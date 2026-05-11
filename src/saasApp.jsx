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
    access: "开放选品、内容、Listing 三个基础 Agent；不含实时抓取和店铺 API 强数据 Agent。",
  },
  {
    id: "standard",
    name: "标准版",
    price: "299",
    desc: "适合已有店铺、希望稳定提效的卖家。",
    recommended: true,
    features: ["每日 500 次 Agent 调用", "店铺 API 配置", "业绩诊断与利润分析", "AI 客服售后模板", "实时抓取数据源", "优先支持"],
    access: "开放全部 6 个 Agent、全自动运行、实时抓取和店铺 API 强数据 Agent。",
  },
  {
    id: "managed",
    name: "全托版",
    price: "899",
    desc: "适合希望让 Agent 接管日常运营的团队。",
    features: ["每日 2,000 次 Agent 调用", "6 Agent 全自动运行增强", "多店铺/多站点管理", "自动化运营周报", "专属配置协助", "1 对 1 运营建议"],
    access: "开放全部能力，增加多店铺、自动化周报和高频调用额度。",
  },
  {
    id: "enterprise",
    name: "定制版",
    price: "联系定价",
    desc: "适合公司团队、私有化或深度数据集成。",
    features: ["自定义调用量", "ERP/BI/客服系统集成", "企业权限与团队席位", "专属知识库", "私有化部署方案", "专属客户成功经理"],
    access: "按企业需求定制调用量、权限、数据集成和私有化部署。",
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
    desc: "售前咨询、订单查询、退款退货、差评挽回和多语言消息自动处理。",
    prompt: "客户咨询库存、物流时效并要求优惠，请识别意图、查询应调接口、给出处理动作和英文回复。",
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

function StoreApiModal({ onClose, storeConfig, setStoreConfig, storeConnected }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="store-api-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p>Store API</p>
            <h2>配置店铺 API</h2>
          </div>
          <button type="button" onClick={onClose}>关闭</button>
        </div>
        <div className="modal-store-config standalone">
          <div className="config-title">
            <PlugZap size={17} />
            强数据 Agent 必须配置
          </div>
          <p>店铺业绩诊断、AI 客服售后、广告库存利润需要读取店铺、广告、库存或客服数据。配置后，OpenClaw 才能基于真实数据诊断。</p>
          <div className="store-api-form vertical">
            <input value={storeConfig.storeName} onChange={(event) => setStoreConfig({ ...storeConfig, storeName: event.target.value })} placeholder="店铺名称" />
            <input value={storeConfig.apiEndpoint} onChange={(event) => setStoreConfig({ ...storeConfig, apiEndpoint: event.target.value })} placeholder="店铺 API Endpoint" />
            <input value={storeConfig.apiToken} onChange={(event) => setStoreConfig({ ...storeConfig, apiToken: event.target.value })} placeholder="API Token / Access Key" />
          </div>
          <div className={storeConnected ? "status-ok" : "status-warn"}>
            {storeConnected ? "店铺 API 已配置" : "未配置店铺 API，相关 Agent 会持续提醒"}
          </div>
        </div>
        <button className="continue-checkout" type="button" onClick={onClose}>
          保存配置
        </button>
      </section>
    </div>
  );
}

