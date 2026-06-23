# 🎬 Roteiro do Vídeo — CoffeCare (C2 + LLM via Groq)

> **Objetivo:** demonstração executável do pipeline *end-to-end*, da foto da folha
> ao plano de tratamento gerado pela LLM.
> **Duração-alvo:** 4 a 6 minutos.
> **Tom:** didático, direto, confiante. Fale como quem explica para um colega — sem ler robótico.

---

## ⚙️ Antes de gravar (checklist)

- [ ] Backend rodando: `cd backend && uvicorn main:app --reload`
- [ ] Frontend rodando: `cd frontend && npm run dev`
- [ ] **A LLM ativa** — para o vídeo bater com os slides, use a **Groq** (chave no `.env`).
      Se ainda estiver no Ollama, ou troque para Groq antes de gravar, ou **diga em off**
      que a camada de linguagem está migrando para a Groq (mesma arquitetura/prompts).
- [ ] Ter à mão 2 fotos de folha: **1 doente (ex.: Ferrugem)** e **1 saudável** (mostra o caso de borda).
- [ ] Terminal visível com os logs do backend (vamos mostrar latência/tokens).
- [ ] Tela limpa: feche abas e notificações. Resolução 1080p, zoom do navegador ~110%.
- [ ] Cronômetro mental: ninguém aguenta demo arrastada. Ritmo!

---

## 🎞️ Estrutura em cenas

| # | Cena | Duração | O que aparece na tela |
|---|------|:---:|---|
| 1 | Abertura | 0:20 | Você falando ou logo/slide de capa |
| 2 | O problema (pitch) | 0:30 | Slide 3 ou foto de lavoura |
| 3 | Visão geral da arquitetura | 0:40 | Slide 5 (arquitetura) |
| 4 | **Demo: upload + diagnóstico (C2)** | 1:00 | App: tela de captura → resultado |
| 5 | **Demo: plano gerado pela LLM (Groq)** | 1:00 | App: bloco do plano + logs no terminal |
| 6 | Saída bruta vs. análise da LLM | 0:40 | App ao lado do JSON cru / Swagger |
| 7 | Robustez e boas práticas | 0:40 | Código: `.env`, try/except, max_tokens, cache |
| 8 | Caso saudável + fechamento | 0:30 | App com folha saudável + frase final |

---

## 🗣️ Roteiro falado (narração + ação)

### Cena 1 — Abertura (0:20)
**[TELA: slide de capa do CoffeCare]**

> "Olá! Somos a equipe do **CoffeCare**. Neste vídeo mostramos, do começo ao fim,
> como o sistema diagnostica uma doença na folha de café por uma simples foto — e como
> uma **LLM rodando na Groq** transforma esse diagnóstico técnico em um plano de
> tratamento que o produtor entende."

---

### Cena 2 — O problema (0:30)
**[TELA: slide do problema, ou imagem de lavoura/folha doente]**

> "Doenças foliares como a **ferrugem** derrubam a produtividade do cafezal. O problema
> é que o diagnóstico costuma chegar tarde e nem sempre há um agrônomo por perto.
> A ideia do CoffeCare é simples: o produtor fotografa a folha e recebe, em segundos,
> **o que** a planta tem e **o que fazer** a respeito."

---

### Cena 3 — Arquitetura (0:40)
**[TELA: slide de arquitetura]**

> "Por trás disso há quatro peças. Um **frontend em React**, onde o produtor envia a foto.
> Um **backend em FastAPI**, que orquestra tudo. E duas inteligências: a **C2**, nosso
> modelo de visão **EfficientNet-B0** em PyTorch, que faz o diagnóstico; e a **LLM via Groq**,
> que gera o plano de tratamento.
> Repare na divisão de papéis: a **C2 diz o que a planta tem**; a **LLM diz o que fazer**."

---

### Cena 4 — Demo: upload e diagnóstico da C2 (1:00)
**[AÇÃO: no app, faça login → tela de captura → selecione a foto da folha doente → enviar]**

> "Vamos ao sistema funcionando. Aqui faço login e vou para a tela de captura.
> Seleciono a foto de uma folha com sintomas e envio."

**[AÇÃO: aponte para as mensagens em tempo real: 'Analisando a imagem...']**

> "Veja que o resultado vem em **tempo real, por WebSocket**. Primeiro roda a **C2**:
> a imagem é pré-processada e o EfficientNet-B0 classifica a doença."

