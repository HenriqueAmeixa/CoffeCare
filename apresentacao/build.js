const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.author = "Equipe CoffeCare";
pres.title = "CoffeCare — Integração C2 + LLM (Groq)";

// ---- Paleta (tema café) ----
const ESPRESSO = "2B1A12"; // fundo escuro
const COFFEE   = "4E342E"; // marrom café
const LEAF     = "2F6B3A"; // verde folha
const MOSS     = "7FB069"; // verde claro
const CREAM    = "F5EFE3"; // creme (fundo claro)
const CREMA    = "C8924A"; // dourado/crema (accent)
const INK      = "2B2118"; // texto escuro
const MUTE     = "6B5E52"; // texto secundário
const CARD     = "FFFFFF";
const W = 13.333, H = 7.5;

const shadow = () => ({ type: "outer", color: "000000", blur: 7, offset: 3, angle: 90, opacity: 0.16 });

function bgLight(s){ s.background = { color: CREAM }; }
function bgDark(s){ s.background = { color: ESPRESSO }; }

// Cabeçalho de seção (kicker + título) para slides claros
function header(s, kicker, title, color){
  s.addText(kicker.toUpperCase(), { x:0.6, y:0.42, w:12, h:0.35, fontFace:"Calibri",
    fontSize:13, bold:true, color: CREMA, charSpacing:3, margin:0 });
  s.addText(title, { x:0.6, y:0.74, w:12.1, h:0.9, fontFace:"Cambria",
    fontSize:32, bold:true, color: color || INK, margin:0 });
}

// círculo numerado
function stepDot(s, x, y, n, color){
  s.addShape(pres.shapes.OVAL, { x, y, w:0.55, h:0.55, fill:{color: color||LEAF}, shadow: shadow() });
  s.addText(String(n), { x, y, w:0.55, h:0.55, align:"center", valign:"middle",
    fontFace:"Cambria", fontSize:20, bold:true, color:"FFFFFF", margin:0 });
}

// card retangular com tint
function card(s, x, y, w, h, fill){
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius:0.09,
    fill:{color: fill||CARD}, shadow: shadow() });
}

/* =====================================================================
   1. CAPA
===================================================================== */
let s = pres.addSlide(); bgDark(s);
// "grão" decorativo
s.addShape(pres.shapes.OVAL, { x:10.4, y:-1.6, w:5.2, h:5.2, fill:{color: COFFEE} });
s.addShape(pres.shapes.OVAL, { x:11.5, y:4.4, w:3.4, h:3.4, fill:{color: LEAF, transparency:35} });
s.addText("☕  PROJETO COFFECARE", { x:0.9, y:1.5, w:9, h:0.5, fontFace:"Calibri",
  fontSize:16, bold:true, color: CREMA, charSpacing:3, margin:0 });
s.addText("Diagnóstico Inteligente de\nDoenças em Folhas de Café", { x:0.9, y:2.1, w:10, h:1.8,
  fontFace:"Cambria", fontSize:46, bold:true, color:"FFFFFF", lineSpacingMultiple:1.0, margin:0 });
s.addText([
  { text:"Etapa Final — ", options:{ bold:true, color: MOSS } },
  { text:"Integração da Visão Computacional (C2) com uma LLM via API Groq", options:{ color:"E9E1D4" } },
], { x:0.9, y:4.2, w:10.5, h:0.7, fontFace:"Calibri", fontSize:18, margin:0 });
s.addText("Visão Computacional (EfficientNet-B0)  ·  Engenharia de Prompt  ·  Groq  ·  FastAPI + React",
  { x:0.9, y:5.1, w:11, h:0.5, fontFace:"Calibri", fontSize:13, italic:true, color:"B9AE9E", margin:0 });
s.addText("Equipe: __________________   |   Disciplina: __________________   |   Data: ___/___/______",
  { x:0.9, y:6.4, w:11.5, h:0.5, fontFace:"Calibri", fontSize:13, color:"8C8073", margin:0 });
s.addNotes(
"Abertura (apresentador): 'Boa tarde a todos. Nosso projeto é o CoffeCare, um sistema que ajuda o produtor de café a descobrir, a partir de uma simples foto da folha, qual doença está atacando a lavoura — e o que fazer a respeito.'\n\n"+
"Contextualize a etapa: 'Nas fases anteriores construímos a C2, que é o nosso modelo de Visão Computacional. Nesta etapa final, conectamos esse modelo a uma LLM (modelo de linguagem) hospedada na Groq, para transformar um diagnóstico técnico em um plano de tratamento que o produtor realmente entende.'\n\n"+
"Diga a duração: 'A apresentação leva cerca de 12 minutos e no fim mostramos o pipeline funcionando de ponta a ponta.' Lembre de preencher equipe/data antes de apresentar.");

/* =====================================================================
   2. AGENDA
===================================================================== */
s = pres.addSlide(); bgLight(s);
header(s, "Roteiro", "O que vamos mostrar");
const agenda = [
  ["1","O problema","Por que detectar doença na folha de café importa"],
  ["2","A solução CoffeCare","Foto → diagnóstico → plano de tratamento"],
  ["3","Arquitetura","Como as peças se conectam (C2 + LLM)"],
  ["4","A C2 e seus resultados","O modelo de visão e suas métricas reais"],
  ["5","Integração com a LLM (Groq)","Prompt, chamada à API, boas práticas"],
  ["6","Demonstração e análise crítica","O pipeline end-to-end e a qualidade das respostas"],
];
let ay = 1.85;
agenda.forEach((it,i)=>{
  const col = i % 2, row = Math.floor(i/2);
  const x = 0.7 + col*6.25, y = ay + row*1.55;
  card(s, x, y, 5.9, 1.3, i%2===0 ? CARD : CARD);
  stepDot(s, x+0.3, y+0.37, it[0], i<3? LEAF : CREMA);
  s.addText(it[1], { x:x+1.05, y:y+0.18, w:4.6, h:0.45, fontFace:"Cambria", fontSize:18, bold:true, color:INK, margin:0 });
  s.addText(it[2], { x:x+1.05, y:y+0.63, w:4.7, h:0.55, fontFace:"Calibri", fontSize:12.5, color:MUTE, margin:0 });
});
s.addNotes(
"Apresentador: 'Para guiar a apresentação, vamos seguir seis blocos.'\n\n"+
"Passe rápido por cada um (não leia palavra por palavra): primeiro o problema real do produtor; depois a solução e como ela funciona na prática; a arquitetura técnica; os resultados do nosso modelo de visão — com honestidade sobre os pontos fracos; a integração com a LLM via Groq, que é o foco desta entrega; e por fim a demonstração e uma análise crítica da qualidade das respostas.\n\n"+
"Frase de transição: 'Começando pelo problema.'");

