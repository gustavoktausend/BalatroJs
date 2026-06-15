import { ehFigura } from "../engine/deck.js";
import { maoContem } from "./hands.js";
import { entre } from "../engine/rng.js";

function maisTresPorNaipe(naipe) {
  return (carta) => (carta.naipe === naipe ? { mult: 3 } : null);
}

function seContem(alvo, efeito) {
  return (ctx) => (maoContem(ctx.jogada.tipo, alvo) ? efeito : null);
}

// Aplica um efeito fixo a cada carta pontuada que satisfaz o predicado.
function porCarta(predicado, efeito) {
  return (carta) => (predicado(carta) ? efeito : null);
}

// Paridade do valor para Steven Par / Todd Ímpar.
// O Ás (14) conta como ÍMPAR, como no Balatro (e o 10 é par).
function ehPar(carta) {
  return carta.valor !== 14 && carta.valor % 2 === 0;
}

const LISTA = [
  // ── Comuns (14) ──────────────────────────────────────────────
  { id: "coringa", nome: "Coringa", raridade: "comum", preco: 3,
    descricao: "+4 mult",
    ganchos: { aoPontuarMao: () => ({ mult: 4 }) } },
  { id: "ganancioso", nome: "Coringa Ganancioso", raridade: "comum", preco: 4,
    descricao: "+3 mult por carta de Ouros pontuada",
    ganchos: { aoPontuarCarta: maisTresPorNaipe("ouros") } },
  { id: "voraz", nome: "Coringa Voraz", raridade: "comum", preco: 4,
    descricao: "+3 mult por carta de Copas pontuada",
    ganchos: { aoPontuarCarta: maisTresPorNaipe("copas") } },
  { id: "colerico", nome: "Coringa Colérico", raridade: "comum", preco: 4,
    descricao: "+3 mult por carta de Espadas pontuada",
    ganchos: { aoPontuarCarta: maisTresPorNaipe("espadas") } },
  { id: "guloso", nome: "Coringa Guloso", raridade: "comum", preco: 4,
    descricao: "+3 mult por carta de Paus pontuada",
    ganchos: { aoPontuarCarta: maisTresPorNaipe("paus") } },
  { id: "par-certeiro", nome: "Par Certeiro", raridade: "comum", preco: 4,
    descricao: "+50 chips se a mão jogada contém um Par",
    ganchos: { aoPontuarMao: seContem("par", { chips: 50 }) } },
  { id: "mente-brilhante", nome: "Mente Brilhante", raridade: "comum", preco: 4,
    descricao: "+80 chips se a mão jogada contém Dois Pares",
    ganchos: { aoPontuarMao: seContem("dois-pares", { chips: 80 }) } },
  { id: "maluco", nome: "Coringa Maluco", raridade: "comum", preco: 4,
    descricao: "+12 mult se a mão jogada contém uma Sequência",
    ganchos: { aoPontuarMao: seContem("sequencia", { mult: 12 }) } },
  { id: "trinca-forte", nome: "Trinca Forte", raridade: "comum", preco: 4,
    descricao: "+10 mult se a mão jogada contém uma Trinca",
    ganchos: { aoPontuarMao: seContem("trinca", { mult: 10 }) } },
  { id: "meio-coringa", nome: "Meio Coringa", raridade: "comum", preco: 5,
    descricao: "+20 mult se a jogada tem 3 cartas ou menos",
    ganchos: { aoPontuarMao: (ctx) => (ctx.jogada.cartas.length <= 3 ? { mult: 20 } : null) } },
  { id: "estandarte", nome: "Estandarte", raridade: "comum", preco: 5,
    descricao: "+30 chips por descarte restante",
    ganchos: { aoPontuarMao: (ctx) => ({ chips: 30 * ctx.state.rodada.descartesRestantes }) } },
  { id: "cume-mistico", nome: "Cume Místico", raridade: "comum", preco: 5,
    descricao: "+15 mult quando há 0 descartes restantes",
    ganchos: { aoPontuarMao: (ctx) => (ctx.state.rodada.descartesRestantes === 0 ? { mult: 15 } : null) } },
  { id: "cara-amigavel", nome: "Cara Amigável", raridade: "comum", preco: 4,
    descricao: "+5 mult por figura (J/Q/K) pontuada",
    ganchos: { aoPontuarCarta: (carta) => (ehFigura(carta) ? { mult: 5 } : null) } },
  { id: "banqueiro", nome: "Banqueiro", raridade: "comum", preco: 5,
    descricao: "+2 mult a cada $5 que você possui (máx. +20)",
    ganchos: { aoPontuarMao: (ctx) => ({ mult: Math.min(20, Math.floor(ctx.state.dinheiro / 5) * 2) }) } },
  { id: "steven-par", nome: "Steven Par", raridade: "comum", preco: 4,
    descricao: "+4 mult por carta de valor par (2,4,6,8,10) pontuada",
    ganchos: { aoPontuarCarta: porCarta((c) => ehPar(c) && !ehFigura(c), { mult: 4 }) } },
  { id: "todd-impar", nome: "Todd Ímpar", raridade: "comum", preco: 4,
    descricao: "+31 chips por carta de valor ímpar (A,3,5,7,9) pontuada",
    ganchos: { aoPontuarCarta: porCarta((c) => !ehPar(c) && !ehFigura(c), { chips: 31 }) } },
  { id: "cara-assustadora", nome: "Cara Assustadora", raridade: "comum", preco: 4,
    descricao: "+30 chips por figura (J/Q/K) pontuada",
    ganchos: { aoPontuarCarta: porCarta(ehFigura, { chips: 30 }) } },
  { id: "erudito", nome: "Erudito", raridade: "comum", preco: 4,
    descricao: "Cada Ás pontuado dá +20 chips e +4 mult",
    ganchos: { aoPontuarCarta: porCarta((c) => c.valor === 14, { chips: 20, mult: 4 }) } },
  { id: "walkie-talkie", nome: "Walkie Talkie", raridade: "comum", preco: 4,
    descricao: "Cada 10 ou 4 pontuado dá +10 chips e +4 mult",
    ganchos: { aoPontuarCarta: porCarta((c) => c.valor === 10 || c.valor === 4, { chips: 10, mult: 4 }) } },
  { id: "coringa-alegre", nome: "Coringa Alegre", raridade: "comum", preco: 3,
    descricao: "+8 mult se a mão jogada contém um Par",
    ganchos: { aoPontuarMao: seContem("par", { mult: 8 }) } },
  // Eco de chips do par-certeiro com preço menor (paralelo intencional do Balatro).
  { id: "coringa-astuto", nome: "Coringa Astuto", raridade: "comum", preco: 3,
    descricao: "+50 chips se a mão jogada contém um Par",
    ganchos: { aoPontuarMao: seContem("par", { chips: 50 }) } },
  // Variante de mult da trinca-forte (paralelo intencional do Balatro).
  { id: "coringa-travesso", nome: "Coringa Travesso", raridade: "comum", preco: 4,
    descricao: "+12 mult se a mão jogada contém uma Trinca",
    ganchos: { aoPontuarMao: seContem("trinca", { mult: 12 }) } },
  { id: "coringa-diabrete", nome: "Coringa Diabrete", raridade: "comum", preco: 4,
    descricao: "+10 mult se a mão jogada é Naipe (Flush)",
    ganchos: { aoPontuarMao: seContem("flush", { mult: 10 }) } },
  { id: "coringa-malandro", nome: "Coringa Malandro", raridade: "comum", preco: 4,
    descricao: "+80 chips se a mão jogada é Naipe (Flush)",
    ganchos: { aoPontuarMao: seContem("flush", { chips: 80 }) } },
  { id: "coringa-devoto", nome: "Coringa Devoto", raridade: "comum", preco: 4,
    descricao: "+100 chips se a mão jogada contém uma Sequência",
    ganchos: { aoPontuarMao: seContem("sequencia", { chips: 100 }) } },
  { id: "arena", nome: "Arena", raridade: "comum", preco: 5,
    descricao: "+2 chips por cada $1 que você possui",
    ganchos: { aoPontuarMao: (ctx) => ({ chips: 2 * ctx.state.dinheiro }) } },
  { id: "acrobata", nome: "Acrobata", raridade: "comum", preco: 5,
    descricao: "×3 mult na última mão da rodada",
    ganchos: { aoPontuarMao: (ctx) => (ctx.state.rodada.maosRestantes === 1 ? { xmult: 3 } : null) } },

  // ── Incomuns (8) ─────────────────────────────────────────────
  { id: "coringa-verde", nome: "Coringa Verde", raridade: "incomum", preco: 6,
    descricao: "+1 mult por mão jogada; −1 mult por descarte usado",
    estadoInicial: { mult: 0 },
    ganchos: {
      aoPontuarMao: (ctx) => { ctx.coringa.dados.mult += 1; return { mult: ctx.coringa.dados.mult }; },
      aoDescartar: (ctx) => { ctx.coringa.dados.mult = Math.max(0, ctx.coringa.dados.mult - 1); },
    } },
  { id: "supernova", nome: "Supernova", raridade: "incomum", preco: 6,
    descricao: "Soma ao mult quantas vezes a mão jogada já foi jogada na run",
    ganchos: { aoPontuarMao: (ctx) => ({ mult: ctx.state.estatisticas.porMao[ctx.jogada.tipo] || 0 }) } },
  { id: "foguete", nome: "Foguete", raridade: "incomum", preco: 6,
    descricao: "Dá $1 ao fim da rodada; o valor sobe $2 ao vencer um Chefe",
    estadoInicial: { valor: 1 },
    ganchos: {
      aoFimDaRodada: (ctx) => {
        const dados = ctx.coringa.dados;
        const ganho = dados.valor;
        if (ctx.blindTipo === "chefe") dados.valor += 2;
        return { dinheiro: ganho };
      },
    } },
  { id: "constelacao", nome: "Constelação", raridade: "incomum", preco: 7,
    descricao: "×mult; ganha +0,1 a cada Planeta usado",
    estadoInicial: { x: 1 },
    ganchos: {
      aoUsarPlaneta: (ctx) => { ctx.coringa.dados.x = +(ctx.coringa.dados.x + 0.1).toFixed(1); },
      aoPontuarMao: (ctx) => ({ xmult: ctx.coringa.dados.x }),
    } },
  { id: "maos-limpas", nome: "Mãos Limpas", raridade: "incomum", preco: 7,
    descricao: "×1,5 mult se nenhum descarte foi usado nesta rodada",
    ganchos: { aoPontuarMao: (ctx) => (ctx.state.rodada.descartesUsados === 0 ? { xmult: 1.5 } : null) } },
  { id: "fotografia", nome: "Fotografia", raridade: "incomum", preco: 6,
    descricao: "A primeira figura pontuada na jogada dá ×2 mult",
    ganchos: {
      aoPontuarCarta: (carta, ctx) => {
        if (!ehFigura(carta) || ctx.memoria.fotografia) return null;
        ctx.memoria.fotografia = true;
        return { xmult: 2 };
      },
    } },
  { id: "gros-michel", nome: "Gros Michel", raridade: "incomum", preco: 6,
    descricao: "+15 mult; chance de 1 em 6 de se destruir ao fim da rodada",
    ganchos: {
      aoPontuarMao: () => ({ mult: 15 }),
      aoFimDaRodada: (ctx) => (entre(ctx.state, 1, 6) === 1 ? { destruir: true } : null),
    } },
  { id: "trapaceiro", nome: "Trapaceiro", raridade: "incomum", preco: 7,
    descricao: "×2 mult se a mão jogada já havia sido jogada nesta rodada",
    ganchos: { aoPontuarMao: (ctx) => (ctx.state.rodada.tiposJogados.includes(ctx.jogada.tipo) ? { xmult: 2 } : null) } },
  { id: "fibonacci", nome: "Fibonacci", raridade: "incomum", preco: 7,
    descricao: "+8 mult por carta de valor A, 2, 3, 5 ou 8 pontuada",
    ganchos: { aoPontuarCarta: porCarta((c) => [14, 2, 3, 5, 8].includes(c.valor), { mult: 8 }) } },
  { id: "estencil", nome: "Estêncil", raridade: "incomum", preco: 7,
    descricao: "×mult igual ao número de slots de Coringa vazios + 1",
    // 5 = MAX_CORINGAS (shop.js); literal aqui para não importar shop.js (evita ciclo).
    ganchos: { aoPontuarMao: (ctx) => ({ xmult: (5 - ctx.state.coringas.length) + 1 }) } },
  { id: "abstrato", nome: "Coringa Abstrato", raridade: "incomum", preco: 6,
    descricao: "+3 mult por Coringa que você possui",
    ganchos: { aoPontuarMao: (ctx) => ({ mult: 3 * ctx.state.coringas.length }) } },
  { id: "cartao-fidelidade", nome: "Cartão Fidelidade", raridade: "incomum", preco: 7,
    descricao: "×4 mult a cada 6 mãos jogadas (na 6ª, 12ª, ...)",
    estadoInicial: { contagem: 0 },
    ganchos: {
      aoPontuarMao: (ctx) => {
        ctx.coringa.dados.contagem += 1;
        return ctx.coringa.dados.contagem % 6 === 0 ? { xmult: 4 } : null;
      },
    } },
  { id: "bode", nome: "Bode Expiatório", raridade: "incomum", preco: 6,
    descricao: "+1 mult acumulado por mão sem figura; zera ao jogar uma figura",
    estadoInicial: { mult: 0 },
    ganchos: {
      aoPontuarMao: (ctx) => {
        const dados = ctx.coringa.dados;
        if (ctx.jogada.cartas.some(ehFigura)) { dados.mult = 0; return null; }
        dados.mult += 1;
        return { mult: dados.mult };
      },
    } },
  { id: "corrida", nome: "Corrida", raridade: "incomum", preco: 7,
    descricao: "+15 chips acumulados a cada Sequência jogada",
    estadoInicial: { chips: 0 },
    ganchos: {
      aoPontuarMao: (ctx) => {
        if (maoContem(ctx.jogada.tipo, "sequencia")) ctx.coringa.dados.chips += 15;
        return { chips: ctx.coringa.dados.chips };
      },
    } },
  { id: "castelo-cartas", nome: "Castelo de Cartas", raridade: "incomum", preco: 6,
    descricao: "+4 chips acumulados sempre que a jogada tem exatamente 4 cartas",
    estadoInicial: { chips: 0 },
    ganchos: {
      aoPontuarMao: (ctx) => {
        if (ctx.jogada.cartas.length === 4) ctx.coringa.dados.chips += 4;
        return { chips: ctx.coringa.dados.chips };
      },
    } },
  { id: "misterioso", nome: "Coringa Misterioso", raridade: "incomum", preco: 6,
    descricao: "+mult aleatório de 0 a 23 a cada mão jogada",
    ganchos: { aoPontuarMao: (ctx) => ({ mult: entre(ctx.state, 0, 23) }) } },

  // ── Raros (3) ────────────────────────────────────────────────
  { id: "cavendish", nome: "Cavendish", raridade: "raro", preco: 8,
    descricao: "×3 mult; chance de 1 em 12 de se destruir ao fim da rodada",
    ganchos: {
      aoPontuarMao: () => ({ xmult: 3 }),
      aoFimDaRodada: (ctx) => (entre(ctx.state, 1, 12) === 1 ? { destruir: true } : null),
    } },
  { id: "obelisco", nome: "Obelisco", raridade: "raro", preco: 8,
    descricao: "Ganha ×0,2 a cada mão diferente da anterior; volta a ×1 ao repetir",
    estadoInicial: { x: 1 },
    ganchos: {
      aoPontuarMao: (ctx) => {
        const dados = ctx.coringa.dados;
        dados.x = ctx.jogada.tipo === ctx.state.ultimaMaoJogada ? 1 : +(dados.x + 0.2).toFixed(1);
        return { xmult: dados.x };
      },
    } },
  { id: "holograma", nome: "Holograma", raridade: "raro", preco: 9,
    descricao: "×1,5 mult; ganha +0,25 a cada Coringa comprado",
    estadoInicial: { x: 1.5 },
    ganchos: {
      aoComprarCoringa: (ctx) => { ctx.coringa.dados.x = +(ctx.coringa.dados.x + 0.25).toFixed(2); },
      aoPontuarMao: (ctx) => ({ xmult: ctx.coringa.dados.x }),
    } },
  // Sem teto (ao contrário do banqueiro) — intencional para um raro.
  { id: "coturno", nome: "Coturno", raridade: "raro", preco: 8,
    descricao: "+2 mult por cada $5 que você possui",
    ganchos: { aoPontuarMao: (ctx) => ({ mult: 2 * Math.floor(ctx.state.dinheiro / 5) }) } },
  { id: "campeao", nome: "Campeão", raridade: "raro", preco: 9,
    descricao: "×mult; ganha +0,1 a cada Quadra jogada",
    estadoInicial: { x: 1 },
    ganchos: {
      aoPontuarMao: (ctx) => {
        if (ctx.jogada.tipo === "quadra") ctx.coringa.dados.x = +(ctx.coringa.dados.x + 0.1).toFixed(1);
        return { xmult: ctx.coringa.dados.x };
      },
    } },
  { id: "coringa-ouro", nome: "Coringa de Ouro", raridade: "raro", preco: 8,
    descricao: "Dá $4 ao fim de cada rodada",
    ganchos: { aoFimDaRodada: () => ({ dinheiro: 4 }) } },
];

