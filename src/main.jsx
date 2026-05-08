import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  Clock3,
  Globe2,
  Headphones,
  LineChart,
  LockKeyhole,
  PackageSearch,
  PenLine,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  WalletCards,
  Zap,
} from "lucide-react";
import "./styles.css";

const agents = [
  {
    id: "trend",
    name: "爆款选品监控 Agent",
    short: "发现商品机会",
    icon: PackageSearch,
    color: "#2563eb",
    gradient: "linear-gradient(135deg, #2563eb, #7c3aed)",
    pain: "不知道卖什么、跟品慢、爆款数据分散。",
    outcome: "自动监控 TikTok、Amazon、Temu、Shopify 等渠道的热卖趋势，输出机会评分、价格带、竞争强度和上架建议。",
    prompt: "帮我监控美国站家居收纳类目，找 7 天内增长最快且客单价 20-60 美元的潜力品。",
    metrics: ["爆款热度 +238%", "竞争强度 中", "建议毛利 42%"],
    tasks: ["全网爆款抓取", "趋势预警", "竞品价格带分析", "机会评分"],
  },
  {
    id: "content",
    name: "爆款内容生成 Agent",
    short: "短视频脚本和素材",
    icon: PenLine,
    color: "#db2777",
    gradient: "linear-gradient(135deg, #db2777, #f97316)",
    pain: "不会写爆款脚本、素材产出慢、视频没有转化钩子。",
    outcome: "基于商品卖点和平台风格，生成 TikTok/Reels/Shorts 脚本、分镜、口播、标题、封面文案和拍摄清单。",
    prompt: "为一款便携式榨汁杯生成 5 条 TikTok 爆款短视频脚本，目标人群是办公室女性。",
    metrics: ["脚本 5 套", "钩子 18 个", "拍摄清单 1 份"],
    tasks: ["爆款脚本", "分镜口播", "达人 Brief", "广告素材角度"],
  },
  {
    id: "listing",
    name: "Listing 转化优化 Agent",
    short: "高质量文案和 SEO",
    icon: Sparkles,
    color: "#0891b2",
    gradient: "linear-gradient(135deg, #0891b2, #10b981)",
    pain: "标题关键词弱、五点描述普通、详情页不能打动海外买家。",
    outcome: "生成高转化标题、五点描述、A+ 页面结构、FAQ、SEO 关键词和多语言本地化文案。",
    prompt: "把这款宠物饮水机优化成 Amazon US 高转化 Listing，突出静音、过滤和大容量。",
    metrics: ["SEO 词 42 个", "转化文案 3 版", "本地化 EN/DE"],
    tasks: ["标题优化", "五点描述", "A+ 页面结构", "多语言本地化"],
  },
  {
    id: "growth",
    name: "店铺业绩诊断 Agent",
    short: "分析数据给建议",
    icon: BarChart3,
    color: "#16a34a",
    gradient: "linear-gradient(135deg, #16a34a, #65a30d)",
    pain: "销售下滑不知道原因，广告、转化、库存和评价割裂。",
    outcome: "读取店铺经营数据，拆解 GMV、转化率、退款、广告 ROI、库存周转，并给出优先级清晰的优化动作。",
    prompt: "分析我上周店铺 GMV 下滑 18% 的原因，并给出本周最应该执行的 5 个动作。",
    metrics: ["异常项 9 个", "ROI 漏损 -12%", "动作优先级 P0"],
    tasks: ["业绩归因", "利润看板", "转化瓶颈", "增长建议"],
  },
  {
    id: "service",
    name: "AI 客服售后 Agent",
    short: "自动接待和纠纷处理",
    icon: Headphones,
    color: "#7c3aed",
    gradient: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    pain: "时差导致回复慢，差评、退货和物流问题消耗大量人力。",
    outcome: "自动处理售前咨询、物流追踪、退换货、差评安抚和多语言客服，沉淀高频问题知识库。",
    prompt: "客户说包裹延迟并要求退款，请用英文回复，既安抚客户又尽量保留订单。",
    metrics: ["响应 < 10 秒", "支持 12 语种", "工单节省 68%"],
    tasks: ["多语言回复", "物流解释", "差评挽回", "知识库训练"],
  },
  {
    id: "profit",
    name: "广告库存利润 Agent",
    short: "控成本保利润",
    icon: LineChart,
    color: "#ea580c",
    gradient: "linear-gradient(135deg, #ea580c, #ca8a04)",
    pain: "广告烧钱、库存断货或积压、真实利润看不清。",
    outcome: "联动广告花费、库存、采购、物流和平台费用，给出补货、降价、停投、加预算和利润预警。",
    prompt: "帮我判断这 20 个 SKU 哪些应该补货、清仓或暂停广告，并解释利润影响。",
    metrics: ["利润预警 6 个", "滞销风险 3 个", "预算节省 21%"],
    tasks: ["广告预算建议", "库存预警", "利润核算", "清仓策略"],
  },
];

