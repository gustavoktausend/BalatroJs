import { escolher } from "../engine/rng.js";
import { MAOS } from "./hands.js";
import { criarCoringaDe } from "../engine/shop.js";

const PRECO_ESPECTRAL = 4;

const LISTA = [
  { id: "aether", nome: "Aether", icone: "✦", descricao: "Sobe 2 níveis de uma mão aleatória.",
    aplicar: (state) => {
      for (let i = 0; i < 2; i++) state.niveisMaos[escolher(state, Object.keys(MAOS))] += 1;
      return {};
    } },
  { id: "seance", nome: "Séance", icone: "❂", descricao: "Cria 1 Coringa raro.",
    aplicar: (state) => criarCoringaDe(state, "raro") },
  { id: "wraith", nome: "Wraith", icone: "☄", descricao: "Cria 1 Coringa raro, mas zera seu dinheiro.",
    aplicar: (state) => {
      const r = criarCoringaDe(state, "raro");
      if (r.erro) return r;
      state.dinheiro = 0;
      return {};
    } },
];

export const ESPECTRAIS = Object.fromEntries(LISTA.map((e) => [e.id, { ...e, preco: PRECO_ESPECTRAL }]));
