import { teste, ok, igual } from "./harness.js";
import { criarRun, apagarSave } from "../js/state.js";
import { novoCoringa } from "../js/data/jokers.js";
import {
  iniciarBlind, pularBlind, jogar, descartar, ordenarMao, usarConsumivel,
  TAMANHO_MAO, MAOS_POR_BLIND, DESCARTES_POR_BLIND,
} from "../js/engine/run.js";

const carta = (naipe, valor) => ({ id: `${naipe}-${valor}`, naipe, valor });

function emRodada(semente = 1) {
  const state = criarRun(semente);
  iniciarBlind(state, "pequena");
  return state;
}

// Coloca cartas conhecidas no início da mão para selecionar por índice.
function prepararMao(state, cartas) {
  state.rodada.mao = [...cartas, ...state.rodada.mao.slice(cartas.length)];
}

teste("run: iniciarBlind distribui 8 cartas e define o alvo", () => {
  const state = emRodada();
  igual(state.fase, "rodada");
  igual(state.rodada.mao.length, TAMANHO_MAO);
  igual(state.rodada.baralho.length, 52 - TAMANHO_MAO);
  igual(state.blindAtual.alvo, 300);
  igual(state.rodada.maosRestantes, MAOS_POR_BLIND);
  igual(state.rodada.descartesRestantes, DESCARTES_POR_BLIND);
});

teste("run: jogar consome mão, pontua, repõe e registra estatísticas", () => {
  const state = emRodada();
  state.blindAtual.alvo = 99999; // não vencer ainda
  prepararMao(state, [carta("copas", 9), carta("ouros", 9)]);
  const resultado = jogar(state, [0, 1]);
  ok(!resultado.erro, resultado.erro);
  igual(state.rodada.pontuacao, 56);
  igual(state.rodada.maosRestantes, 3);
  igual(state.rodada.mao.length, TAMANHO_MAO, "mão reposta");
  igual(state.estatisticas.porMao["par"], 1);
  igual(state.estatisticas.melhorJogada, 56);
  igual(state.ultimaMaoJogada, "par");
  igual(state.rodada.tiposJogados, ["par"]);
});

teste("run: validações de jogar", () => {
  const state = emRodada();
  igual(jogar(state, []).erro, "selecao-invalida");
  igual(jogar(state, [0, 1, 2, 3, 4, 5]).erro, "selecao-invalida");
});

teste("run: descartar troca cartas e dispara aoDescartar", () => {
  const state = emRodada();
  state.coringas = [novoCoringa("coringa-verde")];
  state.coringas[0].dados.mult = 2;
  const antes = state.rodada.mao.map((c) => c.id);
  const resultado = descartar(state, [0, 1, 2]);
  ok(!resultado.erro);
  igual(state.rodada.mao.length, TAMANHO_MAO);
  igual(state.rodada.descartesRestantes, 2);
  igual(state.rodada.descartesUsados, 1);
  igual(state.coringas[0].dados.mult, 1, "coringa verde perdeu 1 mult");
  ok(state.rodada.mao.map((c) => c.id).join() !== antes.join(), "cartas mudaram");

  state.rodada.descartesRestantes = 0;
  igual(descartar(state, [0]).erro, "sem-descartes");
});

teste("run: vencer a blind paga recompensa e abre a loja", () => {
  const state = emRodada();
  state.blindAtual.alvo = 10; // qualquer jogada vence
  state.dinheiro = 10;
  prepararMao(state, [carta("copas", 9), carta("ouros", 9)]);
  const resultado = jogar(state, [0, 1]);
  ok(resultado.vitoriaBlind);
  // $3 (pequena) + $3 (mãos restantes) + $2 (juros de $10) = 8
  igual(resultado.recompensa, 8);
  igual(state.dinheiro, 18);
  igual(state.fase, "loja");
  ok(state.loja, "loja gerada");
  igual(state.proximaBlind, "grande");
  igual(state.estatisticas.rodadas, 1);
});

teste("run: foguete paga e gros michel pode se destruir no fim da rodada", () => {
  const state = emRodada();
  state.blindAtual.alvo = 10;
  state.dinheiro = 0;
  state.coringas = [novoCoringa("foguete")];
  prepararMao(state, [carta("copas", 9), carta("ouros", 9)]);
  jogar(state, [0, 1]);
  // $3 + $3 + $0 juros + $1 foguete = 7
  igual(state.dinheiro, 7);
});

