import { useCallback, useEffect, useMemo, useState } from "react";
import { EnterpriseShell } from "./layout/EnterpriseShell.jsx";
import { enterpriseHref, enterpriseWorkbenchHref, parseEnterpriseRoute } from "./navConfig.js";
import { enterpriseModeHref } from "./layout/EnterpriseModeSwitch.jsx";
import { defaultWorkbenchAgentId } from "./workbenchConfig.js";
import {
  enterpriseDefaultHash,
  enterpriseGuardHash,
  getEnterpriseRoleLabel,
  isEnterpriseOwner,
  resolveEnterpriseLandingHash,
} from "./enterpriseRoles.js";
import { EnterpriseOverviewPage } from "./pages/EnterpriseOverviewPage.jsx";
import { goToShopAuthorization } from "./components/EnterpriseShopBindPrompt.jsx";
import { EnterprisePlaceholderPage } from "./pages/EnterprisePlaceholderPage.jsx";
import { EnterpriseWorkbenchPage } from "./pages/EnterpriseWorkbenchPage.jsx";
import { EnterpriseOrgAgentsPage } from "./pages/EnterpriseOrgAgentsPage.jsx";
import { EnterpriseOrgShopsPage } from "./pages/EnterpriseOrgShopsPage.jsx";
import { EnterpriseAgentUsagePage } from "./pages/EnterpriseAgentUsagePage.jsx";
import { EnterpriseScopeProvider } from "./scope/EnterpriseScopeContext.jsx";
import "./enterprise.css";

function readRouteHash() {
  return String(window.location.hash || "").replace(/^#/, "").trim();
}

export function EnterpriseApp({ user, onExit, onLogout, standalone = false }) {
  const [routeHash, setRouteHash] = useState(readRouteHash);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const route = parseEnterpriseRoute(routeHash) || {
    mode: "console",
    path: "console/overview",
    agentId: null,
    item: null,
    group: null,
  };

  const isOwner = useMemo(() => isEnterpriseOwner(user), [user]);

  useEffect(() => {
    if (!user) return;

    const guard = enterpriseGuardHash(user, route);
    if (guard) {
      window.location.hash = guard.slice(1);
      return;
    }

    const raw = readRouteHash();
    const bareEnterprise = raw === "enterprise" || raw === "enterprise/";
    if (bareEnterprise) {
      const landing = enterpriseDefaultHash(user);
      window.location.hash = landing.slice(1);
    }
  }, [user, route.mode, route.path, route.agentId]);

  useEffect(() => {
    function onHashChange() {
      setRouteHash(readRouteHash());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (route.mode === "workbench") {
      setSidebarCollapsed(true);
    }
  }, [route.mode]);

  const navigateConsole = useCallback((path) => {
    window.location.hash = enterpriseHref(path).slice(1);
    window.scrollTo(0, 0);
  }, []);

  const navigateAgent = useCallback((agentId) => {
    window.location.hash = enterpriseWorkbenchHref(agentId).slice(1);
    window.scrollTo(0, 0);
  }, []);

  const switchMode = useCallback(
    (nextMode) => {
      if (!isOwner && nextMode === "console") return;
      const href = enterpriseModeHref(nextMode, route.agentId || defaultWorkbenchAgentId());
      window.location.hash = href.slice(1);
      window.scrollTo(0, 0);
    },
    [route.agentId, isOwner],
  );

  const orgName = user?.orgName || user?.company || "企业 AI 工作台";
  const roleLabel = getEnterpriseRoleLabel(user);
  const handleExit = onLogout || onExit;

  let page = <EnterprisePlaceholderPage route={route} />;
  if (route.mode === "workbench") {
    page = <EnterpriseWorkbenchPage agentId={route.agentId} user={user} />;
  } else if (route.path === "console/overview") {
    page = (
      <EnterpriseOverviewPage
        isOwner={isOwner}
        onOpenWorkbench={() => navigateAgent(defaultWorkbenchAgentId())}
        onOpenShopAuth={goToShopAuthorization}
      />
    );
  } else if (route.path === "console/org/agents") {
    page = <EnterpriseOrgAgentsPage onNavigateWorkbench={navigateAgent} />;
  } else if (route.path === "console/org/shops") {
    page = <EnterpriseOrgShopsPage />;
  } else if (route.path === "console/monitor/usage") {
    page = <EnterpriseAgentUsagePage />;
  }

  return (
    <EnterpriseScopeProvider mode={route.mode} isOwner={isOwner}>
      <div className="enterprise-root">
        <EnterpriseShell
          mode={route.mode}
          activePath={route.path}
          activeAgentId={route.agentId || defaultWorkbenchAgentId()}
          orgName={orgName}
          user={user}
          roleLabel={roleLabel}
          isOwner={isOwner}
          standalone={standalone}
          onModeSwitch={switchMode}
          onExit={handleExit}
          onNavigate={navigateConsole}
          onNavigateAgent={navigateAgent}
          onOpenShopAuth={goToShopAuthorization}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        >
          {page}
        </EnterpriseShell>
      </div>
    </EnterpriseScopeProvider>
  );
}

export { parseEnterpriseRoute } from "./navConfig.js";
export {
  enterpriseDefaultHash,
  getEnterpriseRoleLabel,
  isEnterpriseOwner,
  resolveEnterpriseLandingHash,
} from "./enterpriseRoles.js";
