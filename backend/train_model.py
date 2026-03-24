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
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader, random_split
import time
import kagglehub
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
NUM_EPOCHS    = 5
BATCH_SIZE    = 32
TRAIN_SPLIT   = 0.80   # Princípio de Pareto: 80% treino / 20% teste

CLASS_MAP = {
    "miner":   "Bicho-mineiro",
    "rust":    "Ferrugem",
    "phoma":   "Phoma",
    "healthy": "Saudável"
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
        for col in ["miner", "rust", "phoma"]:
            if row.get(col, "0").strip() == "1":
                cls = CLASS_MAP[col]; break

        dest = os.path.join(out_dir, cls, img_file)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        if not os.path.exists(dest):
            shutil.copy2(src, dest)
        copied += 1

    print(f"  → {copied} imagens organizadas")
    return copied > 0


# ── Treinamento + Avaliação ────────────────────────────────────────────────────
def run_training_and_evaluation(train_dir):
    print(f"\nDataset: {train_dir}")

    # Transformações
    transform_train = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    transform_eval = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    full_dataset = datasets.ImageFolder(train_dir, transform_train)
    class_names  = full_dataset.classes
    num_classes  = len(class_names)
    total        = len(full_dataset)

    # ── Divisão Pareto 80/20 ──────────────────────────────────────────────────
    train_size = int(TRAIN_SPLIT * total)
    test_size  = total - train_size
    train_set, test_set = random_split(
        full_dataset, [train_size, test_size],
        generator=torch.Generator().manual_seed(42)  # reproducível
    )
    # Sobreescreve transform do subconjunto de teste (sem augmentation)
    test_set.dataset.transform = transform_eval

    print(f"\nClasses: {class_names}")
    print(f"Total de imagens : {total}")
    print(f"  80% treino     : {train_size}")
    print(f"  20% teste      : {test_size}")

    train_loader = DataLoader(train_set, batch_size=BATCH_SIZE, shuffle=True,  num_workers=0)
    test_loader  = DataLoader(test_set,  batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"\nDispositivo: {device}")

    model = models.efficientnet_b0(pretrained=True)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=0.001)

    # ── Loop de Treinamento ────────────────────────────────────────────────────
    print("\n" + "="*60)
    print("FASE 1 — TREINAMENTO (80%)")
    print("="*60)
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

        loss_ep = running_loss / train_size
        acc_ep  = float(running_corrects) / train_size
        print(f"  Epoch {epoch+1}/{NUM_EPOCHS} | Loss: {loss_ep:.4f} | Acc: {acc_ep:.4f} | {time.time()-t0:.0f}s")

    print("\n✅ Treinamento concluído!")

    # ── Avaliação no conjunto de Teste ─────────────────────────────────────────
    print("\n" + "="*60)
    print("FASE 2 — AVALIAÇÃO (20%)")
    print("="*60)
    model.eval()
    all_preds  = []
    all_labels = []

    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())

    # ── Métricas ───────────────────────────────────────────────────────────────
    acc  = accuracy_score(all_labels, all_preds)
    prec = precision_score(all_labels, all_preds, average='weighted', zero_division=0)
    rec  = recall_score(all_labels, all_preds, average='weighted', zero_division=0)
    f1   = f1_score(all_labels, all_preds, average='weighted', zero_division=0)
    cm   = confusion_matrix(all_labels, all_preds)
    report = classification_report(all_labels, all_preds, target_names=class_names, zero_division=0)

    # Construir relatório textual
    lines = []
    lines.append("=" * 60)
    lines.append("RELATÓRIO DE AVALIAÇÃO — CoffeCare EfficientNet-B0")
    lines.append("=" * 60)
    lines.append(f"Total testado  : {test_size} imagens (20% do dataset)")
    lines.append(f"Acurácia       : {acc*100:.2f}%")
    lines.append(f"Precisão       : {prec*100:.2f}%")
    lines.append(f"Recall         : {rec*100:.2f}%")
    lines.append(f"F1-Score       : {f1*100:.2f}%")
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
        'eval': {'accuracy': acc, 'precision': prec, 'recall': rec, 'f1': f1}
    }
    torch.save(checkpoint, MODEL_PATH)
    print(f"🤖 Modelo salvo em: {MODEL_PATH}")


# ── Main ───────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("Baixando dataset via kagglehub (pode usar cache local)...")
    raw_path = kagglehub.dataset_download(DATASET_URL)
    print(f"Dataset disponível em: {raw_path}\n")

    train_dir = os.path.join(DATA_DIR, "train")
    if not os.path.exists(train_dir) or not os.listdir(train_dir):
        if not prepare_dataset(raw_path, "train_classes.csv", "train"):
            print("Falha ao preparar dataset. Encerrando.")
            sys.exit(1)

    if os.path.exists(train_dir):
        run_training_and_evaluation(train_dir)
    else:
        print("Pasta de treino não encontrada. Verifique o dataset.")
