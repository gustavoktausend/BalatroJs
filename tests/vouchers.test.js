import { teste, ok, igual } from "./harness.js";
import { VOUCHERS, PRECO_VOUCHER } from "../js/data/vouchers.js";

teste("vouchers: 4 vouchers com id/nome/descricao e preço $10", () => {
  const lista = Object.values(VOUCHERS);
  igual(lista.length, 4);
  igual(PRECO_VOUCHER, 10);
  for (const v of lista) ok(v.id && v.nome && v.descricao, `voucher incompleto: ${v.id}`);
  for (const id of ["bussola", "juros-mais", "liquidacao", "maos-mais"]) {
    ok(VOUCHERS[id], `voucher ausente: ${id}`);
  }
});
