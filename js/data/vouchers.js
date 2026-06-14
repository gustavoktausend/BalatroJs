// Vouchers: upgrades permanentes comprados na loja ($10, únicos na run).
// Passivos: cada efeito é uma consulta state.vouchers.includes(id) no ponto certo
// (re-roll, juros, preço de item, mãos por rodada). Sem estado interno.
export const PRECO_VOUCHER = 10;

const LISTA = [
  { id: "bussola", nome: "Bússola", descricao: "Re-rolagem da loja começa em $3 (em vez de $5)." },
  { id: "juros-mais", nome: "Juros+", descricao: "Teto de juros sobe de $5 para $10." },
  { id: "liquidacao", nome: "Liquidação", descricao: "Itens da loja custam $1 a menos (mín. $1)." },
  { id: "maos-mais", nome: "Mãos+", descricao: "+1 mão por rodada." },
];

export const VOUCHERS = Object.fromEntries(LISTA.map((v) => [v.id, v]));
