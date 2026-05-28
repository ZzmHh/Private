import { useEffect, useState } from "react";
import { findWorkbenchAgent } from "../workbenchConfig.js";
import { isEnterpriseOwner } from "../enterpriseRoles.js";
import { AgentShopContextBar } from "../layout/AgentShopContextBar.jsx";
import { getAgentWorkbenchSpec } from "../workbench/agentSpecs.js";
import { runEnterpriseAgent } from "../lib/creativeApi.js";
import { AgentOutputView } from "../workbench/AgentOutputView.jsx";
import { AgentComposerDock } from "../workbench/AgentComposerDock.jsx";
import { WorkbenchHistoryRail } from "../workbench/WorkbenchHistoryRail.jsx";
import { CreativeStudioWorkbench } from "../creativeStudio/CreativeStudioWorkbench.jsx";
import { CsStudioWorkbench } from "../csStudio/CsStudioWorkbench.jsx";
import { GrowthStudioWorkbench } from "../growthStudio/GrowthStudioWorkbench.jsx";
import { ProfitStudioWorkbench } from "../profitStudio/ProfitStudioWorkbench.jsx";
import { ListingStudioWorkbench } from "../listingStudio/ListingStudioWorkbench.jsx";
import { ContentStudioWorkbench } from "../contentStudio/ContentStudioWorkbench.jsx";
import { PublishStudioWorkbench } from "../publishStudio/PublishStudioWorkbench.jsx";
import { TrendStudioWorkbench } from "../trendStudio/TrendStudioWorkbench.jsx";
import { useScopeShopId } from "../scope/useScopeShopId.js";

const TREND_STUDIO_AGENTS = new Set(["trend"]);
const CREATIVE_STUDIO_AGENTS = new Set(["visual", "video"]);
const CS_STUDIO_AGENTS = new Set(["service"]);
const GROWTH_STUDIO_AGENTS = new Set(["growth"]);
const PROFIT_STUDIO_AGENTS = new Set(["profit"]);
const LISTING_STUDIO_AGENTS = new Set(["listing"]);
const CONTENT_STUDIO_AGENTS = new Set(["content"]);
const PUBLISH_STUDIO_AGENTS = new Set(["publish"]);
const SHOP_CONTEXT_AGENTS = new Set(["growth", "service", "profit", "publish", "listing"]);

function defaultFields(spec) {
  const out = {};
  spec.fields?.forEach((f) => {
    if (f.type === "select") out[f.key] = resolveSelectDefault(f);
    else out[f.key] = f.defaultValue ?? f.default ?? f.placeholder ?? "";
  });
  return out;
}

function resolveSelectDefault(field) {
  if (field?.default != null && field.default !== "") return field.default;
  const first = field?.options?.[0];
  if (first == null) return "";
  return typeof first === "object" ? first.value : first;
}

function defaultToggles(spec) {
  const out = {};
  spec.toggles?.forEach((t) => {
    out[t.key] = true;
  });
  return out;
}

