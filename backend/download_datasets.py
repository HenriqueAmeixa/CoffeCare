"""
download_datasets.py — CoffeCare Dataset Aggregator
====================================================
Baixa múltiplos datasets públicos de doenças em folhas de café (Kaggle)
e consolida todas as imagens na pasta dataset_prepared/train/<Classe>.

Classes-alvo:
  - Bicho-mineiro (Miner / Leaf Miner)
  - Ferrugem      (Rust / Coffee Leaf Rust)
  - Phoma
  - Cercospora    (nova classe)
  - Saudável      (Healthy / NoRust)

Uso:
  python download_datasets.py
"""

import os
import sys
import subprocess
import shutil
import glob
import zipfile
from pathlib import Path


def ensure_packages():
    try:
        import kagglehub
    except ImportError:
        print("Instalando kagglehub...")
        subprocess.run([sys.executable, "-m", "pip", "install", "kagglehub"], check=True)


ensure_packages()
import kagglehub

# ── Constantes ─────────────────────────────────────────────────────────────────
OUTPUT_DIR = os.path.join("dataset_prepared", "train")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}

# Mapeamento universal: nome de pasta/classe → classe CoffeCare
LABEL_MAP = {
    # Bicho-mineiro
    "miner":        "Bicho-mineiro",
    "Miner":        "Bicho-mineiro",
    "leaf_miner":   "Bicho-mineiro",
    "Leaf_Miner":   "Bicho-mineiro",
    "LeafMiner":    "Bicho-mineiro",
    "bicho-mineiro":"Bicho-mineiro",
    "Bicho-mineiro":"Bicho-mineiro",
    # Ferrugem
    "rust":         "Ferrugem",
    "Rust":         "Ferrugem",
    "leaf_rust":    "Ferrugem",
    "Leaf_Rust":    "Ferrugem",
    "coffee_rust":  "Ferrugem",
    "Coffee_Leaf_Rust": "Ferrugem",
    "Ferrugem":     "Ferrugem",
    # Phoma
    "phoma":        "Phoma",
    "Phoma":        "Phoma",
    "phoma_leaf":   "Phoma",
    # Cercospora
    "cercospora":   "Cercospora",
    "Cercospora":   "Cercospora",
    "Cerscospora":  "Cercospora",    # typo no JMuBEN
    "cerscospora":  "Cercospora",
    "brown_eye_spot":"Cercospora",
    # Saudável
    "healthy":      "Saudável",
    "Healthy":      "Saudável",
    "NoRust":       "Saudável",
    "norust":       "Saudável",
    "Saudável":     "Saudável",
    "saudavel":     "Saudável",
}

# Datasets para baixar (slug kaggle)
KAGGLE_DATASETS = [
    {
        "slug": "noamaanabdulazeem/jmuben-coffee-dataset",
        "name": "JMuBEN (58k+ imagens)",
    },
    {
        "slug": "nirmalsankalana/rocole-a-robusta-coffee-leaf-images-dataset",
        "name": "RoCoLe (1.560 imagens)",
    },
    {
        "slug": "alvarole/coffee-leaves-disease",
        "name": "Alvaro LE Coffee Leaves",
    },
]


def is_image(filepath):
    """Verifica se o arquivo é uma imagem por extensão."""
    return Path(filepath).suffix.lower() in IMAGE_EXTENSIONS


def map_class(folder_name):
    """Tenta mapear o nome da pasta para uma classe CoffeCare."""
    # Tentar match direto
    if folder_name in LABEL_MAP:
        return LABEL_MAP[folder_name]

    # Tentar match case-insensitive
    folder_lower = folder_name.lower().strip()
    for key, value in LABEL_MAP.items():
        if key.lower() == folder_lower:
            return value

    return None


def extract_zips_recursive(directory):
    """Extrai todos os ZIPs encontrados recursivamente dentro do diretório."""
    zip_files = list(Path(directory).rglob("*.zip"))
    for zf in zip_files:
        extract_to = zf.parent / zf.stem
        if not extract_to.exists():
            print(f"  📦 Extraindo ZIP: {zf.name}")
            try:
                with zipfile.ZipFile(str(zf), 'r') as z:
                    z.extractall(str(extract_to))
            except (zipfile.BadZipFile, Exception) as e:
                print(f"  ⚠️ Erro ao extrair {zf.name}: {e}")


