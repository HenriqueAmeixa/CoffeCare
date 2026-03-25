# Relatório Técnico — CoffeCare

## Sistema Inteligente de Diagnóstico de Doenças em Folhas de Café

**Disciplina:** [Nome da Disciplina]  
**Aluno:** Henrique  
**Data:** Março de 2026

---

## 1. Descrição do Dataset e Justificativa

### Dataset Escolhido

**Nome:** Coffee Leaf Diseases (Dataset Ampliado)  
**Fonte:** Compilação múltipla (Kaggle, RoCoLe, JMuBEN, etc. + Data Augmentation)  
**Total de Imagens:** ~51.480 imagens de folhas de cafeeiro  
**Formato:** JPEG, anotadas em formato de classificação multi-classe

### Classes do Dataset

| Classe | Descrição | Quantidade (aprox.) |
|--------|-----------|---------------------|
| **Bicho-mineiro** | Infestação pela larva *Leucoptera coffeella* | ~17.215 |
| **Cercospora** | Fungo *Cercospora coffeicola*, causa mancha de olho pardo | ~7.605 |
| **Ferrugem** | Fungo *Hemileia vastatrix* — principal doença do café | ~255 |
| **Phoma** | Fungo *Phoma costarricensis*, causa mancha foliar | ~6.815 |
| **Saudável** | Folha sem presença de doença | ~19.590 |

### Justificativa

O café é um dos principais produtos agrícolas do Brasil e do mundo. As doenças de folha, especialmente a **Ferrugem**, o **Bicho-mineiro** e a **Cercospora**, causam perdas de até 35% da produção anual. A identificação precoce é crítica para o controle eficaz, mas depende de conhecimento técnico especializado inacessível a pequenos produtores.

O dataset ampliado foi montado para:
- Aumentar a robustez do modelo combinando múltiplas fontes públicas
- Incluir a **Cercospora**, uma das principais doenças do cafeeiro
- Reduzir o overfitting através de um volume considerável de imagens (~51k)

---

## 2. Processo de Treinamento

### Arquitetura do Modelo

O projeto utiliza **EfficientNet-B0** com Transfer Learning:

- **Base:** EfficientNet-B0 pré-treinado no ImageNet (pesos `DEFAULT`)
- **Adaptação:** A camada classificadora final foi substituída por uma `nn.Linear` com saída de 5 classes
- **Optimizer:** Adam com lr=0.001
- **Loss Function:** CrossEntropyLoss
- **Épocas:** 10


### Divisão dos Dados — Princípio de Pareto (80/20)

| Conjunto | Proporção | Imagens |
|----------|-----------|---------|
| Treino   | 80%       | ~41.184 |
| Teste    | 20%       | 10.296  |

A divisão foi realizada com `torch.utils.data.random_split` com semente fixa `42` para garantir reprodutibilidade.

### Pré-processamento e Augmentation

**Treino:**
- `Resize(256)` → `CenterCrop(224)`
- `RandomHorizontalFlip()` — augmentation para evitar overfitting
- Normalização com média e desvio padrão do ImageNet

**Teste:**
- Apenas `Resize`, `CenterCrop` e Normalização (sem augmentation)

### Evolução do Treinamento

| Época | Loss   | Acurácia (treino) |
|-------|--------|-------------------|
| 1     | 0.1400 | 96.09%            |
| 2     | 0.0555 | 98.39%            |
| 3     | 0.0421 | 98.65%            |
| 4     | 0.0364 | 98.81%            |
| 5     | 0.0365 | 98.77%            |
| 6     | 0.0316 | 98.95%            |
| 7     | 0.0314 | 98.94%            |
| 8     | 0.0309 | 98.98%            |
| 9     | 0.0326 | 98.83%            |
| 10    | 0.0308 | 98.96%            |

---

## 3. Implementação Web

### Arquitetura

O sistema é dividido em duas camadas:

**Backend — FastAPI (Python)**
- API REST para autenticação, upload de imagens e histórico
- **WebSocket** para comunicação em tempo real durante a análise
- Inferência com PyTorch carregado na inicialização do servidor
- Integração com Ollama via HTTP para geração do plano de tratamento

**Frontend — React + TypeScript**
- Interface web responsiva com TailwindCSS
- Comunicação via WebSocket com o backend para receber o diagnóstico progressivamente
- Exportação do laudo em PDF via `jsPDF` e `html2canvas`

