import { app, atualizar } from "../app.js";
import { NAIPES_VERMELHOS, SIMBOLO_NAIPE, rotuloDaCarta } from "../engine/deck.js";
import { MAOS } from "../data/hands.js";
import { PLANETAS } from "../data/planets.js";
import { TAROS } from "../data/taros.js";
import { ESPECTRAIS } from "../data/espectrais.js";
import { BARALHOS } from "../data/baralhos.js";
import { STAKES } from "../data/stakes.js";
import { precoVenda } from "../engine/economy.js";
import { codificarSeed } from "../engine/seed.js";
import { venderCoringa, reordenarCoringas, MAX_CORINGAS, MAX_CONSUMIVEIS } from "../engine/shop.js";
import { usarConsumivel } from "../engine/run.js";
import { ligarTooltip } from "./tooltip.js";
import { sufixoEstado, corDoCoringa } from "../data/jokers.js";

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

// Cria um ícone SVG de chapéu de jester nas cores dadas. SVG precisa de namespace,
// então não usa o helper el() (que chama createElement). Decorativo (aria-hidden).
const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, atributos) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(atributos)) node.setAttribute(k, v);
  return node;
}
export function svgCoringa(clara, escura) {
  const svg = svgEl("svg", { viewBox: "0 0 48 48", class: "icone-coringa", "aria-hidden": "true" });
  // Chapéu de jester: três pontas com guizos + faixa da base.
  const chapeu = svgEl("path", {
    d: "M24 6 L14 22 L8 14 L10 30 L38 30 L40 14 L34 22 Z",
    fill: clara, stroke: escura, "stroke-width": "2", "stroke-linejoin": "round",
  });
  const faixa = svgEl("rect", { x: "8", y: "30", width: "32", height: "6", rx: "3", fill: escura });
  const g1 = svgEl("circle", { cx: "8", cy: "13", r: "3", fill: escura });
  const g2 = svgEl("circle", { cx: "24", cy: "5", r: "3", fill: escura });
  const g3 = svgEl("circle", { cx: "40", cy: "13", r: "3", fill: escura });
  svg.append(chapeu, faixa, g1, g2, g3);
  return svg;
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
    el("button", { classe: "botao botao-mini", onclick: () => app.mostrarTabelaMaos(state) }, "Mãos"),
    el("span", { classe: "descricao" }, `${(BARALHOS[state.baralho] || BARALHOS.padrao).nome} · ${(STAKES[state.stake] || STAKES.branco).nome}`),
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
  const { clara, escura } = corDoCoringa(def.id);
  const elemento = el("div", { classe: `coringa raridade-${def.raridade}` },
    svgCoringa(clara, escura),
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

export function elementoConsumivel(consumivel, indice = null) {
  const { tipo, id } = consumivel;
  let nome, descricaoHtml;
  if (tipo === "planeta") {
    const planeta = PLANETAS[id];
    const nivel = app.state ? app.state.niveisMaos[planeta.mao] : 1;
    nome = planeta.nome;
    descricaoHtml = `Sobe o nível de ${MAOS[planeta.mao].nome} (nível atual: ${nivel})`;
  } else {
    const def = tipo === "taro" ? TAROS[id] : ESPECTRAIS[id];
    nome = def.nome;
    descricaoHtml = def.descricao;
  }
  const elemento = el("div", { classe: `consumivel consumivel--${tipo}` }, el("span", {}, nome));
  ligarTooltip(elemento, `<strong>${nome}</strong><br>${descricaoHtml}`);
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
  state.consumiveis.forEach((consumivel, i) => fileira.append(elementoConsumivel(consumivel, i)));
  for (let i = state.consumiveis.length; i < MAX_CONSUMIVEIS; i++) {
    fileira.append(el("div", { classe: "slot-vazio" }));
  }
  return fileira;
}
