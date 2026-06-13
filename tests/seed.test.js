import { teste, ok, igual } from "./harness.js";
import { codificarSeed, decodificarSeed } from "../js/engine/seed.js";

const MAX = 2 ** 31 - 1;

teste("seed: round-trip decodificar(codificar(n)) === n", () => {
  for (const n of [0, 1, 1837465021, MAX]) {
    igual(decodificarSeed(codificarSeed(n)), n, `round-trip ${n}`);
  }
});

teste("seed: codificarSeed é estável, maiúsculo, 6 chars [A-Z0-9]", () => {
  igual(codificarSeed(1837465021), "UDZ931");
  igual(codificarSeed(1), "000001", "padding à esquerda");
  igual(codificarSeed(MAX), "ZIK0ZJ");
  ok(/^[A-Z0-9]{6}$/.test(codificarSeed(0)), "só A-Z0-9, 6 chars");
});

teste("seed: decodificarSeed é case-insensitive e ignora espaços nas pontas", () => {
  igual(decodificarSeed("udz931"), 1837465021, "minúsculas");
  igual(decodificarSeed("  UDZ931  "), 1837465021, "trim");
});

teste("seed: decodificarSeed rejeita inválidos com null", () => {
  igual(decodificarSeed(""), null, "vazio");
  igual(decodificarSeed("   "), null, "só espaços");
  igual(decodificarSeed("abc!@#"), null, "caractere inválido");
  igual(decodificarSeed("ABC"), null, "menos de 6 chars");
  igual(decodificarSeed("ZIK0ZK"), null, "primeiro código acima de 2^31-1");
  igual(decodificarSeed("ZZZZZZ"), null, "válido em A-Z0-9 mas acima de 2^31-1");
  igual(decodificarSeed(123), null, "entrada não-string");
  // O maior código aceito (a cerca dos dois lados): ZIK0ZJ = MAX.
  igual(decodificarSeed("ZIK0ZJ"), MAX, "maior código válido aceito");
});

teste("seed: codificarSeed coage entradas fora do intervalo", () => {
  igual(codificarSeed(2 ** 31), "ZIK0ZJ", "acima do máximo → MAX");
  igual(codificarSeed(-5), "000000", "negativo → 0");
});