/* =====================================================================
   3. O PROBLEMA
===================================================================== */
s = pres.addSlide(); bgLight(s);
header(s, "Contexto", "O problema do produtor de café");
s.addText([
  {text:"Doenças foliares — ", options:{bold:true, color:INK}},
  {text:"ferrugem, bicho-mineiro, cercospora e phoma — reduzem produtividade e qualidade do grão.", options:{color:INK}},
], { x:0.7, y:1.95, w:6.6, h:0.9, fontFace:"Calibri", fontSize:16, margin:0, lineSpacingMultiple:1.1 });
const pains = [
  ["Diagnóstico tardio","O produtor costuma perceber a doença quando já se espalhou pela lavoura."],
  ["Falta de especialista","Nem toda propriedade tem acesso fácil a um agrônomo no momento certo."],
  ["Decisão sem orientação","Identificar a doença é só metade — falta saber o que fazer a seguir."],
];
let py = 3.0;
pains.forEach((p,i)=>{
  card(s, 0.7, py, 6.6, 0.98, CARD);
  s.addShape(pres.shapes.OVAL, { x:0.95, y:py+0.27, w:0.45, h:0.45, fill:{color: CREMA} });
  s.addText("!", { x:0.95, y:py+0.27, w:0.45, h:0.45, align:"center", valign:"middle", bold:true, color:"FFFFFF", fontSize:18, margin:0 });
  s.addText(p[0], { x:1.6, y:py+0.12, w:5.5, h:0.4, fontFace:"Cambria", fontSize:15, bold:true, color:INK, margin:0 });
  s.addText(p[1], { x:1.6, y:py+0.5, w:5.6, h:0.42, fontFace:"Calibri", fontSize:12, color:MUTE, margin:0 });
  py += 1.12;
});
// painel destaque
card(s, 7.7, 1.95, 5.0, 4.4, COFFEE);
s.addText("A oportunidade", { x:8.0, y:2.25, w:4.4, h:0.5, fontFace:"Cambria", fontSize:20, bold:true, color: MOSS, margin:0 });
s.addText([
  {text:"Quase todo produtor tem um ", options:{color:"F0E8DA"}},
  {text:"smartphone", options:{bold:true, color:"FFFFFF"}},
  {text:" no bolso.\n\n", options:{color:"F0E8DA"}},
  {text:"E se uma ", options:{color:"F0E8DA"}},
  {text:"foto da folha", options:{bold:true, color:"FFFFFF"}},
  {text:" virasse, em segundos, um diagnóstico confiável + um plano de ação em linguagem simples?", options:{color:"F0E8DA"}},
], { x:8.0, y:2.85, w:4.4, h:3.2, fontFace:"Calibri", fontSize:15.5, margin:0, lineSpacingMultiple:1.15 });
s.addNotes(
"Apresentador: 'O café é uma das principais culturas do Brasil, e as doenças foliares são um inimigo silencioso. A ferrugem, por exemplo, pode derrubar boa parte da produção de uma safra.'\n\n"+
"Explique as três dores, uma a uma, apontando para os cartões: o diagnóstico costuma chegar tarde; nem sempre há um agrônomo por perto; e, mesmo identificando a doença, o produtor fica sem saber qual a próxima atitude.\n\n"+
"Vire para o painel da direita: 'A boa notícia é que quase todo produtor tem um celular. Nossa ideia foi exatamente essa: transformar uma foto em diagnóstico mais plano de ação. É isso que o CoffeCare faz.'");

/* =====================================================================
   4. A SOLUÇÃO — FLUXO
===================================================================== */
s = pres.addSlide(); bgLight(s);
header(s, "Visão geral", "Como o CoffeCare funciona");
const flow = [
  ["1","Foto da folha","Produtor fotografa e envia pelo app (React).", LEAF],
  ["2","Diagnóstico (C2)","EfficientNet-B0 classifica a doença e dá o grau de confiança.", LEAF],
  ["3","Plano por LLM","A LLM via Groq escreve o plano de tratamento em português.", CREMA],
  ["4","Laudo + histórico","Resultado em tela, exportável em PDF e salvo por usuário.", CREMA],
];
let fx = 0.7;
flow.forEach((f,i)=>{
  card(s, fx, 2.2, 2.95, 3.5, CARD);
  stepDot(s, fx+0.3, 2.5, f[0], f[3]);
  s.addText(f[1], { x:fx+0.25, y:3.25, w:2.5, h:0.7, fontFace:"Cambria", fontSize:17, bold:true, color:INK, margin:0 });
  s.addText(f[2], { x:fx+0.25, y:3.95, w:2.55, h:1.6, fontFace:"Calibri", fontSize:12.5, color:MUTE, margin:0, lineSpacingMultiple:1.12 });
  if(i<3){ s.addText("›", { x:fx+2.78, y:3.4, w:0.5, h:0.7, fontFace:"Arial", fontSize:34, bold:true, color: CREMA, align:"center", margin:0 }); }
  fx += 3.05;
});
card(s, 0.7, 6.0, 12.0, 1.0, "EFE7D7");
s.addText([
  {text:"Em uma frase:  ", options:{bold:true, color:COFFEE}},
  {text:"a C2 diz ", options:{color:INK}},
  {text:"o que", options:{bold:true, italic:true, color:LEAF}},
  {text:" a planta tem; a LLM diz ", options:{color:INK}},
  {text:"o que fazer", options:{bold:true, italic:true, color:CREMA}},
  {text:" sobre isso.", options:{color:INK}},
], { x:1.0, y:6.0, w:11.4, h:1.0, fontFace:"Calibri", fontSize:18, align:"center", valign:"middle", margin:0 });
s.addNotes(
"Apresentador: 'O fluxo tem quatro passos bem simples do ponto de vista do usuário.'\n\n"+
"Passo 1: o produtor tira a foto e envia pelo app. Passo 2: nosso modelo de visão, a C2, classifica a doença e devolve um grau de confiança. Passo 3 — e este é o coração desta etapa: pegamos esse resultado e mandamos para uma LLM via Groq, que redige o plano de tratamento em português. Passo 4: tudo aparece na tela, pode ser exportado em PDF e fica salvo no histórico do usuário.\n\n"+
"Reforce a frase de baixo: 'A divisão de papéis é clara: a C2 diz O QUE a planta tem; a LLM diz O QUE FAZER. São responsabilidades diferentes, e isso é importante para a arquitetura.'");

