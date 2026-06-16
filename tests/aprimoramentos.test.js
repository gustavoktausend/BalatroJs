import { teste, ok, igual } from "./harness.js";
import { APRIMORAMENTOS, IDS_APRIMORAMENTO } from "../js/data/aprimoramentos.js";
import { pontuarJogada } from "../js/engine/scoring.js";
import { MAOS } from "../js/data/hands.js";

const carta = (naipe, valor, apr = null) =>
  ({ id: `${naipe}-${valor}-${Math.random()}`, naipe, valor, aprimoramento: apr });

function stateBase(extra = {}) {
  return {
    rngEstado: 1, dinheiro: 0, coringas: [], consumiveis: [],
    niveisMaos: Object.fromEntries(Object.keys(MAOS).map((m) => [m, 1])),
    estatisticas: { porMao: {}, melhorJogada: 0, rodadas: 0 }, ultimaMaoJogada: null,
    blindAtual: { tipo: "pequena", chefeId: null, alvo: 300 },
    rodada: { baralho: [], mao: [], pontuacao: 0, maosRestantes: 4, descartesRestantes: 3, descartesUsados: 0, tiposJogados: [] },
    ...extra,
  };
}

teste("aprimoramentos: 8 ids esperados", () => {
  ok(IDS_APRIMORAMENTO.length === 8, `esperava 8, veio ${IDS_APRIMORAMENTO.length}`);
  for (const id of ["bonus", "mult", "wild", "vidro", "aco", "ouro", "pedra", "sorte"]) {
    ok(IDS_APRIMORAMENTO.includes(id), `falta o id ${id}`);
  }
});

teste("aprimoramentos: cada um tem nome e descricao PT-BR não-vazios", () => {
  for (const id of IDS_APRIMORAMENTO) {
    const a = APRIMORAMENTOS[id];
    ok(a && a.nome && a.nome.trim().length > 0, `${id} sem nome`);
    ok(a.descricao && a.descricao.trim().length > 0, `${id} sem descricao`);
  }
});

teste("aprimoramento bonus: +30 chips na carta pontuada", () => {
  const state = stateBase();
  const { total } = pontuarJogada(state, [carta("copas", 9, "bonus"), carta("ouros", 9)]);
  igual(total, (28 + 30) * 2);
});

teste("aprimoramento mult: +4 mult na carta pontuada", () => {
  const state = stateBase();
  const { total } = pontuarJogada(state, [carta("copas", 9, "mult"), carta("ouros", 9)]);
  igual(total, 28 * (2 + 4));
});

teste("aprimoramento pedra: +50 chips e não soma chips por rank", () => {
  const state = stateBase();
  const { total } = pontuarJogada(state, [carta("copas", 9), carta("ouros", 9), carta("paus", 2, "pedra")]);
  igual(total, (28 + 50) * 2);
});

teste("aprimoramento aco: ×1,5 mult por carta de aço na mão (mesmo sem jogar)", () => {
  const naMao = [carta("paus", 7, "aco"), carta("espadas", 3)];
  const state = stateBase({ rodada: { ...stateBase().rodada, mao: naMao } });
  const { total } = pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]);
  igual(total, Math.floor(28 * (2 * 1.5)));
});

teste("aprimoramento aco: duas cartas de aço na mão multiplicam duas vezes", () => {
  const naMao = [carta("paus", 7, "aco"), carta("espadas", 3, "aco")];
  const state = stateBase({ rodada: { ...stateBase().rodada, mao: naMao } });
  const { total } = pontuarJogada(state, [carta("copas", 9), carta("ouros", 9)]);
  igual(total, Math.floor(28 * (2 * 1.5 * 1.5)));
});

teste("aprimoramento aco: carta de aço JOGADA não dá ×1,5 (só segurada conta)", () => {
  // No momento da pontuação, state.rodada.mao ainda contém as cartas jogadas
  // (só são filtradas depois, em run.js). O aço só vale para cartas SEGURADAS,
  // então uma carta de aço que está sendo pontuada não deve multiplicar.
  const jogadas = [carta("copas", 9, "aco"), carta("ouros", 9)];
  const naMao = [...jogadas, carta("espadas", 3)]; // a carta de aço também está na mão
  const state = stateBase({ rodada: { ...stateBase().rodada, mao: naMao } });
  const { total } = pontuarJogada(state, jogadas);
  igual(total, 28 * 2, "aço jogado pontua como carta normal (sem ×1,5)");
});

teste("aprimoramento vidro: ×2 mult sempre que pontua", () => {
  const state = stateBase({ rngEstado: 1 });
  const { total } = pontuarJogada(state, [carta("copas", 9, "vidro"), carta("ouros", 9)]);
  igual(total, 28 * 4);
});

teste("aprimoramento vidro: em alguns seeds quebra (entra em cartasDestruidas)", () => {
  let quebrou = false, sobreviveu = false;
  for (let seed = 1; seed <= 40; seed++) {
    const state = stateBase({ rngEstado: seed });
    const c = carta("copas", 9, "vidro");
    const r = pontuarJogada(state, [c, carta("ouros", 9)]);
    if (r.cartasDestruidas.some((d) => d.id === c.id)) quebrou = true; else sobreviveu = true;
  }
  ok(quebrou, "nenhum seed quebrou — entre()/probabilidade pode estar errada");
  ok(sobreviveu, "todos quebraram — probabilidade pode estar errada");
});

teste("aprimoramento sorte: pipeline devolve dinheiroSorte (0 ou múltiplo de 20)", () => {
  const state = stateBase({ rngEstado: 1 });
  const r = pontuarJogada(state, [carta("copas", 9, "sorte"), carta("ouros", 9)]);
  ok(typeof r.dinheiroSorte === "number", "deve devolver dinheiroSorte");
  ok(r.dinheiroSorte % 20 === 0, `dinheiroSorte deve ser múltiplo de 20, veio ${r.dinheiroSorte}`);
});

teste("aprimoramento sorte: em alguns seeds concede +20 mult", () => {
  let concedeu = false;
  for (let seed = 1; seed <= 40; seed++) {
    const state = stateBase({ rngEstado: seed });
    const { eventos } = pontuarJogada(state, [carta("copas", 9, "sorte"), carta("ouros", 9)]);
    if (eventos.some((e) => e.tipo === "efeito" && e.origem === "aprimoramento:sorte" && e.mult === 20)) concedeu = true;
  }
  ok(concedeu, "nenhum seed concedeu +20 mult — probabilidade 1/5 pode estar errada");
});
