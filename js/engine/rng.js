// Gerador determinístico (mulberry32). O estado vive em state.rngEstado,
// então salvar/recarregar a página não re-rola a sorte.

export function proximoAleatorio(state) {
  state.rngEstado = (state.rngEstado + 0x6D2B79F5) >>> 0;
  let t = state.rngEstado;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function entre(state, min, max) {
  return min + Math.floor(proximoAleatorio(state) * (max - min + 1));
}

export function escolher(state, lista) {
  return lista[entre(state, 0, lista.length - 1)];
}

export function embaralhar(state, lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = entre(state, 0, i);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
