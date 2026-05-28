import { useEffect, useMemo, useState } from "react";
import { OpsStudioShell } from "../opsStudio/OpsStudioShell.jsx";
import { CsToast } from "../csStudio/CsToast.jsx";
import {
  buildAgentInput,
  defaultSharedValues,
  defaultToolValues,
  formatError,
  runListingContentAgent,
} from "./agentStudioApi.js";
import { mockAgentResult } from "./agentStudioMocks.js";
import { AgentResultPreview } from "./AgentResultPreview.jsx";
import "../creativeStudio/creativeStudio.css";
import "../csStudio/csStudio.css";
import "../opsStudio/opsStudio.css";
import "./agentStudio.css";

function renderField(field, value, onChange) {
  if (field.type === "select") {
    return (
      <select className="ent-cs-control" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {field.options.map((o) => {
          const val = typeof o === "object" ? o.value : o;
          const label = typeof o === "object" ? o.label : o;
          return (
            <option key={val} value={val}>
              {label}
            </option>
          );
        })}
      </select>
    );
  }
  if (field.type === "textarea") {
    return (
      <textarea
        className="ent-cs-control ent-cs-textarea"
        rows={field.rows || 3}
        value={value ?? ""}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      className="ent-cs-control"
      type="text"
      value={value ?? ""}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function AgentGenStudioWorkbench({ studio, defaultToolId, findTool, user }) {
  const [toolId, setToolId] = useState(defaultToolId);
  const [shared, setShared] = useState(() => defaultSharedValues(studio));
  const [toolValues, setToolValues] = useState(() => defaultToolValues(findTool(defaultToolId)));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [rawAnswer, setRawAnswer] = useState("");
  const [toast, setToast] = useState("");
  const [logOpen, setLogOpen] = useState(false);
  const [execLog, setExecLog] = useState(null);
  const [viewRaw, setViewRaw] = useState(false);

  const tool = useMemo(() => findTool(toolId), [toolId, findTool]);

  useEffect(() => {
    setToolValues(defaultToolValues(tool));
    setResult(null);
    setRawAnswer("");
    setExecLog(null);
    setLogOpen(false);
    setViewRaw(false);
  }, [toolId, tool]);

  function updateShared(key, val) {
    setShared((prev) => ({ ...prev, [key]: val }));
  }

  function updateTool(key, val) {
    setToolValues((prev) => ({ ...prev, [key]: val }));
  }

  async function runGenerate() {
    const productField = studio.sharedFields?.find((f) => f.key === "product");
    if (productField?.required && !shared.product?.trim?.()) {
      setToast("请填写商品名称。");
      return;
    }

    setBusy(true);
    setResult(null);
    setRawAnswer("");
    setViewRaw(false);

    const input = buildAgentInput(studio, tool, shared, toolValues);
    const token = localStorage.getItem("enterprise_token");

    try {
      if (!token) {
        if (import.meta.env.DEV) {
          await new Promise((r) => setTimeout(r, 650));
          const mock = mockAgentResult(studio.id, tool.mockKey, shared);
          setResult(mock);
          setExecLog({ mode: "mock", toolId, input, result: mock });
          setLogOpen(true);
          return;
        }
        throw new Error("请先登录后再生成");
      }

      const data = await runListingContentAgent(studio.agentId, input);
      const answer = data.answer || "";
      setRawAnswer(answer);
      setResult({ type: "raw", text: answer });
      setViewRaw(true);
      setExecLog({ mode: "api", toolId, input, answer, taskId: data.task?.id });
      setLogOpen(true);
    } catch (err) {
      setToast(formatError(err));
      setExecLog({ mode: "error", error: formatError(err) });
      setLogOpen(true);
    } finally {
      setBusy(false);
    }
  }

  const shellStudio = {
    ...studio,
    groups: studio.groups,
  };

  return (
    <OpsStudioShell
      studio={shellStudio}
      toolId={toolId}
      onToolIdChange={setToolId}
      user={user}
      panelHint={tool?.panelHint}
      showLog
      logOpen={logOpen}
      onLogToggle={() => setLogOpen((v) => !v)}
      execLog={execLog}
    >
      <CsToast message={toast} onClear={() => setToast("")} />
      <div className="ent-cs-split ent-ops-split-run">
        <div className="ent-cs-form">
          <p className="ent-cs-form-intro">
            当前模块：<strong>{tool?.name}</strong> · 平台 {shared.platform || "—"}
          </p>

          <details className="ent-cs-collapsible" open>
            <summary>商品上下文（跨模块共享）</summary>
            <div className="ent-cs-collapsible-body">
              {studio.sharedFields?.map((f) => (
                <label className="ent-cs-field" key={f.key}>
                  <span className="ent-cs-field-label">{f.label}</span>
                  {renderField(f, shared[f.key], (v) => updateShared(f.key, v))}
                </label>
              ))}
            </div>
          </details>

          {(tool?.toolFields || []).length ? (
            <div className="ent-agent-tool-fields">
              <p className="ent-cs-field-label">本模块参数</p>
              {tool.toolFields.map((f) => (
                <label className="ent-cs-field" key={f.key}>
                  <span className="ent-cs-field-label">{f.label}</span>
                  {renderField(f, toolValues[f.key], (v) => updateTool(f.key, v))}
                </label>
              ))}
            </div>
          ) : null}

          <button type="button" className="ent-cs-submit" disabled={busy} onClick={runGenerate}>
            {busy ? "生成中…" : `生成 · ${tool?.name}`}
          </button>
          <p className="ent-cs-form-footnote">消耗 Agent 套餐次数；输出需人工合规与事实核对后再上架/发布。</p>
        </div>

        <div className="ent-cs-preview ent-cs-preview--route">
          <div className="ent-cs-preview-toolbar">
            <span className={`ent-cs-status ent-cs-status--${busy ? "busy" : result || rawAnswer ? "ok" : "idle"}`}>
              {busy ? "生成中" : result || rawAnswer ? "已完成" : "等待生成"}
            </span>
            {rawAnswer && result ? (
              <button type="button" className="ent-cs-query-btn" onClick={() => setViewRaw((v) => !v)}>
                {viewRaw ? "看结构化预览" : "看 AI 原文"}
              </button>
            ) : null}
          </div>
          <div className="ent-cs-preview-stage ent-cs-preview-stage--route ent-ops-preview-scroll">
            <AgentResultPreview
              result={viewRaw ? null : result}
              rawAnswer={viewRaw ? rawAnswer : !result ? rawAnswer : null}
              busy={busy}
            />
          </div>
        </div>
      </div>
    </OpsStudioShell>
  );
}
