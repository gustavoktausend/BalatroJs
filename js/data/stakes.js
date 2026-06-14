// Stakes: nível de dificuldade da run (passivo). multAlvo escala os alvos das blinds;
// dinheiroInicial ajusta o dinheiro de partida. Branco = base.
const LISTA = [
  { id: "branco",   nome: "Stake Branco",   descricao: "Dificuldade normal.",                   multAlvo: 1,    dinheiroInicial: 0 },
  { id: "vermelho", nome: "Stake Vermelho", descricao: "Alvos das blinds +25%.",                multAlvo: 1.25, dinheiroInicial: 0 },
  { id: "dourado",  nome: "Stake Dourado",  descricao: "Alvos +25% e começa com $1 a menos.",   multAlvo: 1.25, dinheiroInicial: -1 },
];

export const STAKES = Object.fromEntries(LISTA.map((s) => [s.id, s]));