**[AÇÃO: o diagnóstico aparece — ex.: 'Ferrugem — 94% de certeza']**

> "Pronto: **Ferrugem**, com **94% de confiança**. Esse grau de confiança é importante —
> ele acompanha o diagnóstico e também é enviado para a LLM no próximo passo."

---

### Cena 5 — Demo: plano de tratamento pela LLM via Groq (1:00)
**[AÇÃO: a mensagem muda para 'Elaborando plano de tratamento...' e o bloco do plano aparece]**

> "Agora o backend pega o resultado da C2 e chama a **LLM na Groq**. O *system prompt*
> diz para ela agir como um **engenheiro agrônomo** e responder em português; o *user prompt*
> injeta a doença e a confiança e pede uma explicação curta mais **três passos práticos**."

**[AÇÃO: mostre o terminal do backend com o log da chamada]**

> "No terminal dá para ver o **log da chamada**: a **latência** e os **tokens consumidos**.
> Medimos isso justamente para controlar custo e desempenho."

**[AÇÃO: volte ao app e leia rapidamente o plano gerado]**

> "E aqui está o plano, em linguagem que o produtor entende: o que é a ferrugem e os
> passos de controle — fungicida, manejo da umidade e monitoramento."

---

### Cena 6 — Saída bruta vs. análise da LLM (0:40)
**[TELA: app ao lado da resposta crua — Swagger em /docs, ou o JSON da C2]**

> "Um ponto que fizemos questão de deixar claro: o usuário consegue **comparar a saída
> bruta da C2** — aqui o JSON com doença, confiança e classes — **com a análise gerada
> pela LLM**. São coisas diferentes: o dado **medido** do modelo, e a **interpretação**
> em texto. A LLM é uma **sugestão**, nunca substitui o dado nem o agrônomo."

---

### Cena 7 — Robustez e boas práticas (0:40)
**[TELA: editor mostrando `services/ai_service.py` e o `.env` (com a chave mascarada)]**

> "Do ponto de vista de engenharia, seguimos as boas práticas de uso de LLM:
> a **chave da API fica no `.env`**, fora do código e fora do Git;
> toda chamada tem **timeout e try/except** — se a Groq falhar, devolvemos um **fallback**
> e o sistema **não quebra**;
> limitamos **`max_tokens`** para respostas enxutas; e **cacheamos** respostas repetidas,
> economizando tempo e dinheiro."

**[AÇÃO opcional: simule uma falha — desligue a internet/chave inválida — e mostre o fallback]**

> "Olha só: forçando um erro na LLM, a aplicação continua de pé e avisa o usuário,
> em vez de travar."

---

### Cena 8 — Caso saudável + fechamento (0:30)
**[AÇÃO: envie a foto da folha saudável]**

> "Por fim, um caso de borda: uma folha **saudável**. Aqui nem chamamos a LLM —
> retornamos direto uma orientação de manejo. É a postura de **não gastar a LLM à toa**."

**[TELA: slide final / logo]**

> "Esse é o **CoffeCare**: da foto da folha ao plano de tratamento, com **visão
> computacional e linguagem trabalhando juntas**, de forma rápida e resiliente.
> O código, os prompts e o README estão no nosso repositório. Obrigado!"

---

## 🎯 Dicas de gravação

- **Mostre, não só conte.** A parte mais forte é o app rodando em tempo real (cenas 4 e 5).
- **Corte os tempos mortos.** Se o modelo demora alguns segundos, acelere ou corte na edição.
- **Logs no terminal vendem credibilidade** — latência e tokens provam que há logging de verdade.
- **A falha controlada (cena 7) impressiona a banca**: prova que "falha na LLM não quebra o sistema".
- **Legendas** ajudam quem assistir sem som.
- Se for usar o vídeo na apresentação de 10–15 min, deixe ele com ~4 min e use o tempo restante
  para os slides de arquitetura, métricas e análise crítica.

---

## ⚠️ Nota de honestidade (importante)

O código **atual** do repositório usa **Ollama (Llama 3 local)** na função
`generate_treatment` ([backend/services/ai_service.py](../backend/services/ai_service.py)).
Os slides e este roteiro retratam a **arquitetura-alvo da etapa final, com Groq**.
Antes de gravar a demo, **migre a chamada para a API da Groq** (mesmos prompts, trocando
o endpoint do Ollama pela chamada à Groq com a chave do `.env`) — assim o vídeo bate
exatamente com a apresentação. Se não der tempo, deixe isso explícito na narração.
