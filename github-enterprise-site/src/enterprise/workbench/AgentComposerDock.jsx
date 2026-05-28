import { useId } from "react";

function resolveSelectDefault(field) {
  if (field?.default != null && field.default !== "") return field.default;
  const first = field?.options?.[0];
  if (first == null) return "";
  return typeof first === "object" ? first.value : first;
}

function metaColsClass(fieldCount) {
  if (fieldCount >= 4) return "ent-wb-composer-meta--4";
  if (fieldCount === 3) return "ent-wb-composer-meta--3";
  if (fieldCount === 2) return "ent-wb-composer-meta--2";
  return "ent-wb-composer-meta--1";
}

export function AgentComposerDock({
  spec,
  input,
  onInputChange,
  fields,
  onFieldChange,
  toggles,
  onToggleChange,
  onSubmit,
  busy,
  agent,
}) {
  const textareaId = useId();
  const fieldCount = spec.fields?.length || 0;
  const hasMeta = Boolean(fieldCount || spec.toggles?.length || agent.id === "visual" || agent.id === "video");

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!busy && input.trim()) onSubmit();
    }
  }

  return (
    <footer className="ent-wb-composer">
      <div className="ent-wb-composer-card">
        {hasMeta ? (
          <div className={`ent-wb-composer-meta ${metaColsClass(fieldCount)}`}>
            {spec.fields?.map((f) => {
              const fieldId = `ent-wb-${agent.id}-${f.key}`;
              return (
                <label className="ent-wb-param-cell" key={f.key} htmlFor={fieldId}>
                  <span className="ent-wb-param-label">{f.label}</span>
                  {f.type === "select" ? (
                    <select
                      id={fieldId}
                      className="ent-wb-param-control"
                      value={fields[f.key] ?? resolveSelectDefault(f)}
                      onChange={(e) => onFieldChange(f.key, e.target.value)}
                    >
                      {f.options?.map((o) => {
                        const val = typeof o === "object" ? o.value : o;
                        const label = typeof o === "object" ? o.label : o;
                        return (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <input
                      id={fieldId}
                      className="ent-wb-param-control"
                      type="text"
                      value={fields[f.key] ?? ""}
                      onChange={(e) => onFieldChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                    />
                  )}
                </label>
              );
            })}

            {spec.toggles?.map((t) => (
              <label className="ent-wb-param-toggle" key={t.key}>
                <input
                  type="checkbox"
                  checked={Boolean(toggles[t.key])}
                  onChange={(e) => onToggleChange(t.key, e.target.checked)}
                />
                <span>{t.label}</span>
              </label>
            ))}

            {(agent.id === "visual" || agent.id === "video") && (
              <div className="ent-wb-param-upload">
                <button type="button" className="enterprise-btn enterprise-btn-secondary">
                  上传商品图
                </button>
              </div>
            )}
          </div>
        ) : null}

        <div className="ent-wb-composer-body">
          <label className="ent-wb-param-label" htmlFor={textareaId}>
            {spec.inputLabel}
          </label>
          <textarea
            id={textareaId}
            className="ent-wb-composer-textarea"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={spec.inputPlaceholder}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="ent-wb-composer-toolbar">
          <button type="button" className="ent-wb-composer-attach">
            导入附件
          </button>
          <span className="ent-wb-composer-kbd">Enter 发送 · Shift+Enter 换行</span>
          <button
            type="button"
            className="enterprise-btn enterprise-btn-primary ent-wb-composer-send"
            disabled={busy || !input.trim()}
            onClick={onSubmit}
          >
            {busy ? "生成中…" : "生成"}
          </button>
        </div>
      </div>
    </footer>
  );
}
