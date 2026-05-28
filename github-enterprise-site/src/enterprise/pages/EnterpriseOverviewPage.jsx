import { EnterpriseBreadcrumbs } from "../layout/EnterpriseBreadcrumbs.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { KpiStrip } from "../components/KpiStrip.jsx";
import { EnterpriseShopSetupWizard } from "../components/EnterpriseShopSetupWizard.jsx";

const mockSubAccounts = [
  { name: "北美 TikTok 主店", owner: "Alice", shops: 3, csToday: 128, status: "ok" },
  { name: "欧洲 TikTok 店", owner: "Bob", shops: 2, csToday: 64, status: "ok" },
  { name: "测试子账号", owner: "Carol", shops: 1, csToday: 12, status: "warn" },
  { name: "已停用账号", owner: "—", shops: 0, csToday: 0, status: "off" },
];

const mockActivity = [
  { time: "10:32", text: "子账号「北美 TikTok 主店」自动回复 24 条会话" },
  { time: "09:15", text: "API 任务「同步订单」完成，写入 156 条" },
  { time: "昨天", text: "管理员为 Bob 分配「客服监控」权限" },
  { time: "昨天", text: "店铺 TikTok TH-001 OAuth 刷新成功" },
];

function statusLabel(status) {
  if (status === "ok") return { dot: "ok", text: "正常" };
  if (status === "warn") return { dot: "warn", text: "需关注" };
  return { dot: "off", text: "停用" };
}

export function EnterpriseOverviewPage({ isOwner, onOpenWorkbench, onOpenShopAuth }) {
  return (
    <>
      <EnterpriseBreadcrumbs crumbs={["控制台", "总览"]} />
      <PageHeader
        title="企业总览"
        description="主账号跨子账号监控；子账号在「Agent 工作台」试用与执行，不离开本企业站。"
        actions={
          <>
            {isOwner ? (
              <button type="button" className="enterprise-btn enterprise-btn-primary" onClick={onOpenShopAuth}>
                店铺授权 / 绑定 API
              </button>
            ) : null}
            <button type="button" className="enterprise-btn enterprise-btn-secondary" onClick={onOpenWorkbench}>
              进入 Agent 工作台
            </button>
          </>
        }
      />

      <EnterpriseShopSetupWizard isOwner={isOwner} onGoBind={onOpenShopAuth} />

      <KpiStrip
        items={[
          { label: "今日 GMV", value: "¥128,400", meta: "较昨日 +12%" },
          { label: "待处理订单", value: "342", meta: "3 个子账号" },
          { label: "客服会话", value: "204", meta: "自动回复率 68%" },
          { label: "API 任务", value: "12", meta: "2 个排队中" },
        ]}
      />

      <div className="enterprise-grid-2">
        <section className="enterprise-panel">
          <div className="enterprise-panel-head">
            <h2>子账号</h2>
            <span className="enterprise-tag accent">{mockSubAccounts.length} 个</span>
          </div>
          <div className="enterprise-panel-body">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>负责人</th>
                  <th>店铺</th>
                  <th>今日会话</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {mockSubAccounts.map((row) => {
                  const st = statusLabel(row.status);
                  return (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.owner}</td>
                      <td>{row.shops}</td>
                      <td>{row.csToday}</td>
                      <td>
                        <span className={`enterprise-status-dot ${st.dot}`} />
                        {st.text}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="enterprise-panel">
          <div className="enterprise-panel-head">
            <h2>最近动态</h2>
          </div>
          <ul className="enterprise-activity-list">
            {mockActivity.map((a) => (
              <li key={a.time + a.text}>
                <strong>{a.time}</strong> · {a.text}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

