import { teste, ok, igual } from "./harness.js";
import { PLANETAS, PRECO_PLANETA } from "../js/data/planets.js";
import { TAROS } from "../js/data/taros.js";
import { ESPECTRAIS } from "../js/data/espectrais.js";
import { CORINGAS, novoCoringa, sufixoEstado, corDoCoringa } from "../js/data/jokers.js";
import { MAOS } from "../js/data/hands.js";

teste("planets: 9 planetas, um por mão, preço $3", () => {
  igual(Object.keys(PLANETAS).length, 9);
  igual(PRECO_PLANETA, 3);
  const maos = Object.values(PLANETAS).map((p) => p.mao);
  igual(new Set(maos).size, 9, "cada planeta aponta para uma mão distinta");
  for (const mao of maos) ok(mao in MAOS, `mão desconhecida: ${mao}`);
  igual(PLANETAS.plutao.mao, "carta-alta");
  igual(PLANETAS.netuno.mao, "sequencia-de-naipe");
});

teste("jokers: 25 coringas — 14 comuns, 8 incomuns, 3 raros", () => {
  const lista = Object.values(CORINGAS);
  igual(lista.length, 25);
  igual(lista.filter((c) => c.raridade === "comum").length, 14);
  igual(lista.filter((c) => c.raridade === "incomum").length, 8);
  igual(lista.filter((c) => c.raridade === "raro").length, 3);
  for (const c of lista) {
    ok(c.id && c.nome && c.descricao, `coringa incompleto: ${c.id}`);
    ok(c.preco >= 3 && c.preco <= 9, `preço fora da faixa: ${c.id}`);
    ok(Object.keys(c.ganchos).length > 0, `coringa sem ganchos: ${c.id}`);
  }
});

teste("jokers: novoCoringa clona o estado inicial", () => {
  const a = novoCoringa("coringa-verde");
  const b = novoCoringa("coringa-verde");
  igual(a.dados, { mult: 0 });
  a.dados.mult = 99;
  igual(b.dados.mult, 0, "instâncias não compartilham dados");
  ok(typeof a.def.ganchos.aoPontuarMao === "function");
});

teste("jokers: sufixoEstado mostra cada campo de dados presente", () => {
  igual(sufixoEstado({}), "", "dados vazio não gera sufixo");
  igual(sufixoEstado({ mult: 5 }), " (atual: +5)", "campo mult");
  igual(sufixoEstado({ x: 1.5 }), " (atual: ×1.5)", "campo x");
  igual(sufixoEstado({ valor: 3 }), " (atual: $3)", "campo valor");
  // O caso que a versão antiga quebrava: dois campos ao mesmo tempo.
  igual(sufixoEstado({ mult: 5, x: 1.5 }), " (atual: +5, ×1.5)");
});

teste("jokers: corDoCoringa é determinística e bem formada", () => {
  const a = corDoCoringa("coringa");
  const b = corDoCoringa("coringa");
  igual(a, b, "mesmo id → mesma cor");
  ok(a.clara.startsWith("hsl("), "clara é hsl");
  ok(a.escura.startsWith("hsl("), "escura é hsl");
});

teste("jokers: corDoCoringa — escura tem lightness menor que a clara", () => {
  const { clara, escura } = corDoCoringa("obelisco");
  const lightness = (s) => Number(s.match(/(\d+)%\)$/)[1]);
  ok(lightness(escura) < lightness(clara), "escura mais escura");
});

teste("jokers: corDoCoringa espalha matizes entre ids diferentes", () => {
  const matiz = (s) => Number(s.match(/hsl\((\d+)/)[1]);
  const hs = ["coringa", "ganancioso", "obelisco", "holograma"].map((id) => matiz(corDoCoringa(id).clara));
  igual(new Set(hs).size, hs.length, "matizes distintos para ids distintos");
});

teste("consumiveis: todo planeta/tarô/espectral tem ícone (glifo não vazio)", () => {
  // PLANETAS/TAROS/ESPECTRAIS são todos mapas id→def (taros/espectrais via
  // Object.fromEntries(LISTA…)). Iteramos Object.values uniformemente.
  const grupos = { planeta: PLANETAS, taro: TAROS, espectral: ESPECTRAIS };
  for (const [tipo, mapa] of Object.entries(grupos)) {
    for (const def of Object.values(mapa)) {
      ok(typeof def.icone === "string" && def.icone.trim().length > 0,
        `${tipo} sem ícone: ${def.nome}`);
    }
  }
});
