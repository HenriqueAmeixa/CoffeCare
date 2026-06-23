# ☕ CoffeCare — Diagnóstico Inteligente de Doenças em Folhas de Café

> Sistema web de inteligência artificial para identificação de doenças em folhas de cafeeiro usando Visão Computacional (EfficientNet-B0) e Geração de Planos de Tratamento via LLM (Ollama/Llama3).

---

## 📋 Sobre o Projeto

O **CoffeCare** é uma aplicação web full-stack que permite ao produtor de café fotografar uma folha da sua plantação e obter automaticamente:

- ✅ **Diagnóstico visual** da doença (Ferrugem, Bicho-mineiro, Cercospora, Phoma ou folha Saudável)
- ✅ **Grau de confiança** da análise (ex: 96%)
- ✅ **Plano de tratamento personalizado** gerado por IA (LLM local via Ollama)
- ✅ **Histórico de consultas** por usuário
- ✅ **Exportação em PDF** do laudo

---

## 🧠 Resultado da Avaliação do Modelo

O modelo EfficientNet-B0 foi treinado e avaliado em **5 classes** com **20% das imagens reservadas para teste** (10.296 imagens nunca vistas):

| Métrica     | Weighted | Macro |
|-------------|:---:|:---:|
| Acurácia    | **99.15%** | — |
| Precisão    | **99.19%** | 92% |
| Recall      | **99.15%** | 95% |
| F1-Score    | **99.16%** | 93% |

> ⚠️ **Leia a coluna Macro.** A média *weighted* (99%) é dominada pelas classes
> com muitas imagens. A média *macro* trata todas as classes igualmente e revela
> o ponto fraco: a **Ferrugem** ainda tem F1 de apenas **0.68** (precisão 0.62,
> recall 0.76) por ter pouquíssimas imagens. É exatamente isso que o novo
> agregador de dataset (`download_datasets.py`) e a loss ponderada por classe
> buscam corrigir — reavalie pelo Macro após reconsolidar o dataset e retreinar.

**Desempenho por classe (conjunto de teste):**

| Classe        | Precisão | Recall | F1 | Suporte |
|---------------|:---:|:---:|:---:|:---:|
| Bicho-mineiro | 1.00 | 0.99 | 0.99 | 3443 |
| Cercospora    | 1.00 | 1.00 | 1.00 | 1521 |
| **Ferrugem**  | **0.62** | **0.76** | **0.68** | **51** |
| Phoma         | 0.98 | 0.99 | 0.99 | 1363 |
| Saudável      | 0.99 | 1.00 | 0.99 | 3918 |

**Matriz de Confusão:**

|               | Bicho-mineiro | Cercospora | Ferrugem | Phoma | Saudável |
|---------------|:---:|:---:|:---:|:---:|:---:|
| Bicho-mineiro | **3392** | 0 | 15 | 15 | 21 |
| Cercospora    | 0 | **1521** | 0 | 0 | 0 |
| Ferrugem      | 2 | 0 | **39** | 2 | 8 |
| Phoma         | 8 | 0 | 5 | **1348** | 2 |
| Saudável      | 1 | 0 | 4 | 5 | **3908** |

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

### Passo 0 — Credenciais do Kaggle (pré-requisito)

Os datasets são baixados do Kaggle, então é preciso uma chave de API (gratuita):

1. Crie/entre em uma conta em [kaggle.com](https://www.kaggle.com/).
2. Vá em **Account → Settings → API → Create New Token**. Isso baixa um arquivo `kaggle.json`.
3. Coloque o arquivo em:
   - **Windows**: `C:\Users\<SEU_USUARIO>\.kaggle\kaggle.json`
   - **Linux/Mac**: `~/.kaggle/kaggle.json`

> Sem isso, o download falha com erro de autenticação. O `kaggle.json` já está
> no `.gitignore` — **nunca versione essa chave**.

### Passo 1 — Consolidar o dataset (recomendado)

`download_datasets.py` agrega **vários** datasets públicos do Kaggle numa única
pasta `dataset_prepared/train/<Classe>`, priorizando fontes ricas em **Ferrugem**
(a classe mais difícil) e **removendo imagens repetidas por conteúdo** (perceptual
hash — não apenas por nome de arquivo):

```bash
cd backend
venv\Scripts\activate
python download_datasets.py
```

Garantias do agregador:
- **Sem repetições**: cada imagem entra uma única vez, mesmo que apareça em mais
  de um dataset, em formato diferente ou recomprimida (dedup por `dhash`).
- **Sempre classificada**: só copia imagens de pastas cujo nome mapeia para uma
  classe conhecida (`rust`/`ferrugem`/`roya` → Ferrugem, etc.).
- **Balanceamento**: teto de `MAX_PER_CLASS = 3000` por classe (configurável no
  topo do script) reduz o desbalanceamento e mantém o treino viável na CPU.
- Pula imagens corrompidas e reporta quantas foram duplicadas/ignoradas.

### Passo 2 — Treinar e avaliar

```bash
python train_model.py
```

O script:
1. Instala dependências necessárias (`kagglehub`, `torch`, `torchvision`, `scikit-learn`)
2. Usa o `dataset_prepared/train` consolidado (ou, em fallback, baixa o `badasstechie/coffee-leaf-diseases`)
3. Faz **divisão estratificada 72% treino / 8% validação / 20% teste** — garante que classes raras apareçam em todos os conjuntos
4. Treina o EfficientNet-B0 com **loss ponderada por classe**, augmentation forte, **scheduler** e **early stopping** pelo F1-macro
5. Avalia no teste e exibe métricas **weighted E macro** (a macro revela o desempenho real na classe minoritária)
6. Salva o melhor modelo em `modelos/coffecare_efficientnet.pt`
7. Salva o relatório em `modelos/evaluation_report.txt`

> 💻 **CPU vs GPU** — o `train_model.py` detecta o hardware automaticamente:
> - **Com GPU (CUDA)**: faz **fine-tuning completo** (backbone + cabeçalho, LR discriminativo) → maior acurácia.
> - **Só CPU**: treina **apenas o cabeçalho** (backbone congelado) para terminar em tempo razoável.
>
> Para forçar um modo, edite `FINE_TUNE_BACKBONE` no topo do `train_model.py`
> (`True` = completo, `False` = só cabeçalho). Em CPU, mantenha o `MAX_PER_CLASS`
> baixo no `download_datasets.py` para o treino não demorar horas.

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
