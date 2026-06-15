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

teste("scoring: steven-par soma só em pares numéricos (A e figuras não contam)", () => {
  const state = stateBase({ coringas: [novoCoringa("steven-par")] }); // +4 mult por par numérico
  igual(pontuarJogada(state, [carta("copas", 10), carta("ouros", 10)]).total, 30 * 10);
  const s2 = stateBase({ coringas: [novoCoringa("steven-par")] });
  igual(pontuarJogada(s2, [carta("copas", 14), carta("ouros", 14)]).total, (10 + 11 + 11) * 2, "Ás é ímpar");
  const s3 = stateBase({ coringas: [novoCoringa("steven-par")] });
  igual(pontuarJogada(s3, [carta("copas", 12), carta("ouros", 12)]).total, 30 * 2, "Dama (figura) não conta");
});

teste("scoring: todd-impar soma em ímpares numéricos e no Ás (figuras não contam)", () => {
  const state = stateBase({ coringas: [novoCoringa("todd-impar")] }); // +31 chips por ímpar numérico
  igual(pontuarJogada(state, [carta("copas", 14), carta("ouros", 14)]).total, (32 + 62) * 2);
  const s2 = stateBase({ coringas: [novoCoringa("todd-impar")] });
  igual(pontuarJogada(s2, [carta("copas", 13), carta("ouros", 13)]).total, 30 * 2, "Rei (figura) não conta");
});

teste("scoring: erudito dá chips e mult por Ás", () => {
  const state = stateBase({ coringas: [novoCoringa("erudito")] });
  const { total } = pontuarJogada(state, [carta("copas", 14), carta("ouros", 14)]);
  igual(total, 72 * 10);
});

teste("scoring: cara-assustadora dá +30 chips por figura", () => {
  const a = stateBase({ coringas: [novoCoringa("cara-assustadora")] });
  // par de reis: chips 10+10+10 + 30 + 30 = 90; mult 2
  igual(pontuarJogada(a, [carta("copas", 13), carta("ouros", 13)]).total, 90 * 2);
});

teste("scoring: walkie-talkie conta 10 e 4", () => {
  const state = stateBase({ coringas: [novoCoringa("walkie-talkie")] });
  igual(pontuarJogada(state, [carta("copas", 10), carta("ouros", 10)]).total, 50 * 10);
});

teste("scoring: fibonacci conta A/2/3/5/8", () => {
  const state = stateBase({ coringas: [novoCoringa("fibonacci")] });
  igual(pontuarJogada(state, [carta("copas", 5), carta("ouros", 5)]).total, 20 * 18);
  const s2 = stateBase({ coringas: [novoCoringa("fibonacci")] });
  igual(pontuarJogada(s2, [carta("copas", 4), carta("ouros", 4)]).total, (10 + 4 + 4) * 2);
});

teste("scoring: coringa-alegre e coringa-astuto exigem Par", () => {
  const alegre = stateBase({ coringas: [novoCoringa("coringa-alegre")] });
  igual(pontuarJogada(alegre, [carta("copas", 9), carta("ouros", 9)]).total, 28 * (2 + 8));
  const semPar = stateBase({ coringas: [novoCoringa("coringa-alegre")] });
  igual(pontuarJogada(semPar, [carta("copas", 9), carta("ouros", 2)]).total, (5 + 9) * 1);
  const astuto = stateBase({ coringas: [novoCoringa("coringa-astuto")] });
  igual(pontuarJogada(astuto, [carta("copas", 9), carta("ouros", 9)]).total, (28 + 50) * 2);
});

teste("scoring: coringa-travesso exige Trinca", () => {
  const state = stateBase({ coringas: [novoCoringa("coringa-travesso")] });
  const cartas = [carta("copas", 9), carta("ouros", 9), carta("paus", 9)];
  igual(pontuarJogada(state, cartas).total, 57 * 15);
});

teste("scoring: coringa-diabrete e coringa-malandro exigem Flush", () => {
  const flush = () => [
    carta("copas", 2), carta("copas", 5), carta("copas", 7),
    carta("copas", 9), carta("copas", 11),
  ];
  const dia = stateBase({ coringas: [novoCoringa("coringa-diabrete")] });
  igual(pontuarJogada(dia, flush()).total, 68 * 14);
  const mal = stateBase({ coringas: [novoCoringa("coringa-malandro")] });
  igual(pontuarJogada(mal, flush()).total, (68 + 80) * 4);
  const semFlush = stateBase({ coringas: [novoCoringa("coringa-diabrete")] });
  igual(pontuarJogada(semFlush, [carta("copas", 9), carta("ouros", 9)]).total, 28 * 2);
});

