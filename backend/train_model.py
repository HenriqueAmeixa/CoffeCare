import os
import sys
import subprocess

def ensure_packages():
    try:
        import kagglehub
        import torch
        import torchvision
        import sklearn
    except ImportError:
        print("Instalando dependências automaticamente...")
        subprocess.run([sys.executable, "-m", "pip", "install",
                        "kagglehub", "torch", "torchvision", "scikit-learn"], check=True)
        print("Instalação concluída!")

ensure_packages()

import csv
import shutil
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader, Subset
from torch.optim.lr_scheduler import ReduceLROnPlateau
import time
import kagglehub
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report
)

# ── Constantes ─────────────────────────────────────────────────────────────────
DATASET_URL   = "badasstechie/coffee-leaf-diseases"
DATA_DIR      = "dataset_prepared"
MODEL_DIR     = "modelos"
MODEL_PATH    = os.path.join(MODEL_DIR, "coffecare_efficientnet.pt")
REPORT_PATH   = os.path.join(MODEL_DIR, "evaluation_report.txt")
NUM_EPOCHS    = 15
BATCH_SIZE    = 32
TEST_SPLIT    = 0.20   # Princípio de Pareto: 80% treino+val / 20% teste
VAL_SPLIT     = 0.10   # 10% do treino vira validação (early stopping)
EARLY_STOP_PATIENCE = 4  # épocas sem melhora no F1 de validação antes de parar
SEED          = 42

# Fine-tuning do backbone (features) além do classificador.
#   True  → maior acurácia, MAS lento sem GPU (recomendado com CUDA).
#   False → treina só o cabeçalho (rápido na CPU). Bom para um teste rápido.
# Auto: liga só se houver GPU. Force com True/False se preferir.
FINE_TUNE_BACKBONE = torch.cuda.is_available()

CLASS_MAP = {
    "miner":      "Bicho-mineiro",
    "rust":       "Ferrugem",
    "phoma":      "Phoma",
    "cercospora": "Cercospora",
    "healthy":    "Saudável"
}

# ── Preparação do Dataset ──────────────────────────────────────────────────────
def prepare_dataset(raw_path, csv_filename, split_name):
    """
    Lê o CSV e organiza as imagens em subpastas por classe.
    Estrutura do kagglehub:
      raw_path/coffee-leaf-diseases/{split_name}/images/*.jpg
    """
    csv_path   = os.path.join(raw_path, csv_filename)
    images_dir = os.path.join(raw_path, "coffee-leaf-diseases", split_name, "images")
    out_dir    = os.path.join(DATA_DIR, split_name)

    if not os.path.exists(csv_path):
        print(f"CSV não encontrado: {csv_path}"); return False
    if not os.path.exists(images_dir):
        print(f"Pasta de imagens não encontrada: {images_dir}"); return False

    print(f"Preparando '{split_name}' → {images_dir}")
    with open(csv_path, newline='') as f:
        rows = list(csv.DictReader(f))

    copied = 0
    for row in rows:
        img_file = f"{row['id']}.jpg"
        src = os.path.join(images_dir, img_file)
        if not os.path.exists(src):
            continue

        cls = "Saudável"
        for col in ["miner", "rust", "phoma", "cercospora"]:
            if row.get(col, "0").strip() == "1":
                cls = CLASS_MAP[col]; break

        dest = os.path.join(out_dir, cls, img_file)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        if not os.path.exists(dest):
            shutil.copy2(src, dest)
        copied += 1

    print(f"  → {copied} imagens organizadas")
    return copied > 0


# ── Avaliação auxiliar ──────────────────────────────────────────────────────────
@torch.no_grad()
def evaluate(model, loader, device):
    """Roda o modelo sobre um loader e devolve (labels, preds)."""
    model.eval()
    all_preds, all_labels = [], []
    for inputs, labels in loader:
        inputs = inputs.to(device)
        outputs = model(inputs)
        _, preds = torch.max(outputs, 1)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.numpy())
    return all_labels, all_preds