/* =====================================================================
   5. ARQUITETURA
===================================================================== */
s = pres.addSlide(); bgDark(s);
s.addText("ARQUITETURA", { x:0.6, y:0.42, w:12, h:0.35, fontFace:"Calibri", fontSize:13, bold:true, color:CREMA, charSpacing:3, margin:0 });
s.addText("Como as peças se conectam", { x:0.6, y:0.74, w:12, h:0.9, fontFace:"Cambria", fontSize:32, bold:true, color:"FFFFFF", margin:0 });
// blocos
function archBox(x,y,w,h,title,sub,fill,tcol){
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x,y,w,h, rectRadius:0.08, fill:{color:fill}, shadow: shadow() });
  s.addText(title, { x:x+0.15, y:y+0.18, w:w-0.3, h:0.5, fontFace:"Cambria", fontSize:16, bold:true, color:tcol||"FFFFFF", align:"center", margin:0 });
  s.addText(sub, { x:x+0.15, y:y+0.72, w:w-0.3, h:h-0.85, fontFace:"Calibri", fontSize:11.5, color:tcol? "3A2E24":"E6DCCB", align:"center", margin:0, lineSpacingMultiple:1.05 });
}
archBox(0.7, 2.0, 3.0, 1.7, "Frontend", "React + TypeScript + Vite\nCaptura, resultados, histórico, PDF", "3A4A8C");
archBox(5.0, 2.0, 3.3, 1.7, "Backend — FastAPI", "API REST + WebSocket\nAutenticação JWT · SQLite", COFFEE);
archBox(9.6, 1.35, 3.0, 1.55, "C2 · Visão (PyTorch)", "EfficientNet-B0\nDiagnóstico + confiança", LEAF);
archBox(9.6, 3.25, 3.0, 1.55, "LLM · Groq API", "Plano de tratamento\nLlama 3 (nuvem, rápida)", CREMA, "2B2118");
// banco e env
archBox(5.0, 4.15, 3.3, 1.4, "Persistência", "Consultas por usuário\n(histórico + laudo)", "55504A");
// setas (linhas)
function arrow(x,y,w){ s.addShape(pres.shapes.LINE, { x,y,w,h:0, line:{color:MOSS, width:2.5, endArrowType:"triangle"} }); }
arrow(3.7, 2.85, 1.25);          // front -> back
s.addShape(pres.shapes.LINE, { x:8.3, y:2.6, w:1.25, h:0, line:{color:MOSS, width:2.5, endArrowType:"triangle"} }); // back->C2
s.addShape(pres.shapes.LINE, { x:8.3, y:3.95, w:1.25, h:0, line:{color:MOSS, width:2.5, endArrowType:"triangle"} }); // back->LLM
s.addShape(pres.shapes.LINE, { x:6.65, y:3.7, w:0, h:0.45, line:{color:MOSS, width:2.5, endArrowType:"triangle"} }); // back->db
// faixa env
card(s, 0.7, 6.05, 12.0, 0.95, COFFEE);
s.addText([
  {text:"🔐 Credenciais via .env  —  ", options:{bold:true, color: MOSS}},
  {text:"a GROQ_API_KEY nunca vai para o código nem para o GitHub; falha na LLM não derruba o sistema (fallback).", options:{color:"F0E8DA"}},
], { x:1.0, y:6.05, w:11.4, h:0.95, fontFace:"Calibri", fontSize:14, valign:"middle", margin:0 });
s.addNotes(
"Apresentador: 'Tecnicamente, o sistema tem quatro grandes peças.'\n\n"+
"Frontend em React, onde o produtor interage. Backend em FastAPI, que orquestra tudo via REST e WebSocket, com login JWT e banco SQLite. À direita, as duas inteligências: em cima a C2, nosso modelo de visão em PyTorch, que faz o diagnóstico; embaixo a LLM hospedada na Groq, que gera o plano de tratamento.\n\n"+
"Mostre o caminho de uma requisição seguindo as setas: a foto entra pelo front, vai ao backend, o backend chama a C2 para diagnosticar e, com esse resultado, chama a Groq para o plano; tudo é salvo no histórico.\n\n"+
"Destaque a faixa inferior: 'Um requisito importante da entrega: a chave da API fica em variável de ambiente, no arquivo .env, que está no .gitignore. E se a Groq falhar, o sistema não quebra — ele tem um fallback. Vamos detalhar isso adiante.'");

