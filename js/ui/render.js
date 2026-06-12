import { NAIPES_VERMELHOS, SIMBOLO_NAIPE, rotuloDaCarta } from "../engine/deck.js";

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
};

export function avisar(codigo) {
  document.getElementById("aviso")?.remove();
  document.body.append(el("div", { id: "aviso" }, MENSAGENS[codigo] || codigo));
  setTimeout(() => document.getElementById("aviso")?.remove(), 1900);
}