# ── Treinamento + Avaliação ────────────────────────────────────────────────────
def run_training_and_evaluation(train_dir):
    print(f"\nDataset: {train_dir}")

    # Transformações
    # Augmentation mais forte no treino: ajuda principalmente a classe minoritária
    # (Ferrugem) a generalizar a partir de poucos exemplos.
    transform_train = transforms.Compose([
        transforms.Resize(256),
        transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    transform_eval = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # Dois ImageFolder sobre a mesma pasta: um com augmentation (treino) e outro
    # "limpo" (validação/teste). Os índices é que definem cada subconjunto.
    train_pool = datasets.ImageFolder(train_dir, transform_train)
    eval_pool  = datasets.ImageFolder(train_dir, transform_eval)
    class_names = train_pool.classes
    num_classes = len(class_names)
    targets     = [label for _, label in train_pool.samples]
    total       = len(train_pool)

    # ── Divisão ESTRATIFICADA 72/8/20 ─────────────────────────────────────────
    # Estratificar garante que a Ferrugem (minoritária) apareça proporcionalmente
    # em treino, validação E teste — o random_split anterior podia quase zerá-la
    # no teste, mascarando o desempenho real.
    idx = list(range(total))
    trainval_idx, test_idx = train_test_split(
        idx, test_size=TEST_SPLIT, stratify=targets, random_state=SEED)
    trainval_targets = [targets[i] for i in trainval_idx]
    train_idx, val_idx = train_test_split(
        trainval_idx, test_size=VAL_SPLIT, stratify=trainval_targets, random_state=SEED)

    train_set = Subset(train_pool, train_idx)
    val_set   = Subset(eval_pool,  val_idx)
    test_set  = Subset(eval_pool,  test_idx)

    print(f"\nClasses: {class_names}")
    print(f"Total de imagens : {total}")
    print(f"  Treino         : {len(train_idx)}")
    print(f"  Validação      : {len(val_idx)}")
    print(f"  Teste (20%)    : {len(test_idx)}")

    # Distribuição por classe no treino (transparência sobre o desbalanceamento)
    train_counts = np.bincount([targets[i] for i in train_idx], minlength=num_classes)
    print("\nDistribuição no treino:")
    for name, c in zip(class_names, train_counts):
        print(f"  {name:<14}: {c}")

    # No Windows, usar num_workers=0 para evitar freeze/crash silencioso
    train_loader = DataLoader(train_set, batch_size=BATCH_SIZE, shuffle=True,  num_workers=0)
    val_loader   = DataLoader(val_set,   batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    test_loader  = DataLoader(test_set,  batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"\nDispositivo: {device}")

    model = models.efficientnet_b0(pretrained=True)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    model = model.to(device)

    # ── Loss ponderada por classe ──────────────────────────────────────────────
    # Peso inversamente proporcional à frequência: cada erro na Ferrugem
    # "pesa" muito mais, forçando o modelo a aprendê-la em vez de ignorá-la.
    weights = train_counts.sum() / (num_classes * np.maximum(train_counts, 1))
    class_weights = torch.tensor(weights, dtype=torch.float, device=device)
    print("\nPesos por classe (loss):")
    for name, w in zip(class_names, weights):
        print(f"  {name:<14}: {w:.3f}")
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    # ── Otimizador: fine-tuning completo (LR discriminativo) ou só o cabeçalho ──
    # Com backbone: ajusta também as features (LR baixo) + cabeçalho (LR maior),
    # ganho grande de acurácia sem perder o conhecimento da ImageNet.
    # Sem backbone: treina só o classificador (rápido na CPU).
    if FINE_TUNE_BACKBONE:
        print("\n🔧 Modo: fine-tuning COMPLETO (backbone + cabeçalho)")
        optimizer = optim.Adam([
            {"params": model.features.parameters(),   "lr": 1e-4},
            {"params": model.classifier.parameters(), "lr": 1e-3},
        ])
    else:
        print("\n🔧 Modo: só o CABEÇALHO (backbone congelado — rápido na CPU)")
        for p in model.features.parameters():
            p.requires_grad = False
        optimizer = optim.Adam(model.classifier.parameters(), lr=1e-3)
    scheduler = ReduceLROnPlateau(optimizer, mode="max", factor=0.3, patience=2)

    # ── Loop de Treinamento com validação + early stopping ─────────────────────
    print("\n" + "="*60)
    print("FASE 1 — TREINAMENTO + VALIDAÇÃO")
    print("="*60)
    best_f1 = -1.0
    best_state = None
    epochs_no_improve = 0

    for epoch in range(NUM_EPOCHS):
        model.train()
        running_loss = 0.0
        running_corrects = 0
        t0 = time.time()

        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            running_loss     += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)

        loss_ep = running_loss / len(train_idx)
        acc_ep  = float(running_corrects) / len(train_idx)

        # Validação — early stopping pelo F1 MACRO (sensível à classe minoritária)
        val_labels, val_preds = evaluate(model, val_loader, device)
        val_f1 = f1_score(val_labels, val_preds, average="macro", zero_division=0)
        scheduler.step(val_f1)

        flag = ""
        if val_f1 > best_f1:
            best_f1 = val_f1
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            epochs_no_improve = 0
            flag = "  ⭐ melhor"
        else:
            epochs_no_improve += 1

        print(f"  Epoch {epoch+1}/{NUM_EPOCHS} | Loss: {loss_ep:.4f} | "
              f"Acc: {acc_ep:.4f} | ValF1(macro): {val_f1:.4f} | "
              f"{time.time()-t0:.0f}s{flag}")

        if epochs_no_improve >= EARLY_STOP_PATIENCE:
            print(f"\n⏹️  Early stopping: {EARLY_STOP_PATIENCE} épocas sem melhora.")
            break

    # Restaura os melhores pesos (não os da última época)
    if best_state is not None:
        model.load_state_dict(best_state)
    print(f"\n✅ Treinamento concluído! Melhor ValF1(macro): {best_f1:.4f}")

    # ── Avaliação no conjunto de Teste ─────────────────────────────────────────
    print("\n" + "="*60)
    print("FASE 2 — AVALIAÇÃO (20% teste, nunca visto)")
    print("="*60)
    all_labels, all_preds = evaluate(model, test_loader, device)
    test_size = len(test_idx)

    # ── Métricas ───────────────────────────────────────────────────────────────
    acc      = accuracy_score(all_labels, all_preds)
    prec     = precision_score(all_labels, all_preds, average='weighted', zero_division=0)
    rec      = recall_score(all_labels, all_preds, average='weighted', zero_division=0)
    f1       = f1_score(all_labels, all_preds, average='weighted', zero_division=0)
    # Métricas MACRO: tratam todas as classes igualmente, expondo o desempenho
    # real na Ferrugem (minoritária) que o "weighted" mascara.
    prec_mac = precision_score(all_labels, all_preds, average='macro', zero_division=0)
    rec_mac  = recall_score(all_labels, all_preds, average='macro', zero_division=0)
    f1_mac   = f1_score(all_labels, all_preds, average='macro', zero_division=0)
    cm   = confusion_matrix(all_labels, all_preds)
    report = classification_report(all_labels, all_preds, target_names=class_names, zero_division=0)

    # Construir relatório textual
    lines = []
    lines.append("=" * 60)
    lines.append("RELATÓRIO DE AVALIAÇÃO — CoffeCare EfficientNet-B0")
    lines.append("=" * 60)
    lines.append(f"Total testado  : {test_size} imagens (20% do dataset)")
    lines.append("── Médias ponderadas (weighted) ───────────────────────────")
    lines.append(f"Acurácia       : {acc*100:.2f}%")
    lines.append(f"Precisão       : {prec*100:.2f}%")
    lines.append(f"Recall         : {rec*100:.2f}%")
    lines.append(f"F1-Score       : {f1*100:.2f}%")
    lines.append("── Médias macro (tratam todas as classes igualmente) ──────")
    lines.append(f"Precisão (macro): {prec_mac*100:.2f}%")
    lines.append(f"Recall   (macro): {rec_mac*100:.2f}%")
    lines.append(f"F1-Score (macro): {f1_mac*100:.2f}%")
    lines.append("")
    lines.append("── Matriz de Confusão ─────────────────────────────────────")
    header = "          " + "  ".join(f"{c[:8]:>8}" for c in class_names)
    lines.append(header)
    for i, row_vals in enumerate(cm):
        row_str = f"{class_names[i][:10]:<10}" + "  ".join(f"{v:>8}" for v in row_vals)
        lines.append(row_str)
    lines.append("")
    lines.append("── Relatório por Classe ────────────────────────────────────")
    lines.append(report)

    full_report = "\n".join(lines)
    print("\n" + full_report)

    os.makedirs(MODEL_DIR, exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(full_report)
    print(f"\n📄 Relatório salvo em: {REPORT_PATH}")

    # ── Salvar Modelo ──────────────────────────────────────────────────────────
    checkpoint = {
        'state_dict': model.state_dict(),
        'classes':    class_names,
        'num_classes': num_classes,
        'eval': {
            'accuracy': acc, 'precision': prec, 'recall': rec, 'f1': f1,
            'precision_macro': prec_mac, 'recall_macro': rec_mac, 'f1_macro': f1_mac,
        }
    }
    torch.save(checkpoint, MODEL_PATH)
    print(f"🤖 Modelo salvo em: {MODEL_PATH}")


# ── Main ───────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    # Necessário para evitar crashes do DataLoader no Windows com num_workers > 0
    # mesmo que num_workers=0 tenha sido configurado, algumas bibliotecas
    # podem iniciar processos filhos na importação.
    
    train_dir = os.path.join(DATA_DIR, "train")

    # Se o dataset já foi consolidado (ex.: por download_datasets.py), treina
    # direto com ele — não precisa rebaixar nada. Só recorre ao Kaggle como
    # fallback quando não há dataset preparado.
    if not os.path.exists(train_dir) or not os.listdir(train_dir):
        print("Dataset preparado não encontrado.")
        print("👉 Recomendado: rode 'python download_datasets.py' para um dataset")
        print("   maior e balanceado. Usando fallback (badasstechie) por enquanto...\n")
        print("Baixando dataset via kagglehub (pode usar cache local)...")
        raw_path = kagglehub.dataset_download(DATASET_URL)
        print(f"Dataset disponível em: {raw_path}\n")
        if not prepare_dataset(raw_path, "train_classes.csv", "train"):
            print("Falha ao preparar dataset. Encerrando.")
            sys.exit(1)

    if os.path.exists(train_dir):
        run_training_and_evaluation(train_dir)
    else:
        print("Pasta de treino não encontrada. Verifique o dataset.")
