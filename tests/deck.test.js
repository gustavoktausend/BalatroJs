import { teste, ok, igual } from "./harness.js";
import { criarBaralho, chipsDaCarta, rotuloDaCarta, ehFigura, NAIPES } from "../js/engine/deck.js";

teste("deck: baralho tem 52 cartas únicas, 13 por naipe", () => {
  const baralho = criarBaralho();
  igual(baralho.length, 52);
  igual(new Set(baralho.map((c) => c.id)).size, 52);
  for (const naipe of NAIPES) {
    igual(baralho.filter((c) => c.naipe === naipe).length, 13, naipe);
  }
});

teste("deck: chips — número vale o número, figura 10, ás 11", () => {
  igual(chipsDaCarta({ naipe: "copas", valor: 2 }), 2);
  igual(chipsDaCarta({ naipe: "copas", valor: 10 }), 10);
  igual(chipsDaCarta({ naipe: "copas", valor: 11 }), 10); // J
  igual(chipsDaCarta({ naipe: "copas", valor: 13 }), 10); // K
  igual(chipsDaCarta({ naipe: "copas", valor: 14 }), 11); // A
});

teste("deck: rótulos e figuras", () => {
  igual(rotuloDaCarta({ valor: 2 }), "2");
  igual(rotuloDaCarta({ valor: 11 }), "J");
  igual(rotuloDaCarta({ valor: 12 }), "Q");
  igual(rotuloDaCarta({ valor: 13 }), "K");
  igual(rotuloDaCarta({ valor: 14 }), "A");
  ok(ehFigura({ valor: 12 }));
  ok(!ehFigura({ valor: 14 }), "ás não é figura");
  ok(!ehFigura({ valor: 10 }));
});