teste("scoring: coringa-devoto exige Sequência", () => {
  const state = stateBase({ coringas: [novoCoringa("coringa-devoto")] });
  const seq = [
    carta("copas", 5), carta("ouros", 6), carta("paus", 7),
    carta("espadas", 8), carta("copas", 9),
  ];
  igual(pontuarJogada(state, seq).total, 165 * 4);
});

teste("scoring: arena e coturno usam o dinheiro do jogador", () => {
  const arena = stateBase({ coringas: [novoCoringa("arena")], dinheiro: 7 });
  igual(pontuarJogada(arena, [carta("copas", 9), carta("ouros", 9)]).total, 42 * 2);
  const coturno = stateBase({ coringas: [novoCoringa("coturno")], dinheiro: 12 });
  igual(pontuarJogada(coturno, [carta("copas", 9), carta("ouros", 9)]).total, 28 * 6);
});

teste("scoring: acrobata só na última mão", () => {
  const ultima = stateBase({ coringas: [novoCoringa("acrobata")] });
  ultima.rodada.maosRestantes = 1;
  igual(pontuarJogada(ultima, [carta("copas", 9), carta("ouros", 9)]).total, 28 * 2 * 3);
  const naoUltima = stateBase({ coringas: [novoCoringa("acrobata")] });
  naoUltima.rodada.maosRestantes = 2;
  igual(pontuarJogada(naoUltima, [carta("copas", 9), carta("ouros", 9)]).total, 28 * 2);
});

teste("scoring: estencil multiplica por slots vazios + 1", () => {
  const state = stateBase({ coringas: [novoCoringa("estencil")] });
  igual(pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]).total, 28 * 2 * 5);
});

teste("scoring: abstrato soma por coringa possuído", () => {
  const state = stateBase({ coringas: [novoCoringa("abstrato"), novoCoringa("coringa")] });
  igual(pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]).total, 28 * 12);
});

teste("scoring: cartao-fidelidade dá ×4 a cada 6 mãos", () => {
  const c = novoCoringa("cartao-fidelidade");
  const state = stateBase({ coringas: [c] });
  const jogar = () => pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]).total;
  for (let i = 0; i < 5; i++) igual(jogar(), 28 * 2, `mão ${i + 1} sem bônus`);
  igual(jogar(), 28 * 2 * 4, "6ª mão ativa ×4");
});

teste("scoring: bode acumula sem figura e zera com figura", () => {
  const c = novoCoringa("bode");
  const state = stateBase({ coringas: [c] });
  igual(pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]).total, 28 * (2 + 1));
  igual(pontuarJogada(state, [carta("copas", 8), carta("ouros", 8)]).total, (10 + 16) * (2 + 2));
  igual(pontuarJogada(state, [carta("copas", 13), carta("ouros", 13)]).total, 30 * 2);
});

teste("scoring: corrida acumula +15 chips por Sequência", () => {
  const c = novoCoringa("corrida");
  const state = stateBase({ coringas: [c] });
  const seq = () => [
    carta("copas", 5), carta("ouros", 6), carta("paus", 7),
    carta("espadas", 8), carta("copas", 9),
  ];
  igual(pontuarJogada(state, seq()).total, 80 * 4);
  igual(pontuarJogada(state, seq()).total, 95 * 4);
});

teste("scoring: castelo-cartas acumula +4 chips por jogada de 4 cartas", () => {
  const c = novoCoringa("castelo-cartas");
  const state = stateBase({ coringas: [c] });
  const cartas4 = () => [carta("copas", 9), carta("ouros", 9), carta("paus", 7), carta("espadas", 7)];
  igual(pontuarJogada(state, cartas4()).total, 56 * 2);
  igual(pontuarJogada(state, cartas4()).total, 60 * 2);
});

teste("scoring: campeao ganha ×0,1 por Quadra", () => {
  const c = novoCoringa("campeao");
  const state = stateBase({ coringas: [c] });
  const quadra = () => [
    carta("copas", 9), carta("ouros", 9), carta("paus", 9), carta("espadas", 9),
  ];
  igual(pontuarJogada(state, quadra()).total, Math.floor(96 * (7 * 1.1)));
  igual(pontuarJogada(state, quadra()).total, Math.floor(96 * (7 * 1.2)));
});
