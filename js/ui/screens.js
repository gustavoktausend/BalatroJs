import { app, atualizar } from "../app.js";
import { criarRun, carregar } from "../state.js";
import { el, cabecalhoRun } from "./render.js";
import { CHEFES } from "../data/bosses.js";
import { alvoDaBlind, chefeDoAnte } from "../engine/blinds.js";
import { PREMIOS } from "../engine/economy.js";
import { iniciarBlind, pularBlind } from "../engine/run.js";

export function mostrarTela(state) {
  const fase = state ? state.fase : "titulo";
  for (const secao of document.querySelectorAll("[data-tela]")) {
    secao.hidden = secao.dataset.tela !== fase;
  }
  RENDERS[fase]?.(state);
}

function secaoDe(fase) {
  return document.querySelector(`[data-tela="${fase}"]`);
}

// ── Título ──────────────────────────────────────────────
function renderTitulo() {
  const secao = secaoDe("titulo");
  secao.replaceChildren(
    el("h1", { classe: "logo" }, "BalatroJS"),
    el("p", { classe: "subtitulo" }, "um clone de estudo em JavaScript puro"),
    el("button", { classe: "botao botao-azul", onclick: () => { app.state = criarRun(); atualizar(); } }, "Jogar"),
  );
  const save = carregar();
  if (save) {
    secao.append(el("button", { classe: "botao", onclick: () => { app.state = save; atualizar(); } }, "Continuar"));
  }
}

// ── Seleção de blind ────────────────────────────────────
const NOME_BLIND = { pequena: "Aposta Pequena", grande: "Aposta Grande" };

function renderSelecaoBlind(state) {
  const secao = secaoDe("selecao-blind");
  secao.replaceChildren(
    cabecalhoRun(state),
    el("div", { classe: "blinds" },
      cartaoBlind(state, "pequena"),
      cartaoBlind(state, "grande"),
      cartaoBlind(state, "chefe"),
    ),
  );
}

function cartaoBlind(state, tipo) {
  const chefeId = chefeDoAnte(state);
  const atual = state.proximaBlind === tipo;
  const cartao = el("div", { classe: `cartao-blind ${tipo}${atual ? " atual" : ""}` },
    el("h3", {}, tipo === "chefe" ? CHEFES[chefeId].nome : NOME_BLIND[tipo]),
    tipo === "chefe" ? el("p", { classe: "descricao" }, CHEFES[chefeId].descricao) : null,
    el("p", {}, "Alvo: ", el("span", { classe: "numero" }, alvoDaBlind(state.ante, tipo, chefeId).toLocaleString("pt-BR"))),
    el("p", { classe: "dinheiro" }, `Prêmio: $${PREMIOS[tipo]}`),
  );
  if (atual) {
    cartao.append(el("button", { classe: "botao botao-azul", onclick: () => { iniciarBlind(state, tipo); atualizar(); } }, "Jogar"));
    if (tipo !== "chefe") {
      cartao.append(el("button", { classe: "botao", onclick: () => { pularBlind(state); atualizar(); } }, "Pular"));
    }
  }
  return cartao;
}

// ── Telas preenchidas nas Tasks 14 e 15 ─────────────────
function renderRodada(state) {}
function renderLoja(state) {}
function renderPacote(state) {}
function renderFim(state) {}

const RENDERS = {
  "titulo": renderTitulo,
  "selecao-blind": renderSelecaoBlind,
  "rodada": renderRodada,
  "loja": renderLoja,
  "pacote": renderPacote,
  "fim": renderFim,
};
