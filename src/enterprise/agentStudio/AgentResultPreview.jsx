function CopyBtn({ text, label = "复制" }) {
  function copy() {
    navigator.clipboard?.writeText(text || "");
  }
  return (
    <button type="button" className="ent-cs-copy-btn" onClick={copy}>
      {label}
    </button>
  );
}

export function AgentResultPreview({ result, rawAnswer, busy }) {
  if (busy) {
    return (
      <div className="ent-cs-preview-loading">
        <div className="ent-cs-spinner" />
        <span>生成中…</span>
      </div>
    );
  }

  if (!result && !rawAnswer) {
    return <div className="ent-cs-empty">填写左侧参数后点击生成，结果将显示在此。</div>;
  }

  if (rawAnswer && (!result || result.type === "raw")) {
    return (
      <article className="ent-agent-preview ent-agent-preview--raw">
        <div className="ent-agent-preview-head">
          <CopyBtn text={rawAnswer} />
        </div>
        <pre>{rawAnswer}</pre>
      </article>
    );
  }

  switch (result.type) {
    case "listing-titles":
      return (
        <ul className="ent-agent-card-list">
          {result.items.map((item, i) => (
            <li key={i} className="ent-agent-card">
              <div className="ent-agent-card-head">
                <strong>候选 {i + 1}</strong>
                <span>{item.chars} 字符</span>
                <CopyBtn text={item.text} />
              </div>
              <p>{item.text}</p>
              {item.note ? <small>{item.note}</small> : null}
            </li>
          ))}
        </ul>
      );

    case "listing-bullets":
      return (
        <div className="ent-agent-preview">
          <div className="ent-agent-preview-head">
            <CopyBtn text={result.items.join("\n")} label="复制全部" />
          </div>
          <ol className="ent-agent-bullets">
            {result.items.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ol>
        </div>
      );

    case "listing-keywords":
      return (
        <div className="ent-agent-preview">
          <section>
            <h4>核心词</h4>
            <p className="ent-agent-tags">
              {result.core.map((k) => (
                <span key={k}>{k}</span>
              ))}
            </p>
          </section>
          <section>
            <h4>长尾词</h4>
            <p className="ent-agent-tags ent-agent-tags--muted">
              {result.longTail.map((k) => (
                <span key={k}>{k}</span>
              ))}
            </p>
          </section>
          {result.avoid?.length ? (
            <section>
              <h4>避免词</h4>
              <p className="ent-agent-warn">{result.avoid.join(" · ")}</p>
            </section>
          ) : null}
          {result.charEstimate ? <p className="ent-ops-field-hint">字符估算：{result.charEstimate}</p> : null}
        </div>
      );

    case "listing-faq":
      return (
        <div className="ent-agent-preview">
          <ul className="ent-agent-faq-list">
            {result.faqs.map((f) => (
              <li key={f.q}>
                <strong>Q：{f.q}</strong>
                <p>A：{f.a}</p>
              </li>
            ))}
          </ul>
          {result.compliance?.length ? (
            <section className="ent-agent-compliance">
              <h4>合规待核实</h4>
              <ul>
                {result.compliance.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      );

    case "listing-full":
      return (
        <div className="ent-agent-preview ent-agent-preview--stack">
          <AgentResultPreview result={result.title} />
          <AgentResultPreview result={result.bullets} />
          <AgentResultPreview result={result.keywords} />
          <AgentResultPreview result={result.faq} />
        </div>
      );

    case "content-hooks":
      return (
        <ul className="ent-agent-card-list">
          {result.items.map((item) => (
            <li key={item.text} className="ent-agent-card">
              <div className="ent-agent-card-head">
                <span className="ent-ops-badge">{item.type}</span>
                <CopyBtn text={item.text} />
              </div>
              <p>{item.text}</p>
              <small>镜头：{item.shot}</small>
            </li>
          ))}
        </ul>
      );

    case "content-scripts":
      return (
        <ul className="ent-agent-card-list">
          {result.items.map((item) => (
            <li key={item.title} className="ent-agent-card">
              <div className="ent-agent-card-head">
                <strong>{item.title}</strong>
                <CopyBtn text={`${item.hook}\n\n${item.body}`} />
              </div>
              <p className="ent-agent-hook">{item.hook}</p>
              <p>{item.body}</p>
              <small>{item.shots}</small>
            </li>
          ))}
        </ul>
      );

    case "content-storyboard":
      return (
        <div className="ent-ops-table-wrap">
          <table className="ent-ops-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>画面</th>
                <th>口播</th>
                <th>字幕</th>
              </tr>
            </thead>
            <tbody>
              {result.shots.map((s) => (
                <tr key={s.t}>
                  <td>{s.t}</td>
                  <td>{s.visual}</td>
                  <td>{s.vo}</td>
                  <td>{s.sub || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "content-voiceover":
      return (
        <ul className="ent-agent-card-list">
          {result.items.map((item) => (
            <li key={item.label} className="ent-agent-card">
              <div className="ent-agent-card-head">
                <strong>{item.label}</strong>
                <span>≈ {item.estSec}s</span>
                <CopyBtn text={item.text} />
              </div>
              <pre>{item.text}</pre>
            </li>
          ))}
        </ul>
      );

    case "content-brief":
      return (
        <div className="ent-agent-preview">
          {result.sections.map((sec) => (
            <section key={sec.title} className="ent-agent-brief-sec">
              <h4>{sec.title}</h4>
              <p>{sec.body}</p>
            </section>
          ))}
          <CopyBtn
            text={result.sections.map((s) => `## ${s.title}\n${s.body}`).join("\n\n")}
            label="复制 Brief"
          />
        </div>
      );

    case "content-batch":
      return (
        <div className="ent-ops-table-wrap">
          <table className="ent-ops-table">
            <thead>
              <tr>
                {result.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "raw":
      return (
        <article className="ent-agent-preview ent-agent-preview--raw">
          <pre>{result.text}</pre>
        </article>
      );

    default:
      return <pre className="ent-agent-preview--raw">{JSON.stringify(result, null, 2)}</pre>;
  }
}
