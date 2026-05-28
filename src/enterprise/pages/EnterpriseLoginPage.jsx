import { useEffect, useRef, useState } from "react";
import { EnterpriseIcon } from "../components/EnterpriseIcon.jsx";
import { getEnterpriseSiteConfig } from "../config/siteConfig.js";

const HIGHLIGHTS = [
  {
    icon: "cpu",
    title: "Agent 工作台",
    desc: "Listing、内容、客服、业绩与利润，统一入口执行",
  },
  {
    icon: "shield",
    title: "组织管控",
    desc: "管理员创建子账号，分配权限，离职一键禁用",
  },
  {
    icon: "bar-chart",
    title: "数据隔离",
    desc: "子账号仅访问授权范围，主账号全局监控",
  },
];

const SHOWCASE_AGENTS = [
  { label: "Listing", tone: "blue" },
  { label: "智能客服", tone: "green" },
  { label: "业绩诊断", tone: "amber" },
  { label: "利润精算", tone: "violet" },
];

const SHOWCASE_STATS = [
  { label: "今日 Agent 调用", value: "128" },
  { label: "自动回复率", value: "68%" },
  { label: "活跃子账号", value: "12" },
];

function normalizeLoginName(value) {
  return String(value || "").trim();
}

export function EnterpriseLoginPage({ onLogin, loading: externalLoading = false }) {
  const site = getEnterpriseSiteConfig();
  const loginRef = useRef(null);
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loginRef.current?.focus();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const name = normalizeLoginName(loginName);
    if (!name) {
      setError("请填写账号名。");
      return;
    }
    if (!password) {
      setError("请填写密码。");
      return;
    }

    setLoading(true);
    try {
      await onLogin({ loginName: name, password });
    } catch (err) {
      setError(err?.message || "登录失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || externalLoading;

  return (
    <div className="enterprise-login">
      <div className="enterprise-login-shell">
        <aside className="enterprise-login-brand">
          <div className="enterprise-login-brand-bg" aria-hidden="true">
            <span className="enterprise-login-orb enterprise-login-orb--a" />
            <span className="enterprise-login-orb enterprise-login-orb--b" />
            <span className="enterprise-login-orb enterprise-login-orb--c" />
            <span className="enterprise-login-grid" />
          </div>

          <div className="enterprise-login-brand-inner">
            <header className="enterprise-login-hero">
              <div className="enterprise-login-logo">
                <span className="enterprise-login-logo-mark">{site.brandMark}</span>
                <div>
                  <span className="enterprise-login-eyebrow">Enterprise AI Platform</span>
                  <strong>{site.orgName}</strong>
                  <p>{site.tagline}</p>
                </div>
              </div>
            </header>

            <div className="enterprise-login-showcase" aria-hidden="true">
              <div className="enterprise-login-showcase-card enterprise-login-showcase-card--main">
                <div className="enterprise-login-showcase-head">
                  <span className="enterprise-login-showcase-badge">
                    <EnterpriseIcon name="sparkles" size={14} />
                    工作台预览
                  </span>
                  <span className="enterprise-login-showcase-live">运行中</span>
                </div>
                <div className="enterprise-login-showcase-stats">
                  {SHOWCASE_STATS.map((item) => (
                    <div key={item.label} className="enterprise-login-showcase-stat">
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="enterprise-login-showcase-agents">
                  {SHOWCASE_AGENTS.map((agent) => (
                    <span
                      key={agent.label}
                      className={`enterprise-login-agent-pill enterprise-login-agent-pill--${agent.tone}`}
                    >
                      {agent.label}
                    </span>
                  ))}
                </div>
                <div className="enterprise-login-showcase-feed">
                  <div className="enterprise-login-feed-row">
                    <span className="enterprise-login-feed-dot is-green" />
                    <span>客服 Agent 自动回复 24 条会话</span>
                    <time>刚刚</time>
                  </div>
                  <div className="enterprise-login-feed-row">
                    <span className="enterprise-login-feed-dot is-blue" />
                    <span>Listing 生成任务已完成</span>
                    <time>2 分钟前</time>
                  </div>
                </div>
              </div>

              <div className="enterprise-login-showcase-card enterprise-login-showcase-card--float enterprise-login-showcase-card--top">
                <EnterpriseIcon name="message-square" size={16} />
                <div>
                  <strong>智能客服</strong>
                  <span>FAQ 命中率 92%</span>
                </div>
              </div>

              <div className="enterprise-login-showcase-card enterprise-login-showcase-card--float enterprise-login-showcase-card--bottom">
                <EnterpriseIcon name="trending-up" size={16} />
                <div>
                  <strong>业绩诊断</strong>
                  <span>GMV +12.4%</span>
                </div>
              </div>
            </div>

            <ul className="enterprise-login-highlights">
              {HIGHLIGHTS.map((item) => (
                <li key={item.title}>
                  <span className="enterprise-login-highlight-icon">
                    <EnterpriseIcon name={item.icon} size={18} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="enterprise-login-brand-foot">
              <span className="enterprise-login-internal-badge">内部系统</span>
              <p>本系统仅供 {site.orgName} 内部使用</p>
            </footer>
          </div>
        </aside>

        <main className="enterprise-login-main">
          <div className="enterprise-login-card">
            <header className="enterprise-login-card-head">
              <h1>登录</h1>
              <p>使用管理员分配的账号名登录</p>
            </header>

            {error ? (
              <div className="enterprise-login-error" role="alert">
                {error}
              </div>
            ) : null}

            <form className="enterprise-login-form" onSubmit={handleSubmit} noValidate>
              <label className="enterprise-login-field">
                <span>账号名</span>
                <input
                  ref={loginRef}
                  type="text"
                  name="loginName"
                  autoComplete="username"
                  placeholder="例如 ops001"
                  value={loginName}
                  disabled={busy}
                  onChange={(e) => setLoginName(e.target.value)}
                />
              </label>

              <label className="enterprise-login-field">
                <span>密码</span>
                <div className="enterprise-login-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="请输入密码"
                    value={password}
                    disabled={busy}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="enterprise-login-password-toggle"
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                    disabled={busy}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "隐藏" : "显示"}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                className="enterprise-btn enterprise-btn-primary enterprise-login-submit"
                disabled={busy}
              >
                {busy ? "登录中…" : "登录"}
              </button>
            </form>

            <footer className="enterprise-login-foot">
              <p>{site.supportHint}</p>
              {import.meta.env.DEV ? (
                <p className="enterprise-login-dev-hint">
                  开发环境默认主账号：<code>admin</code> / <code>admin123</code>
                </p>
              ) : null}
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
