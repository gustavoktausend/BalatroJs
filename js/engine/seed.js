// Conversão entre a semente numérica interna (0 … 2^31-1) e um código curto
// base36 maiúsculo (6 chars), legível e fácil de compartilhar/ditar.

const MAX_SEMENTE = 2 ** 31 - 1;

// Coage a semente ao intervalo válido antes de codificar, garantindo um código de
// exatamente 6 chars. Não lança: é chamada no render do cabeçalho a cada quadro.
export function codificarSeed(semente) {
  const n = Number.isInteger(semente) ? Math.min(Math.max(semente, 0), MAX_SEMENTE) : 0;
  return n.toString(36).toUpperCase().padStart(6, "0");
}

// Retorna o inteiro da seed, ou null se o código for inválido. Nunca lança.
// O código tem exatamente 6 chars [A-Z0-9]; qualquer outro tamanho é inválido.
export function decodificarSeed(codigo) {
  if (typeof codigo !== "string") return null;
  const texto = codigo.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(texto)) return null;
  const n = parseInt(texto, 36);
  if (!Number.isInteger(n) || n < 0 || n > MAX_SEMENTE) return null;
  return n;
}
