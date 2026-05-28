import { enterpriseHref, enterpriseWorkbenchHref } from "../navConfig.js";

export function EnterpriseModeSwitch({ mode, onSwitch, showConsole = true }) {
  if (!showConsole) {
    return (
      <div className="enterprise-mode-switch enterprise-mode-switch--single" aria-label="当前模式">
        <span className="enterprise-mode-tab is-active">Agent 工作台</span>
      </div>
    );
  }

  return (
    <div className="enterprise-mode-switch" role="tablist" aria-label="企业站模式">
      <button
        type="button"
        role="tab"
        aria-selected={mode === "console"}
        className={`enterprise-mode-tab${mode === "console" ? " is-active" : ""}`}
        onClick={() => onSwitch("console")}
      >
        控制台
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "workbench"}
        className={`enterprise-mode-tab${mode === "workbench" ? " is-active" : ""}`}
        onClick={() => onSwitch("workbench")}
      >
        Agent 工作台
      </button>
    </div>
  );
}

export function enterpriseModeHref(nextMode, currentAgentId = "trend") {
  return nextMode === "workbench" ? enterpriseWorkbenchHref(currentAgentId) : enterpriseHref("console/overview");
}
