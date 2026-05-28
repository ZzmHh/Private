import { enterpriseWorkbenchHref } from "../navConfig.js";
import { workbenchAgentGroups } from "../workbenchConfig.js";
import { EnterpriseIcon } from "../components/EnterpriseIcon.jsx";

export function EnterpriseWorkbenchSidebar({ activeAgentId, collapsed, onNavigate, onToggleCollapsed, isOwner, onOpenShopAuth }) {
  const groups = workbenchAgentGroups();

  function go(agentId, e) {
    e?.preventDefault();
    onNavigate(agentId);
  }

  return (
    <aside className="enterprise-sidebar enterprise-workbench-sidebar">
      <div className="enterprise-workbench-sidebar-head">
        {!collapsed ? (
          <>
            <strong>Agent 工作台</strong>
            <small>子账号在此试用与执行，与凡梦能力对齐</small>
          </>
        ) : null}
      </div>
      <nav className="enterprise-sidebar-nav" aria-label="Agent 工作台导航">
        {groups.map((group) => (
          <div className="enterprise-nav-group" key={group.label}>
            <div className="enterprise-nav-label">{group.label}</div>
            {group.items.map((agent) => {
              const active = agent.id === activeAgentId;
              return (
                <a
                  key={agent.id}
                  href={enterpriseWorkbenchHref(agent.id)}
                  className={`enterprise-nav-item${active ? " is-active" : ""}`}
                  title={collapsed ? agent.name : undefined}
                  onClick={(e) => go(agent.id, e)}
                >
                  <span className="enterprise-nav-icon">
                    <EnterpriseIcon name={agent.icon} />
                  </span>
                  <span className="enterprise-nav-text">
                    {agent.name}
                    {agent.enterpriseOnly ? (
                      <span className="enterprise-nav-badge">企业</span>
                    ) : null}
                  </span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="enterprise-sidebar-foot">
        {isOwner && onOpenShopAuth ? (
          <button
            type="button"
            className="enterprise-btn enterprise-btn-secondary ent-wb-shop-auth-btn"
            style={{ width: "100%", marginBottom: 8 }}
            onClick={onOpenShopAuth}
            title="绑定店铺 API"
          >
            {collapsed ? "店" : "店铺授权 / 绑定 API"}
          </button>
        ) : null}
        <button
          type="button"
          className="enterprise-sidebar-toggle"
          style={{ width: "100%" }}
          onClick={onToggleCollapsed}
        >
          {collapsed ? "›" : "‹ 收起"}
        </button>
        {!collapsed ? <small>当前子账号额度 · 演示</small> : null}
      </div>
    </aside>
  );
}
