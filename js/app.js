import { salvar } from "./state.js";

// Ponto único compartilhado entre engine e UI, sem importar nenhum dos dois
// (evita imports circulares). ui/screens.js define app.renderizar no boot.
export const app = { state: null, renderizar: null };

export function atualizar() {
  if (app.state && app.state.fase !== "fim") salvar(app.state);
  app.renderizar(app.state);
}
