const tooltip = document.getElementById("tooltip");

export function ligarTooltip(elemento, html) {
  elemento.addEventListener("mouseenter", () => {
    tooltip.innerHTML = html;
    tooltip.hidden = false;
    const caixa = elemento.getBoundingClientRect();
    tooltip.style.left = `${caixa.left + caixa.width / 2}px`;
    tooltip.style.top = `${Math.min(caixa.bottom + 8, window.innerHeight - 90)}px`;
  });
  elemento.addEventListener("mouseleave", () => { tooltip.hidden = true; });
}
