import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { EnterpriseApp } from "./EnterpriseApp.jsx";
import { EnterpriseLoginPage } from "./pages/EnterpriseLoginPage.jsx";
import {
  fetchEnterpriseSession,
  loginEnterprise,
  logoutEnterprise,
  setStoredEnterpriseToken,
} from "./auth/enterpriseAuth.js";
import { enterpriseDefaultHash } from "./enterpriseRoles.js";
import { getEnterpriseSiteConfig } from "./config/siteConfig.js";
import "./enterprise.css";

function EnterpriseRoot() {
  const [token, setToken] = useState(() => localStorage.getItem("enterprise_token") || "");
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(token));
  const site = getEnterpriseSiteConfig();

  useEffect(() => {
    document.title = site.orgName;
  }, [site.orgName]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setBooting(false);
      return undefined;
    }

    let cancelled = false;
    setBooting(true);

    fetchEnterpriseSession(token)
      .then((sessionUser) => {
        if (cancelled) return;
        if (!sessionUser) {
          setToken("");
          setUser(null);
          return;
        }
        setUser(sessionUser);
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleLogin = useCallback(async ({ loginName, password }) => {
    const data = await loginEnterprise({ loginName, password });
    setStoredEnterpriseToken(data.token);
    setToken(data.token);
    setUser(data.user);
    const landing = enterpriseDefaultHash(data.user);
    window.location.hash = landing.slice(1);
    window.scrollTo(0, 0);
  }, []);

  const handleLogout = useCallback(() => {
    logoutEnterprise();
    setToken("");
    setUser(null);
    window.location.hash = "";
    window.scrollTo(0, 0);
  }, []);

  if (booting) {
    return (
      <div className="enterprise-root enterprise-login enterprise-login--boot">
        <div className="enterprise-login-boot">正在验证登录状态…</div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="enterprise-root">
        <EnterpriseLoginPage onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <EnterpriseApp
      user={user}
      standalone
      onLogout={handleLogout}
    />
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <EnterpriseRoot />
  </StrictMode>,
);
