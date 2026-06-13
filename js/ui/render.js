import { app, atualizar } from "../app.js";
import { NAIPES_VERMELHOS, SIMBOLO_NAIPE, rotuloDaCarta } from "../engine/deck.js";
import { MAOS } from "../data/hands.js";
import { PLANETAS } from "../data/planets.js";
import { precoVenda } from "../engine/economy.js";
import { codificarSeed } from "../engine/seed.js";
import { venderCoringa, reordenarCoringas, MAX_CORINGAS, MAX_CONSUMIVEIS } from "../engine/shop.js";
import { usarConsumivel } from "../engine/run.js";
import { ligarTooltip } from "./tooltip.js";
import { sufixoEstado } from "../data/jokers.js";

// Criador de elementos: el("div", { classe: "x", onclick: fn, dataset: {...} }, ...filhos)
export function el(tag, atributos = {}, ...filhos) {
  const elemento = document.createElement(tag);
  for (const [chave, valor] of Object.entries(atributos)) {
    if (chave === "classe") elemento.className = valor;
    else if (chave === "dataset") Object.assign(elemento.dataset, valor);
    else if (chave.startsWith("on")) elemento.addEventListener(chave.slice(2), valor);
    else if (valor !== false && valor != null) elemento.setAttribute(chave, valor);
  }
  elemento.append(...filhos.filter(Boolean));
  return elemento;
}

export function elementoCarta(carta) {
  const simbolo = SIMBOLO_NAIPE[carta.naipe];
  const rotulo = rotuloDaCarta(carta);
  const vermelha = NAIPES_VERMELHOS.includes(carta.naipe);
  return el("div", { classe: `carta${vermelha ? " vermelha" : ""}`, dataset: { id: carta.id } },
    el("span", { classe: "canto" }, rotulo, el("br"), simbolo),
    el("span", { classe: "pip" }, simbolo),
    el("span", { classe: "canto invertido" }, rotulo, el("br"), simbolo),
  );
}

export function cabecalhoRun(state) {
  return el("header", { classe: "cabecalho-run" },
    el("span", { classe: "numero dinheiro" }, `$${state.dinheiro}`),
    el("span", {}, `Ante ${state.ante}/8`),
    el("span", { classe: "descricao" }, `Rodadas vencidas: ${state.estatisticas.rodadas}`),
    el("span", { classe: "descricao" }, `Seed: ${codificarSeed(state.semente)}`),
  );
}

const MENSAGENS = {
  "selecao-invalida": "Selecione de 1 a 5 cartas.",
  "sem-maos": "Sem mãos restantes.",
  "sem-descartes": "Sem descartes restantes.",
  "bloqueada-pelo-chefe": "O Chefe bloqueia essa jogada!",
  "sem-dinheiro": "Dinheiro insuficiente.",
  "sem-espaco": "Sem espaço livre.",
  "ja-aberto": "Você já abriu um pacote nesta visita.",
  "chefe-obrigatorio": "O Chefe não pode ser pulado.",
  "vazio": "Nada aqui.",
  "slot-vazio": "Slot vazio.",
  "seed-invalida": "Código de seed inválido.",
};

export function avisar(codigo) {
  document.getElementById("aviso")?.remove();
  document.body.append(el("div", { id: "aviso" }, MENSAGENS[codigo] || codigo));
  setTimeout(() => document.getElementById("aviso")?.remove(), 1900);
}

// indice = null exibe sem interação (loja/pacote); com índice, permite vender e arrastar.
export function elementoCoringa(coringa, indice = null) {
  const def = coringa.def;
  const elemento = el("div", { classe: `coringa raridade-${def.raridade}` },
    el("span", { classe: "nome" }, def.nome),
  );
  ligarTooltip(elemento,
    `<strong>${def.nome}</strong><br>${descricaoCoringa(coringa)}<br><em>${def.raridade} — venda $${precoVenda(def.preco)}</em>`);

  if (indice === null) return elemento;

  elemento.addEventListener("click", () => {
    const existente = elemento.querySelector(".vender");
    if (existente) { existente.remove(); return; }
    elemento.append(el("button", {
      classe: "botao botao-vermelho botao-mini vender",
      onclick: (evento) => {
        evento.stopPropagation();
        venderCoringa(app.state, indice);
        atualizar();
      },
    }, `Vender $${precoVenda(def.preco)}`));
  });

  elemento.draggable = true;
  elemento.addEventListener("dragstart", (evento) => evento.dataTransfer.setData("text/plain", String(indice)));
  elemento.addEventListener("dragover", (evento) => evento.preventDefault());
  elemento.addEventListener("drop", (evento) => {
    evento.preventDefault();
    const origem = Number(evento.dataTransfer.getData("text/plain"));
    if (Number.isInteger(origem) && origem !== indice) {
      reordenarCoringas(app.state, origem, indice);
      atualizar();
    }
  });
  return elemento;
}

function descricaoCoringa(coringa) {
  return coringa.def.descricao + sufixoEstado(coringa.dados);
}

export function elementoConsumivel(planetaId, indice = null) {
  const planeta = PLANETAS[planetaId];
  const elemento = el("div", { classe: "consumivel" }, el("span", {}, planeta.nome));
  const nivel = app.state ? app.state.niveisMaos[planeta.mao] : 1;
  ligarTooltip(elemento,
    `<strong>${planeta.nome}</strong><br>Sobe o nível de ${MAOS[planeta.mao].nome} (nível atual: ${nivel})`);
  if (indice !== null) {
    elemento.addEventListener("click", () => {
      usarConsumivel(app.state, indice);
      atualizar();
    });
  }
  return elemento;
}

export function fileiraCoringas(state) {
  const fileira = el("div", { classe: "coringas" });
  state.coringas.forEach((coringa, i) => fileira.append(elementoCoringa(coringa, i)));
  for (let i = state.coringas.length; i < MAX_CORINGAS; i++) {
    fileira.append(el("div", { classe: "slot-vazio" }));
  }
  return fileira;
}

export function fileiraConsumiveis(state) {
  const fileira = el("div", { classe: "consumiveis" });
  state.consumiveis.forEach((id, i) => fileira.append(elementoConsumivel(id, i)));
  for (let i = state.consumiveis.length; i < MAX_CONSUMIVEIS; i++) {
    fileira.append(el("div", { classe: "slot-vazio" }));
  }
  return fileira;
}