/* =====================================================================
   6. A C2 — VISÃO + SAÍDA ESTRUTURADA (Etapa 1)
===================================================================== */
s = pres.addSlide(); bgLight(s);
header(s, "Etapa 1 — Preparar o resultado da C2", "A C2: o modelo de visão computacional");
const c2items = [
  ["Modelo","EfficientNet-B0 (transfer learning, PyTorch) classificando 5 classes de folha."],
  ["Pipeline reutilizável","A inferência foi encapsulada em uma função única: recebe a imagem, devolve o resultado."],
  ["Saída estruturada","Retorno padronizado em dicionário/JSON — pronto para alimentar a LLM."],
];
let cy = 2.0;
c2items.forEach((it,i)=>{
  card(s, 0.7, cy, 6.4, 1.25, CARD);
  stepDot(s, 0.95, cy+0.35, i+1, LEAF);
  s.addText(it[0], { x:1.65, y:cy+0.16, w:5.3, h:0.4, fontFace:"Cambria", fontSize:16, bold:true, color:INK, margin:0 });
  s.addText(it[1], { x:1.65, y:cy+0.56, w:5.35, h:0.65, fontFace:"Calibri", fontSize:12.5, color:MUTE, margin:0, lineSpacingMultiple:1.08 });
  cy += 1.4;
});
// code card JSON
card(s, 7.4, 2.0, 5.3, 4.2, ESPRESSO);
s.addText("Saída padronizada da C2", { x:7.7, y:2.2, w:4.7, h:0.4, fontFace:"Calibri", fontSize:13, bold:true, color: MOSS, margin:0 });
s.addText(
'{\n'+
'  "disease": "Ferrugem",\n'+
'  "confidence": 0.94,\n'+
'  "model": "efficientnet_b0",\n'+
'  "classes": ["Ferrugem",\n'+
'      "Bicho-mineiro", "Cercospora",\n'+
'      "Phoma", "Saudável"]\n'+
'}',
  { x:7.7, y:2.7, w:4.8, h:2.6, fontFace:"Courier New", fontSize:14, color:"EDE6D8", margin:0, lineSpacingMultiple:1.12 });
s.addText("Métricas + contexto suficientes para a LLM analisar — não só o rótulo.",
  { x:7.7, y:5.5, w:4.8, h:0.6, fontFace:"Calibri", fontSize:12.5, italic:true, color:"C9BBA8", margin:0 });
s.addNotes(
"Apresentador: 'A primeira etapa da entrega pedia para preparar o resultado da C2 — e foi exatamente o que fizemos.'\n\n"+
"Ponto 1: o modelo é um EfficientNet-B0 treinado por transfer learning, que classifica a folha em cinco categorias. Ponto 2: a inferência foi encapsulada numa função reutilizável — você passa a imagem e recebe o resultado, sem repetir código. Ponto 3, o mais importante para a integração: a saída é padronizada, em formato estruturado.\n\n"+
"Aponte para o JSON: 'Repare que não devolvemos só o nome da doença. Devolvemos a doença, a confiança, o modelo usado e a lista de classes. Esse contexto extra é o que permite a LLM fazer uma análise rica em seguida — ela recebe dados, não apenas uma palavra solta.'");

/* =====================================================================
   7. RESULTADOS DO MODELO (README)
===================================================================== */
s = pres.addSlide(); bgLight(s);
header(s, "Resultados da C2", "Desempenho do modelo de visão");
// stats
function stat(x, val, lab, col){
  card(s, x, 1.95, 2.85, 1.5, CARD);
  s.addText(val, { x:x, y:2.05, w:2.85, h:0.85, align:"center", fontFace:"Cambria", fontSize:40, bold:true, color: col, margin:0 });
  s.addText(lab, { x:x, y:2.95, w:2.85, h:0.45, align:"center", fontFace:"Calibri", fontSize:12, color:MUTE, margin:0 });
}
stat(0.7,  "99,2%", "Acurácia (weighted)", LEAF);
stat(3.75, "99,2%", "F1 (weighted)", LEAF);
stat(6.8,  "93%",   "F1 (macro)", CREMA);
stat(9.85, "10.296","Imagens de teste", COFFEE);
// tabela por classe
const tbl = [
  [ {text:"Classe",options:{bold:true,color:"FFFFFF",fill:{color:COFFEE}}},
    {text:"Precisão",options:{bold:true,color:"FFFFFF",fill:{color:COFFEE},align:"center"}},
    {text:"Recall",options:{bold:true,color:"FFFFFF",fill:{color:COFFEE},align:"center"}},
    {text:"F1",options:{bold:true,color:"FFFFFF",fill:{color:COFFEE},align:"center"}},
    {text:"Suporte",options:{bold:true,color:"FFFFFF",fill:{color:COFFEE},align:"center"}} ],
  ["Bicho-mineiro","1,00","0,99","0,99","3443"],
  ["Cercospora","1,00","1,00","1,00","1521"],
  [ {text:"Ferrugem",options:{bold:true,color:"8A2B1E"}},
    {text:"0,62",options:{color:"8A2B1E",align:"center"}},
    {text:"0,76",options:{color:"8A2B1E",align:"center"}},
    {text:"0,68",options:{bold:true,color:"8A2B1E",align:"center"}},
    {text:"51",options:{color:"8A2B1E",align:"center"}} ],
  ["Phoma","0,98","0,99","0,99","1363"],
  ["Saudável","0,99","1,00","0,99","3918"],
];
s.addTable(tbl, { x:0.7, y:3.75, w:9.0, colW:[3.0,1.5,1.5,1.5,1.5], rowH:0.42,
  fontFace:"Calibri", fontSize:13, color:INK, valign:"middle", align:"center",
  border:{pt:0.5, color:"D9CEBC"} });
// nota lateral
card(s, 9.95, 3.75, 2.75, 2.85, "F7EDE0");
s.addText("⚠ Olhe o Macro", { x:10.15, y:3.95, w:2.4, h:0.4, fontFace:"Cambria", fontSize:15, bold:true, color: "8A5A1E", margin:0 });
s.addText("A média weighted (99%) é puxada pelas classes grandes. A média macro (93%) trata todas igual — e revela a fraqueza da Ferrugem.",
  { x:10.15, y:4.4, w:2.45, h:2.1, fontFace:"Calibri", fontSize:12, color: "5A4632", margin:0, lineSpacingMultiple:1.12 });
s.addNotes(
"Apresentador: 'Estes são os resultados do modelo no conjunto de teste — mais de dez mil imagens que ele nunca viu no treino.'\n\n"+
"Comece pelos números grandes: 'A acurácia ponderada passa de 99%, o que parece excelente.' Mas, e aqui está a honestidade científica: 'olhem o F1 macro, de 93%. Ele já é mais baixo, e tem um motivo.'\n\n"+
"Desça para a tabela e aponte a linha da Ferrugem, em vermelho: 'A Ferrugem tem F1 de apenas 0,68, com só 51 imagens de teste. As outras classes são quase perfeitas porque têm milhares de exemplos.'\n\n"+
"Explique o cartão da direita: 'A métrica weighted é puxada para cima pelas classes com muitas imagens. A macro trata todas as classes igualmente e por isso expõe o ponto fraco. Sempre olhe a macro em dataset desbalanceado.' (Se o avaliador perguntar: os números do relatório atual, pós-reconsolidação do dataset, estão mais baixos — cite isso como trabalho em andamento.)");