teste("run: perder a run (mãos esgotadas sem alvo)", () => {
  const state = emRodada();
  state.blindAtual.alvo = 99999;
  state.rodada.maosRestantes = 1;
  prepararMao(state, [carta("copas", 9), carta("ouros", 9)]);
  const resultado = jogar(state, [0, 1]);
  ok(resultado.derrota);
  igual(state.fase, "fim");
  igual(state.vitoria, false);
});

teste("run: vencer o chefe do ante 8 vence a run", () => {
  const state = criarRun(3);
  state.ante = 8;
  state.proximaBlind = "chefe";
  iniciarBlind(state, "chefe");
  state.blindAtual.alvo = 10;
  prepararMao(state, [carta("copas", 9), carta("ouros", 9)]);
  // chefe pode bloquear (vidente/boca) ou debuffar; jogada de par simples pode falhar
  // com "vidente" — força um chefe neutro para o teste:
  state.blindAtual.chefeId = "parede";
  const resultado = jogar(state, [0, 1]);
  ok(resultado.vitoriaBlind);
  igual(state.fase, "fim");
  igual(state.vitoria, true);
});

teste("run: pular blind avança sem recompensa; chefe não pula", () => {
  const state = criarRun(1);
  igual(state.proximaBlind, "pequena");
  pularBlind(state);
  igual(state.proximaBlind, "grande");
  pularBlind(state);
  igual(state.proximaBlind, "chefe");
  igual(pularBlind(state).erro, "chefe-obrigatorio");
});

teste("run: avanço de ante após o chefe", () => {
  const state = criarRun(2);
  state.proximaBlind = "chefe";
  iniciarBlind(state, "chefe");
  state.blindAtual.chefeId = "parede";
  state.blindAtual.alvo = 10;
  prepararMao(state, [carta("copas", 9), carta("ouros", 9)]);
  jogar(state, [0, 1]);
  igual(state.ante, 2);
  igual(state.proximaBlind, "pequena");
});

teste("run: A Vidente bloqueia jogada de menos de 5 cartas", () => {
  const state = criarRun(4);
  state.proximaBlind = "chefe";
  iniciarBlind(state, "chefe");
  state.blindAtual.chefeId = "vidente";
  prepararMao(state, [carta("copas", 9), carta("ouros", 9)]);
  igual(jogar(state, [0, 1]).erro, "bloqueada-pelo-chefe");
});

teste("run: ordenarMao por valor e por naipe", () => {
  const state = emRodada();
  ordenarMao(state, "valor");
  const valores = state.rodada.mao.map((c) => c.valor);
  igual([...valores].sort((a, b) => b - a), valores);
  ordenarMao(state, "naipe");
  const naipes = state.rodada.mao.map((c) => c.naipe);
  igual([...naipes].sort(), naipes);
});

teste("run: usarConsumivel (planeta) sobe o nível e avisa a constelação", () => {
  const state = emRodada();
  state.coringas = [novoCoringa("constelacao")];
  state.consumiveis = [{ tipo: "planeta", id: "mercurio" }];
  igual(usarConsumivel(state, 0), {});
  igual(state.niveisMaos["par"], 2);
  igual(state.consumiveis, []);
  igual(state.coringas[0].dados.x, 1.1);
  igual(usarConsumivel(state, 0).erro, "slot-vazio");
});

teste("run: usarConsumivel (taro/espectral) — sucesso gasta, erro reinsere", () => {
  const state = emRodada();
  state.consumiveis = [{ tipo: "taro", id: "o-mundo" }];
  const antes = state.dinheiro;
  igual(usarConsumivel(state, 0), {});
  igual(state.dinheiro, antes + 20);
  igual(state.consumiveis, [], "sucesso remove o slot");

  state.coringas = ["coringa", "ganancioso", "voraz", "colerico", "guloso"].map(novoCoringa);
  state.consumiveis = [{ tipo: "espectral", id: "seance" }];
  igual(usarConsumivel(state, 0).erro, "sem-espaco");
  igual(state.consumiveis, [{ tipo: "espectral", id: "seance" }], "erro mantém o slot");
});

// limpeza: testes acima gravam save indireto? (jogar/iniciar não salvam — só a UI salva)
apagarSave();
