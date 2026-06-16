// Definições dos aprimoramentos de carta (Balatro). Metadados puros: os EFEITOS
// vivem em scoring.js/poker.js; aqui ficam só id, nome e descrição (PT-BR).
// Uma carta tem no máximo um aprimoramento (campo `aprimoramento`, null = nenhum).
const LISTA = [
  { id: "bonus", nome: "Bônus",   descricao: "+30 fichas quando pontua." },
  { id: "mult",  nome: "Mult",    descricao: "+4 mult quando pontua." },
  { id: "wild",  nome: "Selvagem", descricao: "Conta como qualquer naipe." },
  { id: "vidro", nome: "Vidro",   descricao: "×2 mult; 1 em 4 de se destruir ao pontuar." },
  { id: "aco",   nome: "Aço",     descricao: "×1,5 mult enquanto estiver na mão." },
  { id: "ouro",  nome: "Ouro",    descricao: "+$3 se ficar na mão no fim da rodada." },
  { id: "pedra", nome: "Pedra",   descricao: "+50 fichas; sempre pontua; sem naipe ou valor." },
  { id: "sorte", nome: "Sorte",   descricao: "1 em 5 de +20 mult; 1 em 15 de +$20 ao pontuar." },
];

export const APRIMORAMENTOS = Object.fromEntries(LISTA.map((a) => [a.id, a]));
export const IDS_APRIMORAMENTO = LISTA.map((a) => a.id);
