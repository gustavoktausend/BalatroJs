import { escolher, proximoAleatorio } from "../engine/rng.js";
import { MAOS } from "./hands.js";
import { PLANETAS } from "./planets.js";
import { precoVenda } from "../engine/economy.js";
import { criarCoringaDe } from "../engine/shop.js";

const PRECO_TARO = 3;

function subirMaoAleatoria(state, vezes) {
  for (let i = 0; i < vezes; i++) {
    const mao = escolher(state, Object.keys(MAOS));
    state.niveisMaos[mao] += 1;
  }
}

const LISTA = [
  { id: "o-mundo", nome: "O Mundo", icone: "✷", descricao: "Ganha $20.",
    aplicar: (state) => { state.dinheiro += 20; return {}; } },
  { id: "a-estrela", nome: "A Estrela", icone: "★", descricao: "Sobe 1 nível de uma mão aleatória.",
    aplicar: (state) => { subirMaoAleatoria(state, 1); return {}; } },
  { id: "a-lua", nome: "A Lua", icone: "☾", descricao: "Cria 1 Planeta aleatório.",
    aplicar: (state) => {
      const id = escolher(state, Object.keys(PLANETAS));
      state.consumiveis.push({ tipo: "planeta", id });
      return {};
    } },
  { id: "o-diabo", nome: "O Diabo", icone: "⛧", descricao: "Cria 1 Coringa comum.",
    aplicar: (state) => criarCoringaDe(state, "comum") },
  { id: "a-roda", nome: "A Roda da Fortuna", icone: "☸", descricao: "Chance de criar um Coringa incomum; senão +$5.",
    aplicar: (state) => {
      // Se rolou "criar" mas não cabe/não há opção, cai para +$5 (consolação) — por spec.
      if (proximoAleatorio(state) < 0.5) {
        const r = criarCoringaDe(state, "incomum");
        if (!r.erro) return {};
      }
      state.dinheiro += 5;
      return {};
    } },
  { id: "a-temperanca", nome: "A Temperança", icone: "⚖", descricao: "Ganha o valor de venda dos seus Coringas (máx. $20).",
    aplicar: (state) => {
      const soma = state.coringas.reduce((acc, c) => acc + precoVenda(c.def.preco), 0);
      state.dinheiro += Math.min(20, soma);
      return {};
    } },
  { id: "o-mago", nome: "O Mago", icone: "✦", descricao: "Aplica Mult a até 2 cartas selecionadas.",
    // Sub-etapa A (núcleo): sem UI de seleção ainda — aplica nas 2 primeiras cartas da mão
    // (ou do baralhoRun se não houver rodada) e persiste no baralhoRun. Seleção interativa
    // vem na Sub-etapa B (fontes).
    aplicar: (state) => {
      const aplicarEm = (carta) => {
        if (!carta) return;
        carta.aprimoramento = "mult";
        const mestre = state.baralhoRun?.find((c) => c.id === carta.id);
        if (mestre && mestre !== carta) mestre.aprimoramento = "mult";
      };
      const fonte = state.rodada?.mao?.length ? state.rodada.mao : (state.baralhoRun ?? []);
      aplicarEm(fonte[0]);
      aplicarEm(fonte[1]);
      return {};
    } },
];

export const TAROS = Object.fromEntries(LISTA.map((t) => [t.id, { ...t, preco: PRECO_TARO }]));