function SubscriptionModal({ onClose, showToast }) {
  const [selectedPlanId, setSelectedPlanId] = useState("standard");
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", wechat: "", email: "", note: "" });
  const selectedPlan = pricingPlans.find((plan) => plan.id === selectedPlanId);

  function updateContactForm(field, value) {
    setContactForm({ ...contactForm, [field]: value });
  }

  function submitEnterpriseContact() {
    showToast("已记录定制版联系信息，正式上线后会接入表单/CRM。");
    onClose();
  }

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
            <div>
              <span>功能权限</span>
              <p>{checkoutPlan.access}</p>
            </div>
          </div>
          {checkoutPlan.id === "enterprise" ? (
            <div className="payment-box">
              <h3>定制版需要联系我们</h3>
              <p>请留下手机号、微信或邮箱。正式上线后，这里会接入表单通知、CRM 或企业微信客服。</p>
              <div className="enterprise-form">
                <input value={contactForm.name} onChange={(event) => updateContactForm("name", event.target.value)} placeholder="姓名 / 公司名" />
                <input value={contactForm.phone} onChange={(event) => updateContactForm("phone", event.target.value)} placeholder="手机号" />
                <input value={contactForm.wechat} onChange={(event) => updateContactForm("wechat", event.target.value)} placeholder="微信号" />
                <input value={contactForm.email} onChange={(event) => updateContactForm("email", event.target.value)} placeholder="邮箱" />
                <textarea value={contactForm.note} onChange={(event) => updateContactForm("note", event.target.value)} placeholder="需求说明：店铺数量、平台、是否需要私有化部署..." />
              </div>
              <button type="button" onClick={submitEnterpriseContact}>提交联系信息</button>
            </div>
          ) : (
            <div className="payment-box">
              <h3>付款方式</h3>
              <p>当前为支付占位页。申请微信支付/支付宝商户后，这里会创建订单、展示支付二维码，并在支付回调成功后自动开通套餐。</p>
              <div className="order-placeholder">
                <span>订单状态</span>
                <strong>等待接入支付通道</strong>
                <p>预计流程：创建订单 → 返回二维码 → 用户扫码 → 支付回调 → 开通套餐。</p>
              </div>
              <div className="pay-options">
                <button type="button" onClick={() => showToast("微信支付即将接入，请先申请微信支付商户号。")}>微信支付 · 即将接入</button>
                <button type="button" onClick={() => showToast("支付宝即将接入，请先申请支付宝开放平台应用。")}>支付宝 · 即将接入</button>
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
              <p className="plan-access">{plan.access}</p>
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

function StructuredAgentPreview({ agentId }) {
  if (agentId === "growth") {
    return (
      <div className="structured-preview">
        <div className="preview-heading">
          <strong>经营诊断看板</strong>
          <span>适合接入店铺 API 后自动生成</span>
        </div>
        <div className="metric-cards">
          <div>
            <span>GMV</span>
            <strong>待分析</strong>
            <em>环比 / 同比</em>
          </div>
          <div>
            <span>转化率</span>
            <strong>待分析</strong>
            <em>流量到订单</em>
          </div>
          <div>
            <span>广告 ROI</span>
            <strong>待分析</strong>
            <em>投产效率</em>
          </div>
          <div>
            <span>库存周转</span>
            <strong>待分析</strong>
            <em>断货/积压</em>
          </div>
        </div>
        <div className="diagnosis-layout">
          <section>
            <h4>异常诊断</h4>
            <p>P0：销售下滑原因、亏损广告组、断货风险。</p>
            <p>P1：转化率、评价、主图、价格带优化。</p>
          </section>
          <section>
            <h4>行动清单</h4>
            <p>暂停亏损广告、补货高利润 SKU、优化低转化 Listing。</p>
          </section>
        </div>
      </div>
    );
  }

  if (agentId === "service") {
    return (
      <div className="structured-preview service-preview">
        <div className="preview-heading">
          <strong>AI 客服售后中枢</strong>
          <span>售前识别、API 执行、22 种语言回复、售后闭环</span>
        </div>
        <div className="service-flow">
          <div>意图识别</div>
          <span>→</span>
          <div>知识库检索</div>
          <span>→</span>
          <div>平台 API 执行</div>
          <span>→</span>
          <div>生成回复</div>
        </div>
        <div className="service-matrix">
          <section>
            <h4>售前能力</h4>
            <p>产品咨询：库存、规格、材质、适配场景。</p>
            <p>物流时效：调用平台/仓库 API 查询预计送达。</p>
            <p>价格优惠：识别折扣诉求，推荐优惠券或组合购。</p>
            <p>对比推荐：根据需求推荐合适商品。</p>
            <p>催单/改单：确认规则后调用店铺 API 修改订单。</p>
          </section>
          <section>
            <h4>售后能力</h4>
            <p>订单状态：实时查订单、物流、履约节点。</p>
            <p>退款退货：按政策判断并触发退款/退货流程。</p>
            <p>物流投诉：生成安抚话术并创建投诉记录。</p>
            <p>差评挽回：识别高风险情绪并给补偿建议。</p>
            <p>换货补发：核对订单后创建补发或换货任务。</p>
          </section>
        </div>
        <div className="service-system">
          <div>
            <span>店铺接入层</span>
            <strong>Shopify / Amazon / WooCommerce API</strong>
          </div>
          <div>
            <span>消息通道</span>
            <strong>接收客户消息 / 发送回复</strong>
          </div>
          <div>
            <span>语言层</span>
            <strong>22 种语言自动切换</strong>
          </div>
          <div>
            <span>知识库</span>
            <strong>商品信息 / 售后政策 / 回复历史</strong>
          </div>
        </div>
        <div className="reply-box">
          <h4>推荐输出格式</h4>
          <p>意图：物流时效 + 优惠咨询；动作：查询库存和仓库时效，匹配优惠策略；回复：自动生成客户语言版本并等待人工确认或自动发送。</p>
        </div>
      </div>
    );
  }

  if (agentId === "profit") {
    return (
      <div className="structured-preview">
        <div className="preview-heading">
          <strong>广告库存利润决策表</strong>
          <span>适合接入广告、库存、采购成本和订单数据后自动决策</span>
        </div>
        <div className="sku-table">
          <div className="sku-row header">
            <span>SKU</span>
            <span>利润状态</span>
            <span>库存风险</span>
            <span>建议动作</span>
          </div>
          <div className="sku-row">
            <span>SKU-A</span>
            <span className="good">高利润</span>
            <span>可售 28 天</span>
            <span>加预算 / 补货</span>
          </div>
          <div className="sku-row">
            <span>SKU-B</span>
            <span className="bad">实际亏损</span>
            <span>积压风险</span>
            <span>停投 / 清仓</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function ResultDocument({ content }) {
  if (!content) {
    return <div className="result-empty">等待输入要求...</div>;
  }

  const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);

  return (
    <article className="result-document">
      {lines.map((line, index) => {
        const normalized = line.replace(/^#{1,6}\s*/, "");

        if (/^#{1,6}\s+/.test(line) || /^[一二三四五六七八九十]+[、.]/.test(line)) {
          return <h3 key={`${line}-${index}`}>{normalized}</h3>;
        }

        if (/^[-*]\s+/.test(line) || /^\d+[.)、]\s*/.test(line)) {
          return <p className="doc-list-item" key={`${line}-${index}`}>{line.replace(/^[-*]\s+/, "").replace(/^\d+[.)、]\s*/, "")}</p>;
        }

        if (/[:：]$/.test(line) && line.length < 32) {
          return <h4 key={`${line}-${index}`}>{line}</h4>;
        }

        return <p key={`${line}-${index}`}>{line}</p>;
      })}
    </article>
  );
}

function Workspace() {
  const [activeId, setActiveId] = useState("autopilot");
  const [isBetaMode, setIsBetaMode] = useState(() => new URLSearchParams(window.location.search).get("beta") === "1");
  const [token, setToken] = useState(() => localStorage.getItem("fanmeng_token") || "");
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showStoreApiModal, setShowStoreApiModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [toast, setToast] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [answer, setAnswer] = useState("登录后已开启 3 天免费试用。请选择左侧模块，输入要求后由 OpenClaw 生成结果。");
  const [input, setInput] = useState("");
  const [autoInput, setAutoInput] = useState("");
  const [scrapeConfig, setScrapeConfig] = useState({
    enabled: false,
    platform: "",
    market: "",
    category: "",
    url: "",
  });
  const [storeConfig, setStoreConfig] = useState({
    platform: "Amazon",
    storeName: "",
    apiEndpoint: "",
    apiToken: "",
  });
  const [attachments, setAttachments] = useState([]);

  const activeAgent = useMemo(() => agents.find((agent) => agent.id === activeId), [activeId]);
  const visibleTasks = useMemo(() => tasks.filter((task) => task.type === activeId), [tasks, activeId]);
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

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  function hasFeature(feature, detail) {
    if (isBetaMode) return true;

    const features = user?.planFeatures;
    if (!features) return false;

    if (feature === "agent") return features.agents?.includes(detail);
    return Boolean(features[feature]);
  }

  function selectAgent(id) {
    if (!hasFeature("agent", id)) {
      showToast("当前套餐不支持该 Agent，请升级到标准版或更高套餐。");
      setShowSubscription(true);
      return;
    }

    setActiveId(id);
    setAnswer("");
    setInput("");
  }

  function openTaskHistory(task) {
    setActiveId(task.type);
    setAnswer(task.answer);
    setInput("");
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
    if (!isBetaMode && !user?.trialActive && user?.plan === "trial") {
      showToast("3 天免费试用已结束，请先订阅套餐后继续使用。");
      setShowSubscription(true);
      return;
    }

    if (!hasFeature("autopilot")) {
      showToast("当前套餐不支持 6 Agent 全自动运行，请升级套餐。");
      setShowSubscription(true);
      return;
    }

    if (scrapeConfig.enabled && !hasFeature("scraper")) {
      showToast("当前套餐不支持实时抓取数据源，请升级到标准版或更高套餐。");
      setShowSubscription(true);
      return;
    }

    setIsRunning(true);
    setAnswer("OpenClaw 正在调度 6 个 Agent 自动生成完整方案...");
    try {
      const response = await fetch("/api/autopilot/run", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          input: `${autoInput || "用户未填写具体要求，请先提示用户补充平台、市场、类目和目标。"}${buildAttachmentContext()}`,
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
    if (!isBetaMode && !user?.trialActive && user?.plan === "trial") {
      showToast("3 天免费试用已结束，请先订阅套餐后继续使用。");
      setShowSubscription(true);
      return;
    }

    if (!hasFeature("agent", activeAgent.id)) {
      showToast("当前套餐不支持该 Agent，请升级套餐。");
      setShowSubscription(true);
      return;
    }

    if (scrapeConfig.enabled && !hasFeature("scraper")) {
      showToast("当前套餐不支持实时抓取数据源，请升级到标准版或更高套餐。");
      setShowSubscription(true);
      return;
    }

    if (!isBetaMode && activeAgent?.requiresStoreApi && !storeConnected) {
      showToast("该 Agent 需要先配置店铺 API。");
      setShowStoreApiModal(true);
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
      {toast && <div className="toast-message">{toast}</div>}
      {showSubscription && (
        <SubscriptionModal
          onClose={() => setShowSubscription(false)}
          showToast={showToast}
        />
      )}
      {showFeedbackModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowFeedbackModal(false)}>
          <section className="store-api-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p>Beta Feedback</p>
                <h2>内测反馈</h2>
              </div>
              <button type="button" onClick={() => setShowFeedbackModal(false)}>关闭</button>
            </div>
            <div className="feedback-box">
              <input placeholder="你的称呼 / 公司" />
              <input placeholder="微信 / 手机 / 邮箱" />
              <textarea placeholder="你觉得哪里不好用？还希望增加什么功能？" />
              <button type="button" onClick={() => { showToast("感谢反馈，正式上线后这里会接入反馈收集系统。"); setShowFeedbackModal(false); }}>提交反馈</button>
            </div>
          </section>
        </div>
      )}
      {showStoreApiModal && (
        <StoreApiModal
          onClose={() => setShowStoreApiModal(false)}
          storeConfig={storeConfig}
          setStoreConfig={setStoreConfig}
          storeConnected={storeConnected}
        />
      )}
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="brand-mark">
            <Sparkles size={18} />
          </span>
          <div>
            <strong>凡梦AI</strong>
            <small>{isBetaMode ? "内测版 · 全功能开放" : user?.trialActive ? "3 天免费试用中" : user?.planName || "订阅状态"}</small>
          </div>
        </div>

        <div className="account-card">
          <strong>{user?.storeName || user?.name || "跨境卖家"}</strong>
          <span>{user?.email}</span>
          {isBetaMode && <em>内测版已开放全部功能</em>}
          {!isBetaMode && !user?.trialActive && user?.plan === "trial" && <em>试用期结束，请订阅后继续使用</em>}
          {!isBetaMode && !storeConnected && <em>请配置店铺 API</em>}
          <button type="button" onClick={() => setShowSubscription(true)}>查看/升级订阅</button>
          <button type="button" onClick={() => setShowStoreApiModal(true)}>店铺 API 配置</button>
          <button type="button" onClick={() => setIsBetaMode((value) => !value)}>{isBetaMode ? "退出内测版" : "进入内测版"}</button>
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

        <div className="side-label">{activeId === "autopilot" ? "全自动运行历史" : `${activeAgent?.name}历史`}</div>
        <div className="history-list">
          {visibleTasks.length ? (
            visibleTasks.slice(0, 5).map((task) => (
              <button key={task.id} type="button" onClick={() => openTaskHistory(task)}>
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
          <div className="header-actions">
            <div className={isBetaMode ? "trial-pill beta" : "trial-pill"}>
              <Zap size={16} />
              {isBetaMode ? "内测版全功能开放" : user?.trialActive ? "免费试用中" : user?.planName || "订阅状态"}
            </div>
            {isBetaMode && (
              <button className="header-ghost" type="button" onClick={() => setShowFeedbackModal(true)}>
                提交反馈
              </button>
            )}
            <button className="header-subscribe" type="button" onClick={() => setShowSubscription(true)}>
              订阅套餐
            </button>
          </div>
        </header>

        <div className="content-layout">
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
            <StructuredAgentPreview agentId={activeAgent?.id} />
            <ResultDocument content={answer} />
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
                  <input value={scrapeConfig.platform} onChange={(event) => setScrapeConfig({ ...scrapeConfig, platform: event.target.value })} placeholder="例：TikTok Shop" />
                  <input value={scrapeConfig.market} onChange={(event) => setScrapeConfig({ ...scrapeConfig, market: event.target.value })} placeholder="例：美国" />
                  <input value={scrapeConfig.category} onChange={(event) => setScrapeConfig({ ...scrapeConfig, category: event.target.value })} placeholder="例：宠物用品" />
                  <input value={scrapeConfig.url} onChange={(event) => setScrapeConfig({ ...scrapeConfig, url: event.target.value })} placeholder="例：https://www.tiktokshuju.com/goods/hot-sale" />
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
              <textarea value={autoInput} onChange={(event) => setAutoInput(event.target.value)} placeholder="例：我是 Amazon 美国站卖家，想做宠物用品类目，预算有限，希望系统自动生成选品、内容、Listing、客服、业绩和利润方案。" />
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
              <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={`例：${activeAgent.prompt}`} />
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
