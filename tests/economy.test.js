import { teste, igual } from "./harness.js";
import { juros, recompensaBlind, precoVenda } from "../js/engine/economy.js";

teste("economy: juros de $1 a cada $5, máximo $5", () => {
  igual(juros(0), 0);
  igual(juros(4), 0);
  igual(juros(5), 1);
  igual(juros(14), 2);
  igual(juros(25), 5);
  igual(juros(100), 5);
});

teste("economy: recompensa = prêmio + $1 por mão restante + juros", () => {
  // Pequena $3, 2 mãos sobrando, $10 guardados => 3 + 2 + 2
  igual(recompensaBlind("pequena", 2, 10), 7);
  // Grande $4, 0 mãos, $0 => 4
  igual(recompensaBlind("grande", 0, 0), 4);
  // Chefe $5, 3 mãos, $25 => 5 + 3 + 5
  igual(recompensaBlind("chefe", 3, 25), 13);
});

teste("economy: preço de venda é teto da metade", () => {
  igual(precoVenda(3), 2);
  igual(precoVenda(4), 2);
  igual(precoVenda(7), 4);
  igual(precoVenda(9), 5);
});
