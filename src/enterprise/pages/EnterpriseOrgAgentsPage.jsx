import { EnterpriseBreadcrumbs } from "../layout/EnterpriseBreadcrumbs.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { enterpriseWorkbenchHref } from "../navConfig.js";
import { enterpriseWorkbenchAgents } from "../workbenchConfig.js";

const mockAccounts = [
  {
    name: "北美运营 · Alice",
    role: "运营",
    agents: ["trend", "content", "listing", "visual"],
    usageToday: 18,
    status: "ok",
  },
  {
    name: "客服 · Bob",
    role: "客服",
    agents: ["service"],
    usageToday: 42,
    status: "ok",
  },
  {
    name: "投放 · Carol",
    role: "增长",
    agents: ["growth", "profit", "video"],
    usageToday: 9,
    status: "warn",
  },
];

export function EnterpriseOrgAgentsPage({ onNavigateWorkbench }) {
  function goWorkbench(agentId) {
    if (onNavigateWorkbench) onNavigateWorkbench(agentId);
    else {
      window.location.hash = enterpriseWorkbenchHref(agentId).slice(1);
    }
  }

  return (
    <>
      <EnterpriseBreadcrumbs crumbs={["控制台", "组织", "Agent 开通"]} />
      <PageHeader
        title="Agent 开通与分配"
        description="主账号为子账号配置可用 Agent；子账号登录后在工作台试用，不跳转凡梦官网。"
        actions={
          <button type="button" className="enterprise-btn enterprise-btn-primary" onClick={() => goWorkbench("trend")}>
            预览工作台
          </button>
        }
      />

      <div className="enterprise-panel" style={{ marginBottom: 16 }}>
        <div className="enterprise-panel-head">
          <h2>企业站 Agent 清单</h2>
        </div>
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Agent</th>
              <th>类型</th>
              <th>说明</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {enterpriseWorkbenchAgents.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>
                  {a.enterpriseOnly ? (
                    <span className="enterprise-tag accent">企业增项</span>
                  ) : (
                    <span className="enterprise-tag">凡梦同款</span>
                  )}
                </td>
                <td>{a.desc}</td>
                <td>
                  <button type="button" className="enterprise-btn enterprise-btn-ghost" onClick={() => goWorkbench(a.id)}>
                    在工作台打开
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="enterprise-panel">
        <div className="enterprise-panel-head">
          <h2>子账号 Agent 分配（演示）</h2>
        </div>
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>子账号</th>
              <th>角色</th>
              <th>已开通 Agent</th>
              <th>今日调用</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {mockAccounts.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.role}</td>
                <td>
                  {row.agents
                    .map((id) => enterpriseWorkbenchAgents.find((a) => a.id === id)?.name || id)
                    .join("、")}
                </td>
                <td>{row.usageToday}</td>
                <td>
                  <span className={`enterprise-status-dot ${row.status === "ok" ? "ok" : "warn"}`} />
                  {row.status === "ok" ? "正常" : "接近额度"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
