import { Inputs, services } from './variables'

type MixResult = {
  normalized: Record<string, number>
  sum: number
  isValid: boolean
}

const normalizeMix = (mix: Record<string, number>): MixResult => {
  const sum = Object.values(mix).reduce((acc, v) => acc + v, 0)
  const normalized: Record<string, number> = {}
  for (const [key, value] of Object.entries(mix)) {
    normalized[key] = value / 100
  }
  return { normalized, sum, isValid: Math.abs(sum - 100) < 0.001 }
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(value)

export const formatPercent = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)

export const calculate = (inputs: Inputs) => {
  const packageMix = normalizeMix({
    full: inputs.packageMix.full,
    p5: inputs.packageMix.p5,
    p10: inputs.packageMix.p10,
    p20: inputs.packageMix.p20,
  })

  const serviceMix = normalizeMix(inputs.serviceMix)

  const grossSessions = inputs.atendHot * inputs.daysHot + inputs.atendCold * inputs.daysCold
  const netSessions = grossSessions * (1 - inputs.noShowRate)

  const avgPriceByService = services.map((service) => {
    const prices = service.prices
    const avgPrice =
      prices.full * packageMix.normalized.full +
      prices.p5 * packageMix.normalized.p5 +
      prices.p10 * packageMix.normalized.p10 +
      prices.p20 * packageMix.normalized.p20
    const override = inputs.serviceTicketOverride[service.id]
    return { id: service.id, avgPrice: override ?? avgPrice, isOverride: override != null }
  })

  const avgPriceByPackage = {
    full: services.reduce((acc, service) => {
      const weight = serviceMix.normalized[service.id] ?? 0
      return acc + service.prices.full * weight
    }, 0),
    p5: services.reduce((acc, service) => {
      const weight = serviceMix.normalized[service.id] ?? 0
      return acc + service.prices.p5 * weight
    }, 0),
    p10: services.reduce((acc, service) => {
      const weight = serviceMix.normalized[service.id] ?? 0
      return acc + service.prices.p10 * weight
    }, 0),
    p20: services.reduce((acc, service) => {
      const weight = serviceMix.normalized[service.id] ?? 0
      return acc + service.prices.p20 * weight
    }, 0),
  }

  const avgPriceOverall = avgPriceByService.reduce((acc, item) => {
    const weight = serviceMix.normalized[item.id] ?? 0
    return acc + item.avgPrice * weight
  }, 0)

  const revenue = netSessions * avgPriceOverall

  const variableCostPerSession = inputs.variableCostPerSession + inputs.extraVariablePerSession
  const variableCosts = netSessions * variableCostPerSession

  const cardFees = revenue * inputs.cardFeeRate
  const commissions = revenue * inputs.commissionRate

  const fixedCosts = inputs.therapists * inputs.fixedSalary + inputs.otherFixedCosts

  const totalExpenses = variableCosts + cardFees + commissions + fixedCosts
  const result = revenue - totalExpenses

  return {
    packageMixSum: packageMix.sum,
    serviceMixSum: serviceMix.sum,
    mixIsValid: packageMix.isValid && serviceMix.isValid,
    grossSessions,
    netSessions,
    avgPriceByService,
    avgPriceByPackage,
    avgPriceOverall,
    revenue,
    variableCosts,
    cardFees,
    commissions,
    fixedCosts,
    totalExpenses,
    result,
  }
}
