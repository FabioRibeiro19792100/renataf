export const volumePerformance = [
  { metric: 'Atendimentos/dia (dia quente)', value: 23, unit: 'atend/dia' },
  { metric: 'Atendimentos/dia (dia frio)', value: 14, unit: 'atend/dia' },
  { metric: 'Dias quentes/mês', value: 8, unit: 'dias' },
  { metric: 'Dias frios/mês', value: 22, unit: 'dias' },
  { metric: 'Atendimentos mensais médios', value: 492, unit: 'atend/mês' },
  { metric: 'Taxa de no-show', value: 0.104, unit: '%' },
  { metric: 'Clientes recorrentes', value: 0.224, unit: '%' },
  { metric: 'Clientes ativos (2025)', value: 1137, unit: 'clientes' },
  { metric: 'Novos clientes/mês', value: 53, unit: 'clientes/mês' },
  { metric: 'Média de visitas/mês', value: 338, unit: 'visitas' },
  { metric: 'Ticket médio anual', value: 480, unit: 'R$' },
  { metric: 'Pacotes ativos', value: 1128, unit: 'pacotes' },
]

export const teamCommissions = [
  { item: 'Número de terapeutas', value: 10, note: 'funcionários' },
  { item: 'Comissão %', value: 0.15, note: 'sobre valor recebido' },
  { item: 'Salário fixo', value: 1900, note: 'R$/mês' },
  { item: 'Tipo de vínculo', value: 'CLT', note: '-' },
]

export const costPerSession = [
  { item: 'Produtos (óleo/creme)', value: 69.73 },
  { item: 'Descartáveis', value: 5 },
  { item: 'Taxa de cartão', value: 0.05 },
]

export const laundryCosts = [
  { item: 'Lençol com elástico', qty: 1, unitCost: 2.45, subtotal: 2.45 },
  { item: 'Lençol sem elástico', qty: 1, unitCost: 2.45, subtotal: 2.45 },
  { item: 'Fronha', qty: 1, unitCost: 1.03, subtotal: 1.03 },
  { item: 'Toalhas', qty: 3, unitCost: 1.03, subtotal: 3.09 },
]

export const otherProducts = [
  { item: 'Creme (7 massagens/1kg)', qty: 1, unitCost: 35.71, subtotal: 35.71 },
  { item: 'Odorizante (250ml/15 atend)', qty: 1, unitCost: 12, subtotal: 12 },
  { item: 'Descartáveis', qty: 1, unitCost: 13, subtotal: 13 },
]

export const sessionCostTotal = 69.73
