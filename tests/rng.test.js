import { teste, ok, igual } from "./harness.js";
import { proximoAleatorio, entre, escolher, embaralhar } from "../js/engine/rng.js";

teste("rng: mesma seed produz a mesma sequência", () => {
  const a = { rngEstado: 123 };
  const b = { rngEstado: 123 };
  for (let i = 0; i < 10; i++) igual(proximoAleatorio(a), proximoAleatorio(b));
});

teste("rng: proximoAleatorio fica em [0, 1) e avança o estado", () => {
  const state = { rngEstado: 42 };
  const antes = state.rngEstado;
  const n = proximoAleatorio(state);
  ok(n >= 0 && n < 1, `fora do intervalo: ${n}`);
  ok(state.rngEstado !== antes, "estado não avançou");
});

teste("rng: entre respeita limites inclusivos", () => {
  const state = { rngEstado: 7 };
  const vistos = new Set();
  for (let i = 0; i < 300; i++) {
    const n = entre(state, 1, 6);
    ok(n >= 1 && n <= 6, `fora do intervalo: ${n}`);
    vistos.add(n);
  }
  igual(vistos.size, 6, "deveria visitar todos os valores 1..6");
});

teste("rng: escolher devolve um item da lista", () => {
  const state = { rngEstado: 5 };
  const lista = ["a", "b", "c"];
  for (let i = 0; i < 50; i++) ok(lista.includes(escolher(state, lista)));
});

teste("rng: embaralhar preserva itens e não muta a original", () => {
  const state = { rngEstado: 99 };
  const lista = [1, 2, 3, 4, 5, 6, 7, 8];
  const resultado = embaralhar(state, lista);
  igual([...resultado].sort((x, y) => x - y), [1, 2, 3, 4, 5, 6, 7, 8]);
  igual(lista, [1, 2, 3, 4, 5, 6, 7, 8], "não deve mutar a original");
});
