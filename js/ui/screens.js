import { app, atualizar } from "../app.js";
import { criarRun, carregar } from "../state.js";
import { decodificarSeed } from "../engine/seed.js";
import { el, cabecalhoRun, elementoCarta, fileiraCoringas, fileiraConsumiveis, avisar, elementoCoringa, elementoConsumivel } from "./render.js";
import { novoCoringa } from "../data/jokers.js";
import { comprarItem, comprarPacote, rerolar, escolherDoPacote, pularPacote, comprarVoucher, precoEfetivo, PRECO_PACOTE } from "../engine/shop.js";
import { VOUCHERS, PRECO_VOUCHER } from "../data/vouchers.js";
import { ligarTooltip } from "./tooltip.js";
import { CHEFES } from "../data/bosses.js";
import { alvoDaBlind, chefeDoAnte } from "../engine/blinds.js";
import { PREMIOS } from "../engine/economy.js";
import { iniciarBlind, pularBlind, jogar, descartar, ordenarMao } from "../engine/run.js";
import { MAOS, valoresDaMao } from "../data/hands.js";
import { detectarMao } from "../engine/poker.js";
import { NAIPES, SIMBOLO_NAIPE, rotuloDaCarta } from "../engine/deck.js";
import { animarJogada } from "./animate.js";
import { BARALHOS } from "../data/baralhos.js";
import { STAKES } from "../data/stakes.js";

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
  const campoSeed = el("input", {
    id: "campo-seed", classe: "campo-seed", type: "text",
    placeholder: "Seed (opcional)", maxlength: "8",
  });

  const seletor = (classe, dados) => el("select", { classe },
    ...Object.values(dados).map((d) => el("option", { value: d.id }, d.nome)),
  );
  const selBaralho = seletor("campo-seed seletor-run", BARALHOS);
  const selStake = seletor("campo-seed seletor-run", STAKES);
  const descBaralho = el("p", { classe: "descricao" }, BARALHOS.padrao.descricao);
  const descStake = el("p", { classe: "descricao" }, STAKES.branco.descricao);
  selBaralho.addEventListener("change", () => { descBaralho.textContent = BARALHOS[selBaralho.value].descricao; });
  selStake.addEventListener("change", () => { descStake.textContent = STAKES[selStake.value].descricao; });

  function iniciarJogo() {
    const valor = campoSeed.value.trim();
    let semente;
    if (valor !== "") {
      semente = decodificarSeed(valor);
      if (semente === null) { avisar("seed-invalida"); return; }
    }
    app.state = criarRun(semente, selBaralho.value, selStake.value);
    atualizar();
  }

  secao.replaceChildren(
    el("h1", { classe: "logo" }, "BalatroJS"),
    el("p", { classe: "subtitulo" }, "um clone de estudo em JavaScript puro"),
    campoSeed,
    el("label", { classe: "rotulo-seletor" }, "Baralho"), selBaralho, descBaralho,
    el("label", { classe: "rotulo-seletor" }, "Stake"), selStake, descStake,
    el("button", { classe: "botao botao-azul", onclick: iniciarJogo }, "Jogar"),
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
    el("p", {}, "Alvo: ", el("span", { classe: "numero" }, alvoDaBlind(state.ante, tipo, chefeId, (STAKES[state.stake] || STAKES.branco).multAlvo).toLocaleString("pt-BR"))),
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
  if (resultado.vitoriaBlind) avisar(`Blind vencida! +$${resultado.recompensa}`);
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

export function mostrarTabelaMaos(state) {
  const overlay = el("div", { classe: "overlay", onclick: () => overlay.remove() });
  const painel = el("div", { classe: "painel-baralho tabela-maos", onclick: (e) => e.stopPropagation() },
    el("h3", {}, "Mãos de pôquer"),
    ...Object.keys(MAOS).map((tipo) => {
      const nivel = state.niveisMaos[tipo];
      const { chips, mult } = valoresDaMao(tipo, nivel);
      return el("div", { classe: "linha-mao" },
        el("span", { classe: "nome-mao" }, MAOS[tipo].nome),
        el("span", { classe: "descricao" }, `nv. ${nivel}`),
        el("span", {}, el("span", { classe: "numero chips" }, String(chips)), " × ", el("span", { classe: "numero mult" }, String(mult))),
      );
    }),
  );
  overlay.append(painel);
  document.body.append(overlay);
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

function renderLoja(state) {
  const secao = secaoDe("loja");
  secao.replaceChildren(
    el("h2", { classe: "logo" }, "Loja"),
    cabecalhoRun(state),
    vouchersPossuidos(state),
    el("div", { classe: "topo" }, fileiraCoringas(state), fileiraConsumiveis(state)),
    el("div", { classe: "itens-loja" },
      ...state.loja.itens.map((item, i) => (item ? cartaoItem(state, item, i) : el("div", { classe: "slot-vazio" }))),
      cartaoPacote(state),
      cartaoVoucher(state),
    ),
    el("div", { classe: "controles" },
      el("button", {
        classe: "botao",
        onclick: () => { const r = rerolar(state); if (r.erro) avisar(r.erro); atualizar(); },
      }, `Re-rolar $${state.loja.precoRerolar}`),
      el("button", {
        classe: "botao botao-azul",
        onclick: () => { state.loja = null; state.fase = "selecao-blind"; atualizar(); },
      }, "Próxima rodada"),
    ),
  );
}

function cartaoItem(state, item, indice) {
  const corpo = item.tipo === "coringa"
    ? elementoCoringa(novoCoringa(item.id))
    : elementoConsumivel({ tipo: item.tipo, id: item.id });
  return el("div", { classe: "cartao-item" },
    corpo,
    el("button", {
      classe: "botao botao-azul",
      onclick: () => { const r = comprarItem(state, indice); if (r.erro) avisar(r.erro); else atualizar(); },
    }, `Comprar $${precoEfetivo(state, item)}`),
  );
}

function cartaoPacote(state) {
  return el("div", { classe: "cartao-item" },
    el("div", { classe: "consumivel" }, el("span", {}, "Pacote-surpresa")),
    el("button", {
      classe: "botao botao-azul",
      disabled: state.loja.pacoteAberto,
      onclick: () => { const r = comprarPacote(state); if (r.erro) avisar(r.erro); else atualizar(); },
    }, state.loja.pacoteAberto ? "Aberto" : `Abrir $${PRECO_PACOTE}`),
  );
}

function cartaoVoucher(state) {
  const v = state.loja.voucher;
  if (!v) return el("div", { classe: "slot-vazio" });
  const def = VOUCHERS[v.id];
  const cartao = el("div", { classe: "voucher" }, el("span", { classe: "nome" }, def.nome));
  ligarTooltip(cartao, `<strong>${def.nome}</strong><br>${def.descricao}`);
  return el("div", { classe: "cartao-item" },
    cartao,
    el("button", {
      classe: "botao botao-azul",
      onclick: () => { const r = comprarVoucher(state); if (r.erro) avisar(r.erro); else atualizar(); },
    }, `Comprar $${PRECO_VOUCHER}`),
  );
}

function vouchersPossuidos(state) {
  if (!state.vouchers.length) return el("p", { classe: "descricao" }, "Vouchers: nenhum");
  const nomes = state.vouchers.map((id) => VOUCHERS[id].nome).join(", ");
  return el("p", { classe: "descricao" }, `Vouchers: ${nomes}`);
}

const TITULO_PACOTE = {
  planeta: "Pacote Celestial",
  coringa: "Pacote de Coringas",
  taro: "Pacote Arcano",
  espectral: "Pacote Espectral",
};

function renderPacote(state) {
  const secao = secaoDe("pacote");
  const tipo = state.pacote.tipo;
  secao.replaceChildren(
    el("h2", { classe: "logo" }, TITULO_PACOTE[tipo]),
    el("p", { classe: "subtitulo" }, "Escolha 1"),
    el("div", { classe: "itens-loja" },
      ...state.pacote.opcoes.map((id, i) =>
        el("div", { classe: "cartao-item" },
          tipo === "coringa" ? elementoCoringa(novoCoringa(id)) : elementoConsumivel({ tipo, id }),
          el("button", {
            classe: "botao botao-azul",
            onclick: () => { const r = escolherDoPacote(state, i); if (r.erro) avisar(r.erro); else atualizar(); },
          }, "Escolher"),
        ),
      ),
    ),
    el("button", { classe: "botao", onclick: () => { pularPacote(state); atualizar(); } }, "Pular"),
  );
}

function renderFim(state) {
  const secao = secaoDe("fim");
  const maisJogada = Object.entries(state.estatisticas.porMao).sort((a, b) => b[1] - a[1])[0];
  secao.replaceChildren(
    el("h1", { classe: "logo" }, state.vitoria ? "Vitória!" : "Fim de run"),
    el("div", { classe: "estatisticas" },
      el("p", {}, `Ante alcançado: ${state.ante}`),
      el("p", {}, `Rodadas vencidas: ${state.estatisticas.rodadas}`),
      el("p", {}, "Melhor jogada: ", el("span", { classe: "numero" }, state.estatisticas.melhorJogada.toLocaleString("pt-BR"))),
      el("p", {}, maisJogada
        ? `Mão mais jogada: ${MAOS[maisJogada[0]].nome} (${maisJogada[1]}×)`
        : "Nenhuma mão jogada"),
    ),
    el("button", { classe: "botao botao-azul", onclick: () => { app.state = criarRun(); atualizar(); } }, "Nova run"),
    el("button", { classe: "botao", onclick: () => { app.state = null; atualizar(); } }, "Menu"),
  );
}

const RENDERS = {
  "titulo": renderTitulo,
  "selecao-blind": renderSelecaoBlind,
  "rodada": renderRodada,
  "loja": renderLoja,
  "pacote": renderPacote,
  "fim": renderFim,
};
