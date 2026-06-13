// Fundo decorativo: blobs de cor em movimento lento (lava-lamp) num canvas atrás da UI.
// Isolado do engine/estado; aleatoriedade via Math.random; não afeta o RNG do jogo.

// Avança um blob por dt segundos e reflete posição e velocidade ao bater nas bordas.
// A reflexão (x = 2*limite - x) preserva o excedente quando o passo ultrapassa a
// borda num único quadro, evitando "teleporte" com dt grande. Função pura: retorna
// um novo blob, não muta a entrada.
export function passo(blob, dt, limites) {
  let { x, y, vx, vy } = blob;
  x += vx * dt;
  y += vy * dt;
  if (x <= 0) { x = -x; vx = Math.abs(vx); }
  else if (x >= limites.largura) { x = 2 * limites.largura - x; vx = -Math.abs(vx); }
  if (y <= 0) { y = -y; vy = Math.abs(vy); }
  else if (y >= limites.altura) { y = 2 * limites.altura - y; vy = -Math.abs(vy); }
  return { ...blob, x, y, vx, vy };
}

// Tons de feltro da paleta, com alfa baixo (sobrepõem o gradiente do body).
const CORES = [
  "rgba(53, 98, 67, 0.55)",   // --feltro-claro
  "rgba(28, 58, 39, 0.55)",   // --feltro-escuro
  "rgba(41, 168, 255, 0.10)", // --azul, bem sutil
];

function novoBlob(largura, altura) {
  const dir = () => (Math.random() < 0.5 ? -1 : 1);
  return {
    x: Math.random() * largura,
    y: Math.random() * altura,
    vx: (8 + Math.random() * 14) * dir(),   // px/s, lento
    vy: (8 + Math.random() * 14) * dir(),
    raio: 160 + Math.random() * 180,
    cor: CORES[Math.floor(Math.random() * CORES.length)],
  };
}

function desenhar(ctx, blobs, largura, altura) {
  ctx.clearRect(0, 0, largura, altura);
  ctx.save();
  ctx.filter = "blur(60px)";
  for (const b of blobs) {
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.raio);
    g.addColorStop(0, b.cor);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.raio, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function iniciarFundo() {
  const canvas = document.getElementById("fundo");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let largura, altura, blobs;
  function dimensionar() {
    largura = canvas.width = window.innerWidth;
    altura = canvas.height = window.innerHeight;
  }
  dimensionar();
  blobs = Array.from({ length: 5 }, () => novoBlob(largura, altura));

  window.addEventListener("resize", () => {
    dimensionar();
    // Reposiciona blobs que ficaram fora dos novos limites.
    blobs = blobs.map((b) => ({
      ...b,
      x: Math.min(b.x, largura),
      y: Math.min(b.y, altura),
    }));
  });

  const reduzido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduzido) {
    desenhar(ctx, blobs, largura, altura);
    return;
  }

  let anterior = performance.now();
  function loop(agora) {
    const dt = Math.min(0.05, (agora - anterior) / 1000); // clamp p/ abas em background
    anterior = agora;
    blobs = blobs.map((b) => passo(b, dt, { largura, altura }));
    desenhar(ctx, blobs, largura, altura);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