const plans = [
  {
    name: "尝鲜版",
    price: "99",
    desc: "适合刚开始尝试 AI 工作流的个人卖家。",
    features: ["每月 300 次 Agent 调用", "选品与内容基础模板", "单店铺数据手动导入", "社区支持"],
  },
  {
    name: "标准版",
    price: "299",
    desc: "适合已有稳定店铺、想提效的成长卖家。",
    popular: true,
    features: ["每月 2,000 次 Agent 调用", "6 个 Agent 全部开放", "店铺周报与优化建议", "多语言 Listing 和客服", "优先客服支持"],
  },
  {
    name: "全托版",
    price: "899",
    desc: "适合希望把日常运营交给智能体协同完成的团队。",
    features: ["每月 10,000 次 Agent 调用", "自动化任务编排", "爆款监控实时预警", "专属运营策略模板", "1 对 1 上手配置"],
  },
  {
    name: "企业版",
    price: "定制",
    desc: "适合多店铺、多站点、需要私有化和深度集成的公司。",
    features: ["定制调用量和账号体系", "API/ERP/BI 深度集成", "企业知识库和权限管理", "专属客户成功经理"],
  },
];

const workflow = [
  "连接店铺、广告、表格或手动上传数据",
  "选择业务目标：找爆品、写内容、提转化、降成本",
  "Agent 自动分析并生成可执行方案",
  "团队确认后沉淀为自动化工作流",
];

