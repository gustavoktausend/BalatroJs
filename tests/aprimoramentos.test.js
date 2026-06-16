import { teste, ok } from "./harness.js";
import { APRIMORAMENTOS, IDS_APRIMORAMENTO } from "../js/data/aprimoramentos.js";

teste("aprimoramentos: 8 ids esperados", () => {
  ok(IDS_APRIMORAMENTO.length === 8, `esperava 8, veio ${IDS_APRIMORAMENTO.length}`);
  for (const id of ["bonus", "mult", "wild", "vidro", "aco", "ouro", "pedra", "sorte"]) {
    ok(IDS_APRIMORAMENTO.includes(id), `falta o id ${id}`);
  }
});

teste("aprimoramentos: cada um tem nome e descricao PT-BR não-vazios", () => {
  for (const id of IDS_APRIMORAMENTO) {
    const a = APRIMORAMENTOS[id];
    ok(a && a.nome && a.nome.trim().length > 0, `${id} sem nome`);
    ok(a.descricao && a.descricao.trim().length > 0, `${id} sem descricao`);
  }
});
