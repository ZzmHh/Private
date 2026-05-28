export function OpsKpiGrid({ kpis }) {
  if (!kpis?.length) return null;
  return (
    <div className="ent-ops-kpi-grid">
      {kpis.map((k) => (
        <div className={`ent-ops-kpi ent-ops-kpi--${k.status || "ok"}`} key={k.label}>
          <span>{k.label}</span>
          <strong>{k.value}</strong>
          {k.delta ? <em>{k.delta}</em> : null}
        </div>
      ))}
    </div>
  );
}

export function OpsActionList({ actions }) {
  if (!actions?.length) return null;
  return (
    <ul className="ent-ops-action-list">
      {actions.map((a) => (
        <li key={a.text}>
          <span className={`ent-ops-pill ent-ops-pill--${(a.level || "P1").toLowerCase()}`}>{a.level}</span>
          {a.text}
        </li>
      ))}
    </ul>
  );
}

export function OpsDataTable({ title, columns, rows, footnote }) {
  if (!rows?.length) return null;
  return (
    <section className="ent-ops-table-section">
      {title ? <h4>{title}</h4> : null}
      <div className="ent-ops-table-wrap">
        <table className="ent-ops-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footnote ? <p className="ent-ops-field-hint">{footnote}</p> : null}
    </section>
  );
}

export function OpsDiagnosisReport({ report, rawAnswer }) {
  if (!report && !rawAnswer) {
    return <div className="ent-cs-empty">运行诊断后，报告将显示在此。</div>;
  }

  if (rawAnswer && !report?.kpis) {
    return (
      <article className="ent-ops-report ent-ops-report--raw">
        <header className="ent-ops-report-head">
          <span className="ent-cs-status ent-cs-status--ok">AI 报告</span>
        </header>
        <pre className="ent-ops-report-body">{rawAnswer}</pre>
      </article>
    );
  }

  return (
    <article className="ent-ops-report">
      <header className="ent-ops-report-head">
        {report.mode ? <span className="ent-ops-badge">{report.mode}</span> : null}
        {report.generatedAt ? (
          <time>{new Date(report.generatedAt).toLocaleString("zh-CN", { hour12: false })}</time>
        ) : null}
      </header>
      {report.summary ? <p className="ent-ops-report-lead">{report.summary}</p> : null}
      <OpsKpiGrid kpis={report.kpis} />
      {report.narrative ? <p className="ent-ops-report-narrative">{report.narrative}</p> : null}
      {report.ads ? (
        <OpsDataTable title="广告效率" columns={report.ads.columns} rows={report.ads.rows} />
      ) : null}
      {report.inventory ? (
        <OpsDataTable title="库存风险" columns={report.inventory.columns} rows={report.inventory.rows} />
      ) : null}
      {report.profitRows ? (
        <OpsDataTable
          title="SKU 利润倾向"
          columns={report.profitRows.columns}
          rows={report.profitRows.rows}
          footnote={report.profitRows.footnote}
        />
      ) : null}
      {report.principles ? (
        <section className="ent-ops-table-section">
          <h4>框架原则（数据不足时）</h4>
          <ul className="ent-ops-bullets">
            {report.principles.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {report.actions?.length ? (
        <section className="ent-ops-table-section">
          <h4>动作清单</h4>
          <OpsActionList actions={report.actions} />
        </section>
      ) : null}
    </article>
  );
}

export function OpsDriverList({ drivers }) {
  if (!drivers?.length) return null;
  return (
    <ul className="ent-ops-driver-list">
      {drivers.map((d) => (
        <li key={d.factor}>
          <strong>{d.factor}</strong>
          <span className={`ent-ops-impact${d.impact.startsWith("↓") ? " is-down" : d.impact.startsWith("↑") ? " is-up" : ""}`}>
            {d.impact}
          </span>
          <p>{d.note}</p>
        </li>
      ))}
    </ul>
  );
}