function App() {
  const [activeAgent, setActiveAgent] = useState(agents[0]);
  const [billing, setBilling] = useState("monthly");
  const [promptInput, setPromptInput] = useState(agents[0].prompt);
  const [agentResult, setAgentResult] = useState("");
  const [apiError, setApiError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const selectedIcon = useMemo(() => activeAgent.icon, [activeAgent]);
  const ActiveIcon = selectedIcon;

  useEffect(() => {
    setPromptInput(activeAgent.prompt);
    setAgentResult("");
    setApiError("");
  }, [activeAgent]);

  async function runAgent() {
    setIsRunning(true);
    setApiError("");
    setAgentResult("");

    try {
      const response = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: activeAgent.id,
          input: promptInput,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Agent 调用失败，请检查后端服务和模型配置。");
      }

      setAgentResult(data.answer);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#top" aria-label="Voyage AI Agents">
          <span className="brand-mark">
            <Sparkles size={18} />
          </span>
          Voyage AI Agents
        </a>
        <div className="nav-links">
          <a href="#agents">智能体</a>
          <a href="#workspace">工作台</a>
          <a href="#pricing">订阅</a>
          <a href="#login">登录</a>
        </div>
        <a className="nav-cta" href="#pricing">
          立即订阅 <ArrowRight size={16} />
        </a>
      </nav>

      <section id="top" className="hero section">
        <div className="hero-copy">
          <div className="eyebrow">
            <Globe2 size={16} />
            跨境电商卖家的 AI 员工系统
          </div>
          <h1>不会用 AI，也能让 6 个 Agent 替你跑完整运营链路。</h1>
          <p>
            从爆款选品、短视频脚本、Listing 文案，到店铺诊断、AI 客服、广告库存利润优化，
            Voyage 把复杂 AI 能力封装成跨境卖家直接可用的业务界面。
          </p>
          <div className="hero-actions">
            <a className="primary-btn" href="#workspace">
              体验 Agent 工作台 <Play size={17} />
            </a>
            <a className="secondary-btn" href="#pricing">
              查看订阅价格
            </a>
          </div>
          <div className="trust-row">
            <span>
              <Check size={16} /> 白底高级 UI
            </span>
            <span>
              <Check size={16} /> 6 大运营 Agent
            </span>
            <span>
              <Check size={16} /> 订阅制商业模型
            </span>
          </div>
        </div>

        <div className="hero-panel">
          <div className="panel-top">
            <div>
              <span className="dot"></span>
              Live Store Pulse
            </div>
            <span>Today</span>
          </div>
          <div className="score-card">
            <div>
              <p>本周增长机会</p>
              <strong>87</strong>
            </div>
            <TrendingUp size={34} />
          </div>
          <div className="insight-list">
            {agents.slice(0, 4).map((agent) => {
              const Icon = agent.icon;
              return (
                <button key={agent.id} onClick={() => setActiveAgent(agent)}>
                  <span style={{ background: agent.gradient }}>
                    <Icon size={17} />
                  </span>
                  <div>
                    <strong>{agent.short}</strong>
                    <small>{agent.metrics[0]}</small>
                  </div>
                  <ChevronRight size={16} />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="logos section compact">
        <span>适配主流跨境业务场景</span>
        <strong>Amazon</strong>
        <strong>TikTok Shop</strong>
        <strong>Shopify</strong>
        <strong>Temu</strong>
        <strong>Shopee</strong>
      </section>

      <section id="agents" className="section">
        <div className="section-heading">
          <span className="eyebrow">6 Agents</span>
          <h2>按跨境卖家的真实痛点设计，而不是让用户学习复杂提示词。</h2>
          <p>每个 Agent 都对应一个清晰界面和工作目标，用户只需要选择任务、输入商品或店铺数据，就能得到结果。</p>
        </div>
        <div className="agent-grid">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <article className="agent-card" key={agent.id}>
                <div className="agent-icon" style={{ background: agent.gradient }}>
                  <Icon size={22} />
                </div>
                <h3>{agent.name}</h3>
                <p className="pain">{agent.pain}</p>
                <p>{agent.outcome}</p>
                <div className="tag-row">
                  {agent.tasks.slice(0, 3).map((task) => (
                    <span key={task}>{task}</span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="workspace" className="section workspace-section">
        <div className="section-heading">
          <span className="eyebrow">Agent Console</span>
          <h2>一个网站内完成选品、内容、运营、客服和利润决策。</h2>
          <p>下面是可直接延展成真实 SaaS 的交互工作台：左侧选择 Agent，中间输入业务问题，右侧展示智能分析结果。</p>
        </div>

        <div className="workspace">
          <aside className="agent-sidebar">
            <div className="sidebar-title">
              <Bot size={18} />
              Agent 列表
            </div>
            {agents.map((agent) => {
              const Icon = agent.icon;
              const isActive = agent.id === activeAgent.id;
              return (
                <button
                  className={isActive ? "active" : ""}
                  key={agent.id}
                  onClick={() => setActiveAgent(agent)}
                >
                  <span style={{ background: isActive ? agent.gradient : "#f4f7fb", color: isActive ? "#fff" : agent.color }}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <strong>{agent.name}</strong>
                    <small>{agent.short}</small>
                  </div>
                </button>
              );
            })}
          </aside>

          <section className="console">
            <div className="console-header" style={{ background: activeAgent.gradient }}>
              <div className="console-icon">
                <ActiveIcon size={24} />
              </div>
              <div>
                <h3>{activeAgent.name}</h3>
                <p>{activeAgent.outcome}</p>
              </div>
            </div>
            <div className="prompt-box">
              <label>输入业务问题，Agent 会调用已配置的大模型和专属 Skill：</label>
              <textarea value={promptInput} onChange={(event) => setPromptInput(event.target.value)} />
              <button type="button" onClick={runAgent} disabled={isRunning}>
                {isRunning ? "Agent 正在分析..." : "生成智能方案"} <Zap size={16} />
              </button>
            </div>
          </section>

          <aside className="result-panel">
            <div className="result-title">
              <ShieldCheck size={18} />
              AI 实时输出
            </div>
            <div className="metric-grid">
              {activeAgent.metrics.map((metric) => (
                <div key={metric}>
                  <span>{metric}</span>
                </div>
              ))}
            </div>
            <div className="recommendation">
              <strong>{agentResult ? "模型返回结果" : apiError ? "配置提示" : "Agent Skill 已加载"}</strong>
              {agentResult ? (
                <pre>{agentResult}</pre>
              ) : (
                <p>
                  {apiError ||
                    `当前 Agent 已配置「${activeAgent.tasks[0]}」和「${activeAgent.tasks[1]}」等 Skill。点击生成后会通过后端调用 OpenClaw/OpenAI 兼容模型。`}
                </p>
              )}
            </div>
            <div className="task-list">
              {activeAgent.tasks.map((task) => (
                <span key={task}>
                  <Check size={15} /> {task}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="section process">
        <div className="process-card">
          <div>
            <span className="eyebrow">Workflow</span>
            <h2>把一次性 AI 问答，升级成可复用的跨境运营流程。</h2>
          </div>
          <div className="steps">
            {workflow.map((item, index) => (
              <div key={item}>
                <span>{index + 1}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="section">
        <div className="section-heading">
          <span className="eyebrow">Pricing</span>
          <h2>订阅制价格清晰，方便从个人卖家扩展到企业团队。</h2>
          <p>默认月付方案，也可以在后续接入支付、发票、席位和用量计费。</p>
          <div className="billing-toggle" aria-label="billing toggle">
            <button className={billing === "monthly" ? "active" : ""} onClick={() => setBilling("monthly")}>
              月付
            </button>
            <button className={billing === "yearly" ? "active" : ""} onClick={() => setBilling("yearly")}>
              年付省 15%
            </button>
          </div>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={plan.popular ? "price-card popular" : "price-card"} key={plan.name}>
              {plan.popular && <div className="popular-badge">推荐</div>}
              <h3>{plan.name}</h3>
              <p>{plan.desc}</p>
              <div className="price">
                {plan.price === "定制" ? (
                  <strong>定制报价</strong>
                ) : (
                  <>
                    <span>¥</span>
                    <strong>{billing === "yearly" ? Math.round(Number(plan.price) * 0.85) : plan.price}</strong>
                    <em>/月</em>
                  </>
                )}
              </div>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={16} /> {feature}
                  </li>
                ))}
              </ul>
              <a className={plan.popular ? "primary-btn full" : "secondary-btn full"} href="#login">
                {plan.price === "定制" ? "联系定价" : "选择套餐"}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="login" className="section login-section">
        <div className="login-copy">
          <span className="eyebrow">Account</span>
          <h2>登录后进入你的跨境 AI 员工后台。</h2>
          <p>
            这里可以继续接入真实登录、订阅支付、用量统计、店铺授权和团队权限。
            当前页面先以高保真 UI 展示商业化入口。
          </p>
          <div className="login-benefits">
            <span>
              <Clock3 size={16} /> 7x24 小时 Agent 自动待命
            </span>
            <span>
              <WalletCards size={16} /> 套餐订阅和用量管理
            </span>
            <span>
              <Store size={16} /> 多店铺统一工作台
            </span>
          </div>
        </div>
        <form className="login-card">
          <div className="login-icon">
            <LockKeyhole size={22} />
          </div>
          <h3>欢迎回来</h3>
          <label>
            邮箱
            <input type="email" placeholder="seller@example.com" />
          </label>
          <label>
            密码
            <input type="password" placeholder="输入密码" />
          </label>
          <button type="button">登录并进入工作台</button>
          <p>
            还没有账号？<a href="#pricing">选择订阅套餐</a>
          </p>
        </form>
      </section>

      <footer>
        <div className="brand">
          <span className="brand-mark">
            <Star size={17} />
          </span>
          Voyage AI Agents
        </div>
        <p>为跨境电商卖家打造的多 Agent 智能运营系统。</p>
        <a href="#top">回到顶部</a>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
