import { el, elementoCarta } from "./render.js";

const espera = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Reproduz visualmente os eventos retornados por pontuarJogada, na ordem.
export async function animarJogada(cartas, eventos, area) {
  area.replaceChildren();
  const placar = el("div", { classe: "placar-jogada" });
  area.append(placar);
  const porId = {};
  for (const carta of cartas) {
    const elemento = elementoCarta(carta);
    porId[carta.id] = elemento;
    area.append(elemento);
  }
  await espera(250);

  for (const ev of eventos) {
    if (ev.tipo === "mao") {
      placar.innerHTML = `${ev.nome} — <span class="chips">${ev.chips}</span> × <span class="mult">${ev.mult}</span>`;
    } else if (ev.tipo === "carta") {
      pulsar(porId[ev.carta.id], `+${ev.chips}`, "chips");
      placar.innerHTML = `<span class="chips">${ev.chipsTotal}</span> × …`;
    } else if (ev.tipo === "carta-debuffada") {
      pulsar(porId[ev.carta.id], "×", "mult");
    } else if (ev.tipo === "efeito") {
      const partes = [];
      if (ev.chips) partes.push(`+${ev.chips} chips`);
      if (ev.mult) partes.push(`+${ev.mult} mult`);
      if (ev.xmult) partes.push(`×${ev.xmult} mult`);
      if (ev.dinheiro) partes.push(`+$${ev.dinheiro}`);
      placar.innerHTML =
        `${ev.origem}: ${partes.join(", ")} → <span class="chips">${ev.chipsTotal}</span> × <span class="mult">${ev.multTotal}</span>`;
    } else if (ev.tipo === "total") {
      placar.innerHTML = `<span class="dourado dinheiro">${ev.total.toLocaleString("pt-BR")} pontos!</span>`;
    } else if (ev.tipo === "coringa-destruido") {
      placar.innerHTML = `${ev.nome} se destruiu!`;
    }
    await espera(ev.tipo === "total" ? 900 : 380);
  }
}

function pulsar(elemento, texto, classe) {
  if (!elemento) return;
  elemento.classList.add("pontuando");
  const popup = el("span", { classe: `popup-chips ${classe}` }, texto);
  elemento.append(popup);
  setTimeout(() => {
    elemento.classList.remove("pontuando");
    popup.remove();
  }, 600);
}
