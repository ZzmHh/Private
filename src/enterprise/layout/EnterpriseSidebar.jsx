import { enterpriseConsoleNavGroups, enterpriseHref } from "../navConfig.js";
import { EnterpriseIcon } from "../components/EnterpriseIcon.jsx";

export function EnterpriseSidebar({ activePath, collapsed, onNavigate, onToggleCollapsed }) {
  function go(path, e) {
    e?.preventDefault();
    onNavigate(path);
  }

  return (
    <aside className="enterprise-sidebar">
      <nav className="enterprise-sidebar-nav" aria-label="企业控制台导航">
        {enterpriseConsoleNavGroups.map((group) => (
          <div className="enterprise-nav-group" key={group.id}>
            <div className="enterprise-nav-label">{group.label}</div>
            {group.items.map((item) => {
              const active = item.path === activePath;
              return (
                <a
                  key={item.id}
                  href={enterpriseHref(item.path)}
                  className={`enterprise-nav-item${active ? " is-active" : ""}`}
                  title={collapsed ? item.label : undefined}
                  onClick={(e) => go(item.path, e)}
                >
                  <span className="enterprise-nav-icon">
                    <EnterpriseIcon name={item.icon} />
                  </span>
                  <span className="enterprise-nav-text">{item.label}</span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="enterprise-sidebar-foot">
        <button
          type="button"
          className="enterprise-sidebar-toggle"
          style={{ width: "100%" }}
          onClick={onToggleCollapsed}
        >
          {collapsed ? "›" : "‹ 收起"}
        </button>
        {!collapsed ? <small>主账号 · 监控与管理</small> : null}
      </div>
    </aside>
  );
}