/* =====================================================================
   8. ANÁLISE CRÍTICA DO MODELO
===================================================================== */
s = pres.addSlide(); bgLight(s);
header(s, "Honestidade científica", "Limitações da C2 e como tratamos");
const crit = [
  ["Desbalanceamento de classes","A Ferrugem — justamente a doença mais grave — tinha pouquíssimas imagens. Isso derruba a métrica macro.", "8A2B1E"],
  ["Não confiar só na acurácia","Reportamos weighted E macro lado a lado. Esconder a macro daria uma falsa sensação de perfeição.", COFFEE],
  ["Mitigações aplicadas","Loss ponderada por classe, augmentation forte, divisão estratificada e agregação de vários datasets focando Ferrugem.", LEAF],
  ["A confiança importa no produto","O grau de confiança vai junto do diagnóstico — e é repassado à LLM, que pode ser mais cautelosa quando ele é baixo.", LEAF],
];
let qy = 1.95;
crit.forEach((c,i)=>{
  const col=i%2, row=Math.floor(i/2);
  const x=0.7+col*6.2, y=qy+row*2.3;
  card(s, x, y, 5.85, 2.05, CARD);
  s.addShape(pres.shapes.OVAL, { x:x+0.3, y:y+0.3, w:0.5, h:0.5, fill:{color:c[2]} });
  s.addText(String(i+1), { x:x+0.3, y:y+0.3, w:0.5, h:0.5, align:"center", valign:"middle", bold:true, color:"FFFFFF", fontSize:18, margin:0 });
  s.addText(c[0], { x:x+1.0, y:y+0.28, w:4.6, h:0.65, fontFace:"Cambria", fontSize:16, bold:true, color:INK, margin:0 });
  s.addText(c[1], { x:x+1.0, y:y+0.95, w:4.65, h:0.95, fontFace:"Calibri", fontSize:12.5, color:MUTE, margin:0, lineSpacingMultiple:1.1 });
});
s.addNotes(
"Apresentador: 'Vale parar um instante na análise crítica do modelo, porque ela mostra maturidade.'\n\n"+
"Primeiro: o dataset era desbalanceado, e logo a doença mais grave, a Ferrugem, era a que tinha menos exemplos. Segundo: por isso não confiamos só na acurácia — mostramos weighted e macro juntas, porque esconder a macro daria uma falsa perfeição. Terceiro: aplicamos mitigações concretas — loss ponderada por classe, data augmentation, divisão estratificada e agregação de novos datasets focados em Ferrugem. Quarto, e que liga com a LLM: o grau de confiança acompanha o diagnóstico e é passado para a LLM, que pode ser mais cautelosa quando a confiança é baixa.\n\n"+
"Frase de transição: 'E é exatamente aqui que entra a parte nova desta entrega: a camada de linguagem.'");

/* =====================================================================
   9. ETAPA 2 — ENGENHARIA DE PROMPT
===================================================================== */
s = pres.addSlide(); bgDark(s);
s.addText("ETAPA 2 — ENGENHARIA DE PROMPT", { x:0.6, y:0.42, w:12, h:0.35, fontFace:"Calibri", fontSize:13, bold:true, color:CREMA, charSpacing:3, margin:0 });
s.addText("Como conversamos com a LLM", { x:0.6, y:0.74, w:12, h:0.9, fontFace:"Cambria", fontSize:32, bold:true, color:"FFFFFF", margin:0 });
// system prompt card
card(s, 0.7, 1.95, 6.0, 2.1, COFFEE);
s.addText("System prompt  —  o papel da LLM", { x:0.95, y:2.12, w:5.5, h:0.4, fontFace:"Calibri", fontSize:13, bold:true, color: MOSS, margin:0 });
s.addText('"Você é um Engenheiro Agrônomo especialista em cafeicultura. Responda SEMPRE em português do Brasil, de forma objetiva e prática."',
  { x:0.95, y:2.55, w:5.55, h:1.4, fontFace:"Calibri", fontSize:14, italic:true, color:"F0E8DA", margin:0, lineSpacingMultiple:1.15 });
// user prompt card
card(s, 0.7, 4.25, 6.0, 2.35, COFFEE);
s.addText("User prompt  —  injeta o resultado da C2", { x:0.95, y:4.42, w:5.5, h:0.4, fontFace:"Calibri", fontSize:13, bold:true, color: MOSS, margin:0 });
s.addText('"Diagnóstico: {disease} (confiança {confidence}). Explique brevemente a doença e liste 3 passos práticos de tratamento e controle."',
  { x:0.95, y:4.85, w:5.55, h:1.65, fontFace:"Calibri", fontSize:14, italic:true, color:"F0E8DA", margin:0, lineSpacingMultiple:1.15 });
// right column decisions
card(s, 7.0, 1.95, 5.7, 4.65, "F5EFE3");
s.addText("Decisões de prompt", { x:7.3, y:2.15, w:5.1, h:0.45, fontFace:"Cambria", fontSize:18, bold:true, color:INK, margin:0 });
const pdec = [
  ["Formato definido","Pedimos resposta curta, em tópicos — fácil de ler no celular."],
  ["Temperatura baixa (0,2)","Tarefa analítica e objetiva → respostas estáveis, menos 'invenção'."],
  ["Idioma forçado","Garante português do Brasil mesmo que o modelo pense em inglês."],
  ["Prompts versionados","Fazem parte da arquitetura: ficam documentados no repositório."],
];
let dy=2.7;
pdec.forEach(d=>{
  s.addShape(pres.shapes.OVAL, { x:7.35, y:dy+0.05, w:0.28, h:0.28, fill:{color:CREMA} });
  s.addText(d[0], { x:7.8, y:dy-0.06, w:4.6, h:0.4, fontFace:"Cambria", fontSize:14.5, bold:true, color:INK, margin:0 });
  s.addText(d[1], { x:7.8, y:dy+0.32, w:4.7, h:0.55, fontFace:"Calibri", fontSize:12, color:MUTE, margin:0, lineSpacingMultiple:1.05 });
  dy+=0.95;
});
s.addNotes(
"Apresentador: 'A engenharia de prompt é o que define a qualidade da resposta. Separamos em dois prompts.'\n\n"+
"O system prompt estabelece o PAPEL: a LLM age como um engenheiro agrônomo especialista em café e responde sempre em português objetivo. O user prompt INJETA o resultado da C2 — a doença e a confiança — e pede uma explicação curta mais três passos práticos.\n\n"+
"Do lado direito, as decisões: definimos o formato (curto, em tópicos, pensado para o celular); usamos temperatura baixa, 0,2, porque é uma tarefa analítica e queremos respostas estáveis, não criativas; forçamos o idioma; e — boa prática exigida — versionamos os prompts no repositório, porque o prompt faz parte da arquitetura do sistema, não é um detalhe.\n\n"+
"Se perguntarem por que 0,2 e não 0: deixamos uma margem mínima de naturalidade no texto sem comprometer a consistência; testamos 0,0, 0,2 e 0,7 e o 0,2 deu o melhor equilíbrio.");

