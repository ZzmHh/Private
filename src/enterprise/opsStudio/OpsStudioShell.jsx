import { useState } from "react";

export function OpsStudioShell({
  studio,
  toolId,
  onToolIdChange,
  user,
  panelHint,
  children,
  showLog,
  logOpen,
  onLogToggle,
  execLog,
}) {
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(studio.groups.map((g) => [g.id, g.defaultOpen !== false])),
  );

  const tool = studio.groups.flatMap((g) => g.tools).find((t) => t.id === toolId);
  const userLabel = user?.name || user?.email || "未登录";

  function toggleGroup(id) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className={`ent-cs-root ent-ops-root ent-ops-root--${studio.id}`}>
      <aside className="ent-cs-sidebar">
        <div className="ent-cs-brand">
          <span className={`ent-cs-brand-mark ent-ops-brand-mark ent-ops-brand-mark--${studio.id}`}>
            {studio.brandMark}
          </span>
          <div>
            <strong>{studio.brandTitle}</strong>
            <small>{studio.brandSubtitle}</small>
          </div>
        </div>

        <nav className="ent-cs-nav" aria-label={`${studio.brandTitle}工具`}>
          {studio.groups.map((group) => (
            <div className="ent-cs-nav-group" key={group.id}>
              <button type="button" className="ent-cs-nav-group-head" onClick={() => toggleGroup(group.id)}>
                <span>{group.label}</span>
                <span className="ent-cs-nav-caret">{openGroups[group.id] ? "⌄" : "›"}</span>
              </button>
              {openGroups[group.id]
                ? group.tools.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      className={`ent-cs-nav-item${t.id === toolId ? " is-active" : ""}`}
                      onClick={() => onToolIdChange(t.id)}
                    >
                      <strong>{t.name}</strong>
                      <span>{t.desc}</span>
                    </button>
                  ))
                : null}
            </div>
          ))}
        </nav>
      </aside>

      <div className="ent-cs-main">
        <header className="ent-cs-header">
          <div>
            <h1>{tool?.name || studio.brandTitle}</h1>
            <p className="ent-cs-header-intro">{studio.intro}</p>
          </div>
          <div className="ent-cs-header-user">
            <span className="ent-cs-user-avatar">{userLabel.slice(0, 1)}</span>
            <span>{userLabel}</span>
          </div>
        </header>

        <section className="ent-cs-panel">
          <div className="ent-cs-panel-head">
            <h2>功能操作区</h2>
            <p>{panelHint || tool?.panelHint || "选择左侧工具开始。"}</p>
          </div>
          {children}
        </section>

        {showLog ? (
          <footer className="ent-cs-log">
            <button type="button" className="ent-cs-log-toggle" onClick={onLogToggle}>
              {logOpen ? "▼" : "▶"} 执行结果（{logOpen ? "点击收起" : "默认折叠" }）
            </button>
            {logOpen ? (
              <pre className="ent-cs-log-body">
                {execLog ? JSON.stringify(execLog, null, 2) : "暂无执行记录"}
              </pre>
            ) : null}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
