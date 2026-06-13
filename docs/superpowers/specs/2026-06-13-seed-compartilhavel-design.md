# Seed compartilhável — BalatroJS

Data: 2026-06-13
Milestone: #7 do roadmap (`2026-06-12-balatro-clone-design.md`).

## Objetivo

Permitir que o jogador veja o código da seed da run atual e inicie uma run nova com uma
seed escolhida (colada/digitada), tornando runs reproduzíveis e compartilháveis. A infra
de RNG determinístico com seed já existe; esta milestone só adiciona conversão de formato
e UI.

## Contexto existente

- `criarRun(semente = Date.now() % 2 ** 31)` (em `js/state.js`) já aceita uma semente e
  guarda em `state.semente`; `state.rngEstado` deriva dela. O save já persiste `semente`.
- O RNG (`js/engine/rng.js`) é determinístico a partir de `rngEstado`.
- A semente interna é um número inteiro (0 … 2³¹−1).

## Escopo

- Código de seed legível: string curta base36 maiúscula (ex.: `"7K3FQ2"`).
- Campo de entrada na tela de título para iniciar com uma seed específica.
- Exibição do código da seed da run atual no cabeçalho da run (visível em todas as
  telas de jogo).
- Entrada case-insensitive (normaliza para maiúsculo); saída sempre maiúscula.

## Não-escopo

- Botão "copiar para a área de transferência" (descartado no brainstorm; o jogador
  seleciona o texto manualmente).
- Mudança no formato/versão do save (`VERSAO_SAVE` continua 1).
- Seeds em formato de palavra/frase livre.

## Arquitetura

Novo módulo puro `js/engine/seed.js` + ajustes pontuais de UI. `criarRun`/RNG inalterados.

### Interface de `js/engine/seed.js` (puro, testável)

- `codificarSeed(semente)` → string base36 maiúscula com padding à esquerda de `0` até
  **6 caracteres** (o máximo possível, pois `2³¹−1` = `ZIK0ZJ`, 6 chars). Sementes
  pequenas ficam tipo `000001`, dando ao código aparência estável.
- `decodificarSeed(codigo)` → número inteiro válido, ou `null` se o código for inválido.
  Normaliza para maiúsculo e remove espaços nas pontas antes de validar. Inválido =
  vazio, ou contém caractere fora de `[A-Z0-9]`, ou resulta em número fora de
  `0 … 2³¹−1`. Nunca lança.

### Ajustes na UI

- `js/ui/screens.js` → `renderTitulo()`:
  - Adicionar um `<input>` (placeholder ex.: "Seed (opcional)") e usar seu valor no
    "Jogar":
    - valor vazio → `criarRun()` (semente aleatória, comportamento atual);
    - valor não-vazio e válido (`decodificarSeed` ≠ `null`) → `criarRun(seed)`;
    - valor não-vazio e inválido → `avisar("seed-invalida")`, não inicia a run.
  - O botão "Continuar" (save existente) não é afetado.
- `js/ui/render.js`:
  - `cabecalhoRun(state)` passa a exibir `Seed: <codigo>` usando
    `codificarSeed(state.semente)`.
  - Adicionar `"seed-invalida": "Código de seed inválido."` ao dicionário `MENSAGENS`.

## Fluxo

Título: jogador opcionalmente digita uma seed → "Jogar" decodifica e cria a run com ela
(ou aleatória). Durante a run, o cabeçalho mostra o código da seed atual, que o jogador
pode anotar/compartilhar. Outra pessoa digita o mesmo código → mesma sequência de RNG →
mesma run.

## Tratamento de erros

- Código inválido na entrada → `avisar("seed-invalida")`; nenhuma run iniciada.
- `decodificarSeed` nunca lança; sempre retorna número ou `null`.
- Save antigo (sem mudança de versão) continua carregando normalmente; `state.semente`
  já existia.

## Testes

`tests/seed.test.js` (novo, importado em `tests/todos.js`):
- round-trip: `decodificarSeed(codificarSeed(n)) === n` para várias sementes (0, 1,
  um valor grande, 2³¹−1);
- `codificarSeed` é estável: mesma semente → mesmo código; saída só `[A-Z0-9]`;
- `decodificarSeed` é case-insensitive: mesmo resultado para minúsculas e maiúsculas;
- `decodificarSeed` rejeita inválidos retornando `null`: `""`, `"  "`, `"abc!@#"`,
  e um código que decodifique acima de 2³¹−1.

## Critérios de sucesso

1. Iniciar com um código de seed reproduz exatamente a mesma run (mesmos chefes, loja,
   compras de carta) — verificável porque o RNG é determinístico a partir da semente.
2. O cabeçalho da run mostra o código da seed atual.
3. Código inválido é rejeitado com aviso, sem quebrar a tela.
4. `tests/seed.test.js` passa (`node tests/todos.js`, 0 falhas).
