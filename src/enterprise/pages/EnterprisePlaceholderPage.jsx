import { EnterpriseBreadcrumbs } from "../layout/EnterpriseBreadcrumbs.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function EnterprisePlaceholderPage({ route }) {
  const groupLabel = route?.group?.label || "模块";
  const pageLabel = route?.item?.label || route?.path || "页面";

  return (
    <>
      <EnterpriseBreadcrumbs crumbs={["控制台", route?.group?.label || "模块", pageLabel]} />
      <PageHeader
        title={pageLabel}
        description={`${groupLabel} · 主账号监控视图。子账号实际操作请切换到顶栏「Agent 工作台」。`}
        actions={
          <button type="button" className="enterprise-btn enterprise-btn-secondary">
            配置
          </button>
        }
      />
      <div className="enterprise-panel">
        <div className="enterprise-placeholder">
          <span className="enterprise-tag">框架预览</span>
          <h2>{pageLabel}</h2>
          <p>
            路由：<code>#enterprise/{route?.path || ""}</code>
          </p>
          <p style={{ marginTop: 16, maxWidth: 480, marginInline: "auto" }}>
            控制台用于主账号查看与管理；Agent 执行在
            <code> #enterprise/workbench/* </code>
            完成，能力对齐凡梦并含图文美化、AI 视频等企业增项。
          </p>
        </div>
      </div>
    </>
  );
}
