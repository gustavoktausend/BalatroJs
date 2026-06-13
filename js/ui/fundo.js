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
