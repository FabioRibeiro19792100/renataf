export type PackageMix = {
  full: number
  p5: number
  p10: number
  p20: number
}

export type Service = {
  id: string
  name: string
  duration: string
  prices: {
    full: number
    p5: number
    p10: number
    p20: number
  }
}

export const services: Service[] = [
  {
    id: 'miracle-corporal-50',
    name: 'Miracle Corporal',
    duration: "50'",
    prices: { full: 520, p5: 468, p10: 416, p20: 390 },
  },
  {
    id: 'miracle-corporal-80',
    name: 'Miracle Corporal',
    duration: "80'",
    prices: { full: 720, p5: 648, p10: 576, p20: 540 },
  },
  {
    id: 'miracle-face-30',
    name: 'Miracle Face',
    duration: "30'",
    prices: { full: 320, p5: 288, p10: 256, p20: 240 },
  },
  {
    id: 'relaxante-60',
    name: 'Relaxante',
    duration: "60'",
    prices: { full: 520, p5: 468, p10: 416, p20: 390 },
  },
  {
    id: 'relaxante-80',
    name: 'Relaxante',
    duration: "80'",
    prices: { full: 720, p5: 648, p10: 576, p20: 540 },
  },
  {
    id: 'drenagem-50',
    name: 'Drenagem',
    duration: "50'",
    prices: { full: 520, p5: 468, p10: 416, p20: 390 },
  },
  {
    id: 'ayurvedica-80',
    name: 'Ayurvédica',
    duration: "80'",
    prices: { full: 720, p5: 648, p10: 576, p20: 540 },
  },
]

const buildEvenServiceMix = () => {
  const base = Math.floor((100 / services.length) * 10) / 10
  const mix: Record<string, number> = {}
  let remaining = 100
  services.forEach((service, index) => {
    const value = index === services.length - 1 ? Number(remaining.toFixed(1)) : base
    mix[service.id] = value
    remaining -= value
  })
  return mix
}

export const baseInputs = {
  daysHot: 8,
  daysCold: 22,
  atendHot: 23,
  atendCold: 14,
  noShowRate: 0.104,
  packageMix: {
    full: 40,
    p5: 30,
    p10: 20,
    p20: 10,
  } satisfies PackageMix,
  serviceTicketOverride: {} as Record<string, number>,
  serviceMix: buildEvenServiceMix(),
  variableCostPerSession: 69.73,
  extraVariablePerSession: 0,
  commissionRate: 0.15,
  cardFeeRate: 0.05,
  adminStaff: {
    terapeutas: { qty: 10, salary: 1900 },
    manobristas: { qty: 3, salary: 2100 },
    recepcionistas: { qty: 3, salary: 3100 },
    copeiras: { qty: 2, salary: 2900 },
    gerente: { qty: 1, salary: 10000 },
  },
  fixedExpenses: {
    rent: 20000,
    electricity: 0,
    water: 0,
    internet: 0,
    other: 0,
  },
}

export type Inputs = typeof baseInputs
