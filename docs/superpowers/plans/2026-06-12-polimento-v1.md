# Polimento da v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar os 3 *minors* da revisão final da v1 — feedback de recompensa ao vencer a blind, correção do `descricaoCoringa`, e self-host das fontes — sem introduzir novos sistemas de jogo.

**Architecture:** Três tarefas independentes. (B) extrai uma função pura `sufixoEstado(dados)` para `js/data/jokers.js`, testada em Node, e a reusa em `render.js`. (A) adiciona um toast de UI em `aoJogar`. (C) baixa os `.woff2`, cria `css/fonts.css` com `@font-face` e remove os links do Google Fonts. Cada tarefa é um commit.

**Tech Stack:** JavaScript puro (ES modules, sem build), HTML, CSS. Testes via harness próprio (`tests/harness.js`), rodados com `node tests/todos.js` (Node 18+). Zero dependências.

**Convenções do projeto (obrigatórias):**
- Código e comentários em português (BR).
- Zero dependências de runtime; ES modules nativos, sem build.
- Todo commit termina com a segunda linha:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

**Spec:** `docs/superpowers/specs/2026-06-12-polimento-v1-design.md`

---

## Arquivos tocados

- `js/data/jokers.js` — **Modificar**: adicionar e exportar `sufixoEstado(dados)`.
- `js/ui/render.js` — **Modificar**: `descricaoCoringa` passa a usar `sufixoEstado`.
- `js/ui/screens.js` — **Modificar**: `aoJogar` exibe o toast de recompensa.
- `tests/data.test.js` — **Modificar**: casos de teste de `sufixoEstado`.
- `index.html` — **Modificar**: remove os 3 links de fonte externos + preconnect; adiciona `css/fonts.css`.
- `css/fonts.css` — **Criar**: regras `@font-face` apontando para `fonts/`.
- `fonts/*.woff2` — **Criar**: arquivos de fonte baixados.
- `fonts/OFL.txt` — **Criar**: crédito/licença das fontes.
- `README.md` — **Modificar**: nota de fontes self-hosted.

---

## Task 1 (Frente B): função pura `sufixoEstado` + correção do `descricaoCoringa`

**Files:**
- Modify: `js/data/jokers.js` (adicionar `sufixoEstado` ao fim, antes ou depois de `novoCoringa`)
- Modify: `js/ui/render.js:99-106` (`descricaoCoringa`)
- Test: `tests/data.test.js`

Contexto: hoje `descricaoCoringa` (em `render.js`) monta o sufixo "(atual: …)" com três
`if` que **sobrescrevem** a mesma variável, então um coringa com dois campos de `dados`
mostraria só o último. A lógica de formatação vai virar uma função pura em `jokers.js`
(onde mora a semântica dos `dados` dos coringas), testável em Node sem tocar no DOM.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar ao fim de `tests/data.test.js`. Primeiro, incluir `sufixoEstado` no import
existente da linha 3:

```js
import { CORINGAS, novoCoringa, sufixoEstado } from "../js/data/jokers.js";
```

Depois, acrescentar os casos ao fim do arquivo:

