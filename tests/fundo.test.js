import { teste, ok, igual } from "./harness.js";
import { passo } from "../js/ui/fundo.js";

const LIM = { largura: 100, altura: 100 };

teste("fundo: passo avança a posição dentro dos limites", () => {
  const b = { x: 50, y: 50, vx: 10, vy: -20, raio: 8, cor: "x" };
  const n = passo(b, 1, LIM);
  igual(n.x, 60, "x avança vx*dt");
  igual(n.y, 30, "y avança vy*dt");
  igual(n.vx, 10, "vx inalterado dentro dos limites");
  igual(n.vy, -20, "vy inalterado dentro dos limites");
});

teste("fundo: passo reflete na borda direita e esquerda", () => {
  // x=90 +20 = 110, 10 além da borda → reflete para 2*100-110 = 90.
  const dir = passo({ x: 90, y: 50, vx: 20, vy: 0, raio: 8, cor: "x" }, 1, LIM);
  igual(dir.x, 90, "reflete o excedente além de largura");
  igual(dir.vx, -20, "inverte vx ao bater na direita");
  // x=10 -20 = -10 → reflete para 10.
  const esq = passo({ x: 10, y: 50, vx: -20, vy: 0, raio: 8, cor: "x" }, 1, LIM);
  igual(esq.x, 10, "reflete o excedente além de 0");
  igual(esq.vx, 20, "inverte vx ao bater na esquerda");
});

teste("fundo: passo reflete no topo e na base", () => {
  const base = passo({ x: 50, y: 90, vx: 0, vy: 20, raio: 8, cor: "x" }, 1, LIM);
  igual(base.y, 90, "reflete o excedente além de altura");
  igual(base.vy, -20, "inverte vy ao bater na base");
  const topo = passo({ x: 50, y: 10, vx: 0, vy: -20, raio: 8, cor: "x" }, 1, LIM);
  igual(topo.y, 10, "reflete o excedente além de 0");
  igual(topo.vy, 20, "inverte vy ao bater no topo");
});

teste("fundo: passo não muta o blob de entrada", () => {
  const b = { x: 50, y: 50, vx: 10, vy: 10, raio: 8, cor: "x" };
  passo(b, 1, LIM);
  igual(b.x, 50, "x original intacto");
  igual(b.y, 50, "y original intacto");
  igual(b.vx, 10, "vx original intacto");
  igual(b.vy, 10, "vy original intacto");
});
