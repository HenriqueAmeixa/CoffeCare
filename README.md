# ☕ CoffeCare — Diagnóstico Inteligente de Doenças em Folhas de Café

> Sistema web de inteligência artificial para identificação de doenças em folhas de cafeeiro usando Visão Computacional (EfficientNet-B0) e Geração de Planos de Tratamento via LLM (Ollama/Llama3).

---

## 📋 Sobre o Projeto

O **CoffeCare** é uma aplicação web full-stack que permite ao produtor de café fotografar uma folha da sua plantação e obter automaticamente:

- ✅ **Diagnóstico visual** da doença (Ferrugem, Bicho-mineiro, Phoma ou Saudável)
- ✅ **Grau de confiança** da análise (ex: 96%)
- ✅ **Plano de tratamento personalizado** gerado por IA (LLM local via Ollama)
- ✅ **Histórico de consultas** por usuário
- ✅ **Exportação em PDF** do laudo

---

## 🧠 Resultado da Avaliação do Modelo

O modelo EfficientNet-B0 foi treinado e avaliado com divisão **80% treino / 20% teste** (Princípio de Pareto):

| Métrica     | Resultado |
|-------------|-----------|
| Acurácia    | **96.84%** |
| Precisão    | **96.86%** |
| Recall      | **96.84%** |
| F1-Score    | **96.84%** |

**Matriz de Confusão:**

|               | Bicho-mineiro | Ferrugem | Phoma | Saudável |
|---------------|:---:|:---:|:---:|:---:|
| Bicho-mineiro | **62** | 3 | 0 | 1 |
| Ferrugem      | 1 | **43** | 0 | 1 |
| Phoma         | 1 | 0 | **71** | 0 |
| Saudável      | 1 | 0 | 0 | **69** |

---

## 🛠️ Tecnologias Utilizadas

| Camada       | Tecnologias |
|--------------|-------------|
| Frontend     | React 19, TypeScript, Vite, TailwindCSS |
| Backend      | Python 3, FastAPI, SQLAlchemy, SQLite |
| IA (Visão)   | PyTorch, EfficientNet-B0, scikit-learn |
| IA (LLM)     | Ollama (Llama3) — execução local |
| Comunicação  | REST API + WebSocket |

---

## ⚙️ Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) 3.10+
- [Ollama](https://ollama.com/) instalado

---

## 🚀 Como Rodar o Projeto

### 1. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/CoffeCare.git
cd CoffeCare
```

### 2. Inicie o Ollama (IA de linguagem)

Em um terminal separado:
```bash
ollama run llama3
```

> ⚠️ Na primeira execução, o Ollama fará o download do modelo Llama3 (~4GB).

### 3. Backend (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# ou: source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
uvicorn main:app --reload
```

O backend estará disponível em `http://localhost:8000`  
Documentação automática da API: `http://localhost:8000/docs`

### 4. Frontend (React)

Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```

O app estará disponível em `http://localhost:5173`

---

## 🤖 Treinar o Modelo de IA (Opcional)

O repositório inclui um script para treinar o modelo do zero com download automático do dataset:

```bash
cd backend
venv\Scripts\activate
python train_model.py
```

O script irá automaticamente:
1. Instalar dependências necessárias (`kagglehub`, `torch`, `torchvision`, `scikit-learn`)
2. Baixar o dataset `badasstechie/coffee-leaf-diseases` via KaggleHub
3. Organizar as imagens por classe usando os CSVs de anotação
4. Treinar por 5 épocas com divisão 80/20 (Princípio de Pareto)
5. Avaliar o modelo e exibir as métricas completas
6. Salvar o modelo em `modelos/coffecare_efficientnet.pt`
7. Salvar o relatório em `modelos/evaluation_report.txt`

---

## 📁 Estrutura do Projeto

```
CoffeCare/
├── backend/
│   ├── main.py                    # Entrypoint FastAPI
│   ├── models.py                  # Modelos de banco de dados (SQLAlchemy)
│   ├── database.py                # Configuração do SQLite
│   ├── auth.py                    # Autenticação JWT
│   ├── schemas.py                 # Schemas Pydantic
│   ├── requirements.txt           # Dependências Python
│   ├── train_model.py             # Script de treinamento e avaliação
│   ├── routers/
│   │   ├── auth.py                # Endpoints de autenticação
│   │   ├── upload.py              # Upload de imagens
│   │   ├── analyze.py             # WebSocket de análise IA
│   │   └── history.py             # Histórico de consultas
│   ├── services/
│   │   └── ai_service.py          # Inferência PyTorch + integração Ollama
│   └── modelos/
│       ├── coffecare_efficientnet.pt   # Modelo treinado
│       └── evaluation_report.txt       # Relatório de métricas
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── App.tsx                # Roteamento principal
        └── pages/
            ├── Login.tsx
            ├── Register.tsx
            ├── Dashboard.tsx
            ├── Capture.tsx        # Upload de imagem
            ├── Results.tsx        # Exibição do diagnóstico via WebSocket
            └── History.tsx        # Histórico de consultas
```

---

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos.