export function EnterpriseWorkbenchPage({ agentId, user }) {
  const agent = findWorkbenchAgent(agentId) || findWorkbenchAgent("trend");
  const spec = getAgentWorkbenchSpec(agent.id);
  const isOwner = isEnterpriseOwner(user);
  const { shopId: scopeShopId } = useScopeShopId();
  const showShopContext = SHOP_CONTEXT_AGENTS.has(agent.id);

  function wrapStudio(studio, className = "ent-wb-stage--creative") {
    return (
      <div className={`ent-wb-stage ${className}`}>
        <section className="ent-wb-main ent-wb-main--with-shop-bar">
          {showShopContext ? <AgentShopContextBar isOwner={isOwner} /> : null}
          {studio}
        </section>
      </div>
    );
  }

  const [input, setInput] = useState(agent.prompt || "");
  const [fields, setFields] = useState(() => defaultFields(spec));
  const [toggles, setToggles] = useState(() => defaultToggles(spec));
  const [output, setOutput] = useState(null);
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const nextSpec = getAgentWorkbenchSpec(agent.id);
    setInput(agent.prompt || "");
    setFields(defaultFields(nextSpec));
    setToggles(defaultToggles(nextSpec));
    setOutput(null);
    setBusy(false);
  }, [agent.id, agent.prompt]);

  if (TREND_STUDIO_AGENTS.has(agent.id)) {
    return (
      <div className="ent-wb-stage ent-wb-stage--creative">
        <section className="ent-wb-main">
          <TrendStudioWorkbench user={user} />
        </section>
      </div>
    );
  }

  function buildAgentInputText() {
    const lines = [input.trim()];
    spec.fields?.forEach((f) => {
      const v = fields[f.key];
      if (v != null && String(v).trim()) lines.push(`${f.label}：${v}`);
    });
    spec.toggles?.forEach((t) => {
      if (toggles[t.key]) lines.push(`[开启] ${t.label}`);
    });
    return lines.filter(Boolean).join("\n");
  }

  async function runGenerate() {
    setBusy(true);
    setOutput(null);
    const token = localStorage.getItem("enterprise_token");
    const agentInput = buildAgentInputText();

    try {
      if (!token) {
        if (import.meta.env.DEV) {
          await new Promise((r) => setTimeout(r, 650));
          setOutput({ type: "raw", text: `【演示】${agent.name}\n\n${agentInput}\n\n（登录后将调用 ${agent.id} Agent 真实模型。）` });
          return;
        }
        throw new Error("请先登录企业账号");
      }
      if (!agentInput.trim()) throw new Error("请填写任务描述");

      const data = await runEnterpriseAgent(agent.id, agentInput);
      setOutput({ type: "raw", text: data.answer || "模型未返回内容。" });
    } catch (err) {
      setOutput({ type: "raw", text: `错误：${err?.message || "生成失败"}` });
    } finally {
      setBusy(false);
    }
  }

  if (CREATIVE_STUDIO_AGENTS.has(agent.id)) {
    return (
      <div className="ent-wb-stage ent-wb-stage--creative">
        <section className="ent-wb-main">
          <CreativeStudioWorkbench studioId={agent.id} user={user} />
        </section>
      </div>
    );
  }

  if (CS_STUDIO_AGENTS.has(agent.id)) {
    return wrapStudio(<CsStudioWorkbench user={user} scopeShopId={scopeShopId} />);
  }

  if (GROWTH_STUDIO_AGENTS.has(agent.id)) {
    return wrapStudio(<GrowthStudioWorkbench user={user} scopeShopId={scopeShopId} />);
  }

  if (PROFIT_STUDIO_AGENTS.has(agent.id)) {
    return wrapStudio(<ProfitStudioWorkbench user={user} scopeShopId={scopeShopId} />);
  }

  if (LISTING_STUDIO_AGENTS.has(agent.id)) {
    return wrapStudio(<ListingStudioWorkbench user={user} />);
  }

  if (CONTENT_STUDIO_AGENTS.has(agent.id)) {
    return (
      <div className="ent-wb-stage ent-wb-stage--creative">
        <section className="ent-wb-main">
          <ContentStudioWorkbench user={user} />
        </section>
      </div>
    );
  }

  if (PUBLISH_STUDIO_AGENTS.has(agent.id)) {
    return wrapStudio(<PublishStudioWorkbench user={user} />);
  }

  return (
    <div className="ent-wb-stage">
      <section className="ent-wb-main">
        <div className="ent-wb-output-toolbar">
          <div className="ent-wb-output-toolbar-left">
            <h1>{agent.name}</h1>
            <span className="ent-wb-output-toolbar-divider">/</span>
            <h2>{spec.outputTitle}</h2>
            {busy ? <span className="ent-wb-status">生成中…</span> : null}
          </div>
          <div className="ent-wb-output-toolbar-right">
            {agent.enterpriseOnly ? <span className="enterprise-tag accent">企业增项</span> : null}
            {agent.legacyParity ? <span className="enterprise-tag">标准能力</span> : null}
            <button type="button" className="enterprise-btn enterprise-btn-ghost" disabled={!output}>
              复制
            </button>
            <button type="button" className="enterprise-btn enterprise-btn-ghost" disabled={!output}>
              导出
            </button>
            <button
              type="button"
              className={`enterprise-btn enterprise-btn-secondary ent-wb-history-toggle${historyOpen ? " is-active" : ""}`}
              onClick={() => setHistoryOpen((v) => !v)}
            >
              历史
            </button>
          </div>
        </div>

        <div className="ent-wb-output-scroll">
          <AgentOutputView agent={agent} output={output} busy={busy} spec={spec} />
        </div>

        <AgentComposerDock
          spec={spec}
          agent={agent}
          input={input}
          onInputChange={setInput}
          fields={fields}
          onFieldChange={(k, v) => setFields((prev) => ({ ...prev, [k]: v }))}
          toggles={toggles}
          onToggleChange={(k, v) => setToggles((prev) => ({ ...prev, [k]: v }))}
          onSubmit={runGenerate}
          busy={busy}
        />

        <WorkbenchHistoryRail
          agentId={agent.id}
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          user={user}
        />
      </section>
    </div>
  );
}
