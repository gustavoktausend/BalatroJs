import { sortearChefes } from "./engine/blinds.js";
import { MAOS } from "./data/hands.js";
import { CORINGAS } from "./data/jokers.js";
import { BARALHOS } from "./data/baralhos.js";
import { STAKES } from "./data/stakes.js";

export const VERSAO_SAVE = 4;
const CHAVE_SAVE = "balatrojs-save";

export function criarRun(semente = Date.now() % 2 ** 31, baralhoId = "padrao", stakeId = "branco") {
  const baralho = BARALHOS[baralhoId] || BARALHOS.padrao;
  const stake = STAKES[stakeId] || STAKES.branco;
  const state = {
    versao: VERSAO_SAVE,
    semente,
    rngEstado: semente >>> 0,
    fase: "selecao-blind",
    ante: 1,
    proximaBlind: "pequena",
    blindAtual: null,
    chefesPorAnte: [],
    dinheiro: Math.max(0, 4 + baralho.dinheiroInicial + stake.dinheiroInicial),
    coringas: [],     // instâncias { id, dados, def }
    consumiveis: [],  // { tipo: "planeta"|"taro"|"espectral", id } — máx. 2
    vouchers: [],     // ids de vouchers possuídos (permanentes)
    baralho: baralho.id,
    stake: stake.id,
    niveisMaos: Object.fromEntries(Object.keys(MAOS).map((m) => [m, 1])),
    estatisticas: { porMao: {}, melhorJogada: 0, rodadas: 0 },
    ultimaMaoJogada: null,
    vitoria: null,
    rodada: null,
    loja: null,
    pacote: null,
  };
  state.chefesPorAnte = sortearChefes(state);
  return state;
}

export function salvar(state) {
  const dados = { ...state, coringas: state.coringas.map(({ id, dados }) => ({ id, dados })) };
  localStorage.setItem(CHAVE_SAVE, JSON.stringify(dados));
}

export function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE_SAVE);
    if (!bruto) return null;
    const dados = JSON.parse(bruto);
    if (dados.versao !== VERSAO_SAVE) return null;
    dados.coringas = dados.coringas.map(({ id, dados: d }) => ({ id, dados: d, def: CORINGAS[id] })).filter((c) => c.def !== undefined);
    return dados;
  } catch {
    return null;
  }
}

export function apagarSave() {
  localStorage.removeItem(CHAVE_SAVE);
}