/* =====================================================================
   10. ETAPA 3 — INTEGRAÇÃO COM GROQ
===================================================================== */
s = pres.addSlide(); bgLight(s);
header(s, "Etapa 3 — Integração com o Groq", "Chamando a LLM com robustez");
const groq = [
  ["Chamada à API","Requisição à Groq com a chave lida do .env (variável de ambiente).", LEAF],
  ["Timeout + tratamento de erro","Toda chamada tem tempo-limite; erro de rede ou de API é capturado.", CREMA],
  ["Nunca quebra o sistema","Se a LLM falhar, retornamos uma mensagem de fallback — a análise da C2 continua válida.", "8A2B1E"],
  ["Limite de tokens (max_tokens)","Resposta enxuta: controla custo, latência e evita texto longo demais.", LEAF],
  ["Logging","Registramos latência e tokens consumidos por chamada — para medir e otimizar.", COFFEE],
  ["Cache de respostas","Mesma doença → resposta reaproveitada: mais rápido e mais barato.", CREMA],
];
let gx=0.7, gy=1.95;
groq.forEach((g,i)=>{
  const col=i%3, row=Math.floor(i/3);
  const x=gx+col*4.07, y=gy+row*2.3;
  card(s, x, y, 3.8, 2.05, CARD);
  s.addShape(pres.shapes.OVAL, { x:x+0.28, y:y+0.28, w:0.5, h:0.5, fill:{color:g[2]} });
  s.addText(String(i+1), { x:x+0.28, y:y+0.28, w:0.5, h:0.5, align:"center", valign:"middle", bold:true, color:"FFFFFF", fontSize:17, margin:0 });
  s.addText(g[0], { x:x+0.28, y:y+0.92, w:3.3, h:0.5, fontFace:"Cambria", fontSize:15, bold:true, color:INK, margin:0 });
  s.addText(g[1], { x:x+0.28, y:y+1.4, w:3.35, h:0.6, fontFace:"Calibri", fontSize:11.5, color:MUTE, margin:0, lineSpacingMultiple:1.05 });
});
s.addNotes(
"Apresentador: 'A integração com a Groq não é só chamar a API. Os requisitos pediam robustez, e foi nisso que focamos.'\n\n"+
"Vá pelos seis cartões: 1) a chamada usa a chave lida do .env, nunca hardcoded. 2) Toda chamada tem timeout e tratamento de erro. 3) A regra de ouro: falha na LLM NÃO derruba o sistema — entregamos um fallback e o diagnóstico da C2 continua valendo. 4) Limitamos max_tokens, para controlar custo, latência e tamanho. 5) Fazemos logging de latência e tokens consumidos, para conseguir medir e otimizar. 6) E cacheamos respostas: se já geramos o plano para 'Ferrugem', reaproveitamos — economiza tempo e dinheiro.\n\n"+
"Mensagem central: 'A LLM é um componente externo e pode falhar. Tratamos isso como engenharia: o sistema é resiliente a essa falha.'");

/* =====================================================================
   11. BOAS PRÁTICAS COM LLMs
===================================================================== */
s = pres.addSlide(); bgDark(s);
s.addText("BOAS PRÁTICAS COM LLMs", { x:0.6, y:0.42, w:12, h:0.35, fontFace:"Calibri", fontSize:13, bold:true, color:CREMA, charSpacing:3, margin:0 });
s.addText("Princípios que guiaram a integração", { x:0.6, y:0.74, w:12, h:0.9, fontFace:"Cambria", fontSize:32, bold:true, color:"FFFFFF", margin:0 });
const bp = [
  ["Nunca confiar cegamente","A resposta da LLM é uma SUGESTÃO. O diagnóstico técnico vem da C2; a LLM apenas orienta."],
  ["Temperatura 0,0–0,3","Tarefa objetiva pede respostas determinísticas. Usamos 0,2."],
  ["Documentar os prompts","Eles são parte da arquitetura — versionados e revisáveis."],
  ["Limitar tokens","max_tokens evita respostas longas, caras e divagantes."],
  ["Cachear entradas repetidas","Economia e velocidade para diagnósticos recorrentes."],
  ["Segredos no .env","GROQ_API_KEY fora do código e fora do Git."],
];
let bx=0.7, by=1.95;
bp.forEach((b,i)=>{
  const col=i%2, row=Math.floor(i/2);
  const x=bx+col*6.2, y=by+row*1.62;
  card(s, x, y, 5.85, 1.4, COFFEE);
  s.addShape(pres.shapes.OVAL, { x:x+0.28, y:y+0.45, w:0.5, h:0.5, fill:{color: MOSS} });
  s.addText("✓", { x:x+0.28, y:y+0.45, w:0.5, h:0.5, align:"center", valign:"middle", bold:true, color: ESPRESSO, fontSize:18, margin:0 });
  s.addText(b[0], { x:x+1.0, y:y+0.18, w:4.6, h:0.45, fontFace:"Cambria", fontSize:15, bold:true, color:"FFFFFF", margin:0 });
  s.addText(b[1], { x:x+1.0, y:y+0.62, w:4.65, h:0.7, fontFace:"Calibri", fontSize:11.5, color:"E6DCCB", margin:0, lineSpacingMultiple:1.05 });
});
s.addNotes(
"Apresentador: 'Seguimos um conjunto de boas práticas que são quase um código de conduta ao usar LLMs.'\n\n"+
"A primeira é a mais importante: nunca confiar cegamente. A resposta da LLM é uma sugestão de manejo; o diagnóstico de verdade vem da C2, que é mensurável. Usamos temperatura baixa para tarefas objetivas; documentamos os prompts como parte da arquitetura; limitamos tokens; cacheamos entradas repetidas; e guardamos a chave em variável de ambiente.\n\n"+
"Se quiser fechar com impacto: 'Resumindo: tratamos a LLM como um assistente competente porém falível — útil, mas sempre sob supervisão e com salvaguardas.'");

