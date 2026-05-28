export function AgentOutputView({ agent, output, busy, spec }) {
  if (busy) {
    return (
      <div className="ent-wb-output-loading">
        <div className="ent-wb-skeleton ent-wb-skeleton--lg" />
        <div className="ent-wb-skeleton ent-wb-skeleton--md" />
        <div className="ent-wb-skeleton ent-wb-skeleton--sm" />
        <p>Agent 正在生成…</p>
      </div>
    );
  }

  if (!output) {
    return (
      <div className="ent-wb-output-empty">
        <div className="ent-wb-output-empty-icon">{agent.name.slice(0, 1)}</div>
        <h3>{spec.outputTitle}</h3>
        <p>{spec.emptyHint}</p>
      </div>
    );
  }

  switch (output.type) {
    case "table":
      return (
        <div className="ent-wb-output-doc">
          {output.summary ? <p className="ent-wb-output-lead">{output.summary}</p> : null}
          {output.sections?.map((sec) => (
            <section className="ent-wb-output-section" key={sec.title}>
              <h4>{sec.title}</h4>
              {sec.columns ? (
                <div className="ent-wb-table-wrap">
                  <table className="enterprise-table">
                    <thead>
                      <tr>
                        {sec.columns.map((c) => (
                          <th key={c}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sec.rows.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {sec.bullets ? (
                <ul className="ent-wb-bullets">
                  {sec.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      );

    case "scripts":
      return (
        <div className="ent-wb-output-doc">
          {output.items.map((item, i) => (
            <article className="ent-wb-script-card" key={i}>
              <header>{item.hook}</header>
              <p>{item.body}</p>
              <div className="ent-wb-script-actions">
                <button type="button" className="enterprise-btn enterprise-btn-ghost">
                  复制
                </button>
              </div>
            </article>
          ))}
        </div>
      );

    case "listing":
      return (
        <div className="ent-wb-output-doc">
          <section className="ent-wb-output-section">
            <h4>标题候选</h4>
            <p className="ent-wb-listing-title">{output.title}</p>
          </section>
          <section className="ent-wb-output-section">
            <h4>五点描述</h4>
            <ol className="ent-wb-listing-bullets">
              {output.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ol>
          </section>
          <section className="ent-wb-output-section">
            <h4>后台关键词</h4>
            <p className="ent-wb-keywords">{output.keywords}</p>
          </section>
        </div>
      );

    case "diagnosis":
      return (
        <div className="ent-wb-output-doc">
          <div className="ent-wb-kpi-row">
            {output.kpis.map((k) => (
              <div className={`ent-wb-kpi ent-wb-kpi--${k.status}`} key={k.label}>
                <span>{k.label}</span>
                <strong>{k.value}</strong>
              </div>
            ))}
          </div>
          <section className="ent-wb-output-section">
            <h4>动作清单</h4>
            <ul className="ent-wb-action-list">
              {output.actions.map((a) => (
                <li key={a.text}>
                  <span className={`ent-wb-pill ent-wb-pill--${a.level.toLowerCase()}`}>{a.level}</span>
                  {a.text}
                </li>
              ))}
            </ul>
          </section>
        </div>
      );

    case "cs":
      return (
        <div className="ent-wb-output-doc">
          <div className="ent-wb-cs-meta">
            <span className="enterprise-tag">匹配 FAQ：{output.matchedFaq}</span>
            <span className="ent-wb-cs-note">{output.note}</span>
          </div>
          <div className="ent-wb-cs-reply">
            <label>建议回复</label>
            <div className="ent-wb-cs-reply-body">{output.reply}</div>
            <div className="ent-wb-cs-reply-actions">
              <button type="button" className="enterprise-btn enterprise-btn-primary">
                复制发送
              </button>
              <button type="button" className="enterprise-btn enterprise-btn-secondary">
                改为草稿
              </button>
            </div>
          </div>
        </div>
      );

    case "visual":
      return (
        <div className="ent-wb-output-doc">
          <div className="ent-wb-visual-grid">
            {output.variants.map((v) => (
              <div className="ent-wb-visual-card" key={v.name}>
                <div className="ent-wb-visual-preview">{v.size}</div>
                <footer>
                  <strong>{v.name}</strong>
                  <button type="button" className="enterprise-btn enterprise-btn-ghost">
                    下载
                  </button>
                </footer>
              </div>
            ))}
          </div>
        </div>
      );

    case "video":
      return (
        <div className="ent-wb-output-doc">
          <div className="ent-wb-video-layout">
            <div className="ent-wb-video-preview">9:16 预览区</div>
            <div className="ent-wb-video-meta">
              <p>
                任务 <code>{output.jobId}</code> · {output.status === "queued" ? "排队中" : output.status}
              </p>
              <h4>分镜表</h4>
              <ul className="ent-wb-shot-list">
                {output.shots.map((s) => (
                  <li key={s.t}>
                    <time>{s.t}</time>
                    <span>{s.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );

    case "raw":
      return <pre className="ent-wb-output-raw">{output.text || ""}</pre>;

    default:
      return <pre className="ent-wb-output-raw">{output.text ?? JSON.stringify(output, null, 2)}</pre>;
  }
}
