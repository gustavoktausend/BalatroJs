// Harness mínimo: funciona no navegador (tests/index.html) e no Node (node tests/todos.js).
const ehNavegador = typeof document !== "undefined";

// Shim de localStorage para os testes de save rodarem no Node.
if (!ehNavegador && typeof globalThis.localStorage === "undefined") {
  const dados = new Map();
  globalThis.localStorage = {
    getItem: (chave) => (dados.has(chave) ? dados.get(chave) : null),
    setItem: (chave, valor) => dados.set(chave, String(valor)),
    removeItem: (chave) => dados.delete(chave),
    clear: () => dados.clear(),
  };
}

let total = 0;
let falhas = 0;

function registrar(texto, classe) {
  if (ehNavegador) {
    const linha = document.createElement("div");
    linha.className = classe;
    linha.textContent = texto;
    document.getElementById("resultados").append(linha);
  } else {
    console.log(texto);
  }
}

export function teste(nome, fn) {
  total += 1;
  try {
    fn();
    registrar(`✔ ${nome}`, "ok");
  } catch (erro) {
    falhas += 1;
    registrar(`✘ ${nome} — ${erro?.message ?? String(erro)}`, "falha");
  }
}

export function ok(condicao, mensagem = "condição falsa") {
  if (!condicao) throw new Error(mensagem);
}

export function igual(obtido, esperado, mensagem = "") {
  const a = JSON.stringify(obtido);
  const b = JSON.stringify(esperado);
  if (a !== b) throw new Error(`${mensagem} esperado ${b}, obtido ${a}`.trim());
}

export function resumo() {
  registrar(`${total} teste(s), ${falhas} falha(s)`, falhas ? "falha" : "ok");
  if (!ehNavegador && falhas > 0) process.exit(1);
}