/* =====================================================================
   12. ETAPA 4 — APRESENTAÇÃO DO RESULTADO (UI)
===================================================================== */
s = pres.addSlide(); bgLight(s);
header(s, "Etapa 4 — Apresentação do resultado", "C2 e LLM lado a lado para o usuário");
// mockup: phone-ish card
card(s, 0.7, 1.95, 5.4, 4.7, CARD);
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:1.0, y:2.25, w:4.8, h:1.2, rectRadius:0.06, fill:{color:"EAF3E9"} });
s.addText("Diagnóstico (C2)", { x:1.2, y:2.4, w:4.4, h:0.35, fontFace:"Calibri", fontSize:12, bold:true, color: LEAF, margin:0 });
s.addText("Ferrugem", { x:1.2, y:2.72, w:3.0, h:0.55, fontFace:"Cambria", fontSize:26, bold:true, color: LEAF, margin:0 });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:4.05, y:2.78, w:1.55, h:0.45, rectRadius:0.2, fill:{color: LEAF} });
s.addText("94% certeza", { x:4.05, y:2.78, w:1.55, h:0.45, align:"center", valign:"middle", fontSize:11, bold:true, color:"FFFFFF", margin:0 });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:1.0, y:3.65, w:4.8, h:2.75, rectRadius:0.06, fill:{color:"FBF6EC"} });
s.addText("Plano de ação — IA (Groq)", { x:1.2, y:3.8, w:4.4, h:0.35, fontFace:"Calibri", fontSize:12, bold:true, color: CREMA, margin:0 });
s.addText([
  {text:"A ferrugem é um fungo que forma manchas alaranjadas na folha.\n", options:{breakLine:true}},
  {text:"1. Aplicar fungicida cúprico nas primeiras manchas.\n", options:{breakLine:true}},
  {text:"2. Melhorar arejamento e reduzir umidade da copa.\n", options:{breakLine:true}},
  {text:"3. Monitorar semanalmente e adubar para fortalecer a planta.", options:{}},
], { x:1.2, y:4.15, w:4.45, h:2.15, fontFace:"Calibri", fontSize:11.5, color:INK, margin:0, lineSpacingMultiple:1.12 });
// right: explanation
const ui = [
  ["Saída bruta vs. análise","O usuário vê o rótulo + confiança da C2 e, separadamente, a análise gerada pela LLM."],
  ["Tempo real (WebSocket)","As etapas aparecem na tela conforme acontecem: 'analisando…', 'gerando plano…'."],
  ["Laudo em PDF + histórico","O resultado é exportável e fica salvo por usuário para consulta futura."],
];
let uy=2.15;
ui.forEach((u,i)=>{
  card(s, 6.5, uy, 6.2, 1.35, CARD);
  stepDot(s, 6.78, uy+0.4, i+1, i<1?LEAF:CREMA);
  s.addText(u[0], { x:7.5, y:uy+0.2, w:5.0, h:0.45, fontFace:"Cambria", fontSize:16, bold:true, color:INK, margin:0 });
  s.addText(u[1], { x:7.5, y:uy+0.65, w:5.05, h:0.65, fontFace:"Calibri", fontSize:12, color:MUTE, margin:0, lineSpacingMultiple:1.08 });
  uy+=1.5;
});
s.addNotes(
"Apresentador: 'A quarta etapa é mostrar tudo isso para o usuário de forma clara. À esquerda está a tela de resultado do app.'\n\n"+
"Aponte: 'No bloco verde, a saída crua da C2 — a doença e o grau de confiança. No bloco dourado, a análise gerada pela LLM: a explicação e os três passos. O usuário consegue comparar o dado bruto do modelo com a interpretação da linguagem — exatamente o que o requisito pedia.'\n\n"+
"Lado direito: 'A análise aparece em tempo real, via WebSocket, mostrando cada fase do pipeline. E o resultado final pode virar um PDF e fica salvo no histórico do usuário.'\n\n"+
"Observação honesta para a banca, se couber: 'Na captura mostrada, a fonte do plano é a Groq; no código atual essa camada está em migração a partir do Ollama local — a arquitetura, prompts e tratamento de erros são os mesmos.'");