```js
teste("jokers: sufixoEstado mostra cada campo de dados presente", () => {
  igual(sufixoEstado({}), "", "dados vazio não gera sufixo");
  igual(sufixoEstado({ mult: 5 }), " (atual: +5)");
  igual(sufixoEstado({ x: 1.5 }), " (atual: ×1.5)");
  igual(sufixoEstado({ valor: 3 }), " (atual: $3)");
  // O caso que a versão antiga quebrava: dois campos ao mesmo tempo.
  igual(sufixoEstado({ mult: 5, x: 1.5 }), " (atual: +5, ×1.5)");
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `node tests/todos.js 2>&1 | grep -E "sufixoEstado|falha"`
Expected: falha — `sufixoEstado is not a function` (ou o teste aparece como ✘), e o
resumo final acusa ≥1 falha.

- [ ] **Step 3: Implementar `sufixoEstado` em `js/data/jokers.js`**

Adicionar ao fim do arquivo (depois de `novoCoringa`):

```js
// Sufixo "(atual: …)" exibido no tooltip de um Coringa com estado interno.
// Acumula todos os campos presentes em "dados" (não sobrescreve).
export function sufixoEstado(dados) {
  const partes = [];
  if (dados.mult !== undefined) partes.push(`+${dados.mult}`);
  if (dados.x !== undefined) partes.push(`×${dados.x}`);
  if (dados.valor !== undefined) partes.push(`$${dados.valor}`);
  return partes.length ? ` (atual: ${partes.join(", ")})` : "";
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `node tests/todos.js 2>&1 | tail -1`
Expected: `N teste(s), 0 falha(s)` (N = 72, era 71 + o novo caso).

- [ ] **Step 5: Reusar `sufixoEstado` em `render.js`**

Em `js/ui/render.js`, `sufixoEstado` vem de `jokers.js`, que ainda **não** é importado
nesse arquivo (os imports existentes não precisam mudar). Adicionar um novo import logo
após a linha 8 (`import { ligarTooltip } from "./tooltip.js";`):

```js
import { sufixoEstado } from "../data/jokers.js";
```

Depois, substituir a função `descricaoCoringa` (linhas 99-106) por:

```js
function descricaoCoringa(coringa) {
  return coringa.def.descricao + sufixoEstado(coringa.dados);
}
```

- [ ] **Step 6: Rodar a suíte inteira de novo**

Run: `node tests/todos.js 2>&1 | tail -1`
Expected: `72 teste(s), 0 falha(s)` (a mudança em `render.js` não roda nos testes, mas
confirma que nada quebrou).

- [ ] **Step 7: Commit**

```bash
git add js/data/jokers.js js/ui/render.js tests/data.test.js
git commit -m "fix: descricaoCoringa mostra todos os campos de dados (minor #3)

Extrai sufixoEstado para jokers.js (função pura, testada) e a reusa em render.js.
Antes, três ifs sobrescreviam o sufixo e um coringa com dois campos mostraria só o último.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2 (Frente A): toast de recompensa ao vencer a blind

**Files:**
- Modify: `js/ui/screens.js:155-167` (`aoJogar`)

Contexto: `jogar(state, indices)` já retorna `{ vitoriaBlind: true, recompensa, eventos, ... }`
quando a blind é vencida (ver `js/engine/run.js:88-89`). A UI recebe esse resultado em
`aoJogar` mas não exibe a recompensa — o jogador cai na loja sem ver o ganho. O helper
`avisar(codigo)` (em `js/ui/render.js:55-59`) exibe um toast: se o código não estiver no
dicionário `MENSAGENS`, exibe o texto cru, então podemos passar a mensagem já formatada.

Esta tarefa é puramente de UI; não há teste de engine novo (`run.test.js:78` já cobre
que `recompensa` vale 8 ao vencer). A verificação é manual no navegador.

- [ ] **Step 1: Adicionar o toast em `aoJogar`**

Em `js/ui/screens.js`, a função `aoJogar` hoje é (linhas 155-167):

```js
async function aoJogar(state) {
  const indices = [...selecao];
  const cartas = indices.map((i) => state.rodada.mao[i]);
  const resultado = jogar(state, indices);
  if (resultado.erro) {
    avisar(resultado.erro);
    return;
  }
  document.getElementById("btn-jogar").disabled = true;
  document.getElementById("btn-descartar").disabled = true;
  await animarJogada(cartas, resultado.eventos, document.getElementById("area-jogada"));
  atualizar();
}
```

Substituir pela versão que mostra o toast após a animação e antes da troca de tela:

```js
async function aoJogar(state) {
  const indices = [...selecao];
  const cartas = indices.map((i) => state.rodada.mao[i]);
  const resultado = jogar(state, indices);
  if (resultado.erro) {
    avisar(resultado.erro);
    return;
  }
  document.getElementById("btn-jogar").disabled = true;
  document.getElementById("btn-descartar").disabled = true;
  await animarJogada(cartas, resultado.eventos, document.getElementById("area-jogada"));
  if (resultado.vitoriaBlind) avisar(`Blind vencida! +$${resultado.recompensa}`);
  atualizar();
}
```

- [ ] **Step 2: Rodar a suíte para confirmar que nada quebrou**

Run: `node tests/todos.js 2>&1 | tail -1`
Expected: `72 teste(s), 0 falha(s)` (mudança só de UI; testes inalterados).

- [ ] **Step 3: Verificação manual (anotar, não bloqueia o commit)**

Servir o app (`python3 -m http.server 8000`) e jogar até vencer uma blind; confirmar
que aparece o toast "Blind vencida! +$N" antes da loja. Como este ambiente não tem
navegador, registrar como pendente de verificação visual se não houver browser.

- [ ] **Step 4: Commit**

```bash
git add js/ui/screens.js
git commit -m "feat: aviso +\$N ao vencer a blind (minor #2)

aoJogar passa a exibir um toast com a recompensa após a animação da jogada vitoriosa,
antes de transicionar para a loja. Reusa o helper avisar.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 3 (Frente C): self-host das fontes

**Files:**
- Create: `fonts/` com `.woff2` baixados
- Create: `fonts/OFL.txt`
- Create: `css/fonts.css`
- Modify: `index.html:7-9` (remover links externos), `index.html:10` (adicionar `fonts.css`)
- Modify: `README.md`

Contexto: `index.html` carrega `Press Start 2P` (peso 400) e `Rubik` (400/600/800) do
Google Fonts. É a única dependência externa em runtime. As declarações de família já têm
fallback (`css/base.css:14` → `"Press Start 2P", monospace`; `css/base.css:24` → `"Rubik",
system-ui, sans-serif`), então **só o source muda**, via `@font-face` local. Subsets
latin + latin-ext (cobrem os acentos do PT-BR). Ambas as fontes são OFL, redistribuíveis.

> Nota: este passo baixa arquivos da internet. Se o ambiente de execução não tiver rede,
> registrar como bloqueado e pular para o commit dos demais artefatos (CSS + HTML) só
> depois que os `.woff2` existirem — sem os arquivos, não commitar HTML que aponta para
> caminhos vazios. Durante o brainstorming a rede foi confirmada disponível.

- [ ] **Step 1: Baixar os `.woff2` para `fonts/`**

Obter as URLs `.woff2` (subsets latin e latin-ext) a partir do endpoint CSS do Google
Fonts com User-Agent moderno, e baixar cada arquivo. Rodar:

```bash
mkdir -p fonts
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
CSS=$(curl -s --max-time 15 "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rubik:wght@400;600;800&display=swap" -H "User-Agent: $UA")
echo "$CSS"   # inspecionar: cada bloco @font-face tem um comentário de subset (/* latin */, /* latin-ext */) e um src woff2
```

Da saída, identificar e baixar, **apenas dos subsets `latin` e `latin-ext`**:
- Press Start 2P, weight 400 → 2 arquivos (latin, latin-ext)
- Rubik weight 400 → 2 arquivos
- Rubik weight 600 → 2 arquivos
- Rubik weight 800 → 2 arquivos

Nomear de forma estável (não usar os hashes do Google). Exemplo de download de uma URL:

```bash
curl -s -o fonts/press-start-2p-400-latin.woff2 "<URL latin do Press Start 2P 400>"
curl -s -o fonts/press-start-2p-400-latin-ext.woff2 "<URL latin-ext>"
curl -s -o fonts/rubik-400-latin.woff2 "<URL>"
curl -s -o fonts/rubik-400-latin-ext.woff2 "<URL>"
curl -s -o fonts/rubik-600-latin.woff2 "<URL>"
curl -s -o fonts/rubik-600-latin-ext.woff2 "<URL>"
curl -s -o fonts/rubik-800-latin.woff2 "<URL>"
curl -s -o fonts/rubik-800-latin-ext.woff2 "<URL>"
```

Confirmar que todos têm tamanho > 0 e assinatura woff2:

```bash
ls -l fonts/*.woff2
file fonts/*.woff2   # deve dizer "Web Open Font Format (Version 2)"
```

Expected: 8 arquivos `.woff2`, todos não-vazios e reconhecidos como WOFF2.

- [ ] **Step 2: Criar `css/fonts.css`**

Criar `css/fonts.css` com um `@font-face` por arquivo. Usar `font-display: swap` e o
`unicode-range` apropriado para cada subset (copiar os ranges do CSS retornado pelo
Google no Step 1 — latin e latin-ext têm ranges distintos). Modelo:

```css
/* Fontes self-hosted (OFL). Substituem o Google Fonts. Ver fonts/OFL.txt. */

/* Press Start 2P — latin */
@font-face {
  font-family: "Press Start 2P";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("../fonts/press-start-2p-400-latin.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* Press Start 2P — latin-ext */
@font-face {
  font-family: "Press Start 2P";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("../fonts/press-start-2p-400-latin-ext.woff2") format("woff2");
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

/* Rubik 400 — latin */
@font-face {
  font-family: "Rubik";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("../fonts/rubik-400-latin.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* Rubik 400 — latin-ext */
@font-face {
  font-family: "Rubik";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("../fonts/rubik-400-latin-ext.woff2") format("woff2");
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

/* Rubik 600 — latin */
@font-face {
  font-family: "Rubik";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("../fonts/rubik-600-latin.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* Rubik 600 — latin-ext */
@font-face {
  font-family: "Rubik";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("../fonts/rubik-600-latin-ext.woff2") format("woff2");
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

/* Rubik 800 — latin */
@font-face {
  font-family: "Rubik";
  font-style: normal;
  font-weight: 800;
  font-display: swap;
  src: url("../fonts/rubik-800-latin.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* Rubik 800 — latin-ext */
@font-face {
  font-family: "Rubik";
  font-style: normal;
  font-weight: 800;
  font-display: swap;
  src: url("../fonts/rubik-800-latin-ext.woff2") format("woff2");
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
```

> Os valores de `unicode-range` acima são os que o Google Fonts usa hoje para latin e
> latin-ext. Se a saída do Step 1 trouxer ranges diferentes, usar os da saída real.

- [ ] **Step 3: Atualizar `index.html`**

Remover as três linhas de fonte externa e o preconnect (linhas 7-9 atuais):

```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rubik:wght@400;600;800&display=swap" rel="stylesheet">
```

E adicionar `css/fonts.css` como **primeiro** stylesheet (antes de `base.css`), para que
os `@font-face` estejam declarados quando as outras folhas referenciarem as famílias. O
bloco de `<link>` de CSS deve ficar assim:

```html
  <link rel="stylesheet" href="css/fonts.css">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/cards.css">
  <link rel="stylesheet" href="css/screens.css">
```

- [ ] **Step 4: Criar `fonts/OFL.txt`**

Criar `fonts/OFL.txt` com o crédito das fontes e o texto da licença OFL. Conteúdo mínimo
(cabeçalho de crédito + a íntegra da SIL OFL 1.1):

```text
As fontes deste diretório são distribuídas sob a SIL Open Font License 1.1.

- Press Start 2P — Copyright 2012 The Press Start 2P Project Authors.
- Rubik — Copyright 2015 The Rubik Project Authors (https://github.com/googlefonts/rubik).

-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

[Colar aqui a íntegra do texto da OFL 1.1, disponível em
https://openfontlicense.org/open-font-license-official-text/ —
baixar com: curl -s https://openfontlicense.org/documents/OFL.txt ]
```

Para obter o texto oficial e anexá-lo:

```bash
curl -s --max-time 15 "https://openfontlicense.org/documents/OFL.txt" -o /tmp/ofl.txt
cat /tmp/ofl.txt   # conferir; depois colar a íntegra no fonts/OFL.txt após o cabeçalho de crédito
```

Se o download falhar, registrar como pendência e deixar o cabeçalho de crédito + um link
para o texto oficial.

- [ ] **Step 5: Atualizar o README**

Em `README.md`, ajustar a linha que cita o Google Fonts como pendência. Hoje o README
não menciona explicitamente as fontes no corpo, mas o item de roadmap "self-hostear" some.
Acrescentar uma frase em "O que tem na v1" ou criar uma nota curta:

Trocar (no roadmap, linha que lista melhorias) qualquer menção a "self-hostear fontes" e
adicionar à seção "O que tem na v1" o item:

```markdown
- Sem dependências externas em runtime — fontes self-hosted (OFL) em `fonts/`
```

> Se o README atual não tiver menção a fontes para remover, apenas adicionar o item acima.

- [ ] **Step 6: Validar que o app não referencia mais o Google Fonts**

Run: `grep -rn "fonts.googleapis\|fonts.gstatic" index.html css/ || echo "OK: sem referências externas"`
Expected: `OK: sem referências externas`.

Run: `node tests/todos.js 2>&1 | tail -1`
Expected: `72 teste(s), 0 falha(s)` (fontes não afetam os testes).

- [ ] **Step 7: Commit**

```bash
git add fonts/ css/fonts.css index.html README.md
git commit -m "feat: self-host das fontes, remove Google Fonts (minor #1)

Press Start 2P e Rubik (OFL) agora vêm de fonts/ via @font-face em css/fonts.css.
App passa a funcionar offline sem nenhuma dependência externa em runtime.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Encerramento

- [ ] **Atualizar o PROGRESSO.md**

Em `docs/superpowers/plans/PROGRESSO.md`, marcar os 3 minors como resolvidos (referenciando
este plano) e atualizar a contagem de testes para 72. Commit:

```bash
git add docs/superpowers/plans/PROGRESSO.md
git commit -m "docs: minors da revisão resolvidos (polimento v1)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Verificação final**

Run: `node tests/todos.js 2>&1 | tail -1`
Expected: `72 teste(s), 0 falha(s)`.

Run: `grep -rn "fonts.googleapis\|fonts.gstatic" index.html css/ || echo "OK"`
Expected: `OK`.