def copy_images_from_folder_structure(base_path, stats):
    """
    Percorre recursivamente o diretório procurando pastas cujo nome
    corresponda a uma classe conhecida, e copia as imagens para OUTPUT_DIR.
    """
    base = Path(base_path)
    if not base.exists():
        return

    for root, dirs, files in os.walk(str(base)):
        folder_name = os.path.basename(root)
        cls = map_class(folder_name)
        if cls is None:
            continue

        dest_dir = os.path.join(OUTPUT_DIR, cls)
        os.makedirs(dest_dir, exist_ok=True)

        for f in files:
            src = os.path.join(root, f)
            if not is_image(src):
                continue

            # Gerar nome único para evitar colisão
            dest = os.path.join(dest_dir, f)
            if os.path.exists(dest):
                # Adicionar prefixo com hash curto do caminho original
                name, ext = os.path.splitext(f)
                unique_id = abs(hash(src)) % (10**8)
                dest = os.path.join(dest_dir, f"{name}_{unique_id}{ext}")

            if not os.path.exists(dest):
                shutil.copy2(src, dest)
                stats[cls] = stats.get(cls, 0) + 1


def download_and_process_dataset(dataset_info, stats):
    """Baixa um dataset do Kaggle e processa suas imagens."""
    slug = dataset_info["slug"]
    name = dataset_info["name"]

    print(f"\n{'='*60}")
    print(f"📥 Baixando: {name}")
    print(f"   Slug: {slug}")
    print(f"{'='*60}")

    try:
        raw_path = kagglehub.dataset_download(slug)
        print(f"  ✅ Disponível em: {raw_path}")
    except Exception as e:
        print(f"  ❌ Erro ao baixar {slug}: {e}")
        return

    # Extrair ZIPs internos (JMuBEN vem com sub-ZIPs)
    print("  🔍 Verificando ZIPs internos...")
    extract_zips_recursive(raw_path)

    # Copiar imagens organizadas por classe
    print("  📂 Procurando imagens classificadas...")
    before_count = dict(stats)
    copy_images_from_folder_structure(raw_path, stats)

    # Contar imagens adicionadas deste dataset
    added = sum(stats.get(k, 0) - before_count.get(k, 0) for k in stats)
    print(f"  📊 Imagens adicionadas deste dataset: {added}")


def count_existing():
    """Conta imagens já existentes no output."""
    counts = {}
    if os.path.exists(OUTPUT_DIR):
        for cls_dir in os.listdir(OUTPUT_DIR):
            cls_path = os.path.join(OUTPUT_DIR, cls_dir)
            if os.path.isdir(cls_path):
                counts[cls_dir] = len([
                    f for f in os.listdir(cls_path)
                    if is_image(os.path.join(cls_path, f))
                ])
    return counts


def main():
    print("=" * 60)
    print("🌿 CoffeCare — Dataset Aggregator")
    print("=" * 60)

    # Contagem antes
    before = count_existing()
    total_before = sum(before.values())
    print(f"\n📊 Dataset ANTES:")
    for cls, count in sorted(before.items()):
        print(f"   {cls}: {count} imagens")
    print(f"   TOTAL: {total_before}")

    # Processar cada dataset
    stats = {}
    for dataset in KAGGLE_DATASETS:
        download_and_process_dataset(dataset, stats)

    # Contagem depois
    after = count_existing()
    total_after = sum(after.values())

    print(f"\n{'='*60}")
    print("📊 RELATÓRIO FINAL")
    print(f"{'='*60}")
    print(f"\n{'Classe':<20} {'Antes':>8} {'Depois':>8} {'Novas':>8}")
    print("-" * 48)
    all_classes = sorted(set(list(before.keys()) + list(after.keys())))
    for cls in all_classes:
        b = before.get(cls, 0)
        a = after.get(cls, 0)
        print(f"{cls:<20} {b:>8} {a:>8} {a - b:>8}")
    print("-" * 48)
    print(f"{'TOTAL':<20} {total_before:>8} {total_after:>8} {total_after - total_before:>8}")

    print(f"\n✅ Dataset consolidado em: {os.path.abspath(OUTPUT_DIR)}")
    print("   Pronto para treinar com: python train_model.py")


if __name__ == "__main__":
    main()
