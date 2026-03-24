import os
import sys
import subprocess

try:
    import kagglehub
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "kagglehub"], check=True)
    import kagglehub

print("Baixando/localizando dataset...")
path = kagglehub.dataset_download("badasstechie/coffee-leaf-diseases")
print(f"\nRaiz do dataset: {path}\n")

def print_tree(directory, prefix="", max_depth=4, current_depth=0):
    if current_depth > max_depth:
        return
    
    try:
        entries = sorted(os.listdir(directory))
    except PermissionError:
        return
    
    for i, entry in enumerate(entries):
        full_path = os.path.join(directory, entry)
        connector = "└── " if i == len(entries) - 1 else "├── "
        
        if os.path.isdir(full_path):
            count = len([f for f in os.listdir(full_path) if os.path.isfile(os.path.join(full_path, f))])
            print(f"{prefix}{connector}📁 {entry}/ ({count} arquivos)")
            extension = "    " if i == len(entries) - 1 else "│   "
            print_tree(full_path, prefix + extension, max_depth, current_depth + 1)
        else:
            print(f"{prefix}{connector}📄 {entry}")

print("Estrutura de pastas:")
print_tree(path)

# Verificar se existem pastas "train", "val", ou "test"
print("\n--- Verificação de Estrutura para PyTorch ImageFolder ---")
for d in ["train", "val", "test"]:
    target = os.path.join(path, d)
    if os.path.exists(target):
        classes = [f for f in os.listdir(target) if os.path.isdir(os.path.join(target, f))]
        print(f"✅  Pasta '{d}' encontrada com as classes: {classes}")
    else:
        print(f"❌  Pasta '{d}' NÃO encontrada")
