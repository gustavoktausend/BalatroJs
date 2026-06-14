// Baralhos: escolhidos no início da run, modificam recursos iniciais (passivos).
// Não tocam nas cartas (sem baralho persistente). Padrão = neutro.
const LISTA = [
  { id: "padrao",   nome: "Baralho Padrão",   descricao: "Sem modificadores.",        dinheiroInicial: 0,  maosBonus: 0, descartesBonus: 0 },
  { id: "vermelho", nome: "Baralho Vermelho", descricao: "+1 descarte por rodada.",   dinheiroInicial: 0,  maosBonus: 0, descartesBonus: 1 },
  { id: "azul",     nome: "Baralho Azul",     descricao: "+1 mão por rodada.",        dinheiroInicial: 0,  maosBonus: 1, descartesBonus: 0 },
  { id: "amarelo",  nome: "Baralho Amarelo",  descricao: "Começa com +$10.",          dinheiroInicial: 10, maosBonus: 0, descartesBonus: 0 },
];

export const BARALHOS = Object.fromEntries(LISTA.map((b) => [b.id, b]));
