import { teste, ok, igual } from "./harness.js";
import { VOUCHERS, PRECO_VOUCHER } from "../js/data/vouchers.js";
import { criarRun } from "../js/state.js";
import { juros } from "../js/engine/economy.js";
import { gerarLoja, rerolar, comprarVoucher, precoEfetivo } from "../js/engine/shop.js";
import { iniciarBlind, MAOS_POR_BLIND } from "../js/engine/run.js";

teste("vouchers: 4 vouchers com id/nome/descricao e preço $10", () => {
  const lista = Object.values(VOUCHERS);
  igual(lista.length, 4);
  igual(PRECO_VOUCHER, 10);
  for (const v of lista) ok(v.id && v.nome && v.descricao, `voucher incompleto: ${v.id}`);
  for (const id of ["bussola", "juros-mais", "liquidacao", "maos-mais"]) {
    ok(VOUCHERS[id], `voucher ausente: ${id}`);
  }
});

teste("vouchers: Juros+ sobe o teto de juros de 5 para 10", () => {
  igual(juros(30), 5, "teto padrão 5");
  igual(juros(30, 10), 6, "teto 10 → 6 a $30");
  igual(juros(100, 10), 10, "teto 10 satura em 10");
});

teste("vouchers: Bússola deixa a re-rolagem começar em $3", () => {
  const semVoucher = criarRun(1); gerarLoja(semVoucher);
  igual(semVoucher.loja.precoRerolar, 5);
  const comVoucher = criarRun(1); comVoucher.vouchers = ["bussola"]; gerarLoja(comVoucher);
  igual(comVoucher.loja.precoRerolar, 3);
});

teste("vouchers: Liquidação dá $1 de desconto (mínimo $1)", () => {
  const state = criarRun(1);
  igual(precoEfetivo(state, { preco: 3 }), 3, "sem voucher");
  state.vouchers = ["liquidacao"];
  igual(precoEfetivo(state, { preco: 3 }), 2, "com voucher");
  igual(precoEfetivo(state, { preco: 1 }), 1, "nunca abaixo de 1");
});

teste("vouchers: Mãos+ dá +1 mão por rodada", () => {
  const state = criarRun(1); state.vouchers = ["maos-mais"];
  iniciarBlind(state, "pequena");
  igual(state.rodada.maosRestantes, MAOS_POR_BLIND + 1);
});

teste("vouchers: gerarLoja oferece 1 voucher não-possuído; todos possuídos → null", () => {
  const state = criarRun(1); gerarLoja(state);
  ok(state.loja.voucher && state.loja.voucher.id, "tem um voucher");
  ok(!state.vouchers.includes(state.loja.voucher.id), "não-possuído");
  const cheio = criarRun(1);
  cheio.vouchers = ["bussola", "juros-mais", "liquidacao", "maos-mais"];
  gerarLoja(cheio);
  igual(cheio.loja.voucher, null, "todos possuídos → null");
});

teste("vouchers: comprarVoucher debita, adiciona e esvazia o slot", () => {
  const state = criarRun(1); state.dinheiro = 50; gerarLoja(state);
  const id = state.loja.voucher.id;
  igual(comprarVoucher(state), {});
  igual(state.dinheiro, 40, "debita $10");
  ok(state.vouchers.includes(id), "adiciona aos possuídos");
  igual(state.loja.voucher, null, "esvazia o slot");
  igual(comprarVoucher(state).erro, "vazio", "slot vazio");
});

teste("vouchers: comprarVoucher sem dinheiro falha sem gastar", () => {
  const state = criarRun(1); state.dinheiro = 5; gerarLoja(state);
  igual(comprarVoucher(state).erro, "sem-dinheiro");
  igual(state.dinheiro, 5, "não gastou");
  ok(state.loja.voucher, "slot intacto");
});

teste("vouchers: rerolar não troca o voucher do slot", () => {
  const state = criarRun(1); state.dinheiro = 50; gerarLoja(state);
  const antes = state.loja.voucher;
  rerolar(state);
  igual(state.loja.voucher, antes, "voucher inalterado após re-roll");
});
