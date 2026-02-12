import { services } from './variables'
import {
  volumePerformance,
  teamCommissions,
  costPerSession,
  laundryCosts,
  otherProducts,
  sessionCostTotal,
} from './tablesData'

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

export default function Tables() {
  return (
    <div className="tables">
      <header className="hero">
        <div>
          <p className="eyebrow">Tabelas</p>
          <h1>SPA • Dados detalhados</h1>
          <p className="sub">Visualize cada tabela do Excel em páginas separadas.</p>
        </div>
        <div />
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Serviços e preços</h3>
          <p>Valores de referência por serviço e pacote.</p>
        </div>
        <div className="table-wrap table-desktop">
          <table>
            <thead>
              <tr>
                <th>Serviço</th>
                <th>Duração</th>
                <th>Preço cheio</th>
                <th>Pac 5 (-10%)</th>
                <th>Pac 10 (-20%)</th>
                <th>Pac 20 (-25%)</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>{service.name}</td>
                  <td>{service.duration}</td>
                  <td>R$ {service.prices.full}</td>
                  <td>R$ {service.prices.p5}</td>
                  <td>R$ {service.prices.p10}</td>
                  <td>R$ {service.prices.p20}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-cards">
          {services.map((service) => (
            <div className="card-row" key={service.id}>
              <div className="card-title">{service.name} {service.duration}</div>
              <div className="card-field"><span>Preço cheio</span><strong>R$ {service.prices.full}</strong></div>
              <div className="card-field"><span>Pac 5 (-10%)</span><strong>R$ {service.prices.p5}</strong></div>
              <div className="card-field"><span>Pac 10 (-20%)</span><strong>R$ {service.prices.p10}</strong></div>
              <div className="card-field"><span>Pac 20 (-25%)</span><strong>R$ {service.prices.p20}</strong></div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Volume e performance</h3>
          <p>Métricas operacionais da aba Painel Geral.</p>
        </div>
        <div className="table-wrap table-desktop">
          <table>
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Valor</th>
                <th>Unidade</th>
              </tr>
            </thead>
            <tbody>
              {volumePerformance.map((item) => (
                <tr key={item.metric}>
                  <td>{item.metric}</td>
                  <td>
                    {item.unit === '%' ? formatPercent(item.value) : item.value}
                  </td>
                  <td>{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-cards">
          {volumePerformance.map((item) => (
            <div className="card-row" key={item.metric}>
              <div className="card-title">{item.metric}</div>
              <div className="card-field">
                <span>Valor</span>
                <strong>{item.unit === '%' ? formatPercent(item.value) : item.value}</strong>
              </div>
              <div className="card-field">
                <span>Unidade</span>
                <strong>{item.unit}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Equipe e comissões</h3>
          <p>Estrutura de equipe e remuneração.</p>
        </div>
        <div className="table-wrap table-desktop">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Valor</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {teamCommissions.map((item) => (
                <tr key={item.item}>
                  <td>{item.item}</td>
                  <td>
                    {typeof item.value === 'number'
                      ? item.item.includes('%')
                        ? formatPercent(item.value)
                        : item.value
                      : item.value}
                  </td>
                  <td>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-cards">
          {teamCommissions.map((item) => (
            <div className="card-row" key={item.item}>
              <div className="card-title">{item.item}</div>
              <div className="card-field">
                <span>Valor</span>
                <strong>
                  {typeof item.value === 'number'
                    ? item.item.includes('%')
                      ? formatPercent(item.value)
                      : item.value
                    : item.value}
                </strong>
              </div>
              <div className="card-field">
                <span>Observação</span>
                <strong>{item.note}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Custos por atendimento</h3>
          <p>Itens diretos por sessão.</p>
        </div>
        <div className="table-wrap table-desktop">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {costPerSession.map((item) => (
                <tr key={item.item}>
                  <td>{item.item}</td>
                  <td>
                    {item.item.includes('%') ? formatPercent(item.value) : `R$ ${item.value}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-cards">
          {costPerSession.map((item) => (
            <div className="card-row" key={item.item}>
              <div className="card-title">{item.item}</div>
              <div className="card-field">
                <span>Valor</span>
                <strong>{item.item.includes('%') ? formatPercent(item.value) : `R$ ${item.value}`}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Detalhamento de custos por sessão</h3>
          <p>Lavanderia e outros produtos.</p>
        </div>
        <div className="table-wrap table-desktop">
          <h4>Componentes da lavanderia</h4>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qtd</th>
                <th>Custo unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {laundryCosts.map((item) => (
                <tr key={item.item}>
                  <td>{item.item}</td>
                  <td>{item.qty}</td>
                  <td>R$ {item.unitCost}</td>
                  <td>R$ {item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-cards">
          <h4>Componentes da lavanderia</h4>
          {laundryCosts.map((item) => (
            <div className="card-row" key={item.item}>
              <div className="card-title">{item.item}</div>
              <div className="card-field"><span>Qtd</span><strong>{item.qty}</strong></div>
              <div className="card-field"><span>Custo unit.</span><strong>R$ {item.unitCost}</strong></div>
              <div className="card-field"><span>Subtotal</span><strong>R$ {item.subtotal}</strong></div>
            </div>
          ))}
        </div>
        <div className="table-wrap table-desktop">
          <h4>Outros produtos</h4>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qtd</th>
                <th>Custo unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {otherProducts.map((item) => (
                <tr key={item.item}>
                  <td>{item.item}</td>
                  <td>{item.qty}</td>
                  <td>R$ {item.unitCost}</td>
                  <td>R$ {item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-cards">
          <h4>Outros produtos</h4>
          {otherProducts.map((item) => (
            <div className="card-row" key={item.item}>
              <div className="card-title">{item.item}</div>
              <div className="card-field"><span>Qtd</span><strong>{item.qty}</strong></div>
              <div className="card-field"><span>Custo unit.</span><strong>R$ {item.unitCost}</strong></div>
              <div className="card-field"><span>Subtotal</span><strong>R$ {item.subtotal}</strong></div>
            </div>
          ))}
        </div>
        <p className="total">Custo total por sessão: R$ {sessionCostTotal}</p>
      </section>
    </div>
  )
}
