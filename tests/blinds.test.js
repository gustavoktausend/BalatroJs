import { teste, ok, igual } from "./harness.js";
import { CHEFES } from "../js/data/bosses.js";
import { BASES, alvoDaBlind, sortearChefes, chefeDoAnte } from "../js/engine/blinds.js";

const carta = (naipe, valor) => ({ id: `${naipe}-${valor}`, naipe, valor });

teste("blinds: alvos por tipo (pequena ×1, grande ×1,5, chefe ×2, parede ×4)", () => {
  igual(BASES, [300, 800, 2000, 5000, 11000, 20000, 35000, 50000]);
  igual(alvoDaBlind(1, "pequena", null), 300);
  igual(alvoDaBlind(1, "grande", null), 450);
  igual(alvoDaBlind(1, "chefe", "gancho"), 600);
  igual(alvoDaBlind(1, "chefe", "parede"), 1200);
  igual(alvoDaBlind(8, "pequena", null), 50000);
});

teste("blinds: sorteia os 8 chefes sem repetição", () => {
  const state = { rngEstado: 11 };
  const chefes = sortearChefes(state);
  igual(chefes.length, 8);
  igual(new Set(chefes).size, 8);
  for (const id of chefes) ok(id in CHEFES, `chefe desconhecido: ${id}`);
});

teste("blinds: chefeDoAnte usa o ante atual", () => {
  const state = { ante: 3, chefesPorAnte: ["a", "b", "c", "d", "e", "f", "g", "h"] };
  igual(chefeDoAnte(state), "c");
});

teste("chefes: debuff de naipe", () => {
  ok(CHEFES.cabeca.ganchos.cartaDebuffada(carta("copas", 5)));
  ok(!CHEFES.cabeca.ganchos.cartaDebuffada(carta("paus", 5)));
  ok(CHEFES.aguilhao.ganchos.cartaDebuffada(carta("espadas", 5)));
  ok(CHEFES.janela.ganchos.cartaDebuffada(carta("ouros", 5)));
  ok(CHEFES.taco.ganchos.cartaDebuffada(carta("paus", 5)));
});

teste("chefes: A Vidente exige exatamente 5 cartas", () => {
  const cinco = [2, 3, 4, 5, 6].map((v) => carta("copas", v));
  ok(CHEFES.vidente.ganchos.jogadaValida(cinco, {}));
  ok(!CHEFES.vidente.ganchos.jogadaValida(cinco.slice(0, 4), {}));
});

teste("chefes: A Boca só permite o primeiro tipo de mão da rodada", () => {
  const state = { rodada: { tiposJogados: [] } };
  const par = [carta("copas", 9), carta("ouros", 9)];
  const trinca = [carta("copas", 5), carta("ouros", 5), carta("paus", 5)];
  ok(CHEFES.boca.ganchos.jogadaValida(par, state), "primeira jogada é livre");
  state.rodada.tiposJogados.push("par");
  ok(CHEFES.boca.ganchos.jogadaValida(par, state), "repetir o tipo é permitido");
  ok(!CHEFES.boca.ganchos.jogadaValida(trinca, state), "outro tipo é bloqueado");
});

teste("chefes: O Gancho descarta 2 cartas aleatórias da mão", () => {
  const state = {
    rngEstado: 3,
    rodada: { mao: [2, 3, 4, 5, 6, 7].map((v) => carta("copas", v)) },
  };
  CHEFES.gancho.ganchos.aposJogar(state);
  igual(state.rodada.mao.length, 4);
});
