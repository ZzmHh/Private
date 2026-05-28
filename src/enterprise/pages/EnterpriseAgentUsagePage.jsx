import { EnterpriseBreadcrumbs } from "../layout/EnterpriseBreadcrumbs.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { KpiStrip } from "../components/KpiStrip.jsx";
import { enterpriseWorkbenchAgents } from "../workbenchConfig.js";

const mockUsage = [
  { account: "北美运营 · Alice", trend: 6, content: 8, listing: 4, visual: 2, video: 0 },
  { account: "客服 · Bob", service: 42 },
  { account: "投放 · Carol", growth: 3, profit: 4, video: 2 },
];

export function EnterpriseAgentUsagePage() {
  return (
    <>
      <EnterpriseBreadcrumbs crumbs={["控制台", "监控", "Agent 用量"]} />
      <PageHeader
        title="Agent 用量"
        description="主账号查看各子账号在企业工作台内的 Agent 调用汇总（子账号在工作台内实际操作）。"
      />
      <KpiStrip
        items={[
          { label: "今日总调用", value: "69", meta: "3 个子账号" },
          { label: "最活跃 Agent", value: "智能客服", meta: "42 次" },
          { label: "企业增项调用", value: "6", meta: "图文 + 视频" },
          { label: "额度剩余", value: "93%", meta: "企业包月" },
        ]}
      />
      <div className="enterprise-panel">
        <div className="enterprise-panel-head">
          <h2>按子账号 · 按 Agent（演示）</h2>
        </div>
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>子账号</th>
              {enterpriseWorkbenchAgents.slice(0, 6).map((a) => (
                <th key={a.id}>{a.name.replace(/Agent|监控|生成|优化/g, "").slice(0, 4)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockUsage.map((row) => (
              <tr key={row.account}>
                <td>{row.account}</td>
                {enterpriseWorkbenchAgents.slice(0, 6).map((a) => (
                  <td key={a.id}>{row[a.id] ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
