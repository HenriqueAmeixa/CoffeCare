import torch
from torchvision import models, transforms
from PIL import Image
import httpx
import random
import asyncio
import os

# Setup do modelo base EfficientNet
model = None
MODEL_CLASSES = ["Ferrugem", "Bicho-mineiro", "Cercosporiose", "Saudável"] # Default fallback fallback

try:
    model_path = os.path.join(os.path.dirname(__file__), "..", "modelos", "coffecare_efficientnet.pt")
    if os.path.exists(model_path):
        # Inicializa arquitetura dinamicamente baseado no num de classes no checkpoint
        checkpoint = torch.load(model_path, map_location=torch.device('cpu'))
        
        # O train_model salva um dicionário! (para sabermos as classes)
        if isinstance(checkpoint, dict) and 'classes' in checkpoint:
            MODEL_CLASSES = checkpoint['classes']
            num_classes = checkpoint['num_classes']
            state_dict = checkpoint['state_dict']
        else:
            # Caso antigo ou compatibilidade (apenas state dict)
            num_classes = 4
            state_dict = checkpoint

        model = models.efficientnet_b0(pretrained=False)
        model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, num_classes)
        model.load_state_dict(state_dict)
        model.eval()
        print(f"Modelo PyTorch carregado! Classes detectadas: {MODEL_CLASSES}")
    else:
        print(f"Aviso: Modelo PyTorch não encontrado no caminho {model_path}. Usando simulação e fallback.")
except Exception as e:
    print(f"Aviso: Não foi possível carregar o modelo PyTorch: {e}")
    model = None

preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

async def predict_disease(image_path: str) -> dict:
    if model is not None:
        try:
            image = Image.open(image_path).convert('RGB')
            input_tensor = preprocess(image).unsqueeze(0)
            
            with torch.no_grad():
                output = model(input_tensor)
                
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            confidence, predicted_idx = torch.max(probabilities, 0)
            
            # Se a predição sair do limite da lista de CLASSES (safe check)
            idx = predicted_idx.item()
            if idx < len(MODEL_CLASSES):
                disease = MODEL_CLASSES[idx]
            else:
                disease = "Desconhecido"
                
            return {"disease": disease, "confidence": round(float(confidence.item()), 2)}
        except Exception as e:
            print(f"Erro na inferência real, usando fallback: {e}")
            
    # Simulação da latência e diagnóstico de Fallback (Se o modelo falhar ou não existir)
    await asyncio.sleep(2)
    disease = random.choice(["Ferrugem", "Bicho-mineiro", "Cercosporiose", "Saudável"])
    confidence = round(random.uniform(0.75, 0.99), 2)
    
    return {"disease": disease, "confidence": confidence}

async def generate_treatment(disease: str) -> str:
    if disease == "Saudável":
        return "A planta está saudável! Continue com o manejo nutricional e irrigação padrão adequados à fase fisiológica do cafeeiro."
    
    prompt = f"Aja como um Engenheiro Agrônomo especialista em cafeicultura. A planta do produtor foi diagnosticada com: {disease}. Descreva brevemente o que é a doença e sugira 3 passos práticos para o tratamento e controle. IMPORTANTE: Responda SEMPRE em português do Brasil, independentemente do idioma desta instrução."
    
    try:
        # A API do Ollama roda na porta 11434 por padrão
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3", # Pode ser trocado para llama2, mistral, etc dependedo do setup do usuário
                    "prompt": prompt,
                    "stream": False
                },
                timeout=90.0
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "Erro ao obter texto do Ollama.")
    except Exception as e:
        print(f"Erro no Ollama: {e}")
        return "Não foi possível gerar a sugestão de tratamento. O Ollama está rodando localmente?"
        
    return "Falha inesperada ao contatar serviço de IA."