### Fluxo de Análise

```
Usuário faz upload da foto
       ↓
Backend recebe a imagem e abre WebSocket
       ↓
PyTorch EfficientNet analisa a imagem → envia Disease + Confidence
       ↓
Ollama Llama3 gera o plano de tratamento → envia Treatment
       ↓
Frontend exibe resultado em tempo real
       ↓
Resultado salvo no banco SQLite + PDF exportável
```

---

## 4. Resultados da Avaliação do Modelo

### Métricas Gerais (20% de dados nunca vistos durante o treino)

| Métrica     | Resultado  |
|-------------|------------|
| **Acurácia**    | **99,15%** |
| **Precisão**    | **99,19%** |
| **Recall**      | **99,15%** |
| **F1-Score**    | **99,16%** |

> Avaliação sobre **10.296 imagens** do conjunto de teste (20% do dataset total ampliado)

### Matriz de Confusão

|               | Prev: Bicho-mi | Prev: Cercospo | Prev: Ferrugem | Prev: Phoma | Prev: Saudável |
|---------------|:---:|:---:|:---:|:---:|:---:|
| **Real: Bicho-mineiro** | **3392** | 0   | 15  | 15  | 21  |
| **Real: Cercospora**    | 0      | **1521** | 0   | 0   | 0   |
| **Real: Ferrugem**      | 2      | 0   | **39** | 2   | 8   |
| **Real: Phoma**         | 8      | 0   | 5   | **1348** | 2   |
| **Real: Saudável**      | 1      | 0   | 4   | 5   | **3908** |

### Relatório por Classe

| Classe        | Precisão | Recall | F1   | Suporte |
|---------------|----------|--------|------|---------|
| Bicho-mineiro | 1.00     | 0.99   | 0.99 | 3443    |
| Cercospora    | 1.00     | 1.00   | 1.00 | 1521    |
| Ferrugem      | 0.62     | 0.76   | 0.68 | 51      |
| Phoma         | 0.98     | 0.99   | 0.99 | 1363    |
| Saudável      | 0.99     | 1.00   | 0.99 | 3918    |
| **Média Macro**| **0.92** | **0.95** | **0.93** | **10296** |
| **Média Ponderada**| **0.99** | **0.99** | **0.99** | **10296** |

### Análise dos Resultados

- **Acurácia excepcional de 99,15%** em um conjunto de teste muito diversificado e numeroso (mais de 10 mil imagens).
- **Cercospora** e **Saudável** apresentaram performance quase perfeita (F1-score de 1.00 e 0.99).
- **Ferrugem** foi a classe com desafio maior (F1 de 0.68), justificado pelo número baixíssimo de suporte (apenas 51 imagens no teste), gerando confusão principalmente para falsos positivos em Bicho-mineiro, Saudável e Phoma.
- Houve um grande salto de qualidade ao passar para mais de 50.000 imagens e 10 épocas, tornando o modelo extremamente confiável na detecção das doenças majoritárias.

---

## 5. Conclusões e Possíveis Melhorias

### Conclusões

O CoffeCare demonstrou resultados excelentes com **99,15% de acurácia** usando EfficientNet-B0 com Transfer Learning. A ampliação do dataset para incluir a **Cercospora** e mais de 50 mil imagens no total resultou em um modelo altamente robusto. A combinação de Visão Computacional para diagnóstico e LLM local para geração de planos de tratamento oferece uma solução completa e extremamente eficiente para o produtor rural.

### Possíveis Melhorias

| Área | Melhoria |
|------|----------|
| **Dataset** | Aumentar drasticamente o volume de **Ferrugem** (apresentou apenas 51 imagens no teste). Reduzir o desbalanceamento gerando dados sintéticos. |
| **Modelo** | Implementar `Class Weights` na Loss Function para focar na detecção de Ferrugem. Testar arquiteturas mais densas se necessário. |
| **Fine-Tuning** | Descongelar gradualmente as camadas da base pré-treinada (gradual unfreezing). |
| **Implantação** | Deploy em servidor cloud (AWS/GCP) para acesso móvel pelos produtores. Versão offline com ONNX |
| **UX** | Modo câmera em tempo real com inferência no navegador via TensorFlow.js |
| **Severidade** | Adicionar estimativa do grau de severidade da doença (leve/moderada/severa) |
