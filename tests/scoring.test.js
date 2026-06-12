import { teste, ok, igual } from "./harness.js";
import { pontuarJogada } from "../js/engine/scoring.js";
import { novoCoringa } from "../js/data/jokers.js";
import { MAOS } from "../js/data/hands.js";

const carta = (naipe, valor) => ({ id: `${naipe}-${valor}-${Math.random()}`, naipe, valor });

function stateBase(extra = {}) {
  return {
    rngEstado: 1,
    dinheiro: 0,
    coringas: [],
    consumiveis: [],
    niveisMaos: Object.fromEntries(Object.keys(MAOS).map((m) => [m, 1])),
    estatisticas: { porMao: {}, melhorJogada: 0, rodadas: 0 },
    ultimaMaoJogada: null,
    blindAtual: { tipo: "pequena", chefeId: null, alvo: 300 },
    rodada: { baralho: [], mao: [], pontuacao: 0, maosRestantes: 4, descartesRestantes: 3, descartesUsados: 0, tiposJogados: [] },
    ...extra,
  };
}

teste("scoring: par sem coringas — (10 + 9 + 9) × 2 = 56", () => {
  const state = stateBase();
  const { total } = pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]);
  igual(total, 56);
});

teste("scoring: nível da mão muda a base", () => {
  const state = stateBase();
  state.niveisMaos["par"] = 3; // 10+30 chips, 2+2 mult
  const { total } = pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]);
  igual(total, (40 + 18) * 4);
});

teste("scoring: kicker não soma chips (par com 5 cartas)", () => {
  const state = stateBase();
  const { total } = pontuarJogada(state, [
    carta("copas", 9), carta("ouros", 9),
    carta("paus", 2), carta("espadas", 3), carta("copas", 4),
  ]);
  igual(total, 56, "as cartas 2, 3 e 4 não pontuam");
});

teste("scoring: a ordem dos coringas importa (+mult antes de ×mult)", () => {
  const maisQuatro = novoCoringa("coringa");      // +4 mult
  const vezesTres = novoCoringa("cavendish");     // ×3 mult
  const cartas = () => [carta("copas", 9), carta("ouros", 9)];

  const a = stateBase({ coringas: [maisQuatro, vezesTres] });
  igual(pontuarJogada(a, cartas()).total, 28 * (2 + 4) * 3); // 504

  const b = stateBase({ coringas: [novoCoringa("cavendish"), novoCoringa("coringa")] });
  igual(pontuarJogada(b, cartas()).total, 28 * (2 * 3 + 4)); // 280
});

teste("scoring: gancho por carta (Ganancioso conta só Ouros pontuados)", () => {
  const state = stateBase({ coringas: [novoCoringa("ganancioso")] });
  const { total } = pontuarJogada(state, [
    carta("ouros", 9), carta("ouros", 9),
    carta("copas", 2), carta("paus", 3), carta("espadas", 4),
  ]);
  // chips 10+18=28; mult 2 + 3 + 3 (apenas os dois 9♦ pontuam) = 8
  igual(total, 28 * 8);
});

teste("scoring: chefe de naipe anula chips e ganchos da carta", () => {
  const state = stateBase({
    coringas: [novoCoringa("voraz")], // +3 por copas pontuada
    blindAtual: { tipo: "chefe", chefeId: "cabeca", alvo: 600 }, // copas não pontuam
  });
  const { total, eventos } = pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]);
  igual(total, (10 + 9) * 2, "o 9♥ não soma chips nem ativa o Voraz");
  ok(eventos.some((e) => e.tipo === "carta-debuffada"));
});

teste("scoring: fotografia só multiplica na primeira figura", () => {
  const state = stateBase({ coringas: [novoCoringa("fotografia")] });
  const { total } = pontuarJogada(state, [carta("copas", 12), carta("ouros", 12)]);
  // chips 10+10+10=30; mult 2 ×2 (uma vez só) = 4
  igual(total, 120);
});

teste("scoring: estandarte usa descartes restantes", () => {
  const state = stateBase({ coringas: [novoCoringa("estandarte")] });
  state.rodada.descartesRestantes = 2;
  const { total } = pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]);
  igual(total, (28 + 60) * 2);
});

teste("scoring: total é arredondado para baixo", () => {
  const state = stateBase({ coringas: [novoCoringa("maos-limpas")] }); // ×1,5
  const { total } = pontuarJogada(state, [carta("copas", 9), carta("ouros", 9), carta("paus", 9)]);
  // trinca: chips 30+27=57, mult 3 ×1,5 = 4,5 → floor(256,5) = 256
  igual(total, 256);
});

teste("scoring: eventos saem na ordem mão → cartas → coringas → total", () => {
  const state = stateBase({ coringas: [novoCoringa("coringa")] });
  const { eventos } = pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]);
  igual(eventos[0].tipo, "mao");
  igual(eventos[1].tipo, "carta");
  igual(eventos[2].tipo, "carta");
  igual(eventos[3].tipo, "efeito");
  igual(eventos.at(-1).tipo, "total");
});
