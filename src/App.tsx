import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import './styles.css'
import { baseInputs, Inputs, services } from './variables'
import { calculate, formatCurrency, formatNumber } from './calc'
import Tables from './Tables'

const parseNumber = (value: string) => {
  const normalized = value.replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const cloneInputs = () => JSON.parse(JSON.stringify(baseInputs)) as Inputs
const getIncrementStep = (value: number) => (Math.abs(value) >= 100 ? 10 : 1)

export default function App() {
  const [view, setView] = useState<'dashboard' | 'tables'>('dashboard')
  const [inputs, setInputs] = useState<Inputs>(cloneInputs)
  const [serviceTicketDraft, setServiceTicketDraft] = useState<Record<string, string>>({})
  const [serviceMixDraft, setServiceMixDraft] = useState<Record<string, string>>({})
  const [showMobileSummary, setShowMobileSummary] = useState(false)
  const [resultPeriod, setResultPeriod] = useState<'monthly' | 'annual'>('monthly')

  useEffect(() => {
    if (window.innerWidth <= 720) {
      document
        .querySelectorAll('details.card-accordion')
        .forEach((detail) => {
          const kind = detail.getAttribute('data-accordion')
          if (kind === 'revenue' || kind === 'expenses') {
            detail.removeAttribute('open')
          }
        })
    }
  }, [])

  useEffect(() => {
    const updateSummary = () => {
      if (window.innerWidth > 720) {
        setShowMobileSummary(false)
        return
      }
      setShowMobileSummary(window.scrollY > 120)
    }
    updateSummary()
    window.addEventListener('scroll', updateSummary, { passive: true })
    window.addEventListener('resize', updateSummary)
    return () => {
      window.removeEventListener('scroll', updateSummary)
      window.removeEventListener('resize', updateSummary)
    }
  }, [])

  const results = useMemo(() => calculate(inputs), [inputs])

  const updateField = (key: keyof Inputs) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = parseNumber(event.target.value)
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  const updateAdminStaff = (role: keyof Inputs['adminStaff'], key: 'qty' | 'salary') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = parseNumber(event.target.value)
      setInputs((prev) => ({
        ...prev,
        adminStaff: {
          ...prev.adminStaff,
          [role]: { ...prev.adminStaff[role], [key]: value },
        },
      }))
    }

  const updateFixedExpenses = (key: keyof Inputs['fixedExpenses']) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = parseNumber(event.target.value)
      setInputs((prev) => ({
        ...prev,
        fixedExpenses: { ...prev.fixedExpenses, [key]: value },
      }))
    }

  const commitServiceMix = (id: string, rawValue: string) => {
    const trimmed = rawValue.trim()
    if (!trimmed) {
      return
    }
    const value = Math.max(Math.round(parseNumber(trimmed)), 0)
    setInputs((prev) => {
      const othersSum = Object.entries(prev.serviceMix).reduce((acc, [key, val]) => {
        return key === id ? acc : acc + val
      }, 0)
      const maxAllowed = Math.max(0, 100 - othersSum)
      const clamped = Math.min(value, maxAllowed)
      return {
        ...prev,
        serviceMix: { ...prev.serviceMix, [id]: clamped },
      }
    })
  }

  const commitServiceTicket = (id: string, rawValue: string) => {
    const trimmed = rawValue.trim()
    if (!trimmed) {
      setInputs((prev) => {
        const next = { ...prev.serviceTicketOverride }
        delete next[id]
        return { ...prev, serviceTicketOverride: next }
      })
      return
    }
    const value = Math.max(parseNumber(trimmed), 0)
    setInputs((prev) => ({
      ...prev,
      serviceTicketOverride: { ...prev.serviceTicketOverride, [id]: value },
    }))
  }

  const getDefaultServiceTicket = (id: string, sourceInputs: Inputs) => {
    const service = services.find((item) => item.id === id)
    if (!service) {
      return 0
    }
    const { full, p5, p10, p20 } = sourceInputs.packageMix
    return (
      service.prices.full * (full / 100) +
      service.prices.p5 * (p5 / 100) +
      service.prices.p10 * (p10 / 100) +
      service.prices.p20 * (p20 / 100)
    )
  }

  const adjustServiceTicket = (id: string, direction: -1 | 1) => {
    setServiceTicketDraft((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setInputs((prev) => {
      const current = prev.serviceTicketOverride[id] ?? getDefaultServiceTicket(id, prev)
      const step = getIncrementStep(current)
      const nextValue = Math.max(current + step * direction, 0)
      return {
        ...prev,
        serviceTicketOverride: { ...prev.serviceTicketOverride, [id]: Number(nextValue.toFixed(2)) },
      }
    })
  }

  const adjustServiceMix = (id: string, direction: -1 | 1) => {
    setServiceMixDraft((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setInputs((prev) => {
      const current = Math.round(prev.serviceMix[id] ?? 0)
      const step = getIncrementStep(current)
      const requested = Math.max(current + step * direction, 0)
      const othersSum = Object.entries(prev.serviceMix).reduce((acc, [key, val]) => {
        return key === id ? acc : acc + val
      }, 0)
      const maxAllowed = Math.max(0, 100 - othersSum)
      const clamped = Math.min(requested, maxAllowed)
      return {
        ...prev,
        serviceMix: { ...prev.serviceMix, [id]: clamped },
      }
    })
  }

  const resetInputs = () => setInputs(cloneInputs())

  return (
    <div className="page">
      <header className="topbar">
        <nav className="nav-tabs">
          <button
            className={`tab ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`tab ${view === 'tables' ? 'active' : ''}`}
            onClick={() => setView('tables')}
          >
            Tabelas
          </button>
          {view === 'dashboard' && (
            <button className="ghost" onClick={resetInputs}>Resetar variáveis</button>
          )}
        </nav>
      </header>

      {view === 'tables' ? (
        <Tables />
      ) : (
        <>
          {showMobileSummary && (
            <div className="mobile-summary mobile-summary--active">
              <div className="mobile-title">SPA • Simulador de Receita e Resultado</div>
              <div className="mobile-metrics">
                <div>
                  <span>Receita</span>
                  <strong>{formatCurrency(results.revenue * (resultPeriod === 'annual' ? 12 : 1))}</strong>
                </div>
                <div>
                  <span>Despesas</span>
                  <strong>{formatCurrency(results.totalExpenses * (resultPeriod === 'annual' ? 12 : 1))}</strong>
                </div>
                <div>
                  <span>Resultado</span>
                  <strong>{formatCurrency(results.result * (resultPeriod === 'annual' ? 12 : 1))}</strong>
                </div>
              </div>
            </div>
          )}
      <header className="hero">
        <div>
          <p className="eyebrow">Dashboard financeiro</p>
          <h1>SPA • Simulador de Receita e Resultado</h1>
        </div>
        <div />
      </header>

      <div className="section-title-row">
        <h2 className="section-title">Resultados</h2>
        <div className="period-toggle">
          <button
            className={`period-btn ${resultPeriod === 'monthly' ? 'active' : ''}`}
            onClick={() => setResultPeriod('monthly')}
          >
            Mês
          </button>
          <button
            className={`period-btn ${resultPeriod === 'annual' ? 'active' : ''}`}
            onClick={() => setResultPeriod('annual')}
          >
            Ano
          </button>
        </div>
      </div>
      <section className="cards">
        <details className="card card-accordion" data-accordion="revenue" open>
          <summary className="card-summary">
            <div>
              <p>Receita mensal</p>
              <h2>{formatCurrency(results.revenue * (resultPeriod === 'annual' ? 12 : 1))}</h2>
            </div>
          </summary>
          <div className="card-details">
            <div className="row"><span>Ticket médio</span><strong>{formatCurrency(results.avgPriceOverall)}</strong></div>
            <div className="row"><span>Sessões líquidas</span><strong>{formatNumber(results.netSessions)}</strong></div>
            <div className="row"><span>Receita anual</span><strong>{formatCurrency(results.revenue * 12)}</strong></div>
          </div>
        </details>
        <details className="card card-accordion" data-accordion="expenses" open>
          <summary className="card-summary">
            <div>
              <p>Despesas mensais</p>
              <h2>{formatCurrency(results.totalExpenses * (resultPeriod === 'annual' ? 12 : 1))}</h2>
            </div>
          </summary>
          <div className="card-details">
            <div className="row"><span>Variáveis</span><strong>{formatCurrency(results.variableCosts)}</strong></div>
            <div className="row"><span>Comissões</span><strong>{formatCurrency(results.commissions)}</strong></div>
            <div className="row"><span>Taxa de cartão</span><strong>{formatCurrency(results.cardFees)}</strong></div>
            <div className="row"><span>Folha administrativa</span><strong>{formatCurrency(results.adminCosts)}</strong></div>
            <div className="row"><span>Despesas fixas</span><strong>{formatCurrency(results.fixedExpenses)}</strong></div>
          </div>
        </details>
        <details className="card card-accordion highlight" data-accordion="result" open>
          <summary className="card-summary">
            <div>
              <p>Resultado mensal</p>
              <h2>{formatCurrency(results.result * (resultPeriod === 'annual' ? 12 : 1))}</h2>
            </div>
          </summary>
          <div className="card-details">
            <div className="row">
              <span className="disclaimer">(não inclui pró-labore, royalties, impostos e depreciação de investimento)</span>
            </div>
          </div>
        </details>
      </section>

      <h2 className="section-title">Premissas</h2>
      <section className="grid">
        <div className="column-stack">
          <div className="panel">
            <div className="panel-header">
              <h3>Volume</h3>
            </div>
            <div className="group">
              <div className="field">
                <label>Atendimentos/dia (quente)</label>
                <div className="range-row">
                  <input type="range" min={0} max={40} step={1} value={inputs.atendHot} onChange={updateField('atendHot')} />
                  <span className="range-value">{inputs.atendHot}</span>
                </div>
              </div>
              <div className="field">
                <label>Atendimentos/dia (frio)</label>
                <div className="range-row">
                  <input type="range" min={0} max={30} step={1} value={inputs.atendCold} onChange={updateField('atendCold')} />
                  <span className="range-value">{inputs.atendCold}</span>
                </div>
              </div>
              <div className="field">
                <label>Dias quentes/mês</label>
                <div className="range-row">
                  <input type="range" min={0} max={31} step={1} value={inputs.daysHot} onChange={updateField('daysHot')} />
                  <span className="range-value">{inputs.daysHot}</span>
                </div>
              </div>
              <div className="field">
                <label>Dias frios/mês</label>
                <div className="range-row">
                  <input type="range" min={0} max={31} step={1} value={inputs.daysCold} onChange={updateField('daysCold')} />
                  <span className="range-value">{inputs.daysCold}</span>
                </div>
              </div>
              <div className="field">
                <label>No-show (%)</label>
                <div className="range-row">
                  <input type="range" min={0} max={50} step={1} value={inputs.noShowRate * 100} onChange={(e) => setInputs((prev) => ({
                    ...prev,
                    noShowRate: parseNumber(e.target.value) / 100,
                  }))} />
                  <span className="range-value">{formatNumber(inputs.noShowRate * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Mix de serviços</h3>
              {Math.abs(results.serviceMixSum - 100) > 0.01 && (
                <p className="warning">A soma deve ser 100%. Ajuste manualmente.</p>
              )}
            </div>
            <div className="mix-table mix-desktop">
              <div className="mix-head">
                <span>Serviço</span>
                <span>Ticket (R$)</span>
                <span>Mix (%)</span>
              </div>
              {services.map((service) => (
                <div className="mix-row" key={service.id}>
                  <span>{service.name} {service.duration}</span>
                  <div className="mix-field">
                    <span className="mix-label">Ticket (R$)</span>
                    <div className="mix-input-stepper">
                      <button
                        type="button"
                        className="stepper-btn"
                        aria-label={`Diminuir ticket de ${service.name} ${service.duration}`}
                        onClick={() => adjustServiceTicket(service.id, -1)}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*[.,]?[0-9]*"
                        step="0.01"
                        min="0"
                        value={
                          serviceTicketDraft[service.id] ??
                          (inputs.serviceTicketOverride[service.id] ??
                            results.avgPriceByService.find((item) => item.id === service.id)?.avgPrice ??
                            0).toFixed(2)
                        }
                        onChange={(e) =>
                          setServiceTicketDraft((prev) => ({ ...prev, [service.id]: e.target.value }))
                        }
                        onBlur={(e) => {
                          commitServiceTicket(service.id, e.target.value)
                          setServiceTicketDraft((prev) => {
                            const next = { ...prev }
                            delete next[service.id]
                            return next
                          })
                        }}
                      />
                      <button
                        type="button"
                        className="stepper-btn"
                        aria-label={`Aumentar ticket de ${service.name} ${service.duration}`}
                        onClick={() => adjustServiceTicket(service.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="mix-field">
                    <span className="mix-label">Mix (%)</span>
                    <div className="mix-input-stepper">
                      <button
                        type="button"
                        className="stepper-btn"
                        aria-label={`Diminuir mix de ${service.name} ${service.duration}`}
                        onClick={() => adjustServiceMix(service.id, -1)}
                      >
                        -
                      </button>
                      <input
                        className="mix-percent"
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        step="1"
                        min="0"
                        max="100"
                        value={
                          serviceMixDraft[service.id] ??
                          String(Math.round(inputs.serviceMix[service.id] ?? 0))
                        }
                        onFocus={(e) =>
                          setServiceMixDraft((prev) => ({ ...prev, [service.id]: e.target.value }))
                        }
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^\d]/g, '')
                          setServiceMixDraft((prev) => ({ ...prev, [service.id]: cleaned }))
                        }}
                        onBlur={(e) => {
                          commitServiceMix(service.id, e.target.value)
                          setServiceMixDraft((prev) => {
                            const next = { ...prev }
                            delete next[service.id]
                            return next
                          })
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            commitServiceMix(service.id, (e.target as HTMLInputElement).value)
                            setServiceMixDraft((prev) => {
                              const next = { ...prev }
                              delete next[service.id]
                              return next
                            })
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="stepper-btn"
                        aria-label={`Aumentar mix de ${service.name} ${service.duration}`}
                        onClick={() => adjustServiceMix(service.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mix-total">
                <span>Total</span>
                <span />
                <span>{Math.round(results.serviceMixSum)}%</span>
              </div>
            </div>
            <div className="mix-mobile">
              <div className="mix-card">
                <h4>Ticket (R$)</h4>
                {services.map((service) => (
                  <div className="mix-card-row" key={`${service.id}-ticket`}>
                    <span>{service.name} {service.duration}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      step="0.01"
                      min="0"
                      value={
                        serviceTicketDraft[service.id] ??
                        (inputs.serviceTicketOverride[service.id] ??
                          results.avgPriceByService.find((item) => item.id === service.id)?.avgPrice ??
                          0).toFixed(2)
                      }
                      onChange={(e) =>
                        setServiceTicketDraft((prev) => ({ ...prev, [service.id]: e.target.value }))
                      }
                      onBlur={(e) => {
                        commitServiceTicket(service.id, e.target.value)
                        setServiceTicketDraft((prev) => {
                          const next = { ...prev }
                          delete next[service.id]
                          return next
                        })
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mix-card">
                <h4>Mix (%)</h4>
                {services.map((service) => (
                  <div className="mix-card-row" key={`${service.id}-mix`}>
                    <span>{service.name} {service.duration}</span>
                    <input
                      className="mix-percent"
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      step="1"
                      min="0"
                      max="100"
                      value={
                        serviceMixDraft[service.id] ??
                        String(Math.round(inputs.serviceMix[service.id] ?? 0))
                      }
                      onFocus={(e) =>
                        setServiceMixDraft((prev) => ({ ...prev, [service.id]: e.target.value }))
                      }
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^\d]/g, '')
                        setServiceMixDraft((prev) => ({ ...prev, [service.id]: cleaned }))
                      }}
                      onBlur={(e) => {
                        commitServiceMix(service.id, e.target.value)
                        setServiceMixDraft((prev) => {
                          const next = { ...prev }
                          delete next[service.id]
                          return next
                        })
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          commitServiceMix(service.id, (e.target as HTMLInputElement).value)
                          setServiceMixDraft((prev) => {
                            const next = { ...prev }
                            delete next[service.id]
                            return next
                          })
                        }
                      }}
                    />
                  </div>
                ))}
                <div className="mix-total">
                  <span>Total</span>
                  <span>{Math.round(results.serviceMixSum)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Folha administrativa</h3>
          </div>
          <div className="group">
            <div className="field">
              <label>Terapeutas (qtd)</label>
              <div className="range-row">
                <input type="range" min={0} max={30} step={1} value={inputs.adminStaff.terapeutas.qty} onChange={updateAdminStaff('terapeutas', 'qty')} />
                <span className="range-value">{inputs.adminStaff.terapeutas.qty}</span>
              </div>
              <label>Salário terapeuta</label>
              <div className="range-row">
                <input type="range" min={0} max={5000} step={50} value={inputs.adminStaff.terapeutas.salary} onChange={updateAdminStaff('terapeutas', 'salary')} />
                <span className="range-value">{formatCurrency(inputs.adminStaff.terapeutas.salary)}</span>
              </div>
            </div>
            <div className="field">
              <label>Manobristas (qtd)</label>
              <div className="range-row">
                <input type="range" min={0} max={10} step={1} value={inputs.adminStaff.manobristas.qty} onChange={updateAdminStaff('manobristas', 'qty')} />
                <span className="range-value">{inputs.adminStaff.manobristas.qty}</span>
              </div>
              <label>Salário manobrista</label>
              <div className="range-row">
                <input type="range" min={0} max={15000} step={100} value={inputs.adminStaff.manobristas.salary} onChange={updateAdminStaff('manobristas', 'salary')} />
                <span className="range-value">{formatCurrency(inputs.adminStaff.manobristas.salary)}</span>
              </div>
            </div>
            <div className="field">
              <label>Recepcionistas (qtd)</label>
              <div className="range-row">
                <input type="range" min={0} max={10} step={1} value={inputs.adminStaff.recepcionistas.qty} onChange={updateAdminStaff('recepcionistas', 'qty')} />
                <span className="range-value">{inputs.adminStaff.recepcionistas.qty}</span>
              </div>
              <label>Salário recepcionista</label>
              <div className="range-row">
                <input type="range" min={0} max={15000} step={100} value={inputs.adminStaff.recepcionistas.salary} onChange={updateAdminStaff('recepcionistas', 'salary')} />
                <span className="range-value">{formatCurrency(inputs.adminStaff.recepcionistas.salary)}</span>
              </div>
            </div>
            <div className="field">
              <label>Copeiras (qtd)</label>
              <div className="range-row">
                <input type="range" min={0} max={10} step={1} value={inputs.adminStaff.copeiras.qty} onChange={updateAdminStaff('copeiras', 'qty')} />
                <span className="range-value">{inputs.adminStaff.copeiras.qty}</span>
              </div>
              <label>Salário copeira</label>
              <div className="range-row">
                <input type="range" min={0} max={15000} step={100} value={inputs.adminStaff.copeiras.salary} onChange={updateAdminStaff('copeiras', 'salary')} />
                <span className="range-value">{formatCurrency(inputs.adminStaff.copeiras.salary)}</span>
              </div>
            </div>
            <div className="field">
              <label>Gerente (qtd)</label>
              <div className="range-row">
                <input type="range" min={0} max={5} step={1} value={inputs.adminStaff.gerente.qty} onChange={updateAdminStaff('gerente', 'qty')} />
                <span className="range-value">{inputs.adminStaff.gerente.qty}</span>
              </div>
              <label>Salário gerente</label>
              <div className="range-row">
                <input type="range" min={0} max={20000} step={500} value={inputs.adminStaff.gerente.salary} onChange={updateAdminStaff('gerente', 'salary')} />
                <span className="range-value">{formatCurrency(inputs.adminStaff.gerente.salary)}</span>
              </div>
            </div>
          </div>
          <p className="note">Nota: salários multiplicados por 1,8 para encargos.</p>
        </div>

        <div className="column-stack">
          <div className="panel">
            <div className="panel-header">
              <h3>Despesas fixas</h3>
            </div>
            <div className="group">
              <div className="field">
                <label>Aluguel / IPTU</label>
                <div className="range-row">
                  <input type="range" min={0} max={50000} step={500} value={inputs.fixedExpenses.rent} onChange={updateFixedExpenses('rent')} />
                  <span className="range-value">{formatCurrency(inputs.fixedExpenses.rent)}</span>
                </div>
              </div>
              <div className="field">
                <label>Produtos de atendimento (óleo e creme)</label>
                <div className="range-row">
                  <input type="range" min={0} max={15000} step={100} value={inputs.fixedExpenses.serviceProducts} onChange={updateFixedExpenses('serviceProducts')} />
                  <span className="range-value">{formatCurrency(inputs.fixedExpenses.serviceProducts)}</span>
                </div>
              </div>
              <div className="field">
                <label>Água</label>
                <div className="range-row">
                  <input type="range" min={0} max={3000} step={50} value={inputs.fixedExpenses.water} onChange={updateFixedExpenses('water')} />
                  <span className="range-value">{formatCurrency(inputs.fixedExpenses.water)}</span>
                </div>
              </div>
              <div className="field">
                <label>Luz</label>
                <div className="range-row">
                  <input type="range" min={0} max={3000} step={50} value={inputs.fixedExpenses.electricity} onChange={updateFixedExpenses('electricity')} />
                  <span className="range-value">{formatCurrency(inputs.fixedExpenses.electricity)}</span>
                </div>
              </div>
              <div className="field">
                <label>Lavanderia</label>
                <div className="range-row">
                  <input type="range" min={0} max={10000} step={100} value={inputs.fixedExpenses.laundry} onChange={updateFixedExpenses('laundry')} />
                  <span className="range-value">{formatCurrency(inputs.fixedExpenses.laundry)}</span>
                </div>
              </div>
              <div className="field">
                <label>Internet</label>
                <div className="range-row">
                  <input type="range" min={0} max={3000} step={50} value={inputs.fixedExpenses.internet} onChange={updateFixedExpenses('internet')} />
                  <span className="range-value">{formatCurrency(inputs.fixedExpenses.internet)}</span>
                </div>
              </div>
              <div className="field">
                <label>Ar condicionado</label>
                <div className="range-row">
                  <input type="range" min={0} max={3000} step={50} value={inputs.fixedExpenses.airConditioning} onChange={updateFixedExpenses('airConditioning')} />
                  <span className="range-value">{formatCurrency(inputs.fixedExpenses.airConditioning)}</span>
                </div>
              </div>
              <div className="field">
                <label>Software de agendamento</label>
                <div className="range-row">
                  <input type="range" min={0} max={5000} step={50} value={inputs.fixedExpenses.schedulingSoftware} onChange={updateFixedExpenses('schedulingSoftware')} />
                  <span className="range-value">{formatCurrency(inputs.fixedExpenses.schedulingSoftware)}</span>
                </div>
              </div>
              <div className="field">
                <label>Contabilidade</label>
                <div className="range-row">
                  <input type="range" min={0} max={5000} step={50} value={inputs.fixedExpenses.accounting} onChange={updateFixedExpenses('accounting')} />
                  <span className="range-value">{formatCurrency(inputs.fixedExpenses.accounting)}</span>
                </div>
              </div>
              <div className="field">
                <label>Produtos de limpeza / descartáveis</label>
                <div className="range-row">
                  <input type="range" min={0} max={5000} step={50} value={inputs.fixedExpenses.cleaningSupplies} onChange={updateFixedExpenses('cleaningSupplies')} />
                  <span className="range-value">{formatCurrency(inputs.fixedExpenses.cleaningSupplies)}</span>
                </div>
              </div>
              <div className="field">
                <label>Estacionamento</label>
                <div className="range-row">
                  <input type="range" min={0} max={5000} step={50} value={inputs.fixedExpenses.parking} onChange={updateFixedExpenses('parking')} />
                  <span className="range-value">{formatCurrency(inputs.fixedExpenses.parking)}</span>
                </div>
              </div>
              <div className="field">
                <label>Seguro carro clientes + alarme spa</label>
                <div className="range-row">
                  <input type="range" min={0} max={5000} step={50} value={inputs.fixedExpenses.insuranceAndAlarm} onChange={updateFixedExpenses('insuranceAndAlarm')} />
                  <span className="range-value">{formatCurrency(inputs.fixedExpenses.insuranceAndAlarm)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Outras variáveis</h3>
            </div>
            <div className="group">
              <div className="field">
                <label>Custo variável por sessão</label>
                <div className="range-row">
                  <input type="range" min={0} max={200} step={1} value={inputs.variableCostPerSession} onChange={updateField('variableCostPerSession')} />
                  <span className="range-value">{formatCurrency(inputs.variableCostPerSession)}</span>
                </div>
              </div>
              <div className="field">
                <label>Extra variável por sessão</label>
                <div className="range-row">
                  <input type="range" min={0} max={200} step={1} value={inputs.extraVariablePerSession} onChange={updateField('extraVariablePerSession')} />
                  <span className="range-value">{formatCurrency(inputs.extraVariablePerSession)}</span>
                </div>
              </div>
              <div className="field">
                <label>Comissão (%)</label>
                <div className="range-row">
                  <input type="range" min={0} max={50} step={1} value={inputs.commissionRate * 100} onChange={(e) => setInputs((prev) => ({
                    ...prev,
                    commissionRate: parseNumber(e.target.value) / 100,
                  }))} />
                  <span className="range-value">{formatNumber(inputs.commissionRate * 100)}%</span>
                </div>
              </div>
              <div className="field">
                <label>Taxa de cartão (%)</label>
                <div className="range-row">
                  <input type="range" min={0} max={20} step={1} value={inputs.cardFeeRate * 100} onChange={(e) => setInputs((prev) => ({
                    ...prev,
                    cardFeeRate: parseNumber(e.target.value) / 100,
                  }))} />
                  <span className="range-value">{formatNumber(inputs.cardFeeRate * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
        </>
      )}
    </div>
  )
}
