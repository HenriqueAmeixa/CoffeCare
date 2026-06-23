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
        from PIL import Image  # noqa: F401
    except ImportError:
        print("Instalando dependências (kagglehub, Pillow)...")
        subprocess.run([sys.executable, "-m", "pip", "install", "kagglehub", "Pillow"], check=True)


ensure_packages()
import kagglehub
from PIL import Image

# ── Constantes ─────────────────────────────────────────────────────────────────
OUTPUT_DIR = os.path.join("dataset_prepared", "train")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}

# Deduplicação por conteúdo (perceptual hash):
#   0  → só match EXATO de hash (O(1) por imagem). Já pega recompressões,
#        conversões de formato e renomeações — recomendado para datasets grandes.
#   >0 → também trata como duplicata hashes a <= N bits de distância (fuzzy),
#        cobrindo recortes/escala leve, mas com custo O(n²) — use só em datasets
#        pequenos.
HASH_HAMMING_THRESHOLD = 0

# Limite opcional de imagens por classe (None = sem limite). Reduz o
# desbalanceamento gritante entre classes dominantes e a Ferrugem, e mantém o
# treino viável na CPU (≤ 5 classes × 3000 = ~15k imagens em vez de 60k+).
# As classes minoritárias (ex.: Ferrugem) ficam abaixo do teto e usam tudo que
# houver — a loss ponderada do train_model.py compensa o resíduo.
MAX_PER_CLASS = 3000

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
# Ordenados para priorizar fontes ricas em Ferrugem (classe minoritária e mais
# fraca do modelo). A dedup por conteúdo garante que sobreposições entre eles
# não inflem o dataset com imagens repetidas.
KAGGLE_DATASETS = [
    {
        "slug": "noamaanabdulazeem/jmuben-coffee-dataset",
        "name": "JMuBEN (58k+ imagens)",
    },
    {
        "slug": "jorgearoca/coffee-rust",
        "name": "Coffee Rust — dataset dedicado de Ferrugem",
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


def dhash(image, hash_size=8):
    """
    Difference hash (perceptual). Retorna um inteiro de 64 bits que representa
    o *conteúdo* visual da imagem — robusto a recompressão, leve redimensionamento
    e mudança de nome de arquivo. Imagens visualmente iguais geram hashes iguais
    (ou quase), permitindo detectar repetições reais, não só nomes repetidos.
    """
    img = image.convert("L").resize((hash_size + 1, hash_size), Image.LANCZOS)
    pixels = list(img.getdata())
    bits = 0
    for row in range(hash_size):
        for col in range(hash_size):
            left = pixels[row * (hash_size + 1) + col]
            right = pixels[row * (hash_size + 1) + col + 1]
            bits = (bits << 1) | (1 if left > right else 0)
    return bits


def hamming(a, b):
    """Distância de Hamming entre dois hashes inteiros."""
    return bin(a ^ b).count("1")


def is_duplicate(img_hash, seen_hashes):
    """
    True se img_hash já apareceu (idêntico ou a <= HASH_HAMMING_THRESHOLD bits
    de algum hash visto). Mantém o conjunto global de imagens já aceitas.
    """
    if img_hash in seen_hashes:
        return True
    if HASH_HAMMING_THRESHOLD > 0:
        for h in seen_hashes:
            if hamming(img_hash, h) <= HASH_HAMMING_THRESHOLD:
                return True
    return False


# Fallback por palavra-chave: usado quando o nome da pasta não bate exatamente
# (ex.: "Coffee Leaf Rust", "Leaf rust", "rust_images"). Ordem importa — termos
# mais específicos primeiro para não confundir (ex.: "brown eye spot" = Cercospora).
KEYWORD_MAP = [
    ("cercospora",  "Cercospora"),
    ("cerscospora", "Cercospora"),
    ("brown eye",   "Cercospora"),
    ("miner",       "Bicho-mineiro"),
    ("minador",     "Bicho-mineiro"),
    ("rust",        "Ferrugem"),
    ("ferrugem",    "Ferrugem"),
    ("roya",        "Ferrugem"),       # espanhol (datasets latino-americanos)
    ("phoma",       "Phoma"),
    ("healthy",     "Saudável"),
    ("norust",      "Saudável"),
    ("sano",        "Saudável"),       # espanhol
    ("saudável",    "Saudável"),
    ("saudavel",    "Saudável"),
]


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

    # Fallback: o nome da pasta CONTÉM uma palavra-chave conhecida
    normalized = folder_lower.replace("_", " ").replace("-", " ")
    for keyword, value in KEYWORD_MAP:
        if keyword in normalized:
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


def copy_images_from_folder_structure(base_path, stats, seen_hashes, class_counts):
    """
    Percorre recursivamente o diretório procurando pastas cujo nome
    corresponda a uma classe conhecida, e copia as imagens para OUTPUT_DIR
    — pulando imagens corrompidas e duplicatas (por conteúdo, não por nome).

    Args:
        seen_hashes  : conjunto global de perceptual-hashes já aceitos.
        class_counts : {classe: total já gravado} — usado para o cap MAX_PER_CLASS.
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

            if MAX_PER_CLASS is not None and class_counts.get(cls, 0) >= MAX_PER_CLASS:
                continue

            # Validar + calcular o hash de conteúdo. Imagens corrompidas caem aqui.
            try:
                with Image.open(src) as im:
                    im.load()
                    img_hash = dhash(im)
            except Exception:
                stats["__corrompidas__"] = stats.get("__corrompidas__", 0) + 1
                continue

            # Deduplicação por conteúdo: idêntica/quase-idêntica a algo já aceito.
            if is_duplicate(img_hash, seen_hashes):
                stats["__duplicadas__"] = stats.get("__duplicadas__", 0) + 1
                continue
            seen_hashes.add(img_hash)

            # Nome único determinístico (baseado no hash) — sem colisões.
            ext = Path(f).suffix.lower() or ".jpg"
            dest = os.path.join(dest_dir, f"{img_hash:016x}{ext}")
            if not os.path.exists(dest):
                shutil.copy2(src, dest)
                stats[cls] = stats.get(cls, 0) + 1
                class_counts[cls] = class_counts.get(cls, 0) + 1


def download_and_process_dataset(dataset_info, stats, seen_hashes, class_counts):
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

    # Copiar imagens organizadas por classe (deduplicando por conteúdo)
    print("  📂 Procurando imagens classificadas...")
    before = {k: v for k, v in stats.items() if not k.startswith("__")}
    before_dup = stats.get("__duplicadas__", 0)
    copy_images_from_folder_structure(raw_path, stats, seen_hashes, class_counts)

    # Contar imagens novas (excluindo contadores internos) e duplicatas puladas
    added = sum(stats.get(k, 0) - before.get(k, 0)
                for k in stats if not k.startswith("__"))
    skipped = stats.get("__duplicadas__", 0) - before_dup
    print(f"  📊 Imagens novas adicionadas: {added}  |  duplicadas puladas: {skipped}")


def seed_seen_hashes():
    """
    Calcula o hash de conteúdo das imagens já presentes em OUTPUT_DIR para que
    re-execuções não re-adicionem nem dupliquem o que já foi consolidado.
    """
    seen = set()
    counts = {}
    if not os.path.exists(OUTPUT_DIR):
        return seen, counts
    print("\n🔁 Indexando imagens já existentes (para evitar repetições)...")
    for cls_dir in os.listdir(OUTPUT_DIR):
        cls_path = os.path.join(OUTPUT_DIR, cls_dir)
        if not os.path.isdir(cls_path):
            continue
        for f in os.listdir(cls_path):
            fp = os.path.join(cls_path, f)
            if not is_image(fp):
                continue
            try:
                with Image.open(fp) as im:
                    im.load()
                    seen.add(dhash(im))
                counts[cls_dir] = counts.get(cls_dir, 0) + 1
            except Exception:
                continue
    print(f"   {len(seen)} imagens indexadas.")
    return seen, counts


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

    # Indexar o que já existe para garantir imagens não-repetidas entre execuções
    seen_hashes, class_counts = seed_seen_hashes()

    # Processar cada dataset (dedup global por conteúdo via seen_hashes)
    stats = {}
    for dataset in KAGGLE_DATASETS:
        download_and_process_dataset(dataset, stats, seen_hashes, class_counts)

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

    dups = stats.get("__duplicadas__", 0)
    corr = stats.get("__corrompidas__", 0)
    print(f"\n🧹 Duplicadas puladas (mesmo conteúdo): {dups}")
    print(f"🗑️  Imagens corrompidas ignoradas      : {corr}")

    print(f"\n✅ Dataset consolidado em: {os.path.abspath(OUTPUT_DIR)}")
    print("   Pronto para treinar com: python train_model.py")


if __name__ == "__main__":
    main()
