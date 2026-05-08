import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  Bot,
  Check,
  Headphones,
  LineChart,
  LockKeyhole,
  PackageSearch,
  PenLine,
  PlugZap,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UploadCloud,
  Zap,
} from "lucide-react";
import "./styles.css";

const pricingPlans = [
  {
    id: "starter",
    name: "尝鲜版",
    price: "99",
    desc: "适合个人卖家试用 AI 工作流。",
    features: ["每日 100 次 Agent 调用", "6 个 Agent 基础使用", "本地文件导入", "任务历史 30 条", "社区/邮件支持"],
  },
  {
    id: "standard",
    name: "标准版",
    price: "299",
    desc: "适合已有店铺、希望稳定提效的卖家。",
    recommended: true,
    features: ["每日 500 次 Agent 调用", "店铺 API 配置", "业绩诊断与利润分析", "AI 客服售后模板", "实时抓取数据源", "优先支持"],
  },
  {
    id: "managed",
    name: "全托版",
    price: "899",
    desc: "适合希望让 Agent 接管日常运营的团队。",
    features: ["每日 2,000 次 Agent 调用", "6 Agent 全自动运行增强", "多店铺/多站点管理", "自动化运营周报", "专属配置协助", "1 对 1 运营建议"],
  },
  {
    id: "enterprise",
    name: "定制版",
    price: "联系定价",
    desc: "适合公司团队、私有化或深度数据集成。",
    features: ["自定义调用量", "ERP/BI/客服系统集成", "企业权限与团队席位", "专属知识库", "私有化部署方案", "专属客户成功经理"],
  },
];

const agents = [
  {
    id: "trend",
    name: "爆款选品监控",
    icon: PackageSearch,
    desc: "监控热卖趋势、竞品、价格带和机会评分。",
    prompt: "帮我监控 TikTok Shop 美国市场家居收纳类目，找适合小卖家的潜力爆品。",
  },
  {
    id: "content",
    name: "爆款内容生成",
    icon: PenLine,
    desc: "生成短视频脚本、分镜、口播和达人 Brief。",
    prompt: "为一款便携式榨汁杯生成 5 条 TikTok 爆款短视频脚本。",
  },
  {
    id: "listing",
    name: "Listing 转化优化",
    icon: Sparkles,
    desc: "生成标题、五点描述、关键词、FAQ 和 A+ 页面结构。",
    prompt: "把这款宠物饮水机优化成 Amazon US 高转化 Listing。",
  },
  {
    id: "growth",
    name: "店铺业绩诊断",
    icon: BarChart3,
    desc: "需要店铺 API 数据，分析 GMV、广告 ROI、退款和库存。",
    prompt: "分析我上周店铺 GMV 下滑的可能原因，并给出诊断框架。",
    requiresStoreApi: true,
  },
  {
    id: "service",
    name: "AI 客服售后",
    icon: Headphones,
    desc: "需要店铺 API/客服工单数据，处理售前、物流、退款和差评。",
    prompt: "客户说包裹延迟并要求退款，请用英文回复并尽量保留订单。",
    requiresStoreApi: true,
  },
  {
    id: "profit",
    name: "广告库存利润",
    icon: LineChart,
    desc: "联动广告、库存、采购成本和平台费用给出利润策略。",
    prompt: "帮我判断 20 个 SKU 哪些应该补货、清仓或暂停广告。",
    requiresStoreApi: true,
  },
];

