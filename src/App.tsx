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
        .forEach((detail) => detail.removeAttribute('open'))
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

  const commitServiceMix = (id: string, rawValue: string) => {
    const trimmed = rawValue.trim()
    if (!trimmed) {
      return
    }
    const value = Math.max(parseNumber(trimmed), 0)
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
        </nav>
        {view === 'dashboard' && (
          <button className="ghost" onClick={resetInputs}>Resetar variáveis</button>
        )}
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
                  <strong>{formatCurrency(results.revenue)}</strong>
                </div>
                <div>
                  <span>Despesas</span>
                  <strong>{formatCurrency(results.totalExpenses)}</strong>
                </div>
                <div>
                  <span>Resultado</span>
                  <strong>{formatCurrency(results.result)}</strong>
                </div>
              </div>
            </div>
          )}
      <header className="hero">
        <div>
          <p className="eyebrow">Dashboard financeiro</p>
          <h1>SPA • Simulador de Receita e Resultado</h1>
          <p className="sub">
            Ajuste as variáveis e veja o impacto mensal e anual nas receitas, despesas e resultado.
          </p>
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
        <details className="card card-accordion">
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
        <details className="card card-accordion">
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
            <div className="row"><span>Fixos</span><strong>{formatCurrency(results.fixedCosts)}</strong></div>
            <div className="row"><span>Admin + aluguel</span><strong>{formatCurrency(results.adminCosts)}</strong></div>
          </div>
        </details>
        <details className="card card-accordion highlight">
          <summary className="card-summary">
            <div>
              <p>Resultado mensal</p>
              <h2>{formatCurrency(results.result * (resultPeriod === 'annual' ? 12 : 1))}</h2>
            </div>
          </summary>
          <div className="card-details">
            <div className="row"><span>Resultado anual</span><strong>{formatCurrency(results.result * 12)}</strong></div>
          </div>
        </details>
      </section>

      <h2 className="section-title">Premissas</h2>
      <section className="grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Volume</h3>
            <p>Premissas de atendimentos.</p>
          </div>

          <div className="group">
            <div className="field">
              <label>Atendimentos/dia (quente)</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*[.,]?[0-9]*" value={inputs.atendHot} onChange={updateField('atendHot')} />
            </div>
            <div className="field">
              <label>Atendimentos/dia (frio)</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*[.,]?[0-9]*" value={inputs.atendCold} onChange={updateField('atendCold')} />
            </div>
            <div className="field">
              <label>Dias quentes/mês</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*[.,]?[0-9]*" value={inputs.daysHot} onChange={updateField('daysHot')} />
            </div>
            <div className="field">
              <label>Dias frios/mês</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*[.,]?[0-9]*" value={inputs.daysCold} onChange={updateField('daysCold')} />
            </div>
            <div className="field">
              <label>No-show (%)</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*[.,]?[0-9]*" value={inputs.noShowRate * 100} onChange={(e) => setInputs((prev) => ({
                ...prev,
                noShowRate: parseNumber(e.target.value) / 100,
              }))} />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Despesas a confirmar</h3>
            <p>Aluguel e folha administrativa.</p>
          </div>
          <div className="group">
            <div className="field">
              <label>Aluguel mensal</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*[.,]?[0-9]*"
                value={inputs.adminRent}
                onChange={updateField('adminRent')}
              />
            </div>
          </div>
          <div className="group">
            <h4>Folha administrativa</h4>
            <div className="field">
              <label>Manobristas (qtd)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*[.,]?[0-9]*"
                value={inputs.adminStaff.manobristas.qty}
                onChange={updateAdminStaff('manobristas', 'qty')}
              />
              <label>Salário manobrista</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*[.,]?[0-9]*"
                value={inputs.adminStaff.manobristas.salary}
                onChange={updateAdminStaff('manobristas', 'salary')}
              />
            </div>
            <div className="field">
              <label>Recepcionistas (qtd)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*[.,]?[0-9]*"
                value={inputs.adminStaff.recepcionistas.qty}
                onChange={updateAdminStaff('recepcionistas', 'qty')}
              />
              <label>Salário recepcionista</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*[.,]?[0-9]*"
                value={inputs.adminStaff.recepcionistas.salary}
                onChange={updateAdminStaff('recepcionistas', 'salary')}
              />
            </div>
            <div className="field">
              <label>Copeiras (qtd)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*[.,]?[0-9]*"
                value={inputs.adminStaff.copeiras.qty}
                onChange={updateAdminStaff('copeiras', 'qty')}
              />
              <label>Salário copeira</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*[.,]?[0-9]*"
                value={inputs.adminStaff.copeiras.salary}
                onChange={updateAdminStaff('copeiras', 'salary')}
              />
            </div>
            <div className="field">
              <label>Gerente (qtd)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*[.,]?[0-9]*"
                value={inputs.adminStaff.gerente.qty}
                onChange={updateAdminStaff('gerente', 'qty')}
              />
              <label>Salário gerente</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*[.,]?[0-9]*"
                value={inputs.adminStaff.gerente.salary}
                onChange={updateAdminStaff('gerente', 'salary')}
              />
            </div>
          </div>
          <p className="note">Nota: salários multiplicados por 1,8 para encargos.</p>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Custos e comissões</h3>
            <p>Premissas financeiras.</p>
          </div>
          <div className="group">
            <div className="field">
              <label>Custo variável por sessão</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*[.,]?[0-9]*" value={inputs.variableCostPerSession} onChange={updateField('variableCostPerSession')} />
            </div>
            <div className="field">
              <label>Extra variável por sessão</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*[.,]?[0-9]*" value={inputs.extraVariablePerSession} onChange={updateField('extraVariablePerSession')} />
            </div>
            <div className="field">
              <label>Comissão (%)</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*[.,]?[0-9]*" value={inputs.commissionRate * 100} onChange={(e) => setInputs((prev) => ({
                ...prev,
                commissionRate: parseNumber(e.target.value) / 100,
              }))} />
            </div>
            <div className="field">
              <label>Taxa de cartão (%)</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*[.,]?[0-9]*" value={inputs.cardFeeRate * 100} onChange={(e) => setInputs((prev) => ({
                ...prev,
                cardFeeRate: parseNumber(e.target.value) / 100,
              }))} />
            </div>
          </div>

          <div className="group">
            <h4>Custos fixos</h4>
            <div className="field">
              <label>Nº de terapeutas</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*[.,]?[0-9]*" value={inputs.therapists} onChange={updateField('therapists')} />
            </div>
            <div className="field">
              <label>Salário fixo por terapeuta</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*[.,]?[0-9]*" value={inputs.fixedSalary} onChange={updateField('fixedSalary')} />
            </div>
            <div className="field">
              <label>Outros custos fixos</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*[.,]?[0-9]*" value={inputs.otherFixedCosts} onChange={updateField('otherFixedCosts')} />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Mix de serviços</h3>
            <p>Use porcentagens. Soma atual: {formatNumber(results.serviceMixSum)}%</p>
            {Math.abs(results.serviceMixSum - 100) > 0.01 && (
              <p className="warning">A soma deve ser 100%. Ajuste manualmente.</p>
            )}
          </div>
          <div className="mix-section">
            <div className="mix-table">
            <div className="mix-head mix-head-2col">
              <span>Serviço</span>
              <span>Ticket médio (R$)</span>
            </div>
            {services.map((service) => (
              <div className="mix-row mix-row-2col" key={service.id}>
                <span>{service.name} {service.duration}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*[.,]?[0-9]*"
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
          </div>
          <div className="mix-section">
            <div className="mix-table">
            <div className="mix-head mix-head-2col">
              <span>Serviço</span>
              <span>%</span>
            </div>
            {services.map((service) => (
              <div className="mix-row mix-row-2col" key={`${service.id}-pct`}>
                <span>{service.name} {service.duration}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*[.,]?[0-9]*"
                  value={
                    serviceMixDraft[service.id] ??
                    String(inputs.serviceMix[service.id] ?? '')
                  }
                  onFocus={(e) =>
                    setServiceMixDraft((prev) => ({ ...prev, [service.id]: e.target.value }))
                  }
                  onChange={(e) =>
                    setServiceMixDraft((prev) => ({ ...prev, [service.id]: e.target.value }))
                  }
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
            <div className="mix-total mix-total-2col">
              <span>Total</span>
              <span>{formatNumber(results.serviceMixSum)}%</span>
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