/* =====================================================================
   13. JUSTIFICATIVA DO MODELO + ANÁLISE CRÍTICA DAS RESPOSTAS
===================================================================== */
s = pres.addSlide(); bgLight(s);
header(s, "Escolha do modelo & qualidade", "Por que Groq + análise das respostas");
// left: model choice
card(s, 0.7, 1.95, 6.0, 4.65, CARD);
s.addText("Por que Groq (Llama 3)?", { x:1.0, y:2.15, w:5.4, h:0.5, fontFace:"Cambria", fontSize:19, bold:true, color:INK, margin:0 });
const why = [
  ["Velocidade","Inferência muito rápida (LPU) → resposta quase instantânea no app."],
  ["Custo / camada gratuita","Viável para um projeto acadêmico, sem servidor de GPU próprio."],
  ["Qualidade em PT-BR","Llama 3 gera texto técnico coerente em português."],
  ["Sem infra local","Diferente do Ollama, não exige o usuário rodar o modelo na máquina."],
];
let wy=2.75;
why.forEach(w=>{
  s.addShape(pres.shapes.OVAL, { x:1.05, y:wy+0.05, w:0.3, h:0.3, fill:{color:LEAF} });
  s.addText(w[0], { x:1.55, y:wy-0.05, w:4.9, h:0.4, fontFace:"Cambria", fontSize:14.5, bold:true, color:INK, margin:0 });
  s.addText(w[1], { x:1.55, y:wy+0.33, w:5.0, h:0.55, fontFace:"Calibri", fontSize:12, color:MUTE, margin:0, lineSpacingMultiple:1.05 });
  wy+=0.95;
});
// right: critical analysis
card(s, 7.0, 1.95, 5.7, 4.65, "F7EDE0");
s.addText("Análise crítica das respostas", { x:7.3, y:2.15, w:5.1, h:0.5, fontFace:"Cambria", fontSize:19, bold:true, color: "7A4E14", margin:0 });
const qa = [
  ["✓ Bom","Linguagem clara, passos práticos e corretos para doenças comuns."],
  ["✓ Bom","Temperatura baixa deixou as respostas consistentes entre execuções."],
  ["⚠ Atenção","Pode 'soar confiante' mesmo quando a confiança da C2 é baixa."],
  ["⚠ Atenção","Sem garantia de fonte agronômica — precisa de revisão de especialista."],
];
let qy2=2.75;
qa.forEach(q=>{
  const good = q[0].startsWith("✓");
  s.addText(q[0], { x:7.3, y:qy2, w:1.0, h:0.4, fontFace:"Calibri", fontSize:13, bold:true, color: good? LEAF : "B5651D", margin:0 });
  s.addText(q[1], { x:8.25, y:qy2, w:4.25, h:0.85, fontFace:"Calibri", fontSize:12.5, color:"5A4632", margin:0, lineSpacingMultiple:1.08 });
  qy2+=0.97;
});
s.addNotes(
"Apresentador: 'Duas perguntas que a banca certamente faria: por que esse modelo, e a resposta é boa?'\n\n"+
"À esquerda, a justificativa do Groq: é absurdamente rápido por causa do hardware LPU, tem camada gratuita viável para um projeto acadêmico, gera bom português técnico com o Llama 3 e, ao contrário do Ollama, não exige que o usuário rode o modelo na própria máquina.\n\n"+
"À direita, a análise crítica honesta, com exemplos reais: os pontos fortes são clareza, passos corretos para as doenças comuns e consistência graças à temperatura baixa. Os pontos de atenção: a LLM pode soar confiante mesmo quando a C2 está incerta, e não há garantia de embasamento agronômico — por isso tratamos a saída como sugestão, sujeita a revisão de um especialista.\n\n"+
"Feche: 'É essa postura crítica que torna o sistema confiável: a LLM agrega valor, mas não substitui o agrônomo nem o dado medido da C2.'");

/* =====================================================================
   14. ENTREGÁVEIS / ENCERRAMENTO
===================================================================== */
s = pres.addSlide(); bgDark(s);
s.addShape(pres.shapes.OVAL, { x:-1.4, y:4.6, w:4.5, h:4.5, fill:{color: COFFEE} });
s.addShape(pres.shapes.OVAL, { x:11.4, y:-1.6, w:4.2, h:4.2, fill:{color: LEAF, transparency:30} });
s.addText("ENTREGÁVEIS & PRÓXIMOS PASSOS", { x:0.8, y:0.6, w:12, h:0.4, fontFace:"Calibri", fontSize:14, bold:true, color: CREMA, charSpacing:3, margin:0 });
s.addText("O que entregamos", { x:0.8, y:1.05, w:12, h:0.9, fontFace:"Cambria", fontSize:34, bold:true, color:"FFFFFF", margin:0 });
const deliver = [
  ["Repositório GitHub","Código C2 + LLM via Groq, com README explicando a integração."],
  ["Prompts documentados","System e user prompt versionados + justificativa do modelo escolhido."],
  ["Demonstração end-to-end","Vídeo curto mostrando o pipeline da foto ao plano de tratamento."],
  ["Análise crítica","Avaliação da qualidade das respostas em exemplos reais."],
];
let dx=0.8, dyy=2.2;
deliver.forEach((d,i)=>{
  const col=i%2, row=Math.floor(i/2);
  const x=dx+col*6.15, y=dyy+row*1.55;
  card(s, x, y, 5.8, 1.35, COFFEE);
  stepDot(s, x+0.3, y+0.4, i+1, MOSS);
  s.addText(d[0], { x:x+1.05, y:y+0.2, w:4.5, h:0.45, fontFace:"Cambria", fontSize:16, bold:true, color:"FFFFFF", margin:0 });
  s.addText(d[1], { x:x+1.05, y:y+0.66, w:4.55, h:0.6, fontFace:"Calibri", fontSize:11.5, color:"E6DCCB", margin:0, lineSpacingMultiple:1.05 });
});
s.addText("Próximos passos:  reavaliar o modelo após reconsolidar o dataset · enriquecer imagens de Ferrugem · medir latência/custo da Groq em produção.",
  { x:0.8, y:5.5, w:11.8, h:0.7, fontFace:"Calibri", fontSize:13, italic:true, color:"C9BBA8", margin:0, lineSpacingMultiple:1.1 });
s.addText("Obrigado!  ☕   Perguntas?", { x:0.8, y:6.35, w:11.8, h:0.7, fontFace:"Cambria", fontSize:24, bold:true, color: MOSS, margin:0 });
s.addNotes(
"Apresentador (fechamento): 'Para encerrar, o que estamos entregando nesta etapa.'\n\n"+
"Liste os quatro entregáveis: o repositório no GitHub com a integração C2 + Groq e um README que a explica; os prompts documentados e a justificativa do modelo; a demonstração em vídeo do pipeline completo; e a análise crítica da qualidade das respostas.\n\n"+
"Próximos passos, mostrando que o projeto tem futuro: reavaliar o modelo depois de reconsolidar o dataset, conseguir mais imagens de Ferrugem para corrigir o ponto fraco, e medir latência e custo reais da Groq em produção.\n\n"+
"Encerre com simpatia: 'Esse é o CoffeCare — da foto da folha ao plano de tratamento, com visão computacional e linguagem trabalhando juntas. Obrigado, e estamos abertos a perguntas.'");

pres.writeFile({ fileName: "CoffeCare_Apresentacao.pptx" }).then(f => console.log("OK:", f));