function LoginScreen({ onLogin }) {
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    storeName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const isRegister = authMode === "register";

  function updateAuthForm(field, value) {
    setAuthForm({ ...authForm, [field]: value });
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthError("");

    if (isRegister && authForm.password !== authForm.confirmPassword) {
      setAuthError("两次输入的密码不一致。");
      return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch(isRegister ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);
      onLogin(data);
    } catch (error) {
      setAuthError(formatError(error));
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="auth-badge">
          <ShieldCheck size={16} />
          登录后自动开启 3 天免费试用
        </div>
        <h1>跨境电商卖家的多 Agent AI 员工后台</h1>
        <p>
          一个客户一个账号，登录后进入订阅制工作台。OpenClaw 会统一接管选品、内容、
          Listing、业绩诊断、客服售后和利润优化 6 个 Agent。
        </p>
        <div className="auth-points">
          <span>
            <Check size={16} /> 账号级订阅
          </span>
          <span>
            <Check size={16} /> 3 天免费试用
          </span>
          <span>
            <Check size={16} /> 店铺 API 授权
          </span>
        </div>
      </section>

      <form className="auth-card" onSubmit={submitAuth}>
        <div className="login-icon">
          {isRegister ? <UserPlus size={22} /> : <LockKeyhole size={22} />}
        </div>
        <h2>{isRegister ? "创建新账号" : "登录你的账号"}</h2>
        <p>
          {isRegister
            ? "注册后自动开启 3 天免费试用，试用结束后再选择订阅套餐。"
            : "当前是产品原型登录，后续可接入真实用户系统、支付订阅和权限控制。"}
        </p>
        {isRegister && (
          <>
            <label>
              姓名
              <input type="text" value={authForm.name} onChange={(event) => updateAuthForm("name", event.target.value)} placeholder="请输入联系人姓名" required />
            </label>
            <label>
              公司或店铺名
              <input type="text" value={authForm.storeName} onChange={(event) => updateAuthForm("storeName", event.target.value)} placeholder="例如：凡梦跨境店铺" required />
            </label>
          </>
        )}
        <label>
          邮箱
          <input type="email" value={authForm.email} onChange={(event) => updateAuthForm("email", event.target.value)} placeholder="seller@example.com" required />
        </label>
        <label>
          密码
          <input type="password" value={authForm.password} onChange={(event) => updateAuthForm("password", event.target.value)} placeholder="输入密码" required />
        </label>
        {isRegister && (
          <label>
            确认密码
            <input type="password" value={authForm.confirmPassword} onChange={(event) => updateAuthForm("confirmPassword", event.target.value)} placeholder="再次输入密码" required />
          </label>
        )}
        {authError && <div className="auth-error">{authError}</div>}
        <button type="submit" disabled={authLoading}>{authLoading ? "处理中..." : isRegister ? "注册并开启 3 天试用" : "登录并进入工作台"}</button>
        <small>{isRegister ? "注册即代表同意订阅服务条款，试用期内不会自动扣费。" : "3 天免费试用，试用期结束后再选择订阅套餐。"}</small>
        <button type="button" className="register-link" onClick={() => setAuthMode(isRegister ? "login" : "register")}>
          {isRegister ? "已有账号？返回登录" : "还没有账号？免费注册"}
        </button>
      </form>
    </main>
  );
}

function formatError(error) {
  return error?.message || "请求失败，请检查后端服务和 OpenClaw 配置。";
}

function readFileAsText(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsText(file);
  });
}

function SubscriptionModal({ onClose }) {
  const [selectedPlanId, setSelectedPlanId] = useState("standard");
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const selectedPlan = pricingPlans.find((plan) => plan.id === selectedPlanId);

  if (checkoutPlan) {
    return (
      <div className="modal-backdrop" role="presentation" onClick={onClose}>
        <section className="checkout-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
          <div className="modal-head">
            <div>
              <p>Checkout</p>
              <h2>确认订阅 {checkoutPlan.name}</h2>
            </div>
            <button type="button" onClick={onClose}>关闭</button>
          </div>
          <div className="checkout-card">
            <div>
              <span>套餐</span>
              <strong>{checkoutPlan.name}</strong>
            </div>
            <div>
              <span>价格</span>
              <strong>{checkoutPlan.price === "联系定价" ? "联系定价" : `¥${checkoutPlan.price}/月`}</strong>
            </div>
            <div>
              <span>开通后权益</span>
              <p>{checkoutPlan.features.join("、")}</p>
            </div>
          </div>
          {checkoutPlan.id === "enterprise" ? (
            <div className="payment-box">
              <h3>定制版需要联系我们</h3>
              <p>请留下联系方式或添加企业微信，后续可接入表单、CRM 或人工客服。</p>
              <button type="button">联系商务定价</button>
            </div>
          ) : (
            <div className="payment-box">
              <h3>付款方式</h3>
              <p>这里是付款界面原型。正式上线时可接入微信支付、支付宝或 Stripe，并在支付成功后自动更新套餐。</p>
              <div className="pay-options">
                <button type="button">微信支付</button>
                <button type="button">支付宝</button>
              </div>
            </div>
          )}
          <button className="back-to-plans" type="button" onClick={() => setCheckoutPlan(null)}>
            返回选择套餐
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="subscription-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p>Subscription</p>
            <h2>选择适合你的凡梦AI套餐</h2>
          </div>
          <button type="button" onClick={onClose}>关闭</button>
        </div>
        <div className="pricing-note">
          这个价格结构是合理的：99 元降低尝试门槛，299 元适合作为主力套餐，899 元覆盖高频运营团队，定制版承接企业客户。
        </div>
        <div className="subscription-grid">
          {pricingPlans.map((plan) => (
            <article
              className={[
                "sub-plan",
                plan.recommended ? "recommended" : "",
                selectedPlanId === plan.id ? "selected" : "",
              ].filter(Boolean).join(" ")}
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              {plan.recommended && <span className="sub-badge">推荐</span>}
              {selectedPlanId === plan.id && <span className="selected-badge">已选中</span>}
              <h3>{plan.name}</h3>
              <p>{plan.desc}</p>
              <div className="sub-price">
                {plan.price === "联系定价" ? (
                  <strong>联系定价</strong>
                ) : (
                  <>
                    <span>¥</span>
                    <strong>{plan.price}</strong>
                    <em>/月</em>
                  </>
                )}
              </div>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={15} /> {feature}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedPlanId(plan.id); setCheckoutPlan(plan); }}>
                {plan.id === "enterprise" ? "联系我们" : "选择套餐"}
              </button>
            </article>
          ))}
        </div>
        {selectedPlan && (
          <button className="continue-checkout" type="button" onClick={() => setCheckoutPlan(selectedPlan)}>
            继续开通 {selectedPlan.name}
          </button>
        )}
      </section>
    </div>
  );
}