export const CORINGAS = Object.fromEntries(LISTA.map((c) => [c.id, c]));

// Instância de um Coringa na run: { id, dados, def }.
// "dados" é serializado no save; "def" é religado pelo id ao carregar.
export function novoCoringa(id) {
  const def = CORINGAS[id];
  return { id, dados: structuredClone(def.estadoInicial || {}), def };
}

// Sufixo "(atual: …)" exibido no tooltip de um Coringa com estado interno.
// Acumula todos os campos conhecidos presentes em "dados", na ordem mult → x → valor.
export function sufixoEstado(dados) {
  const partes = [];
  if (dados.mult !== undefined) partes.push(`+${dados.mult}`);
  if (dados.x !== undefined) partes.push(`×${dados.x}`);
  if (dados.valor !== undefined) partes.push(`$${dados.valor}`);
  return partes.length ? ` (atual: ${partes.join(", ")})` : "";
}

// Cor determinística de um Coringa, derivada do id (hash djb2 → matiz HSL).
// Devolve { clara, escura } — mesma matiz, a escura com lightness menor (contorno).
export function corDoCoringa(id) {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) + hash + id.charCodeAt(i)) >>> 0;
  const matiz = hash % 360;
  return { clara: `hsl(${matiz}, 65%, 60%)`, escura: `hsl(${matiz}, 65%, 35%)` };
}
