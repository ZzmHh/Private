import { EnterpriseTopBar } from "./EnterpriseTopBar.jsx";
import { EnterpriseSidebar } from "./EnterpriseSidebar.jsx";
import { EnterpriseWorkbenchSidebar } from "./EnterpriseWorkbenchSidebar.jsx";

export function EnterpriseShell({
  mode,
  activePath,
  activeAgentId,
  orgName,
  user,
  roleLabel,
  isOwner = true,
  standalone = false,
  onModeSwitch,
  onExit,
  onNavigate,
  onNavigateAgent,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenShopAuth,
  children,
}) {
  const isWorkbench = mode === "workbench";

  return (
    <div
      className={`enterprise-shell enterprise-shell--${mode}${sidebarCollapsed ? " is-collapsed" : ""}${isWorkbench ? " enterprise-shell--workbench" : ""}`}
    >
      <EnterpriseTopBar
        mode={mode}
        orgName={orgName}
        user={user}
        roleLabel={roleLabel}
        isOwner={isOwner}
        standalone={standalone}
        onModeSwitch={onModeSwitch}
        onExit={onExit}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        onOpenShopAuth={onOpenShopAuth}
      />
      {isWorkbench ? (
        <EnterpriseWorkbenchSidebar
          activeAgentId={activeAgentId}
          collapsed={sidebarCollapsed}
          onNavigate={onNavigateAgent}
          onToggleCollapsed={onToggleSidebar}
          isOwner={isOwner}
          onOpenShopAuth={onOpenShopAuth}
        />
      ) : (
        <EnterpriseSidebar
          activePath={activePath}
          collapsed={sidebarCollapsed}
          onNavigate={onNavigate}
          onToggleCollapsed={onToggleSidebar}
        />
      )}
      <main className={`enterprise-main${isWorkbench ? " enterprise-main--workbench" : ""}`}>
        <div className={`enterprise-main-inner${isWorkbench ? " enterprise-main-inner--workbench" : ""}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