function Workspace() {
  const [activeId, setActiveId] = useState("autopilot");
  const [token, setToken] = useState(() => localStorage.getItem("fanmeng_token") || "");
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showSubscription, setShowSubscription] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [answer, setAnswer] = useState("登录后已开启 3 天免费试用。请选择左侧模块，输入要求后由 OpenClaw 生成结果。");
  const [input, setInput] = useState(agents[0].prompt);
  const [autoInput, setAutoInput] = useState("我是 Amazon 美国站卖家，想做宠物用品类目，预算有限，适合新卖家，优先选择轻小件。");
  const [scrapeConfig, setScrapeConfig] = useState({
    enabled: false,
    platform: "TikTok Shop",
    market: "美国",
    category: "宠物用品",
    url: "https://www.tiktokshuju.com/goods/hot-sale",
  });
  const [storeConfig, setStoreConfig] = useState({
    platform: "Amazon",
    storeName: "",
    apiEndpoint: "",
    apiToken: "",
  });
  const [attachments, setAttachments] = useState([]);

  const activeAgent = useMemo(() => agents.find((agent) => agent.id === activeId), [activeId]);
  const storeConnected = Boolean(storeConfig.storeName && storeConfig.apiEndpoint && storeConfig.apiToken);

  useEffect(() => {
    if (!token) return;

    fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setUser(data.user);
        setTasks(data.tasks || []);
      })
      .catch(() => {
        localStorage.removeItem("fanmeng_token");
        setToken("");
        setUser(null);
      });
  }, [token]);

  function handleLogin(data) {
    localStorage.setItem("fanmeng_token", data.token);
    setToken(data.token);
    setUser(data.user);
    setTasks(data.tasks || []);
  }

  function logout() {
    localStorage.removeItem("fanmeng_token");
    setToken("");
    setUser(null);
    setTasks([]);
  }

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  function selectAgent(id) {
    setActiveId(id);
    setAnswer("");
    const selected = agents.find((agent) => agent.id === id);
    if (selected) {
      setInput(selected.prompt);
    }
  }

  async function handleLocalImport(event) {
    const files = Array.from(event.target.files || []);
    const nextAttachments = await Promise.all(
      files.map(async (file) => {
        const isReadableText =
          file.type.startsWith("text/") ||
          /\.(csv|json|md|txt|log|html|xml)$/i.test(file.name);
        const content = isReadableText ? (await readFileAsText(file)).slice(0, 12000) : "";

        return {
          name: file.name,
          type: file.type || "未知类型",
          size: file.size,
          content,
          isImage: file.type.startsWith("image/"),
        };
      }),
    );

    setAttachments(nextAttachments);
    event.target.value = "";
  }

  function buildAttachmentContext() {
    if (!attachments.length) return "";

    return [
      "",
      "用户本地导入的附件：",
      ...attachments.map((file, index) => {
        const basic = `${index + 1}. ${file.name}（${file.type}，${Math.ceil(file.size / 1024)}KB）`;

        if (file.content) {
          return `${basic}\n文件文本内容摘录：\n${file.content}`;
        }

        if (file.isImage) {
          return `${basic}\n这是图片附件。当前版本先记录图片信息；后续接入视觉模型后可自动识别图片内容。`;
        }

        return `${basic}\n当前文件类型暂不自动解析内容，已作为附件信息提供。`;
      }),
    ].join("\n");
  }

  async function runAutopilot() {
    setIsRunning(true);
    setAnswer("OpenClaw 正在调度 6 个 Agent 自动生成完整方案...");
    try {
      const response = await fetch("/api/autopilot/run", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          input: `${autoInput}${buildAttachmentContext()}`,
          scrape: scrapeConfig.enabled ? scrapeConfig : { enabled: false },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAnswer(data.answer);
      if (data.task) setTasks((current) => [data.task, ...current].slice(0, 30));
    } catch (error) {
      setAnswer(formatError(error));
    } finally {
      setIsRunning(false);
    }
  }

  async function runAgent() {
    if (activeAgent?.requiresStoreApi && !storeConnected) {
      setAnswer("该 Agent 需要先配置店铺 API。请在结果区顶部的“店铺 API 配置”中填写店铺名称、接口地址和 Token。");
      return;
    }

    setIsRunning(true);
    setAnswer(`${activeAgent.name} 正在由 OpenClaw 接管执行...`);
    try {
      const response = await fetch("/api/agents/run", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          agentId: activeAgent.id,
          input: [
            input,
            buildAttachmentContext(),
            storeConnected
              ? `\n店铺 API 已配置：平台 ${storeConfig.platform}，店铺 ${storeConfig.storeName}，接口 ${storeConfig.apiEndpoint}。`
              : "",
          ].join(""),
          scrape: activeAgent.id === "trend" && scrapeConfig.enabled ? scrapeConfig : { enabled: false },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAnswer(data.answer);
      if (data.task) setTasks((current) => [data.task, ...current].slice(0, 30));
    } catch (error) {
      setAnswer(formatError(error));
    } finally {
      setIsRunning(false);
    }
  }

  const ActiveIcon = activeAgent?.icon || Rocket;
  const canUseScraper = activeId === "autopilot" || activeAgent?.id === "trend";

  return (
    <main className="app-shell">
      {showSubscription && <SubscriptionModal onClose={() => setShowSubscription(false)} />}
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="brand-mark">
            <Sparkles size={18} />
          </span>
          <div>
            <strong>凡梦AI</strong>
            <small>{user?.trialActive ? "3 天免费试用中" : user?.planName || "订阅状态"}</small>
          </div>
        </div>

        <div className="account-card">
          <strong>{user?.storeName || user?.name || "跨境卖家"}</strong>
          <span>{user?.email}</span>
          <button type="button" onClick={() => setShowSubscription(true)}>查看/升级订阅</button>
          <button type="button" onClick={logout}>退出登录</button>
        </div>

        <button className={activeId === "autopilot" ? "side-item active" : "side-item"} onClick={() => setActiveId("autopilot")}>
          <span>
            <Rocket size={19} />
          </span>
          <div>
            <strong>6 Agent 全自动运行</strong>
            <small>输入平台/市场/类目，一键生成完整方案</small>
          </div>
        </button>

        <div className="side-label">专业 Agent</div>
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <button key={agent.id} className={activeId === agent.id ? "side-item active" : "side-item"} onClick={() => selectAgent(agent.id)}>
              <span>
                <Icon size={18} />
              </span>
              <div>
                <strong>{agent.name}</strong>
                <small>{agent.desc}</small>
              </div>
            </button>
          );
        })}

        <div className="side-label">任务历史</div>
        <div className="history-list">
          {tasks.length ? (
            tasks.slice(0, 5).map((task) => (
              <button key={task.id} type="button" onClick={() => setAnswer(task.answer)}>
                <strong>{task.title}</strong>
                <small>{new Date(task.createdAt).toLocaleString()}</small>
              </button>
            ))
          ) : (
            <p>暂无历史任务</p>
          )}
        </div>
      </aside>

      <section className="work-area">
        <header className="work-header">
          <div>
            <p>OpenClaw Agent Console</p>
            <h2>{activeId === "autopilot" ? "6 Agent 全自动运行" : activeAgent.name}</h2>
          </div>
          <div className="trial-pill">
            <Zap size={16} />
            {user?.trialActive ? "免费试用中" : user?.planName || "订阅状态"}
          </div>
          <button className="header-subscribe" type="button" onClick={() => setShowSubscription(true)}>
            订阅套餐
          </button>
        </header>

        <div className="content-layout">
          {activeAgent?.requiresStoreApi && (
            <section className="store-api-strip">
              <div className="config-title">
                <PlugZap size={17} />
                店铺 API 配置
              </div>
              <p>
                {activeAgent.name} 需要卖家授权店铺 API、广告数据、库存数据或客服工单数据，OpenClaw 才能做真实诊断。
              </p>
              <div className="store-api-form">
                <input value={storeConfig.storeName} onChange={(event) => setStoreConfig({ ...storeConfig, storeName: event.target.value })} placeholder="店铺名称" />
                <input value={storeConfig.apiEndpoint} onChange={(event) => setStoreConfig({ ...storeConfig, apiEndpoint: event.target.value })} placeholder="店铺 API Endpoint" />
                <input value={storeConfig.apiToken} onChange={(event) => setStoreConfig({ ...storeConfig, apiToken: event.target.value })} placeholder="API Token / Access Key" />
              </div>
              <div className={storeConnected ? "status-ok" : "status-warn"}>
                {storeConnected ? "已配置，当前 Agent 可使用店铺数据执行" : "未配置，当前 Agent 会先提示授权"}
              </div>
            </section>
          )}

          <section className="output-panel">
            <div className="output-top">
              <div className="output-icon">
                <ActiveIcon size={24} />
              </div>
              <div>
                <h3>{activeId === "autopilot" ? "自动生成结果" : `${activeAgent.name} 输出`}</h3>
                <p>{activeId === "autopilot" ? "OpenClaw 会按 6 个 Agent 的顺序自动生成跨境运营方案。" : activeAgent.desc}</p>
              </div>
            </div>
            <pre>{answer || "等待输入要求..."}</pre>
          </section>
        </div>

        <section className="composer">
          {canUseScraper && (
            <div className="scrape-config">
              <label className="scrape-toggle">
                <input
                  type="checkbox"
                  checked={scrapeConfig.enabled}
                  onChange={(event) => setScrapeConfig({ ...scrapeConfig, enabled: event.target.checked })}
                />
                启用 Python/Playwright 实时抓取数据源
              </label>
              {scrapeConfig.enabled && (
                <div className="scrape-fields">
                  <input value={scrapeConfig.platform} onChange={(event) => setScrapeConfig({ ...scrapeConfig, platform: event.target.value })} placeholder="平台" />
                  <input value={scrapeConfig.market} onChange={(event) => setScrapeConfig({ ...scrapeConfig, market: event.target.value })} placeholder="市场" />
                  <input value={scrapeConfig.category} onChange={(event) => setScrapeConfig({ ...scrapeConfig, category: event.target.value })} placeholder="类目" />
                  <input value={scrapeConfig.url} onChange={(event) => setScrapeConfig({ ...scrapeConfig, url: event.target.value })} placeholder="抓取 URL" />
                </div>
              )}
            </div>
          )}
          {attachments.length > 0 && (
            <div className="attachment-row">
              {attachments.map((file) => (
                <span key={`${file.name}-${file.size}`}>{file.isImage ? "图片" : "文件"}：{file.name}</span>
              ))}
            </div>
          )}
          {activeId === "autopilot" ? (
            <div className="auto-form">
              <textarea value={autoInput} onChange={(event) => setAutoInput(event.target.value)} placeholder="例如：我是 Amazon 美国站卖家，想做宠物用品类目，预算有限，希望系统自动生成选品、内容、Listing、客服、业绩和利润方案。" />
              <label className="import-btn">
                <UploadCloud size={17} />
                本地导入
                <input type="file" multiple accept="image/*,.csv,.json,.md,.txt,.log,.html,.xml,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleLocalImport} />
              </label>
              <button onClick={runAutopilot} disabled={isRunning}>
                <Send size={17} /> {isRunning ? "运行中..." : "全自动生成"}
              </button>
            </div>
          ) : (
            <div className="agent-composer">
              <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="输入你的具体要求..." />
              <label className="import-btn">
                <UploadCloud size={17} />
                本地导入
                <input type="file" multiple accept="image/*,.csv,.json,.md,.txt,.log,.html,.xml,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleLocalImport} />
              </label>
              <button onClick={runAgent} disabled={isRunning}>
                <Bot size={17} /> {isRunning ? "生成中..." : "发送给 Agent"}
              </button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<Workspace />);
