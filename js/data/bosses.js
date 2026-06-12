import { detectarMao } from "../engine/poker.js";
import { entre } from "../engine/rng.js";
import { NOME_NAIPE } from "../engine/deck.js";

function debuffDeNaipe(naipe) {
  return { cartaDebuffada: (carta) => carta.naipe === naipe };
}

export const CHEFES = {
  gancho: {
    nome: "O Gancho",
    descricao: "Descarta 2 cartas aleatórias da sua mão após cada jogada.",
    ganchos: {
      aposJogar: (state) => {
        for (let i = 0; i < 2 && state.rodada.mao.length > 0; i++) {
          state.rodada.mao.splice(entre(state, 0, state.rodada.mao.length - 1), 1);
        }
      },
    },
  },
  parede: {
    nome: "A Parede",
    descricao: "Alvo da blind ×4.",
    multAlvo: 4,
    ganchos: {},
  },
  cabeca: { nome: "A Cabeça", descricao: `Cartas de ${NOME_NAIPE.copas} não pontuam.`, ganchos: debuffDeNaipe("copas") },
  aguilhao: { nome: "O Aguilhão", descricao: `Cartas de ${NOME_NAIPE.espadas} não pontuam.`, ganchos: debuffDeNaipe("espadas") },
  janela: { nome: "A Janela", descricao: `Cartas de ${NOME_NAIPE.ouros} não pontuam.`, ganchos: debuffDeNaipe("ouros") },
  taco: { nome: "O Taco", descricao: `Cartas de ${NOME_NAIPE.paus} não pontuam.`, ganchos: debuffDeNaipe("paus") },
  vidente: {
    nome: "A Vidente",
    descricao: "Só aceita jogadas de exatamente 5 cartas.",
    ganchos: { jogadaValida: (cartas) => cartas.length === 5 },
  },
  boca: {
    nome: "A Boca",
    descricao: "Só permite jogar o primeiro tipo de mão jogado na rodada.",
    ganchos: {
      jogadaValida: (cartas, state) => {
        const jogados = state.rodada.tiposJogados;
        return jogados.length === 0 || detectarMao(cartas).tipo === jogados[0];
      },
    },
  },
};
