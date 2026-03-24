# Relatório Técnico — CoffeCare

## Sistema Inteligente de Diagnóstico de Doenças em Folhas de Café

**Disciplina:** [Nome da Disciplina]  
**Aluno:** Henrique  
**Data:** Março de 2026

---

## 1. Descrição do Dataset e Justificativa

### Dataset Escolhido

**Nome:** Coffee Leaf Diseases  
**Fonte:** Kaggle — [badasstechie/coffee-leaf-diseases](https://www.kaggle.com/datasets/badasstechie/coffee-leaf-diseases)  
**Total de Imagens:** 1.264 imagens de folhas de cafeeiro  
**Formato:** JPEG, anotadas via arquivo CSV multi-label

### Classes do Dataset

| Classe | Descrição | Quantidade (aprox.) |
|--------|-----------|---------------------|
| **Bicho-mineiro** | Infestação pela larva *Leucoptera coffeella* | ~330 |
| **Ferrugem** | Fungo *Hemileia vastatrix* — principal doença do café | ~225 |
| **Phoma** | Fungo *Phoma costarricensis*, causa mancha foliar | ~360 |
| **Saudável** | Folha sem presença de doença | ~349 |

### Justificativa

O café é um dos principais produtos agrícolas do Brasil e do mundo. As doenças de folha, especialmente a **Ferrugem** e o **Bicho-mineiro**, causam perdas de até 35% da produção anual. A identificação precoce é crítica para o controle eficaz, mas depende de conhecimento técnico especializado inacessível a pequenos produtores.

O dataset escolhido foi selecionado por:
- Ser **público e gratuito**, com licença para uso acadêmico
- Conter as **principais doenças** que afetam o cafeeiro no Brasil
- Ter **anotações confiáveis** em formato CSV com labels multi-classe
- Ser **facilmente integrável** via API do KaggleHub para download automatizado

---

## 2. Processo de Treinamento

### Arquitetura do Modelo

O projeto utiliza **EfficientNet-B0** com Transfer Learning:

- **Base:** EfficientNet-B0 pré-treinado no ImageNet (pesos `DEFAULT`)
- **Adaptação:** A camada classificadora final foi substituída por uma `nn.Linear` com saída de 4 classes
- **Optimizer:** Adam com lr=0.001
- **Loss Function:** CrossEntropyLoss
- **Épocas:** 5


### Divisão dos Dados — Princípio de Pareto (80/20)

| Conjunto | Proporção | Imagens |
|----------|-----------|---------|
| Treino   | 80%       | 1.011   |
| Teste    | 20%       | 253     |

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
| 1     | ~1.200 | ~65%              |
| 2     | ~0.700 | ~80%              |
| 3     | ~0.400 | ~88%              |
| 4     | ~0.200 | ~93%              |
| 5     | ~0.130 | ~96%              |

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
| **Acurácia**    | **96,84%** |
| **Precisão**    | **96,86%** |
| **Recall**      | **96,84%** |
| **F1-Score**    | **96,84%** |

> Avaliação sobre **253 imagens** do conjunto de teste (20% do dataset total de 1.264 imagens)

### Matriz de Confusão

|               | Prev: Bicho-mineiro | Prev: Ferrugem | Prev: Phoma | Prev: Saudável |
|---------------|:---:|:---:|:---:|:---:|
| **Real: Bicho-mineiro** | **62** | 3 | 0 | 1 |
| **Real: Ferrugem**      | 1 | **43** | 0 | 1 |
| **Real: Phoma**         | 1 | 0 | **71** | 0 |
| **Real: Saudável**      | 1 | 0 | 0 | **69** |

### Relatório por Classe

| Classe        | Precisão | Recall | F1   | Suporte |
|---------------|----------|--------|------|---------|
| Bicho-mineiro | 0.95     | 0.94   | 0.95 | 66      |
| Ferrugem      | 0.93     | 0.96   | 0.95 | 45      |
| Phoma         | 1.00     | 0.99   | 0.99 | 72      |
| Saudável      | 0.97     | 0.99   | 0.98 | 70      |
| **Média**     | **0.97** | **0.97** | **0.97** | **253** |

### Análise dos Resultados

- **Phoma** obteve a melhor performance com F1 de 0.99 — a textura específica desta doença é facilmente distinguível
- **Bicho-mineiro e Ferrugem** apresentaram leve confusão entre si (3 casos) — ambas apresentam manchas amarelo-alaranjadas
- A classe **Saudável** foi identificada com 99% de recall — o modelo raramente classifica uma planta saudável como doente

---

## 5. Conclusões e Possíveis Melhorias

### Conclusões

O CoffeCare demonstrou resultados altamente satisfatórios com **96,84% de acurácia** usando EfficientNet-B0 com Transfer Learning e apenas 5 épocas de treinamento em um dataset de 1.264 imagens. A combinação de Visão Computacional para diagnóstico e LLM local para geração de planos de tratamento oferece uma solução completa e prática para o produtor rural.

### Possíveis Melhorias

| Área | Melhoria |
|------|----------|
| **Dataset** | Aumentar o volume de Ferrugem (apenas 225 imagens vs. 360 de Phoma). Data augmentation mais agressivo (rotação, zoom, variação de brilho) |
| **Modelo** | Testar EfficientNet-B3 ou ResNet-50 para comparação. Implementar validação cruzada k-fold |
| **Fine-Tuning** | Descongelar gradualmente as camadas da base pré-treinada (gradual unfreezing) |
| **Implantação** | Deploy em servidor cloud (AWS/GCP) para acesso móvel pelos produtores. Versão offline com ONNX |
| **UX** | Modo câmera em tempo real com inferência no navegador via TensorFlow.js |
| **Severidade** | Adicionar estimativa do grau de severidade da doença (leve/moderada/severa) |
