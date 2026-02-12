import { useMemo, useState, type ChangeEvent } from 'react'
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

  const results = useMemo(() => calculate(inputs), [inputs])

  const updateField = (key: keyof Inputs) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = parseNumber(event.target.value)
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  const updatePackageMix = (key: keyof Inputs['packageMix']) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const raw = parseNumber(event.target.value)
      const value = Math.min(Math.max(raw, 0), 100)
      setInputs((prev) => ({
        ...prev,
        packageMix: { ...prev.packageMix, [key]: value },
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

      <h2 className="section-title">Resultados</h2>
      <section className="cards">
        <details className="card card-accordion" open>
          <summary className="card-summary">
            <div>
              <p>Receita mensal</p>
              <h2>{formatCurrency(results.revenue)}</h2>
            </div>
          </summary>
          <div className="card-details">
            <div className="row"><span>Ticket médio</span><strong>{formatCurrency(results.avgPriceOverall)}</strong></div>
            <div className="row"><span>Sessões líquidas</span><strong>{formatNumber(results.netSessions)}</strong></div>
            <div className="row"><span>Receita anual</span><strong>{formatCurrency(results.revenue * 12)}</strong></div>
          </div>
        </details>
        <details className="card card-accordion" open>
          <summary className="card-summary">
            <div>
              <p>Despesas mensais</p>
              <h2>{formatCurrency(results.totalExpenses)}</h2>
            </div>
          </summary>
          <div className="card-details">
            <div className="row"><span>Variáveis</span><strong>{formatCurrency(results.variableCosts)}</strong></div>
            <div className="row"><span>Comissões</span><strong>{formatCurrency(results.commissions)}</strong></div>
            <div className="row"><span>Taxa de cartão</span><strong>{formatCurrency(results.cardFees)}</strong></div>
            <div className="row"><span>Fixos</span><strong>{formatCurrency(results.fixedCosts)}</strong></div>
          </div>
        </details>
        <details className="card card-accordion highlight" open>
          <summary className="card-summary">
            <div>
              <p>Resultado mensal</p>
              <h2>{formatCurrency(results.result)}</h2>
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
              <input type="text" value={inputs.atendHot} onChange={updateField('atendHot')} />
            </div>
            <div className="field">
              <label>Atendimentos/dia (frio)</label>
              <input type="text" value={inputs.atendCold} onChange={updateField('atendCold')} />
            </div>
            <div className="field">
              <label>Dias quentes/mês</label>
              <input type="text" value={inputs.daysHot} onChange={updateField('daysHot')} />
            </div>
            <div className="field">
              <label>Dias frios/mês</label>
              <input type="text" value={inputs.daysCold} onChange={updateField('daysCold')} />
            </div>
            <div className="field">
              <label>No-show (%)</label>
              <input type="text" value={inputs.noShowRate * 100} onChange={(e) => setInputs((prev) => ({
                ...prev,
                noShowRate: parseNumber(e.target.value) / 100,
              }))} />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Custos e comissões</h3>
            <p>Premissas financeiras.</p>
          </div>
          <div className="group">
            <div className="field">
              <label>Custo variável por sessão</label>
              <input type="text" value={inputs.variableCostPerSession} onChange={updateField('variableCostPerSession')} />
            </div>
            <div className="field">
              <label>Extra variável por sessão</label>
              <input type="text" value={inputs.extraVariablePerSession} onChange={updateField('extraVariablePerSession')} />
            </div>
            <div className="field">
              <label>Comissão (%)</label>
              <input type="text" value={inputs.commissionRate * 100} onChange={(e) => setInputs((prev) => ({
                ...prev,
                commissionRate: parseNumber(e.target.value) / 100,
              }))} />
            </div>
            <div className="field">
              <label>Taxa de cartão (%)</label>
              <input type="text" value={inputs.cardFeeRate * 100} onChange={(e) => setInputs((prev) => ({
                ...prev,
                cardFeeRate: parseNumber(e.target.value) / 100,
              }))} />
            </div>
          </div>

          <div className="group">
            <h4>Custos fixos</h4>
            <div className="field">
              <label>Nº de terapeutas</label>
              <input type="text" value={inputs.therapists} onChange={updateField('therapists')} />
            </div>
            <div className="field">
              <label>Salário fixo por terapeuta</label>
              <input type="text" value={inputs.fixedSalary} onChange={updateField('fixedSalary')} />
            </div>
            <div className="field">
              <label>Outros custos fixos</label>
              <input type="text" value={inputs.otherFixedCosts} onChange={updateField('otherFixedCosts')} />
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
          <div className="mix-table">
            <div className="mix-head">
              <span>Serviço</span>
              <span>Ticket médio</span>
              <span>%</span>
            </div>
            {services.map((service) => (
              <div className="mix-row" key={service.id}>
                <span>{service.name} {service.duration}</span>
                <label className="mix-label-mobile">Ticket médio</label>
                <input
                  type="text"
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
                <label className="mix-label-mobile">Percentual</label>
                <input
                  type="text"
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
            <div className="mix-total">
              <span>Total</span>
              <span />
              <span>{formatNumber(results.serviceMixSum)}%</span>
            </div>
          </div>
        </div>
      </section>
        </>
      )}
    </div>
  )
}
