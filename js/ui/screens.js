import { app, atualizar } from "../app.js";
import { criarRun, carregar } from "../state.js";
import { el, cabecalhoRun, elementoCarta, fileiraCoringas, fileiraConsumiveis, avisar } from "./render.js";
import { CHEFES } from "../data/bosses.js";
import { alvoDaBlind, chefeDoAnte } from "../engine/blinds.js";
import { PREMIOS } from "../engine/economy.js";
import { iniciarBlind, pularBlind, jogar, descartar, ordenarMao } from "../engine/run.js";
import { MAOS, valoresDaMao } from "../data/hands.js";
import { detectarMao } from "../engine/poker.js";
import { NAIPES, SIMBOLO_NAIPE, rotuloDaCarta } from "../engine/deck.js";
import { animarJogada } from "./animate.js";

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
let selecao = new Set();

function renderRodada(state) {
  selecao = new Set();
  const rodada = state.rodada;
  const secao = secaoDe("rodada");
  secao.replaceChildren(
    el("aside", { classe: "lateral" }, ...painelLateral(state)),
    el("div", { classe: "mesa" },
      el("div", { classe: "topo" }, fileiraCoringas(state), fileiraConsumiveis(state)),
      el("div", { classe: "centro", id: "area-jogada" }),
      el("div", { classe: "base" },
        el("div", { classe: "mao" }, ...rodada.mao.map((carta, i) => cartaDaMao(state, carta, i))),
        el("div", { classe: "controles" },
          el("button", { id: "btn-jogar", classe: "botao botao-azul", disabled: "", onclick: () => aoJogar(state) }, "Jogar"),
          el("button", { id: "btn-descartar", classe: "botao botao-vermelho", disabled: "", onclick: () => aoDescartar(state) }, "Descartar"),
          el("button", { classe: "botao botao-mini", onclick: () => { ordenarMao(state, "valor"); atualizar(); } }, "Valor"),
          el("button", { classe: "botao botao-mini", onclick: () => { ordenarMao(state, "naipe"); atualizar(); } }, "Naipe"),
          el("button", { classe: "botao botao-mini", onclick: () => mostrarBaralho(state) }, `Baralho: ${rodada.baralho.length}`),
        ),
      ),
    ),
  );
}

function painelLateral(state) {
  const rodada = state.rodada;
  const blind = state.blindAtual;
  const titulo = blind.tipo === "chefe" ? CHEFES[blind.chefeId].nome : NOME_BLIND[blind.tipo];
  return [
    el("div", { classe: "painel-blind" },
      el("h3", {}, titulo),
      blind.tipo === "chefe" ? el("p", { classe: "descricao" }, CHEFES[blind.chefeId].descricao) : null,
      el("p", {}, "Alvo: ", el("span", { classe: "numero" }, blind.alvo.toLocaleString("pt-BR"))),
    ),
    el("div", { classe: "painel-pontuacao" },
      el("p", {}, "Rodada: ", el("span", { classe: "numero" }, rodada.pontuacao.toLocaleString("pt-BR"))),
      el("div", { id: "previa-mao" }),
    ),
    el("p", {},
      "Mãos: ", el("span", { classe: "numero chips" }, String(rodada.maosRestantes)),
      " · Descartes: ", el("span", { classe: "numero mult" }, String(rodada.descartesRestantes)),
    ),
    el("p", { classe: "numero dinheiro" }, `$${state.dinheiro}`),
    el("p", {}, `Ante ${state.ante}/8`),
  ];
}

function cartaDaMao(state, carta, indice) {
  const elemento = elementoCarta(carta);
  elemento.addEventListener("click", () => {
    if (selecao.has(indice)) {
      selecao.delete(indice);
      elemento.classList.remove("selecionada");
    } else if (selecao.size < 5) {
      selecao.add(indice);
      elemento.classList.add("selecionada");
    }
    atualizarControles(state);
  });
  return elemento;
}

function atualizarControles(state) {
  const rodada = state.rodada;
  document.getElementById("btn-jogar").disabled = selecao.size === 0 || rodada.maosRestantes === 0;
  document.getElementById("btn-descartar").disabled = selecao.size === 0 || rodada.descartesRestantes === 0;
  const previa = document.getElementById("previa-mao");
  if (selecao.size === 0) {
    previa.replaceChildren();
    return;
  }
  const jogada = detectarMao([...selecao].map((i) => rodada.mao[i]));
  const nivel = state.niveisMaos[jogada.tipo];
  const { chips, mult } = valoresDaMao(jogada.tipo, nivel);
  previa.innerHTML =
    `<span class="nome-mao">${MAOS[jogada.tipo].nome} <small>nv. ${nivel}</small></span>` +
    `<span class="numero chips">${chips}</span> × <span class="numero mult">${mult}</span>`;
}

async function aoJogar(state) {
  const indices = [...selecao];
  const cartas = indices.map((i) => state.rodada.mao[i]);
  const resultado = jogar(state, indices);
  if (resultado.erro) {
    avisar(resultado.erro);
    return;
  }
  document.getElementById("btn-jogar").disabled = true;
  document.getElementById("btn-descartar").disabled = true;
  await animarJogada(cartas, resultado.eventos, document.getElementById("area-jogada"));
  atualizar();
}

function aoDescartar(state) {
  const resultado = descartar(state, [...selecao]);
  if (resultado.erro) {
    avisar(resultado.erro);
    return;
  }
  atualizar();
}

function mostrarBaralho(state) {
  const overlay = el("div", { classe: "overlay", onclick: () => overlay.remove() },
    el("div", { classe: "painel-baralho" },
      el("h3", {}, `Cartas restantes (${state.rodada.baralho.length})`),
      ...NAIPES.map((naipe) => el("p", {},
        `${SIMBOLO_NAIPE[naipe]} `,
        state.rodada.baralho
          .filter((c) => c.naipe === naipe)
          .sort((a, b) => b.valor - a.valor)
          .map(rotuloDaCarta)
          .join(" "),
      )),
    ),
  );
  document.body.append(overlay);
}

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
