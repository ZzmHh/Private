import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Check,
  File,
  Globe2,
  Headphones,
  Image,
  LineChart,
  LockKeyhole,
  PackageSearch,
  PenLine,
  Quote,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  UploadCloud,
  Users,
  X,
  Zap,
} from "lucide-react";
import "./styles.css";

const pricingPlans = [
  {
    id: "starter",
    name: "尝鲜版",
    price: "99",
    desc: "适合个人卖家试用 AI 工作流。",
    features: [
      "每日 100 次 Agent 调用",
      "选品 / 内容 / Listing 三个 Agent（6 模块中的基础三件套）",
      "本地文件导入",
      "任务历史 30 条",
      "社区/邮件支持",
    ],
    access: "开放选品、内容、Listing 三个基础 Agent；不含一键运营串联、实时抓取和店铺 API 强数据类 Agent。",
  },
  {
    id: "standard",
    name: "标准版",
    price: "299",
    desc: "适合已有店铺、希望稳定提效的卖家。",
    recommended: true,
    features: ["每日 500 次 Agent 调用", "店铺 API 配置", "业绩诊断与利润分析", "AI 客服售后模板", "公开页参考抓取（Playwright）", "优先支持"],
    access: "开放全部 6 个独立 Agent +「5 Agent 运营一键生成」（一键不含客服自动应答）；含公开页参考抓取（非官方实时）与店铺相关 Agent。",
  },
  {
    id: "managed",
    name: "全托版",
    price: "899",
    desc: "适合希望让 Agent 接管日常运营的团队。",
    features: ["每日 2,000 次 Agent 调用", "5 模块运营一键生成", "多店铺/多站点管理", "自动化运营周报", "专属配置协助", "1 对 1 运营建议"],
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

const PAID_PLAN_IDS = new Set(["starter", "standard", "managed", "enterprise"]);

const agents = [
  {
    id: "trend",
    name: "爆款选品监控",
    icon: PackageSearch,
    desc: "趋势与机会评估；可选公开页参考抓取（非官方实时）。",
    prompt: "帮我评估 TikTok Shop 美国市场家居收纳类目的机会方向，并说明需要补充哪些验证数据。",
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
    desc: "诊断版：框架与指标建议；连接版：可基于你粘贴或 API 导出的真实数据深读。",
    prompt: "我暂未粘贴后台数据，请用诊断版给出应监控的指标、常见下滑原因假设和下一步该导出的报表字段。",
    requiresStoreApi: true,
  },
  {
    id: "service",
    name: "AI 客服售后",
    icon: Headphones,
    desc: "话术与处理清单；不代客执行后台操作；高风险项需人工或已接入系统确认。",
    prompt: "客户咨询物流延迟并要求补偿，请给中文策略、英文回复草稿、内部 Checklist 及须人工确认项。",
    requiresStoreApi: true,
  },
  {
    id: "profit",
    name: "广告库存利润",
    icon: LineChart,
    desc: "利润与库存决策框架；有成本/广告数据时更可量化，无数据时列明待导入字段。",
    prompt: "我只有大致售价区间，没有完整成本表，请按无数据与有数据两种情况给 SKU 分层与广告/库存原则。",
    requiresStoreApi: true,
  },
];

/** 场景案例（内容为产品说明用途的虚构合成案例，非特定客户背书） */
const caseStudies = [
  {
    slug: "home-tiktok-us",
    title: "家居品类 · 美区短视频渠道",
    heroSubtitle: "小型团队 · TikTok Shop 为主 · 兼做独立站测款",
    quote: "把选品讨论和内容初稿从「每周耗两天」压到更短，团队能集中精力盯供应链和投放。",
    tags: ["爆款选品监控", "爆款内容生成"],
    kpi: "周更频次提升 · 素材方向更统一",
    readTime: "约 4 分钟阅读",
    challenge:
      "团队在美区打家居细分类目，依赖短视频拉新，但人均兼顾上架、拍剪、客服，选品会开很久却难有统一结论；内容侧经常出现「脚本风格飘、钩子不贴合当期主推 SKU」的问题。缺乏专职数据同学，只能靠经验拍板，复盘时很难对齐指标。",
    approachBullets: [
      "用选品监控 Agent 每周固定输出「机会清单 + 风险备注」，例会只讨论表内前 10 条，减少开放式闲聊。",
      "用内容 Agent 按「同一批 SKU」生成多版脚本与分镜备注，强制统一本季主卖点与人群口径。",
      "将 Agent 输出沉淀为内部一页纸 Brief，外包剪辑只负责执行，降低反复改稿。",
    ],
    agentMix: ["爆款选品监控 Agent", "爆款内容生成 Agent"],
    timeline: [
      "第 1 周：校准类目、价格带与竞品关注列表，形成固定周报结构。",
      "第 2–4 周：内容与选品周报合并对照，淘汰低效选题，保留可复用钩子模版。",
    ],
    outcomes: [
      { headline: "协同方式", detail: "示意：周会从「发散讨论」改为「对照清单决策」，执行拆分到运营/剪辑。（合成描述）" },
      { headline: "产出节奏", detail: "示意：同一 SKU 批次的脚本产出由分散变为可排期列表，减少临时加塞。（合成描述）" },
      { headline: "风险提示", detail: "实际转化与播放仍受素材质量、履约与投放影响；本案例不表示效果承诺。" },
    ],
  },
  {
    slug: "amazon-multi-listing",
    title: "多站点亚马逊卖家",
    heroSubtitle: "美/欧双站点 · 多子品牌线 · 定期翻新 Listing",
    quote: "Listing 翻新和关键词扩展可以批量产出，再配合业绩诊断 Agent 拉出优先改动清单。",
    tags: ["Listing 优化", "业绩诊断"],
    kpi: "改版周期缩短 · 策略讨论有据可依",
    readTime: "约 5 分钟阅读",
    challenge:
      "SKU 多、站点多，A+ 与五点描述更新常积压；不同运营写法不一致，导致品牌语调漂移。业绩下滑时，团队能感到「哪张 ASIN 该优先改」，但缺乏统一框架把广告、转化与评价数据串起来，例会容易陷入互相甩锅。",
    approachBullets: [
      "用 Listing Agent 批量产出「主卖版本 + 备选短标题 + FAQ 草稿」，再由运营按站点法规模行终审。",
      "用语义相近词组扩展搜索入口，把「该埋词是否已经覆盖」做成检查表，减少遗漏。",
      "用语绩诊断 Agent 先做「假设树」：是曝光、点击、转化还是退款结构异常，对应改动优先级表。",
    ],
    agentMix: ["Listing 转化优化 Agent", "店铺业绩诊断 Agent"],
    timeline: [
      "第 1 阶段：选 20 条长尾 ASIN 试跑，建立可复用的关键词与版式规范。",
      "第 2 阶段：将成功版式推广到同类目，诊断周报与改版工单绑定。",
    ],
    outcomes: [
      { headline: "改版条理", detail: "示意：翻新从「凭感觉大改」改为「先诊断再动刀」，减少无效重写。（合成描述）" },
      { headline: "团队对齐", detail: "示意：诊断输出带「优先级标签」，运营与广告同学共享同一页结论。（合成描述）" },
      { headline: "风险提示", detail: "平台政策与类目竞争变动快；输出需人工合规复核，Agent 不替代后台操作。" },
    ],
  },
  {
    slug: "cs-heavy-store",
    title: "客服密集型店铺",
    heroSubtitle: "订单波动大 · 多时区咨询 · 重复问题占比高",
    quote: "常见物流与退换货问题用模板化话术先顶一轮，高风险单再人工介入，减少夜班压力。",
    tags: ["AI 客服售后", "知识库沉淀"],
    kpi: "响应更一致 · 重复劳动减少",
    readTime: "约 4 分钟阅读",
    challenge:
      "大促后物流与退款咨询暴涨，夜班同事常靠个人经验临场发挥，同样问题答案版本不一，易引发二次纠纷。想把 FAQ 沉淀成文档，但没人有力气持续更新；主管担心纯自动回复踩政策红线。",
    approachBullets: [
      "用客服 Agent 先生成「分级话术」：标准安抚版、需人工兜底版、需主管审批版，执行前由负责人勾选启用范围。",
      "对 TOP20 高频问题强制走模版回复；长尾问题保留人工，但要求事后把结论补进知识库一条。",
      "对退款、索赔、差评威胁类关键词做敏感路由，默认转人工或升级，不自动承诺赔付。",
    ],
    agentMix: ["AI 客服售后 Agent"],
    timeline: [
      "第 1–2 周：跑通英法中三语基础模版与禁用词表，小流量灰度。",
      "第 3 周起：按周回顾工单，压缩重复劳动时间，把省下的工时转去做评价与库存协同。",
    ],
    outcomes: [
      { headline: "一致性", detail: "示意：同类物流延迟问题的首响话术统一，降低「说法前后矛盾」投诉。（合成描述）" },
      { headline: "人机分工", detail: "示意：夜班先处理 60–70% 可模版化咨询，余量转白昼复核。（区间示意，非承诺）" },
      { headline: "风险提示", detail: "各平台客服政策不同；高风险订单必须由人工确认，本案例不排除任何法律与合规责任。" },
    ],
  },
];

function readRouteHash() {
  return window.location.hash.replace(/^#/, "").trim();
}

function parseCaseSlugFromHash(raw) {
  if (!raw.startsWith("case/")) return null;
  const slug = raw.slice(5).split(/[/?]/)[0];
  return slug || null;
}

function CaseStudyDetail({ study, onBack, onHome, onLoginClick, onRegisterClick }) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${study.title} · 客户场景案例 | 凡梦AI`;
    return () => {
      document.title = prev;
    };
  }, [study.title]);

  return (
    <div className="case-detail-page">
      <header className="pub-nav" role="banner">
        <button type="button" className="pub-brand pub-brand-btn" onClick={onHome}>
          <span className="brand-mark">
            <Sparkles size={18} />
          </span>
          凡梦AI
        </button>
        <nav className="pub-nav-links" aria-label="案例内导航">
          <button type="button" className="pub-nav-link" onClick={onBack}>
            ← 返回场景案例列表
          </button>
        </nav>
        <div className="pub-nav-actions">
          <button type="button" className="pub-btn pub-btn-ghost" onClick={onLoginClick}>登录</button>
          <button type="button" className="pub-btn pub-btn-primary" onClick={onRegisterClick}>
            免费注册 <ArrowRight size={16} aria-hidden />
          </button>
        </div>
      </header>

      <article className="case-detail-article">
        <p className="case-detail-meta">
          <span className="case-detail-read">{study.readTime}</span>
          <span className="case-detail-badge">合成案例 · 用于说明工作流</span>
        </p>
        <h1>{study.title}</h1>
        <p className="case-detail-sub">{study.heroSubtitle}</p>
        <blockquote className="case-detail-quote">
          <Quote size={20} aria-hidden />
          {study.quote}
        </blockquote>
        <div className="case-detail-tags">
          {study.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        <section className="case-detail-section" aria-labelledby="cd-challenge">
          <h2 id="cd-challenge">背景与挑战</h2>
          <p className="case-detail-prose">{study.challenge}</p>
        </section>

        <section className="case-detail-section" aria-labelledby="cd-approach">
          <h2 id="cd-approach">方案与 Agent 用法</h2>
          <ul className="case-detail-list">
            {study.approachBullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="case-detail-aside">
            <strong>主要使用的模块：</strong>
            {study.agentMix.join("、")}
          </p>
        </section>

        <section className="case-detail-section" aria-labelledby="cd-timeline">
          <h2 id="cd-timeline">推进节奏（示意）</h2>
          <ol className="case-detail-steps">
            {study.timeline.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="case-detail-section" aria-labelledby="cd-outcome">
          <h2 id="cd-outcome">观察与复盘</h2>
          <div className="case-outcome-cards">
            {study.outcomes.map((row) => (
              <div key={row.headline} className="case-outcome-card">
                <strong>{row.headline}</strong>
                <p>{row.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="case-detail-footer">
          <p>
            本文为便于理解的<strong>虚构合成案例</strong>，与任何单一真实客户无关；数据与区间为描述性示意，
            不构成效果承诺。注册并验证邮箱后可自行试用产品判断是否适合您的团队。
          </p>
          <div className="case-detail-cta-row">
            <button type="button" className="pub-btn pub-btn-primary" onClick={onRegisterClick}>免费注册试用</button>
            <button type="button" className="pub-btn pub-btn-secondary" onClick={onBack}>查看更多场景</button>
          </div>
        </footer>
      </article>
    </div>
  );
}

function CaseStudyNotFound({ onHome, onLoginClick, onRegisterClick }) {
  return (
    <div className="case-detail-page">
      <header className="pub-nav" role="banner">
        <button type="button" className="pub-brand pub-brand-btn" onClick={onHome}>
          <span className="brand-mark">
            <Sparkles size={18} />
          </span>
          凡梦AI
        </button>
        <div className="pub-nav-actions" style={{ marginLeft: "auto" }}>
          <button type="button" className="pub-btn pub-btn-ghost" onClick={onLoginClick}>登录</button>
          <button type="button" className="pub-btn pub-btn-primary" onClick={onRegisterClick}>免费注册</button>
        </div>
      </header>
      <div className="case-not-found">
        <h1>未找到该案例</h1>
        <p>链接可能已更新，请从首页「场景案例」进入。</p>
        <button type="button" className="pub-btn pub-btn-primary" onClick={onHome}>回首页</button>
      </div>
    </div>
  );
}

function PublicLanding({ onLoginClick, onRegisterClick, scrollSectionId }) {
  useEffect(() => {
    if (!scrollSectionId) return;
    const id = scrollSectionId === "top" ? "top" : scrollSectionId;
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [scrollSectionId]);

  function go(href) {
    const id = href.replace("#", "");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="public-landing">
      <header className="pub-nav" role="banner">
        <a className="pub-brand" href="#top" onClick={(e) => { e.preventDefault(); go("#top"); }}>
          <span className="brand-mark">
            <Sparkles size={18} />
          </span>
          凡梦AI
        </a>
        <nav className="pub-nav-links" aria-label="页面导航">
          <button type="button" className="pub-nav-link" onClick={() => go("#flow")}>使用路径</button>
          <button type="button" className="pub-nav-link" onClick={() => go("#capabilities")}>产品能力</button>
          <button type="button" className="pub-nav-link" onClick={() => go("#cases")}>场景案例</button>
          <button type="button" className="pub-nav-link" onClick={() => go("#trust")}>信任与安全</button>
          <button type="button" className="pub-nav-link" onClick={() => go("#pricing-preview")}>定价</button>
          <button type="button" className="pub-nav-link" onClick={() => go("#trial-explainer")}>试用说明</button>
        </nav>
        <div className="pub-nav-actions">
          <button type="button" className="pub-btn pub-btn-ghost" onClick={onLoginClick}>
            登录
          </button>
          <button type="button" className="pub-btn pub-btn-primary" onClick={onRegisterClick}>
            免费注册 <ArrowRight size={16} aria-hidden />
          </button>
        </div>
      </header>

      <section id="top" className="pub-hero">
        <div className="pub-hero-copy">
          <p className="pub-eyebrow">
            <Globe2 size={17} aria-hidden /> 跨境电商 · 6 大模块工作台 · 5 Agent 运营一键生成
          </p>
          <h1>跨境电商多 Agent 工作台：先了解，再上手。</h1>
          <p className="pub-lead">
            凡梦AI 将大模型封装成 <strong>6 个可切换的专业模块</strong>（选品、内容、Listing、业绩诊断、AI 客服话术、广告库存利润），另提供
            <strong>「5 Agent 运营一键生成」</strong>：单轮输出选品—内容—Listing—业绩—利润串联方案（<strong>不含客服自动应答</strong>；客服请在「AI 客服售后」里<strong>对话式</strong>生成话术）。
            本页为<strong>产品介绍站</strong>；需要执行 Agent 时，请通过顶部「登录 / 注册」进入<strong>独立登录页</strong>，验证成功后将进入<strong>工作台</strong>。
          </p>
          <div className="pub-hero-cta">
            <button type="button" className="pub-btn pub-btn-primary pub-btn-lg" onClick={onRegisterClick}>
              免费注册并开启试用
            </button>
            <button
              type="button"
              className="pub-btn pub-btn-secondary pub-btn-lg"
              onClick={onLoginClick}
            >
              已有账号 · 登录
            </button>
          </div>
          <p className="pub-footnote">
            <BadgeCheck size={14} aria-hidden /> 数据与 API 连接遵循最小权限；下方「效果指标」为典型场景综合描述，非效果承诺。
          </p>
        </div>
        <div className="pub-hero-panel" aria-label="产品能力概览">
          <div className="pub-hero-card">
            <div className="pub-hero-card-head">
              <Bot size={20} />
              <span>6 大模块 + 5 Agent 运营</span>
            </div>
            <ul className="pub-mini-list">
              <li>单模块：选品 / 内容 / Listing</li>
              <li>单模块：业绩 · 客服话术 · 利润</li>
              <li>一键串联：5 段运营方案（无客服自动跑）</li>
              <li>工作台：配置店铺 API、附件与任务历史</li>
            </ul>
          </div>
          <div className="pub-hero-stats">
            <div>
              <strong>一站式</strong>
              <span>账号内切换模块</span>
            </div>
            <div>
              <strong>可订阅</strong>
              <span>按调用量与套餐扩展</span>
            </div>
            <div>
              <strong>可接店铺</strong>
              <span>API / 手工粘贴均可</span>
            </div>
          </div>
        </div>
      </section>

      <section className="pub-strip" aria-label="支持的业务场景">
        <span className="pub-strip-label">支持对接与协作</span>
        <span>Amazon</span>
        <span>TikTok Shop</span>
        <span>Shopify</span>
        <span>自建站 / ERP 导出</span>
      </section>

      <section id="flow" className="pub-section pub-section-alt" aria-labelledby="flow-h">
        <div className="pub-section-head">
          <h2 id="flow-h">从了解到使用：浏览、登录、再进工作台</h2>
          <p>先在本页完成信息收集与决策；稍后在登录页验证账号，即可在控制台中运行全部能力。</p>
        </div>
        <div className="pub-flow-steps" role="list">
          <article className="pub-flow-card" role="listitem">
            <span className="pub-flow-num" aria-hidden>1</span>
            <h3>产品介绍站</h3>
            <p>了解 6 大模块、5 Agent 运营一键生成、定价与试用规则，无需账号即可通读。</p>
          </article>
          <article className="pub-flow-card" role="listitem">
            <span className="pub-flow-num" aria-hidden>2</span>
            <h3>登录或注册</h3>
            <p>通过顶部按钮进入独立登录页，验证邮箱后即可启用账号。</p>
          </article>
          <article className="pub-flow-card" role="listitem">
            <span className="pub-flow-num" aria-hidden>3</span>
            <h3>工作台</h3>
            <p>运行各 Agent、一键 5 模块方案、配置店铺 API、查看任务历史与订阅额度。</p>
          </article>
        </div>
        <div className="pub-flow-cta">
          <button type="button" className="pub-btn pub-btn-primary" onClick={onRegisterClick}>
            前往注册
          </button>
          <button type="button" className="pub-btn pub-btn-secondary" onClick={onLoginClick}>
            前往登录
          </button>
        </div>
      </section>

      <section id="capabilities" className="pub-section" aria-labelledby="cap-h">
        <div className="pub-section-head">
          <h2 id="cap-h">产品能力：6 大模块，各司其职</h2>
          <p>
            下方为<strong>六个独立模块</strong>，在工作台内可单独调用；也可使用<strong>「5 Agent 运营一键生成」</strong>将选品、内容、Listing、业绩诊断、广告库存利润
            <strong>单轮串联</strong>输出。「AI 客服售后」建议<strong>单独打开、对话式</strong>生成话术与清单，不参与一键自动跑。
          </p>
        </div>
        <div className="pub-agent-grid">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <article key={agent.id} className="pub-agent-card">
                <div className="pub-agent-icon">
                  <Icon size={22} aria-hidden />
                </div>
                <h3>{agent.name}</h3>
                <p>{agent.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="cases" className="pub-section pub-section-alt" aria-labelledby="cases-h">
        <div className="pub-section-head">
          <h2 id="cases-h">客户场景（综合整理）</h2>
          <p>以下为常见跨境团队结构下的使用方式归纳，便于您评估是否匹配自身阶段；非单一客户背书。</p>
        </div>
        <div className="pub-case-grid">
          {caseStudies.map((item) => (
            <a key={item.slug} className="pub-case-card pub-case-card-link" href={`#case/${item.slug}`}>
              <Quote className="pub-quote-icon" size={22} aria-hidden />
              <p className="pub-case-quote">「{item.quote}」</p>
              <div className="pub-case-tags">
                {item.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <p className="pub-case-kpi">{item.kpi}</p>
              <p className="pub-case-title">{item.title}</p>
              <span className="pub-case-readmore">查看案例详情 →</span>
            </a>
          ))}
        </div>
      </section>

      <section id="trust" className="pub-section" aria-labelledby="trust-h">
        <div className="pub-section-head">
          <h2 id="trust-h">信任与安全</h2>
          <p>我们理解跨境数据敏感，产品在架构上默认按最小可用原则接入，并向您明示边界。</p>
        </div>
        <div className="pub-trust-grid">
          <div className="pub-trust-card">
            <Users size={22} aria-hidden />
            <h3>团队背景</h3>
            <p>产品由具备 <strong>跨境运营</strong> 与 <strong>AI 工程</strong> 经验的团队协作迭代，聚焦「能进工作流」而非演示级对话。</p>
          </div>
          <div className="pub-trust-card">
            <ShieldCheck size={22} aria-hidden />
            <h3>数据与权限</h3>
            <p>店铺 API 密钥服务器侧加密存储；Agent 输出包含须人工确认项时会明确提示，不冒充已代您操作后台。</p>
          </div>
          <div className="pub-trust-card">
            <LockKeyhole size={22} aria-hidden />
            <h3>账号与试用</h3>
            <p>新用户验证邮箱后可获得 <strong>3 天全功能试用</strong>（5 Agent 运营与爬虫等重能力另有日限额）。试用结束再选择订阅套餐。</p>
          </div>
          <div className="pub-trust-card">
            <TrendingUp size={22} aria-hidden />
            <h3>可验证的增长路径</h3>
            <p>支持从手动粘贴数据起步，再逐步接入 API；您可以按模块小步试跑，降低一次性改造风险。</p>
          </div>
        </div>
      </section>

      <section id="trial-explainer" className="pub-section pub-section-accent" aria-labelledby="trial-h">
        <div className="pub-section-head">
          <h2 id="trial-h">试用与上手</h2>
          <p>验证邮箱的新用户可开启 3 天试用；5 Agent 运营与爬虫等能力另计日限额，计费与额度以控制台订阅页为准。</p>
        </div>
        <div className="pub-trial-grid">
          <div>
            <h3>访客 · 浏览介绍</h3>
            <p>任意阅读本页模块与价格信息；准备好后再去登录页创建或进入账号。</p>
          </div>
          <div>
            <h3>登录页 · 验证身份</h3>
            <p>在独立页面完成登录或注册；成功后自动进入工作台，开始使用全部模块。</p>
          </div>
          <div>
            <h3>工作台 · 执行任务</h3>
            <p>在控制台内运行各模块、5 Agent 运营一键生成、配置店铺 API 与本地附件。</p>
          </div>
        </div>
      </section>

      <section id="pricing-preview" className="pub-section" aria-labelledby="price-h">
        <div className="pub-section-head">
          <h2 id="price-h">订阅套餐预览</h2>
          <p>以下为前台标价与权益摘要，实际结算以登录后订购页与协议为准。</p>
        </div>
        <div className="pub-pricing-grid">
          {pricingPlans.map((plan) => (
            <article key={plan.id} className={plan.recommended ? "pub-price-card is-recommended" : "pub-price-card"}>
              {plan.recommended ? <span className="pub-rec-badge">推荐</span> : null}
              <h3>{plan.name}</h3>
              <p className="pub-price-line">
                {plan.price === "联系定价" ? (
                  <strong className="pub-price-custom">联系定价</strong>
                ) : (
                  <>
                    <span className="pub-price-currency">¥</span>
                    <strong className="pub-price-num">{plan.price}</strong>
                    <span className="pub-price-unit">/ 月起</span>
                  </>
                )}
              </p>
              <p className="pub-price-desc">{plan.desc}</p>
              <ul className="pub-price-features">
                {plan.features.slice(0, 5).map((f) => (
                  <li key={f}>
                    <Check size={15} aria-hidden /> {f}
                  </li>
                ))}
              </ul>
              <button type="button" className={plan.recommended ? "pub-btn pub-btn-primary pub-btn-block" : "pub-btn pub-btn-secondary pub-btn-block"} onClick={onRegisterClick}>
                选择此档并注册
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="pub-section pub-cta-final" aria-labelledby="final-cta-h">
        <div className="pub-cta-inner">
          <h2 id="final-cta-h">准备好就开通账号</h2>
          <p>若已了解产品与套餐，可通过下方按钮进入<strong>注册</strong>或<strong>登录</strong>页；验证成功后即可使用工作台。</p>
          <div className="pub-cta-buttons">
            <button type="button" className="pub-btn pub-btn-primary pub-btn-lg" onClick={onRegisterClick}>
              免费注册
            </button>
            <button
              type="button"
              className="pub-btn pub-btn-secondary pub-btn-lg"
              onClick={onLoginClick}
            >
              已有账号 · 登录
            </button>
          </div>
        </div>
      </section>

      <footer className="pub-footer" role="contentinfo">
        <div className="pub-footer-inner">
          <div className="pub-footer-brand">
            <Sparkles size={18} aria-hidden />
            <span>凡梦AI — 跨境电商多智能体工作台</span>
          </div>
          <p>本页内容用于产品介绍与 SEO；产品持续迭代，以登录后控制台为准。</p>
          <button type="button" className="pub-footer-top" onClick={() => go("#top")}>
            回到顶部
          </button>
        </div>
      </footer>
    </div>
  );
}

function LoginScreen({ onLogin, authRouteHash = "login" }) {
  const [authMode, setAuthMode] = useState("login");
  const [resetStep, setResetStep] = useState("request");
  const [registerStep, setRegisterStep] = useState("email");
  const [registerSendInfo, setRegisterSendInfo] = useState(null);
  const [resendCooldownUntil, setResendCooldownUntil] = useState(0);
  const [resendCooldownLeft, setResendCooldownLeft] = useState(0);
  const [authForm, setAuthForm] = useState({
    name: "",
    storeName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [pendingVerification, setPendingVerification] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [passwordReset, setPasswordReset] = useState(null);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const isRegister = authMode === "register";
  const isReset = authMode === "reset";

  useEffect(() => {
    setAuthMode(authRouteHash === "register" ? "register" : "login");
    setRegisterStep("email");
    setRegisterSendInfo(null);
    setVerificationCode("");
    setResendCooldownUntil(0);
    setPendingVerification(null);
    setPasswordReset(null);
    setResetStep("request");
    setAuthError("");
  }, [authRouteHash]);

  useEffect(() => {
    if (!resendCooldownUntil || Date.now() >= resendCooldownUntil) {
      setResendCooldownLeft(0);
      return undefined;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((resendCooldownUntil - Date.now()) / 1000));
      setResendCooldownLeft(left);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [resendCooldownUntil]);

  function updateAuthForm(field, value) {
    setAuthForm({ ...authForm, [field]: value });
  }

  function resetRegisterFlow() {
    setRegisterStep("email");
    setRegisterSendInfo(null);
    setVerificationCode("");
    setResendCooldownUntil(0);
  }

  async function sendRegistrationCode() {
    setAuthError("");
    if (!authForm.email.trim()) {
      setAuthError("请填写邮箱。");
      return;
    }
    setAuthLoading(true);
    try {
      const response = await fetch("/api/auth/register/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setRegisterStep("complete");
      setRegisterSendInfo({ emailDelivered: data.emailDelivered, devCode: data.devCode });
      setVerificationCode(data.devCode ? String(data.devCode) : "");
      setResendCooldownUntil(Date.now() + 60_000);
    } catch (error) {
      setAuthError(formatError(error));
    } finally {
      setAuthLoading(false);
    }
  }

  async function submitCompleteRegistration(event) {
    event.preventDefault();
    setAuthError("");
    if (authForm.password !== authForm.confirmPassword) {
      setAuthError("两次输入的密码不一致。");
      return;
    }
    setAuthLoading(true);
    try {
      const response = await fetch("/api/auth/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authForm.email,
          code: verificationCode,
          password: authForm.password,
          confirmPassword: authForm.confirmPassword,
          name: authForm.name,
          storeName: authForm.storeName,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      resetRegisterFlow();
      onLogin(data);
    } catch (error) {
      setAuthError(formatError(error));
    } finally {
      setAuthLoading(false);
    }
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthError("");

    setAuthLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email, password: authForm.password }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.registrationIncomplete) {
          setAuthError("该邮箱注册尚未完成，请切换到「免费注册」，先收验证码再设置密码。");
          return;
        }
        if (data.verificationRequired) {
          setPendingVerification({ email: data.email, emailDelivered: data.emailDelivered, devCode: data.devCode });
          setVerificationCode("");
          return;
        }
        throw new Error(data.error);
      }
      onLogin(data);
    } catch (error) {
      setAuthError(formatError(error));
    } finally {
      setAuthLoading(false);
    }
  }

  function handleFormSubmit(event) {
    if (isReset) {
      if (resetStep === "confirm") submitPasswordReset(event);
      else requestPasswordReset(event);
      return;
    }
    if (pendingVerification) {
      submitVerification(event);
      return;
    }
    if (isRegister) {
      if (registerStep === "complete") {
        submitCompleteRegistration(event);
        return;
      }
      event.preventDefault();
      sendRegistrationCode();
      return;
    }
    submitAuth(event);
  }

  async function submitVerification(event) {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingVerification.email, code: verificationCode }),
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

  async function resendVerification() {
    setAuthError("");
    setAuthLoading(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingVerification.email }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);
      setPendingVerification(data);
      setVerificationCode(data.devCode || "");
    } catch (error) {
      setAuthError(formatError(error));
    } finally {
      setAuthLoading(false);
    }
  }

  async function requestPasswordReset(event) {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);
      setPasswordReset(data);
      setResetCode(data.devCode || "");
      setResetStep("confirm");
    } catch (error) {
      setAuthError(formatError(error));
    } finally {
      setAuthLoading(false);
    }
  }

  async function submitPasswordReset(event) {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: passwordReset.email, code: resetCode, password: newPassword }),
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
    <main id="account" className="auth-page">
      <section className="auth-hero" aria-label="产品摘要">
        <div className="auth-badge">
          <ShieldCheck size={16} />
          登录后 3 天试用 · 全功能体验（5 Agent 运营/抓取另计日限额）
        </div>
        <h1>跨境电商卖家的多 Agent AI 员工后台</h1>
        <p>
          一个账号进入<strong>工作台</strong>。包含 6 大专业模块，以及「5 Agent 运营一键生成」串联选品—内容—Listing—业绩—利润（客服为单独对话模块，不参与一键自动跑）。
        </p>
        <div className="auth-points">
          <span>
            <Check size={16} /> 账号级订阅
          </span>
          <span>
            <Check size={16} /> 试用全功能 · 日限额保护成本
          </span>
          <span>
            <Check size={16} /> 店铺 API 授权
          </span>
        </div>
      </section>

      <form className="auth-card" onSubmit={handleFormSubmit}>
        <div className="login-icon">
          {isRegister ? <UserPlus size={22} /> : isReset ? <LockKeyhole size={22} /> : <LockKeyhole size={22} />}
        </div>
        {isReset ? (
          <>
            <h2>找回密码</h2>
            <p>{resetStep === "confirm" ? `验证码已发送到 ${passwordReset.email}，请输入验证码和新密码。` : "输入注册邮箱，我们会发送 6 位验证码用于重置密码。"}</p>
            {resetStep === "confirm" && !passwordReset.emailDelivered && passwordReset.devCode && (
              <div className="auth-info">
                当前未配置 SMTP，开发测试验证码：<strong>{passwordReset.devCode}</strong>
              </div>
            )}
            {resetStep === "request" ? (
              <label>
                邮箱
                <input type="email" value={authForm.email} onChange={(event) => updateAuthForm("email", event.target.value)} placeholder="seller@example.com" required />
              </label>
            ) : (
              <>
                <label>
                  验证码
                  <input type="text" inputMode="numeric" maxLength={6} value={resetCode} onChange={(event) => setResetCode(event.target.value)} placeholder="输入 6 位验证码" required />
                </label>
                <label>
                  新密码
                  <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="输入新密码" required />
                </label>
              </>
            )}
          </>
        ) : pendingVerification ? (
          <>
            <h2>验证邮箱</h2>
            <p>验证码已发送到 {pendingVerification.email}，验证成功后会自动进入工作台并开启 3 天免费试用。</p>
            {!pendingVerification.emailDelivered && pendingVerification.devCode && (
              <div className="auth-info">
                当前未配置 SMTP，开发测试验证码：<strong>{pendingVerification.devCode}</strong>
              </div>
            )}
            <label>
              邮箱验证码
              <input type="text" inputMode="numeric" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} placeholder="输入 6 位验证码" required />
            </label>
          </>
        ) : isRegister && registerStep === "complete" ? (
          <>
            <h2>完成注册</h2>
            <p>
              验证码已发送至 <strong>{authForm.email}</strong>，请查收邮件后填写 6 位验证码，并设置登录密码与店铺信息。
            </p>
            {registerSendInfo && !registerSendInfo.emailDelivered && registerSendInfo.devCode && (
              <div className="auth-info">
                当前未配置 SMTP，开发测试验证码：<strong>{registerSendInfo.devCode}</strong>
              </div>
            )}
            <label>
              邮箱验证码
              <input type="text" inputMode="numeric" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} placeholder="输入 6 位验证码" required />
            </label>
            <label>
              姓名
              <input type="text" value={authForm.name} onChange={(event) => updateAuthForm("name", event.target.value)} placeholder="请输入联系人姓名" required />
            </label>
            <label>
              公司或店铺名
              <input type="text" value={authForm.storeName} onChange={(event) => updateAuthForm("storeName", event.target.value)} placeholder="例如：凡梦跨境店铺" required />
            </label>
            <label>
              登录密码
              <input type="password" value={authForm.password} onChange={(event) => updateAuthForm("password", event.target.value)} placeholder="至少 6 位" minLength={6} required />
            </label>
            <label>
              确认密码
              <input type="password" value={authForm.confirmPassword} onChange={(event) => updateAuthForm("confirmPassword", event.target.value)} placeholder="再次输入密码" required />
            </label>
          </>
        ) : isRegister && registerStep === "email" ? (
          <>
            <h2>注册账号</h2>
            <p>输入注册邮箱收取验证码，随后在邮件中填写验证码并完成密码与店铺信息。</p>
            <label>
              邮箱
              <input type="email" value={authForm.email} onChange={(event) => updateAuthForm("email", event.target.value)} placeholder="seller@example.com" required />
            </label>
          </>
        ) : (
          <>
            <h2>登录你的账号</h2>
            <p>使用已验证邮箱与密码登录。若账号尚未完成注册，请先完成邮件验证流程。</p>
            <label>
              邮箱
              <input type="email" value={authForm.email} onChange={(event) => updateAuthForm("email", event.target.value)} placeholder="seller@example.com" required />
            </label>
            <label>
              密码
              <input type="password" value={authForm.password} onChange={(event) => updateAuthForm("password", event.target.value)} placeholder="输入密码" required autoComplete="current-password" />
            </label>
          </>
        )}
        {authError && <div className="auth-error">{authError}</div>}
        <button type="submit" disabled={authLoading}>
          {authLoading
            ? "处理中..."
            : isReset
              ? (resetStep === "confirm" ? "重置密码并登录" : "发送重置验证码")
              : pendingVerification
                ? "验证并进入工作台"
                : isRegister && registerStep === "complete"
                  ? "完成注册并进入工作台"
                  : isRegister && registerStep === "email"
                    ? "发送验证码"
                    : "登录并进入工作台"}
        </button>
        {isReset ? (
          <>
            <small>验证码 10 分钟内有效。重置后会自动登录。</small>
            <button
              type="button"
              className="register-link"
              onClick={() => {
                setAuthMode("login");
                setResetStep("request");
                setPasswordReset(null);
                window.location.hash = "login";
              }}
            >
              返回登录
            </button>
          </>
        ) : pendingVerification ? (
          <>
            <small>验证码 10 分钟内有效。没有收到邮件时，请检查垃圾邮箱或重新发送。</small>
            <button type="button" className="register-link" onClick={resendVerification} disabled={authLoading}>重新发送验证码</button>
            <button
              type="button"
              className="register-link"
              onClick={() => {
                setPendingVerification(null);
                setVerificationCode("");
                window.location.hash = "login";
              }}
            >
              返回登录/注册
            </button>
          </>
        ) : isRegister && registerStep === "complete" ? (
          <>
            <small>验证码 10 分钟内有效。完成注册后将进入工作台并开启 3 天免费试用。</small>
            <button
              type="button"
              className="register-link"
              onClick={sendRegistrationCode}
              disabled={authLoading || resendCooldownLeft > 0}
            >
              {resendCooldownLeft > 0 ? `重新发送验证码（${resendCooldownLeft}s）` : "重新发送验证码"}
            </button>
            <button
              type="button"
              className="register-link"
              onClick={() => {
                setRegisterStep("email");
                setRegisterSendInfo(null);
                setVerificationCode("");
                setAuthForm((f) => ({ ...f, password: "", confirmPassword: "" }));
              }}
            >
              返回修改邮箱
            </button>
            <button
              type="button"
              className="register-link"
              onClick={() => {
                resetRegisterFlow();
                window.location.hash = "login";
              }}
            >
              已有账号？返回登录
            </button>
          </>
        ) : (
          <>
            <small>{isRegister ? "注册即代表同意订阅服务条款，试用期内不会自动扣费。" : "3 天免费试用，试用期结束后再选择订阅套餐。"}</small>
            <button
              type="button"
              className="register-link"
              onClick={() => {
                if (isRegister) {
                  resetRegisterFlow();
                  window.location.hash = "login";
                } else {
                  resetRegisterFlow();
                  setAuthForm((f) => ({ ...f, password: "", confirmPassword: "" }));
                  window.location.hash = "register";
                }
              }}
            >
              {isRegister ? "已有账号？返回登录" : "还没有账号？免费注册"}
            </button>
            {!isRegister && (
              <button type="button" className="register-link" onClick={() => setAuthMode("reset")}>
                忘记密码？邮箱验证找回
              </button>
            )}
          </>
        )}
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

const WORKSPACE_AUTOPILOT_ID = "autopilot";

function workspaceEmptyPanel() {
  return {
    input: "",
    answer: "",
    attachments: [],
    snapshotPlatform: "auto",
    attachStoreSnapshot: false,
    scrape: { enabled: false, platform: "", market: "", category: "", url: "" },
  };
}

function workspaceBuildInitialPanels() {
  const p = {};
  p[WORKSPACE_AUTOPILOT_ID] = {
    ...workspaceEmptyPanel(),
    answer:
      "登录后已开启 3 天免费试用（试用内可体验全部 Agent，5 Agent 运营与抓取另计每日额度）。请在本模块输入要求后由 OpenClaw 生成结果。",
  };
  for (const a of agents) {
    p[a.id] = workspaceEmptyPanel();
  }
  return p;
}

function workspacePanelLabel(panelId) {
  if (panelId === WORKSPACE_AUTOPILOT_ID) return "5 Agent 运营 · 一键生成";
  return agents.find((x) => x.id === panelId)?.name || panelId;
}

function buildAttachmentContextFromList(attachments) {
  if (!attachments?.length) return "";
  return [
    "",
    "用户本地导入的附件：",
    ...attachments.map((file, index) => {
      const basic = `${index + 1}. ${file.name}（${file.type}，${Math.ceil(file.size / 1024)}KB）`;
      if (file.content) {
        return `${basic}\n文件文本内容摘录：\n${file.content}`;
      }
      if (file.isImage) {
        return `${basic}\n（图片附件：请在对话中简要描述截图内容；当前模型以文本为主，未自动 OCR 图片像素。）`;
      }
      return `${basic}\n当前文件类型暂不自动解析内容，已作为附件信息提供。`;
    }),
  ].join("\n");
}

function NavigateInterruptModal({ runningLabel, targetLabel, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section className="store-api-modal nav-confirm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p>切换确认</p>
            <h2>正在生成中</h2>
          </div>
          <button type="button" onClick={onCancel}>
            关闭
          </button>
        </div>
        <div className="store-guide-body">
          <p>
            「<strong>{runningLabel}</strong>」的请求尚未结束。若切换到「<strong>{targetLabel}</strong>」，将中断本次生成，未完成的输出将丢失。
          </p>
          <p>请确认不是误触。</p>
          <div className="store-nudge-actions">
            <button type="button" className="header-ghost" onClick={onCancel}>
              留在当前
            </button>
            <button type="button" className="continue-checkout slim" onClick={onConfirm}>
              仍要切换
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

const STORE_PLATFORM_ORDER = ["tiktok", "amazon", "shopify", "woocommerce"];

const STORE_PLATFORM_LABELS = {
  tiktok: "TikTok Shop",
  amazon: "Amazon",
  shopify: "Shopify",
  woocommerce: "WooCommerce",
};

function emptyStoreBlock() {
  return { storeName: "", apiEndpoint: "", apiToken: "", autoBuyerReply: false };
}

function defaultStoreBlocks() {
  return {
    tiktok: emptyStoreBlock(),
    amazon: emptyStoreBlock(),
    shopify: emptyStoreBlock(),
    woocommerce: emptyStoreBlock(),
  };
}

function mergeRemoteStoreConnections(connections) {
  const blocks = defaultStoreBlocks();
  for (const c of connections || []) {
    const p = String(c.platform || "").toLowerCase();
    if (!blocks[p]) continue;
    blocks[p] = {
      storeName: c.storeName || "",
      apiEndpoint: c.apiEndpoint || "",
      apiToken: c.apiTokenMasked || "",
      autoBuyerReply: Boolean(c.autoBuyerReply),
    };
  }
  return blocks;
}

function platformEndpointHint(platform) {
  if (platform === "shopify") return "例：https://your-store.myshopify.com";
  if (platform === "woocommerce") return "例：https://your-site.com（WordPress 根地址）";
  if (platform === "tiktok") return "可选：Open API 网关备注；凭据主要为下方 JSON";
  return "可选：区域/备注；SP-API 主凭据为 JSON";
}

function platformTokenHint(platform) {
  if (platform === "shopify") return "Admin API access token";
  if (platform === "woocommerce") return "Woo：ck_xxx:cs_xxx";
  if (platform === "tiktok") return "JSON：access_token、shop_cipher；KEY 在服务端 .env";
  return "JSON：refreshToken、sellerId 等（以实现为准）";
}

function isPlatformBlockReady(platform, block) {
  if (!block?.storeName?.trim() || !block?.apiToken?.trim()) return false;
  if (platform === "tiktok" || platform === "amazon") return true;
  return Boolean(block.apiEndpoint?.trim());
}

function StoreApiModal({ onClose, storeBlocks, setStoreBlocks, saveStorePlatform, showToast, authHeaders }) {
  const [snapshotLoading, setSnapshotLoading] = useState(null);
  const [activePlatform, setActivePlatform] = useState("tiktok");
  const [showGuide, setShowGuide] = useState(false);

  async function startTiktokShopOAuth() {
    setSnapshotLoading("oauth");
    try {
      const response = await fetch("/api/store/tiktok/oauth/url", {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error([data.error, data.hint].filter(Boolean).join(" ") || "无法获取授权链接");
      }
      if (!data.url) {
        throw new Error("服务器未返回授权地址");
      }
      window.location.assign(data.url);
    } catch (error) {
      showToast(formatError(error));
    } finally {
      setSnapshotLoading(null);
    }
  }

  async function testSnapshot(platform) {
    const cfg = { platform, ...storeBlocks[platform] };
    setSnapshotLoading(platform);
    try {
      const path =
        platform === "amazon"
          ? "/api/store/amazon/snapshot"
          : platform === "tiktok"
            ? "/api/store/tiktok/snapshot"
            : "/api/store/snapshot";
      const response = await fetch(path, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ testConfig: cfg, storePlatform: platform }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "请求失败");
      }
      if (data.ok) {
        const oc = data.data?.orders_sample?.length ?? 0;
        const pc = data.data?.products_sample?.length ?? 0;
        showToast(`${data.platform} 测试成功：订单样本 ${oc}、商品样本 ${pc}。`);
      } else {
        showToast(data.error || data.hint || "拉取失败");
      }
    } catch (error) {
      showToast(formatError(error));
    } finally {
      setSnapshotLoading(null);
    }
  }

  function updateBlock(platform, field, value) {
    setStoreBlocks((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value },
    }));
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="store-api-modal store-api-modal-wide" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p>Store API</p>
            <h2>配置店铺 API</h2>
          </div>
          <div className="modal-head-actions">
            <button type="button" className="header-ghost slim" onClick={() => setShowGuide(true)}>
              申请指南（官方入口）
            </button>
            <button type="button" onClick={onClose}>关闭</button>
          </div>
        </div>
        <div className="store-api-callout" role="note">
          <strong>强数据 Agent 建议配置</strong>
          <span>
            诊断、客服、广告与库存等能力需要对接店铺数据。请选择一个平台标签，分别填写并保存；TikTok 与 Amazon 凭据互不影响。
          </span>
        </div>
        <p className="store-api-intro">
          点击下方 <strong>TikTok / Amazon</strong> 等标签切换表单，每平台独立「测试快照」与「保存」。
        </p>
        <div className="store-platform-tabs" role="tablist" aria-label="选择店铺平台">
          {STORE_PLATFORM_ORDER.map((platform) => {
            const ready = isPlatformBlockReady(platform, storeBlocks[platform] || emptyStoreBlock());
            const isActive = activePlatform === platform;
            return (
              <button
                key={platform}
                type="button"
                className={`store-platform-tab ${isActive ? "is-active" : ""} ${ready ? "is-ready" : ""}`}
                role="tab"
                aria-selected={isActive}
                id={`store-tab-${platform}`}
                aria-controls={`store-panel-${platform}`}
                onClick={() => setActivePlatform(platform)}
              >
                {STORE_PLATFORM_LABELS[platform]}
              </button>
            );
          })}
        </div>
        <div
          className="store-platform-blocks"
          role="tabpanel"
          id={`store-panel-${activePlatform}`}
          aria-labelledby={`store-tab-${activePlatform}`}
        >
          {(() => {
            const platform = activePlatform;
            const block = storeBlocks[platform] || emptyStoreBlock();
            const ready = isPlatformBlockReady(platform, block);
            return (
              <div key={platform} className={`store-platform-block ${ready ? "is-ready" : ""}`}>
                <div className="store-platform-block-head">
                  <h3>{STORE_PLATFORM_LABELS[platform]}</h3>
                  <span className={ready ? "pill-ok" : "pill-warn"}>{ready ? "已填密钥" : "未配置"}</span>
                </div>
                <div className="store-api-form vertical">
                  <input
                    value={block.storeName}
                    onChange={(e) => updateBlock(platform, "storeName", e.target.value)}
                    placeholder="店铺名称 / 显示名"
                  />
                  <input
                    value={block.apiEndpoint}
                    onChange={(e) => updateBlock(platform, "apiEndpoint", e.target.value)}
                    placeholder={platform === "shopify" ? "店铺 API Endpoint（如 Shopify 店铺地址）" : "店铺 API Endpoint"}
                  />
                  <input
                    value={block.apiToken}
                    onChange={(e) => updateBlock(platform, "apiToken", e.target.value)}
                    placeholder="API Token / Access Key"
                  />
                  <p className="store-field-hint">{platformEndpointHint(platform)} · {platformTokenHint(platform)}</p>
                  {platform === "tiktok" && (
                    <div className="store-oauth-row">
                      <button
                        type="button"
                        className="header-ghost slim store-oauth-btn"
                        disabled={snapshotLoading === "oauth"}
                        onClick={startTiktokShopOAuth}
                      >
                        {snapshotLoading === "oauth" ? "正在跳转授权…" : "使用 TikTok Shop OAuth 连接"}
                      </button>
                      <span className="store-oauth-note">
                        跳转 TikTok 授权后会回到站点并自动保存令牌（需服务端已配置回调 URL）。
                      </span>
                    </div>
                  )}
                  {platform === "tiktok" && (
                    <label className="scrape-toggle tiktok-autoreply-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(block.autoBuyerReply)}
                        onChange={(e) => updateBlock(platform, "autoBuyerReply", e.target.checked)}
                      />
                      开启买家消息 Webhook 自动话术（<code>/webhooks/tiktok</code>）
                    </label>
                  )}
                </div>
                <div className="store-platform-block-actions">
                  <button type="button" className="header-ghost" disabled={snapshotLoading === platform} onClick={() => testSnapshot(platform)}>
                    {snapshotLoading === platform ? "测试中…" : "测试本台快照"}
                  </button>
                  <button type="button" className="continue-checkout slim" onClick={() => saveStorePlatform(platform)}>
                    保存配置
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
        {showGuide ? <StoreApiGuideModal onClose={() => setShowGuide(false)} /> : null}
      </section>
    </div>
  );
}

function SubscriptionModal({ onClose, showToast, authHeaders, onUserUpdate, user }) {
  const [selectedPlanId, setSelectedPlanId] = useState(() =>
    user?.plan && PAID_PLAN_IDS.has(user.plan) ? user.plan : "standard",
  );
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [payerNote, setPayerNote] = useState("");
  const [contactForm, setContactForm] = useState({ name: "", phone: "", wechat: "", email: "", note: "" });
  const selectedPlan = pricingPlans.find((plan) => plan.id === selectedPlanId);

  function orderStatusLabel(status) {
    if (status === "paid") return "已支付 · 套餐已开通";
    if (status === "awaiting_confirm") return "待核实到账（已提交付款提醒）";
    if (status === "pending") return "待付款";
    return status || "未知";
  }

  useEffect(() => {
    if (user?.plan && PAID_PLAN_IDS.has(user.plan)) {
      setSelectedPlanId(user.plan);
    }
  }, [user?.plan]);

  useEffect(() => {
    if (!checkoutPlan || checkoutPlan.id === "enterprise") {
      setPaymentConfig(null);
      return;
    }
    let cancelled = false;
    fetch("/api/billing/payment-config")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPaymentConfig(data);
      })
      .catch(() => {
        if (!cancelled) setPaymentConfig(null);
      });
    return () => {
      cancelled = true;
    };
  }, [checkoutPlan]);

  useEffect(() => {
    setPayerNote("");
  }, [checkoutOrder?.id]);

  function updateContactForm(field, value) {
    setContactForm({ ...contactForm, [field]: value });
  }

  async function submitEnterpriseContact() {
    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/billing/enterprise-leads", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(contactForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      showToast("已记录定制版联系信息，后续可在运营后台查看。");
      onClose();
    } catch (error) {
      showToast(formatError(error));
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function createCheckoutOrder(plan) {
    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/billing/orders", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ planId: plan.id, paymentMethod: "personal_manual" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCheckoutOrder(data.order);
      showToast("订单已创建，请按下方金额扫码付款，并备注订单号。");
    } catch (error) {
      showToast(formatError(error));
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function claimPaid() {
    if (!checkoutOrder) return;
    setCheckoutLoading(true);
    try {
      const response = await fetch(`/api/billing/orders/${checkoutOrder.id}/claim-paid`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ payerNote }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCheckoutOrder(data.order);
      showToast("已提交付款提醒，核实到账后将为你开通套餐。");
    } catch (error) {
      showToast(formatError(error));
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function simulatePayment() {
    if (!checkoutOrder) return;
    setCheckoutLoading(true);
    try {
      const response = await fetch(`/api/billing/orders/${checkoutOrder.id}/simulate-pay`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCheckoutOrder(data.order);
      onUserUpdate(data.user);
      showToast("开发模式已模拟支付成功，套餐已开通。");
      onClose();
    } catch (error) {
      showToast(formatError(error));
    } finally {
      setCheckoutLoading(false);
    }
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
              <ul className="checkout-feature-list">
                {checkoutPlan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
            <div>
              <span>功能权限说明</span>
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
              <h3>扫码支付（个人收款）</h3>
              {!paymentConfig && <p className="payment-loading">正在加载收款配置…</p>}
              {paymentConfig?.provider === "personal_qr" ? (
                <>
                  <p className="payment-legal">{paymentConfig.personalQr.legalNote}</p>
                  {paymentConfig.personalQr.contactHint ? (
                    <p className="payment-contact">{paymentConfig.personalQr.contactHint}</p>
                  ) : null}
                </>
              ) : (
                <p>当前未配置个人收款展示；请联系站长或在服务器环境变量中设置 PAYMENT_PROVIDER=personal_qr。</p>
              )}

              <div className="order-placeholder">
                <span>订单状态</span>
                <strong>
                  {checkoutOrder
                    ? `${checkoutOrder.orderNo} · ${orderStatusLabel(checkoutOrder.status)}`
                    : "尚未创建订单"}
                </strong>
                {!checkoutOrder && (
                  <p>点击「创建订单」后显示应付金额与个人收款码；转账后点「我已付款」通知核实。</p>
                )}
                {checkoutOrder?.status === "awaiting_confirm" && checkoutOrder?.payerNote ? (
                  <p className="order-user-note">用户备注：{checkoutOrder.payerNote}</p>
                ) : null}
              </div>

              {!checkoutOrder && (
                <div className="pay-options">
                  <button type="button" disabled={checkoutLoading} onClick={() => createCheckoutOrder(checkoutPlan)}>
                    创建订单
                  </button>
                </div>
              )}

              {checkoutOrder && paymentConfig?.provider === "personal_qr" && checkoutOrder.status !== "paid" && (
                <>
                  <div className="personal-pay-amount">
                    <span>应付金额</span>
                    <strong>¥{checkoutOrder.amount}</strong>
                  </div>
                  <p className="pay-transfer-hint">{paymentConfig.personalQr.transferNoteHint}</p>
                  <button
                    type="button"
                    className="copy-order-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(checkoutOrder.orderNo);
                      showToast("订单号已复制。");
                    }}
                  >
                    复制订单号 {checkoutOrder.orderNo}
                  </button>

                  <div className="payment-qr-grid">
                    <div className="payment-qr-card">
                      <span>微信收款</span>
                      <img src={paymentConfig.personalQr.wechatQrUrl} alt="微信收款码" width={200} height={200} />
                    </div>
                    <div className="payment-qr-card">
                      <span>支付宝收款</span>
                      <img src={paymentConfig.personalQr.alipayQrUrl} alt="支付宝收款码" width={200} height={200} />
                    </div>
                  </div>

                  {checkoutOrder.status === "pending" && (
                    <>
                      <label className="payer-note-label">
                        付款备注（选填）
                        <input
                          value={payerNote}
                          onChange={(e) => setPayerNote(e.target.value)}
                          placeholder="例如：付款微信昵称 / 转账时间"
                        />
                      </label>
                      <button type="button" className="claim-paid-btn" disabled={checkoutLoading} onClick={claimPaid}>
                        我已完成转账，请核实
                      </button>
                    </>
                  )}

                  {checkoutOrder.status === "awaiting_confirm" && (
                    <p className="awaiting-note">我们核实到账后会为你开通对应套餐，通常可在当日完成。</p>
                  )}

                  {checkoutOrder.status === "paid" && (
                    <p className="order-paid-msg">该订单已支付。若左侧权益未更新，请关闭本窗口刷新页面。</p>
                  )}
                </>
              )}

              {checkoutOrder && paymentConfig?.simulateEnabled && (
                <button type="button" disabled={checkoutLoading} onClick={simulatePayment} className="simulate-pay-btn">
                  开发/内测：模拟支付成功
                </button>
              )}
            </div>
          )}
          <button
            className="back-to-plans"
            type="button"
            onClick={() => {
              setCheckoutPlan(null);
              setCheckoutOrder(null);
              setPayerNote("");
            }}
          >
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
            {user?.plan === "trial" && user?.trialActive ? (
              <p className="subscription-status-line">当前为试用账号 · 订阅后按所选套餐保留调用额度与能力边界。</p>
            ) : null}
            {user?.plan && PAID_PLAN_IDS.has(user.plan) && user?.planName ? (
              <p className="subscription-status-line">
                已订阅：<strong>{user.planName}</strong> · 可选择更高档位升级或续订同档。
              </p>
            ) : null}
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
                user?.plan === plan.id && PAID_PLAN_IDS.has(user.plan || "") ? "is-current-plan" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              <div className="sub-plan-badges">
                {plan.recommended ? <span className="sub-badge">推荐</span> : null}
                {user?.plan === plan.id && PAID_PLAN_IDS.has(user.plan || "") ? (
                  <span className="sub-badge sub-badge-current">当前套餐</span>
                ) : null}
              </div>
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
              <button
                type="button"
                disabled={
                  plan.id !== "enterprise" &&
                  user?.plan === plan.id &&
                  PAID_PLAN_IDS.has(user.plan || "") &&
                  user?.accessActive
                }
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedPlanId(plan.id);
                  setCheckoutPlan(plan);
                }}
              >
                {plan.id === "enterprise"
                  ? "联系我们"
                  : user?.plan === plan.id && PAID_PLAN_IDS.has(user.plan || "") && user?.accessActive
                    ? "当前使用中"
                    : "选择套餐"}
              </button>
            </article>
          ))}
        </div>
        {selectedPlan && (
          <button
            className="continue-checkout"
            type="button"
            disabled={
              selectedPlan.id !== "enterprise" &&
              user?.plan === selectedPlan.id &&
              PAID_PLAN_IDS.has(user.plan || "") &&
              user?.accessActive
            }
            onClick={() => setCheckoutPlan(selectedPlan)}
          >
            {user?.plan === selectedPlan.id &&
            PAID_PLAN_IDS.has(user.plan || "") &&
            user?.accessActive
              ? `已开通 ${selectedPlan.name}（去选择其他档位可升级）`
              : `继续开通 ${selectedPlan.name}`}
          </button>
        )}
      </section>
    </div>
  );
}

function isMarkdownTableRow(line) {
  const t = String(line || "").trim();
  if (!t || !t.includes("|")) return false;
  const cells = t.split("|");
  return cells.length >= 3;
}

function parseMarkdownTableLines(lines) {
  const rows = [];
  for (const raw of lines) {
    const line = String(raw || "").trim();
    if (!isMarkdownTableRow(line)) continue;
    if (/^\|?\s*:?-{3,}/.test(line.replace(/\|/g, "").trim())) continue;
    const cells = line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
    if (cells.length) rows.push(cells);
  }
  return rows;
}

function StoreApiGuideModal({ onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="store-api-modal store-api-modal-guide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p>官方入口（请自行核对最新规则）</p>
            <h2>店铺 Open API / 密钥申请指引</h2>
          </div>
          <button type="button" onClick={onClose}>关闭</button>
        </div>
        <div className="store-guide-body">
          <p className="store-guide-disclaimer">
            以下内容根据各平台<strong>公开文档</strong>整理，用于帮助卖家找到正确入口；<strong>资质、审核周期与收费以平台当时页面为准</strong>，本工具不代申、不承诺审核结果。
          </p>

          <article className="store-guide-card">
            <h3>TikTok Shop（跨境电商开放平台）</h3>
            <ol>
              <li>使用 <a href="https://partner.tiktokshop.com/" target="_blank" rel="noreferrer">TikTok Shop Partner Center</a> 注册合作伙伴账号并完成入驻资料。</li>
              <li>在开发者中心创建应用（公开应用或定制应用视你的业务模式而定），获取 <code>app key</code> / <code>app secret</code>；在应用里配置<strong>回调 URL</strong>与本服务一致，例如 <code>/api/store/tiktok/oauth/callback</code>（完整域名以部署为准）。</li>
              <li>工作台「配置店铺 API」中可使用 <strong>OAuth 连接</strong>跳转授权，成功后服务端会写入 <code>access_token</code>、<code>refresh_token</code> 与 <code>shop_cipher</code>；亦支持手动粘贴 JSON 凭据（高级/排障）。</li>
              <li>接口与字段说明以 Open API 文档为准（Partner Center 内「文档」栏目）。</li>
            </ol>
            <p className="store-guide-li">
              文档入口：<a href="https://partner.tiktokshop.com/doc" target="_blank" rel="noreferrer">partner.tiktokshop.com/doc</a>
            </p>
            <p className="store-guide-note">
              <strong>无需 Open API 的替代方案：</strong>可安装仓库内 Chrome 插件（<code>extension/</code>），在卖家中心同步页面并生成客服/诊断话术，详见 <code>docs/CHROME_EXTENSION.md</code>。
            </p>
          </article>

          <article className="store-guide-card">
            <h3>Amazon（Selling Partner API, SP-API）</h3>
            <ol>
              <li>在卖家后台关联「开发者」身份，并按亚马逊流程<strong>注册应用</strong>；常见入口参见官方说明 <a href="https://developer-docs.amazon.com/sp-api/docs/registering-your-application" target="_blank" rel="noreferrer">Registering your application</a>。</li>
              <li>新建开发者资料（Developer profile）并选择<strong>公开开发者或私有开发者</strong>路径；完成 LWA 安全客户端与 IAM 角色等配置。</li>
              <li>卖家需通过授权流程颁发 <strong>refresh token</strong>，再配合 <code>sellerId</code>、站点 <code>marketplaceIds</code> 等调用 API。</li>
            </ol>
            <p className="store-guide-li">
              总览：<a href="https://developer-docs.amazon.com/sp-api/docs/onboarding-overview" target="_blank" rel="noreferrer">SP-API 入驻总览</a>
            </p>
          </article>

          <article className="store-guide-card">
            <h3>Shopify（Admin API）</h3>
            <ol>
              <li>由店铺管理员在 Shopify 后台创建<strong>自定义应用（Custom app）</strong>并分配所需权限范围（scopes），见 <a href="https://help.shopify.com/en/manual/apps/app-types/custom-apps" target="_blank" rel="noreferrer">Shopify 帮助：自定义应用</a>。</li>
              <li>安装应用后生成 <strong>Admin API access token</strong>；请求时在 Header 携带 <code>X-Shopify-Access-Token</code>（参见 <a href="https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/generate-app-access-tokens-admin" target="_blank" rel="noreferrer">生成 Admin 令牌</a>）。</li>
              <li>店铺地址格式通常为 <code>https://你的店.myshopify.com</code>。</li>
            </ol>
            <p className="store-guide-note">Shopify 正逐步迁移至 Dev Dashboard；新建应用请以 Shopify 后台/文档当前指引为准。</p>
          </article>

          <article className="store-guide-card">
            <h3>WooCommerce（REST API）</h3>
            <ol>
              <li>进入 WordPress 后台 <strong>WooCommerce → 设置 → 高级 → REST API</strong>（官方说明见 <a href="https://developer.woocommerce.com/docs/getting-started-with-the-woocommerce-rest-api/" target="_blank" rel="noreferrer">WooCommerce REST API 入门</a>）。</li>
              <li>点击「添加密钥」，选择用户与权限（<strong>只读 / 读写</strong>），生成 <strong>Consumer Key</strong> 与 <strong>Consumer Secret</strong>（Secret 仅显示一次）。</li>
              <li>在本产品中可将密钥以 <code>ck_xxx:cs_xxx</code> 形式填入 Token 字段；站点根地址填 WordPress 根 URL。</li>
            </ol>
            <p className="store-guide-li">
              鉴权说明：<a href="https://developer.woocommerce.com/docs/apis/rest-api/authentication/" target="_blank" rel="noreferrer">REST API Authentication</a>
            </p>
          </article>

          <p className="store-guide-foot">
            若你的团队无开发能力，可由熟悉各平台后台的同事按上述入口申请；连接完成后在本工作台「配置店铺 API」中保存即可拉取只读快照（受平台与本工具实现范围限制）。
          </p>
        </div>
      </section>
    </div>
  );
}

const STORE_DATA_AGENT_IDS = ["growth", "service", "profit"];

function StoreDataNudgeModal({ agentId, onClose, onOpenStoreApi }) {
  const label =
    agentId === "growth"
      ? "店铺业绩诊断"
      : agentId === "service"
        ? "AI 客服售后"
        : "广告库存利润";

  function dismiss() {
    try {
      localStorage.setItem(`fanmeng_store_data_intro_v2_${agentId}`, "1");
    } catch {
      /* ignore */
    }
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={dismiss}>
      <section className="store-api-modal store-data-nudge" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p>数据接入说明</p>
            <h2>{label}</h2>
          </div>
          <button type="button" onClick={dismiss}>关闭</button>
        </div>
        <div className="store-guide-body">
          <p>
            该模块若对接<strong>店铺 Open API</strong>，可由服务端拉取订单/商品等<strong>只读样本</strong>辅助分析（视平台与你配置的权限而定）。
          </p>
          <p>
            <strong>若不配置店铺 API</strong>，系统无法替你自动从后台实时抓数；请你通过<strong>后台截图</strong>、<strong>导出报表</strong>（CSV/Excel）等，在下方使用<strong>「本地导入」</strong>上传，或在输入框中粘贴关键数据，否则模型只能给出通用框架，难以贴合你店内的真实指标。
          </p>
          <div className="store-nudge-actions">
            <button
              type="button"
              className="continue-checkout slim"
              onClick={() => {
                onOpenStoreApi();
                dismiss();
              }}
            >
              去配置店铺 API
            </button>
            <button type="button" className="header-ghost" onClick={dismiss}>
              我知道了，稍后上传文件
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function AdminGrantRow({ user, authHeaders, onReloadSummary, showToast }) {
  const [planId, setPlanId] = useState(() => (user.plan && user.plan !== "trial" ? user.plan : "standard"));
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);

  async function grant() {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/grant-subscription`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ planId, days: Number(days) || 30 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      showToast(`已为 ${user.email} 开通套餐 ${planId}（${days} 天）。`);
      await onReloadSummary();
    } catch (error) {
      showToast(formatError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-grant-row">
      <div className="admin-grant-meta">
        <strong>{user.email}</strong>
        <span>{user.planName} · {user.accessActive ? "当前可访问" : "未订阅或已过期"}</span>
      </div>
      <select className="admin-grant-select" value={planId} onChange={(e) => setPlanId(e.target.value)} aria-label="套餐">
        <option value="starter">尝鲜版 starter</option>
        <option value="standard">标准版 standard</option>
        <option value="managed">全托版 managed</option>
        <option value="enterprise">企业版 enterprise</option>
      </select>
      <label className="admin-grant-days">
        天数
        <input
          type="number"
          min={1}
          max={730}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        />
      </label>
      <button type="button" className="admin-grant-btn" disabled={busy} onClick={grant}>
        {busy ? "…" : "授权开通"}
      </button>
    </div>
  );
}

function StructuredAgentPreview({ agentId }) {
  if (agentId === "growth") {
    return (
      <div className="structured-preview">
        <div className="preview-heading">
          <strong>店铺业绩 · 诊断版 / 连接版</strong>
          <span>诊断版不假设已读后台；连接版基于你粘贴或导出的数据</span>
        </div>
        <div className="metric-cards">
          <div>
            <span>模式</span>
            <strong>默认诊断</strong>
            <em>指标框架 + 缺口清单</em>
          </div>
          <div>
            <span>GMV</span>
            <strong>待你提供</strong>
            <em>或粘贴区间</em>
          </div>
          <div>
            <span>广告 ROI</span>
            <strong>待你提供</strong>
            <em>或导出报表</em>
          </div>
          <div>
            <span>库存</span>
            <strong>待你提供</strong>
            <em>周转假设可写</em>
          </div>
        </div>
        <div className="diagnosis-layout">
          <section>
            <h4>诊断版</h4>
            <p>输出应监控指标、常见异常假设、P0/P1 动作；不写「实时后台已确认」。</p>
            <p>连接版：仅在你提供数据后做归因与优先级排序。</p>
          </section>
          <section>
            <h4>行动清单</h4>
            <p>补数据 → 验证假设 → 调整广告/Listing/库存，按周复盘。</p>
          </section>
        </div>
      </div>
    );
  }

  if (agentId === "service") {
    return (
      <div className="structured-preview service-preview">
        <div className="preview-heading">
          <strong>AI 客服 · 策略与话术</strong>
          <span>不代客执行后台；高风险须人工或系统确认</span>
        </div>
        <div className="service-flow">
          <div>意图识别</div>
          <span>→</span>
          <div>话术与 Checklist</div>
          <span>→</span>
          <div>若接 API 可规划查询</div>
          <span>→</span>
          <div>人工/系统执行</div>
        </div>
        <div className="service-matrix">
          <section>
            <h4>售前策略</h4>
            <p>规格/库存/时效：无实时数据时用核对模板索取信息。</p>
            <p>价格优惠：避免未经授权的底价承诺。</p>
            <p>推荐与对比：基于需求给方向，注明需核实库存。</p>
            <p>催单改单：只给内部步骤，执行标「待确认」。</p>
          </section>
          <section>
            <h4>售后策略</h4>
            <p>订单物流：话术 + 建议向官方渠道核实的方式。</p>
            <p>退款退货：政策对齐话术，不声称「已操作完成」。</p>
            <p>投诉/差评：安抚与补偿梯度，标注审批与记录。</p>
            <p>换货补发：Checklist + 待仓库/人工执行。</p>
          </section>
        </div>
        <div className="service-system">
          <div>
            <span>后续接入</span>
            <strong>Shopify / Amazon / WooCommerce API 规划项</strong>
          </div>
          <div>
            <span>消息通道</span>
            <strong>草稿回复供人工发送</strong>
          </div>
          <div>
            <span>语言层</span>
            <strong>多语言草稿（按需）</strong>
          </div>
          <div>
            <span>知识库</span>
            <strong>政策 + Q&A 沉淀</strong>
          </div>
        </div>
        <div className="reply-box">
          <h4>输出约定</h4>
          <p>统一输出含：意图、风险等级、话术、须确认项；禁止「已替您在后台操作」类表述。</p>
        </div>
      </div>
    );
  }

  if (agentId === "profit") {
    return (
      <div className="structured-preview">
        <div className="preview-heading">
          <strong>广告 · 库存 · 利润</strong>
          <span>无完整成本时给框架；有数据再算 SKU 级结论</span>
        </div>
        <div className="sku-table">
          <div className="sku-row header">
            <span>数据完备度</span>
            <span>输出类型</span>
            <span>主要动作</span>
            <span>下一步</span>
          </div>
          <div className="sku-row">
            <span>缺成本/广告明细</span>
            <span className="good">原则 + 字段清单</span>
            <span>分层逻辑/假设区间</span>
            <span>导出报表后重跑</span>
          </div>
          <div className="sku-row">
            <span>已粘贴关键数</span>
            <span className="bad">可算倾向</span>
            <span>停投/补货/清仓</span>
            <span>敏感性说明</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function renderDocumentLines(lines) {
  return lines.map((line, index) => {
    const trimmed = String(line || "").trim();
    if (!trimmed) return null;

    const normalized = trimmed.replace(/^#{1,6}\s*/, "");

    if (/^#{1,6}\s+/.test(trimmed) || /^[一二三四五六七八九十]+[、.]/.test(trimmed)) {
      return <h3 key={`h-${index}`}>{normalized}</h3>;
    }

    if (/^[-*]\s+/.test(trimmed) || /^\d+[.)、]\s*/.test(trimmed)) {
      return (
        <p className="doc-list-item" key={`li-${index}`}>
          {trimmed.replace(/^[-*]\s+/, "").replace(/^\d+[.)、]\s*/, "")}
        </p>
      );
    }

    if (/[:：]$/.test(trimmed) && trimmed.length < 32) {
      return <h4 key={`h4-${index}`}>{trimmed}</h4>;
    }

    return <p key={`p-${index}`}>{trimmed}</p>;
  });
}

function ResultDocument({ content, streaming }) {
  if (streaming && (!content || !String(content).trim())) {
    return (
      <article className="result-document is-generating" aria-busy="true">
        <p className="generating-hint">正在生成，请稍候…</p>
      </article>
    );
  }

  if (!content) {
    return <div className="result-empty">等待输入要求...</div>;
  }

  const text = String(content);
  const rawLines = text.split("\n");
  const segments = [];
  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    if (isMarkdownTableRow(line)) {
      const tableLines = [];
      while (i < rawLines.length && isMarkdownTableRow(rawLines[i])) tableLines.push(rawLines[i++]);
      segments.push({ type: "table", lines: tableLines });
    } else {
      const chunk = [];
      while (i < rawLines.length && !isMarkdownTableRow(rawLines[i])) chunk.push(rawLines[i++]);
      if (chunk.length) segments.push({ type: "text", lines: chunk });
    }
  }

  return (
    <article className={`result-document ${streaming ? "is-generating" : ""}`} aria-busy={streaming ? "true" : undefined}>
      {segments.map((seg, idx) => {
        if (seg.type === "table") {
          const rows = parseMarkdownTableLines(seg.lines);
          if (rows.length < 2) {
            return (
              <div key={`tbl-fallback-${idx}`} className="result-table-fallback">
                {seg.lines.map((l, j) => (
                  <p key={j}>{l}</p>
                ))}
              </div>
            );
          }
          const [header, ...body] = rows;
          const colCount = header.length;
          const normalizedBody = body.map((row) => {
            const padded = [...row];
            while (padded.length < colCount) padded.push("");
            return padded.slice(0, colCount);
          });
          return (
            <div key={`tbl-${idx}`} className="result-table-wrap">
              <table className="result-md-table">
                <thead>
                  <tr>
                    {header.map((cell, c) => (
                      <th key={c}>{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {normalizedBody.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return <div key={`txt-${idx}`}>{renderDocumentLines(seg.lines)}</div>;
      })}
    </article>
  );
}

function FeedbackForm({ onSubmit }) {
  const [form, setForm] = useState({ name: "", contact: "", message: "" });

  return (
    <div className="feedback-box">
      <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="你的称呼 / 公司" />
      <input value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} placeholder="微信 / 手机 / 邮箱" />
      <textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="你觉得哪里不好用？还希望增加什么功能？" />
      <button type="button" onClick={() => onSubmit({ type: "beta-feedback", ...form })}>提交反馈</button>
    </div>
  );
}

function AdminModal({ summary, onClose, authHeaders, onReloadSummary, showToast }) {
  const [busyOrderId, setBusyOrderId] = useState(null);

  if (!summary) return null;

  async function confirmPayment(orderId) {
    setBusyOrderId(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/confirm-payment`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      showToast("已确认收款，用户套餐已开通。");
      await onReloadSummary();
    } catch (error) {
      showToast(formatError(error));
    } finally {
      setBusyOrderId(null);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="admin-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p>Admin Console</p>
            <h2>凡梦AI运营后台</h2>
          </div>
          <button type="button" onClick={onClose}>关闭</button>
        </div>
        <div className="admin-metrics">
          {Object.entries(summary.metrics || {}).map(([key, value]) => (
            <div key={key}>
              <span>{key}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="admin-sections">
          <section className="admin-grant-section">
            <h3>手动授权套餐（线下收款 / 对公确认后）</h3>
            <p className="admin-hint">选择用户、套餐与订阅天数后点击「授权开通」。若需仅你自己能进后台，在服务端 .env 配置 <code>ADMIN_EMAILS=你的邮箱</code> 并重启服务。</p>
            <div className="admin-grant-list">
              {(summary.users || []).map((u) => (
                <AdminGrantRow key={u.id} user={u} authHeaders={authHeaders} onReloadSummary={onReloadSummary} showToast={showToast} />
              ))}
            </div>
          </section>
          <section className="admin-orders-section">
            <h3>订单与收款</h3>
            {(summary.orders || []).slice(0, 30).map((item) => (
              <div key={item.id} className="admin-order-row">
                <div>
                  <strong>{item.orderNo}</strong>
                  <span>{item.userEmail} · {item.planName} · ¥{item.amount} · {item.status}</span>
                  {item.payerNote ? <small className="admin-payer-note">备注：{item.payerNote}</small> : null}
                </div>
                {(item.status === "pending" || item.status === "awaiting_confirm") && (
                  <button
                    type="button"
                    className="admin-confirm-pay"
                    disabled={busyOrderId === item.id}
                    onClick={() => confirmPayment(item.id)}
                  >
                    {busyOrderId === item.id ? "处理中…" : "确认到账并开通"}
                  </button>
                )}
              </div>
            ))}
          </section>
          <section>
            <h3>调用记录</h3>
            {(summary.usageLogs || []).slice(0, 8).map((item) => (
              <p key={item.id}>{item.userEmail} · {item.type} · {item.status}</p>
            ))}
          </section>
          <section>
            <h3>反馈/线索</h3>
            {(summary.feedback || []).slice(0, 8).map((item) => (
              <p key={item.id}>{item.userEmail || item.contact?.email || "访客"} · {item.type}</p>
            ))}
          </section>
        </div>
      </section>
    </div>
  );
}

function AuthEntryShell({ onBackHome, children }) {
  return (
    <div className="auth-standalone-shell">
      <header className="auth-standalone-top" role="banner">
        <button type="button" className="auth-standalone-brand" onClick={onBackHome}>
          <span className="brand-mark">
            <Sparkles size={18} />
          </span>
          凡梦AI
        </button>
        <button type="button" className="pub-btn pub-btn-ghost" onClick={onBackHome}>
          返回官网
        </button>
      </header>
      {children}
    </div>
  );
}

function Workspace() {
  const [activeId, setActiveId] = useState(WORKSPACE_AUTOPILOT_ID);
  const [isBetaMode, setIsBetaMode] = useState(() => new URLSearchParams(window.location.search).get("beta") === "1");
  const [token, setToken] = useState(() => localStorage.getItem("fanmeng_token") || "");
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showStoreApiModal, setShowStoreApiModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminSummary, setAdminSummary] = useState(null);
  const [historyQuery, setHistoryQuery] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem("fanmeng_onboarding_done") !== "1");
  const [toast, setToast] = useState("");
  const [panels, setPanels] = useState(workspaceBuildInitialPanels);
  const [isRunning, setIsRunning] = useState(false);
  const [runningPanelId, setRunningPanelId] = useState(null);
  const [navConfirm, setNavConfirm] = useState(null);
  const fetchAbortRef = useRef(null);
  const suppressNextAbortPanelPatchRef = useRef(false);
  const panelsRef = useRef(panels);
  const [storeBlocks, setStoreBlocks] = useState(defaultStoreBlocks);
  const [routeHash, setRouteHash] = useState(readRouteHash);
  const [storeDataNudge, setStoreDataNudge] = useState(null);
  const tiktokOAuthReturnHandledRef = useRef(false);

  const caseSlug = useMemo(() => parseCaseSlugFromHash(routeHash), [routeHash]);
  const authEntryMode = useMemo(() => {
    if (routeHash === "register") return "register";
    if (routeHash === "login") return "login";
    return null;
  }, [routeHash]);
  const landingScrollId = useMemo(() => {
    if (authEntryMode || caseSlug) return null;
    if (!routeHash) return null;
    const ids = new Set(["flow", "capabilities", "cases", "trust", "pricing-preview", "trial-explainer", "top"]);
    return ids.has(routeHash) ? routeHash : null;
  }, [routeHash, authEntryMode, caseSlug]);

  const activeAgent = useMemo(() => (activeId === WORKSPACE_AUTOPILOT_ID ? null : agents.find((agent) => agent.id === activeId)), [activeId]);
  const panel = panels[activeId] || workspaceEmptyPanel();
  const visibleTasks = useMemo(
    () => tasks.filter((task) => task.type === activeId && `${task.title} ${task.input} ${task.answer}`.toLowerCase().includes(historyQuery.toLowerCase())),
    [tasks, activeId, historyQuery],
  );
  const storeConnected = STORE_PLATFORM_ORDER.some((p) => isPlatformBlockReady(p, storeBlocks[p]));
  const accessActive = isBetaMode || user?.accessActive;

  useEffect(() => {
    panelsRef.current = panels;
  }, [panels]);

  const wasRunningRef = useRef(false);
  useEffect(() => {
    if (wasRunningRef.current && !isRunning && navConfirm) {
      setNavConfirm(null);
    }
    wasRunningRef.current = isRunning;
  }, [isRunning, navConfirm]);

  useEffect(() => {
    if (activeId === WORKSPACE_AUTOPILOT_ID || !STORE_DATA_AGENT_IDS.includes(activeId)) {
      setStoreDataNudge(null);
      return;
    }
    const key = `fanmeng_store_data_intro_v2_${activeId}`;
    try {
      if (localStorage.getItem(key)) {
        setStoreDataNudge(null);
        return;
      }
    } catch {
      /* continue */
    }
    setStoreDataNudge(activeId);
  }, [activeId]);

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
        if (data.storeConnections?.length) {
          setStoreBlocks(mergeRemoteStoreConnections(data.storeConnections));
        } else if (data.storeConnection) {
          setStoreBlocks(mergeRemoteStoreConnections([data.storeConnection]));
        }
      })
      .catch(() => {
        localStorage.removeItem("fanmeng_token");
        setToken("");
        setUser(null);
      });
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    if (tiktokOAuthReturnHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const oauthSt = params.get("tiktok_oauth");
    if (!oauthSt) return;
    tiktokOAuthReturnHandledRef.current = true;

    const rawMsg = params.get("tiktok_msg") || "";
    function clearOAuthQuery() {
      const u = new URL(window.location.href);
      u.searchParams.delete("tiktok_oauth");
      u.searchParams.delete("tiktok_msg");
      window.history.replaceState(null, "", u.pathname + u.search + window.location.hash);
    }

    if (oauthSt === "ok") {
      setToast("TikTok Shop 已连接，店铺凭据已保存。");
      setShowStoreApiModal(true);
      window.setTimeout(() => setToast(""), 4200);
      fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setUser(data.user);
          setTasks(data.tasks || []);
          if (data.storeConnections?.length) {
            setStoreBlocks(mergeRemoteStoreConnections(data.storeConnections));
          } else if (data.storeConnection) {
            setStoreBlocks(mergeRemoteStoreConnections([data.storeConnection]));
          }
        })
        .catch(() => {});
      clearOAuthQuery();
      return;
    }

    try {
      setToast(`TikTok 授权未成功：${decodeURIComponent(rawMsg) || "未知错误"}`);
    } catch {
      setToast(`TikTok 授权未成功：${rawMsg || "未知错误"}`);
    }
    window.setTimeout(() => setToast(""), 5200);
    clearOAuthQuery();
  }, [token, user]);

  useEffect(() => {
    if (!token || !user?.trialEndingSoon || isBetaMode) return;
    const key = "fanmeng_trial_last24_nudge";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    setToast("试用剩余不足 24 小时，订阅可锁定更高调用额度与权益。");
    window.setTimeout(() => setToast(""), 4200);
    setShowSubscription(true);
  }, [token, user?.trialEndingSoon, isBetaMode]);

  useEffect(() => {
    const handler = () => setRouteHash(readRouteHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  useEffect(() => {
    if (token || !caseSlug) return;
    window.scrollTo(0, 0);
  }, [token, caseSlug]);

  function handleLogin(data) {
    localStorage.setItem("fanmeng_token", data.token);
    setToken(data.token);
    setUser(data.user);
    setTasks(data.tasks || []);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setRouteHash(readRouteHash());
  }

  function logout() {
    tiktokOAuthReturnHandledRef.current = false;
    localStorage.removeItem("fanmeng_token");
    setToken("");
    setUser(null);
    setTasks([]);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setRouteHash(readRouteHash());
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

  function finishOnboarding() {
    localStorage.setItem("fanmeng_onboarding_done", "1");
    setShowOnboarding(false);
  }

  function updateUser(nextUser) {
    setUser(nextUser);
  }

  function goPublicLogin() {
    window.location.hash = "login";
    window.scrollTo(0, 0);
  }

  function goPublicRegister() {
    window.location.hash = "register";
    window.scrollTo(0, 0);
  }

  function goMarketingHome() {
    window.location.hash = "";
    window.scrollTo(0, 0);
  }

  function goMarketingCases() {
    window.location.hash = "cases";
  }

  if (!token) {
    if (caseSlug) {
      const study = caseStudies.find((c) => c.slug === caseSlug);
      if (!study) {
        return (
          <CaseStudyNotFound
            onHome={goMarketingHome}
            onLoginClick={goPublicLogin}
            onRegisterClick={goPublicRegister}
          />
        );
      }
      return (
        <CaseStudyDetail
          study={study}
          onBack={goMarketingCases}
          onHome={goMarketingHome}
          onLoginClick={goPublicLogin}
          onRegisterClick={goPublicRegister}
        />
      );
    }
    if (authEntryMode) {
      return (
        <AuthEntryShell onBackHome={goMarketingHome}>
          <LoginScreen onLogin={handleLogin} authRouteHash={authEntryMode} />
        </AuthEntryShell>
      );
    }
    return (
      <PublicLanding
        onLoginClick={goPublicLogin}
        onRegisterClick={goPublicRegister}
        scrollSectionId={landingScrollId}
      />
    );
  }

  function hasFeature(feature, detail) {
    if (isBetaMode) return true;

    const features = user?.planFeatures;
    if (!features) return false;

    if (feature === "agent") return features.agents?.includes(detail);
    return Boolean(features[feature]);
  }

  function patchPanel(panelId, updater) {
    setPanels((prev) => {
      const cur = prev[panelId] || workspaceEmptyPanel();
      const next = typeof updater === "function" ? updater(cur) : { ...cur, ...updater };
      return { ...prev, [panelId]: next };
    });
  }

  function applyTaskToPanel(task) {
    setActiveId(task.type);
    setPanels((prev) => ({
      ...prev,
      [task.type]: {
        ...(prev[task.type] || workspaceEmptyPanel()),
        answer: task.answer,
        input: task.input ?? (prev[task.type]?.input ?? ""),
      },
    }));
  }

  function requestNavigateTo(targetId, task = null) {
    if (task) {
      if (!isRunning) {
        applyTaskToPanel(task);
        return;
      }
      setNavConfirm({ targetId: task.type, task });
      return;
    }
    if (targetId === activeId) return;
    if (!isRunning) {
      setActiveId(targetId);
      return;
    }
    setNavConfirm({ targetId, task: null });
  }

  function confirmInterruptNavigation() {
    suppressNextAbortPanelPatchRef.current = true;
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = null;
    setIsRunning(false);
    setRunningPanelId(null);
    const pending = navConfirm;
    setNavConfirm(null);
    if (!pending) return;
    if (pending.task) {
      applyTaskToPanel(pending.task);
    } else {
      setActiveId(pending.targetId);
    }
  }

  function cancelInterruptNavigation() {
    setNavConfirm(null);
  }

  function selectAgent(id) {
    if (!hasFeature("agent", id)) {
      const name = agents.find((a) => a.id === id)?.name || "该模块";
      showToast(
        user?.plan === "starter"
          ? `「${name}」需标准版及以上。尝鲜版包含选品、内容、Listing 三个模块。`
          : `「${name}」未包含在当前套餐中，请升级以解锁。`,
      );
      setShowSubscription(true);
      return;
    }
    requestNavigateTo(id);
  }

  function openTaskHistory(task) {
    requestNavigateTo(task.type, task);
  }

  async function saveStorePlatform(platform) {
    try {
      const block = storeBlocks[platform];
      const response = await fetch("/api/store-connection", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ platform, ...block }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStoreBlocks((prev) => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          apiToken: data.storeConnection.apiTokenMasked || prev[platform].apiToken,
        },
      }));
      showToast(`${STORE_PLATFORM_LABELS[platform]} 配置已保存。`);
    } catch (error) {
      showToast(formatError(error));
    }
  }

  async function toggleFavorite(task) {
    try {
      const response = await fetch(`/api/tasks/${task.id}/favorite`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ favorite: !task.favorite }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setTasks((current) => current.map((item) => (item.id === task.id ? data.task : item)));
    } catch (error) {
      showToast(formatError(error));
    }
  }

  function copyAnswer() {
    navigator.clipboard.writeText(panel.answer || "");
    showToast("结果已复制。");
  }

  function downloadAnswer(format) {
    const extension = format === "html" ? "html" : "md";
    const body = panel.answer || "";
    const content = format === "html"
      ? `<!doctype html><meta charset="utf-8"><title>凡梦AI结果</title><article>${body.split("\n").map((line) => `<p>${line}</p>`).join("")}</article>`
      : `# 凡梦AI生成结果\n\n${body}`;
    const blob = new Blob([content], { type: format === "html" ? "text/html;charset=utf-8" : "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fanmeng-ai-result.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function submitFeedback(payload) {
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      showToast("感谢反馈，已保存到运营后台。");
      setShowFeedbackModal(false);
    } catch (error) {
      showToast(formatError(error));
    }
  }

  async function loadAdminSummary() {
    try {
      const response = await fetch("/api/admin/summary", { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAdminSummary(data);
      setShowAdmin(true);
    } catch (error) {
      showToast(formatError(error));
    }
  }

  async function handleLocalImport(event) {
    const files = Array.from(event.target.files || []);
    const nextAttachments = await Promise.all(
      files.map(async (file) => {
        const id = crypto.randomUUID();
        const isReadableText =
          file.type.startsWith("text/") ||
          /\.(csv|json|md|txt|log|html|xml)$/i.test(file.name);
        const content = isReadableText ? (await readFileAsText(file)).slice(0, 12000) : "";
        let previewUrl = "";
        if (file.type.startsWith("image/")) {
          previewUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
          });
        }

        return {
          id,
          name: file.name,
          type: file.type || "未知类型",
          size: file.size,
          content,
          isImage: file.type.startsWith("image/"),
          previewUrl,
        };
      }),
    );

    patchPanel(activeId, (prev) => ({ ...prev, attachments: [...prev.attachments, ...nextAttachments] }));
    event.target.value = "";
  }

  function removeAttachment(id) {
    patchPanel(activeId, (prev) => ({ ...prev, attachments: prev.attachments.filter((f) => f.id !== id) }));
  }

  async function runAutopilot() {
    if (!accessActive) {
      showToast(user?.plan === "trial" ? "3 天免费试用已结束，请先订阅套餐后继续使用。" : "当前套餐已到期，请续费后继续使用。");
      setShowSubscription(true);
      return;
    }

    if (!hasFeature("autopilot")) {
      showToast("「5 Agent 运营一键生成」需标准版及以上；尝鲜版不包含。");
      setShowSubscription(true);
      return;
    }

    const p = panelsRef.current[WORKSPACE_AUTOPILOT_ID] || workspaceEmptyPanel();
    if (p.scrape.enabled && !hasFeature("scraper")) {
      showToast("公开页参考抓取（Playwright）需标准版及以上套餐。");
      setShowSubscription(true);
      return;
    }

    const ac = new AbortController();
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = ac;
    const panelId = WORKSPACE_AUTOPILOT_ID;
    setIsRunning(true);
    setRunningPanelId(panelId);
    patchPanel(panelId, {
      answer: "OpenClaw 正在按 5 个运营模块生成结构化方案（单轮输出；不含客服自动应答）...",
    });
    try {
      const response = await fetch("/api/autopilot/run", {
        method: "POST",
        headers: authHeaders(),
        signal: ac.signal,
        body: JSON.stringify({
          input: `${p.input || "用户未填写具体要求，请先提示用户补充平台、市场、类目和目标。"}${buildAttachmentContextFromList(p.attachments)}`,
          scrape: p.scrape.enabled ? p.scrape : { enabled: false },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      patchPanel(panelId, { answer: data.answer });
      if (data.task) setTasks((current) => [data.task, ...current].slice(0, user?.planFeatures?.historyLimit || 30));
      void refreshMeProfile();
    } catch (error) {
      if (error?.name === "AbortError") {
        if (!suppressNextAbortPanelPatchRef.current) {
          patchPanel(panelId, (cur) => ({
            ...cur,
            answer: cur.answer.includes("正在按 5 个运营模块") ? "已取消生成。" : cur.answer,
          }));
        } else {
          suppressNextAbortPanelPatchRef.current = false;
        }
      } else {
        patchPanel(panelId, { answer: formatError(error) });
      }
    } finally {
      if (fetchAbortRef.current === ac) fetchAbortRef.current = null;
      setIsRunning(false);
      setRunningPanelId(null);
    }
  }

  async function runAgent() {
    if (!accessActive) {
      showToast(user?.plan === "trial" ? "3 天免费试用已结束，请先订阅套餐后继续使用。" : "当前套餐已到期，请续费后继续使用。");
      setShowSubscription(true);
      return;
    }

    if (!hasFeature("agent", activeAgent.id)) {
      const name = activeAgent.name;
      showToast(
        user?.plan === "starter"
          ? `「${name}」需标准版及以上。尝鲜版包含选品、内容、Listing 三个模块。`
          : `「${name}」未包含在当前套餐中，请升级以解锁。`,
      );
      setShowSubscription(true);
      return;
    }

    const panelId = activeAgent.id;
    const p = panelsRef.current[panelId] || workspaceEmptyPanel();
    if (p.scrape.enabled && !hasFeature("scraper")) {
      showToast("公开页参考抓取（Playwright）需标准版及以上套餐。");
      setShowSubscription(true);
      return;
    }

    const ac = new AbortController();
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = ac;
    setIsRunning(true);
    setRunningPanelId(panelId);
    patchPanel(panelId, { answer: `${activeAgent.name} 正在由 OpenClaw 接管执行...` });
    try {
      const response = await fetch("/api/agents/run", {
        method: "POST",
        headers: authHeaders(),
        signal: ac.signal,
        body: JSON.stringify({
          agentId: activeAgent.id,
          input: [
            p.input,
            buildAttachmentContextFromList(p.attachments),
            storeConnected ? `\n店铺 API 已分平台配置：${storeApiSummary}。` : "",
          ].join(""),
          scrape: activeAgent.id === "trend" && p.scrape.enabled ? p.scrape : { enabled: false },
          useStoreSnapshot:
            p.attachStoreSnapshot && ["growth", "service", "profit"].includes(activeAgent.id) && storeConnected,
          storeSnapshotPlatform: p.snapshotPlatform === "auto" ? undefined : p.snapshotPlatform,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      patchPanel(panelId, { answer: data.answer });
      if (data.task) setTasks((current) => [data.task, ...current].slice(0, user?.planFeatures?.historyLimit || 30));
      void refreshMeProfile();
    } catch (error) {
      if (error?.name === "AbortError") {
        if (!suppressNextAbortPanelPatchRef.current) {
          patchPanel(panelId, (cur) => ({
            ...cur,
            answer: cur.answer.includes("正在由 OpenClaw 接管执行") ? "已取消生成。" : cur.answer,
          }));
        } else {
          suppressNextAbortPanelPatchRef.current = false;
        }
      } else {
        patchPanel(panelId, { answer: formatError(error) });
      }
    } finally {
      if (fetchAbortRef.current === ac) fetchAbortRef.current = null;
      setIsRunning(false);
      setRunningPanelId(null);
    }
  }

  async function refreshMeProfile() {
    if (!token) return;
    try {
      const response = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        if (data.storeConnections?.length) {
          setStoreBlocks(mergeRemoteStoreConnections(data.storeConnections));
        }
      }
    } catch {
      /* ignore */
    }
  }

  const ActiveIcon = activeAgent?.icon || Rocket;
  const canUseScraper = activeId === WORKSPACE_AUTOPILOT_ID || activeAgent?.id === "trend";

  const storeApiSummary = storeConnected
    ? STORE_PLATFORM_ORDER.filter((p) => isPlatformBlockReady(p, storeBlocks[p]))
        .map((p) => `${STORE_PLATFORM_LABELS[p]}（${storeBlocks[p].storeName || "未命名"}）`)
        .join("；")
    : "";

  return (
    <main className="app-shell">
      {toast && <div className="toast-message">{toast}</div>}
      {navConfirm ? (
        <NavigateInterruptModal
          runningLabel={workspacePanelLabel(runningPanelId || activeId)}
          targetLabel={workspacePanelLabel(navConfirm.task ? navConfirm.task.type : navConfirm.targetId)}
          onCancel={cancelInterruptNavigation}
          onConfirm={confirmInterruptNavigation}
        />
      ) : null}
      {showSubscription && (
        <SubscriptionModal
          user={user}
          onClose={() => setShowSubscription(false)}
          showToast={showToast}
          authHeaders={authHeaders}
          onUserUpdate={updateUser}
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
            <FeedbackForm onSubmit={submitFeedback} />
          </section>
        </div>
      )}
      {showAdmin && (
        <AdminModal
          summary={adminSummary}
          onClose={() => setShowAdmin(false)}
          authHeaders={authHeaders}
          onReloadSummary={loadAdminSummary}
          showToast={showToast}
        />
      )}
      {showStoreApiModal && (
        <StoreApiModal
          onClose={() => setShowStoreApiModal(false)}
          storeBlocks={storeBlocks}
          setStoreBlocks={setStoreBlocks}
          saveStorePlatform={saveStorePlatform}
          showToast={showToast}
          authHeaders={authHeaders}
        />
      )}
      {storeDataNudge && (
        <StoreDataNudgeModal
          agentId={storeDataNudge}
          onClose={() => setStoreDataNudge(null)}
          onOpenStoreApi={() => setShowStoreApiModal(true)}
        />
      )}
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="brand-mark">
            <Sparkles size={18} />
          </span>
          <div>
            <strong>凡梦AI</strong>
            <small>{isBetaMode ? "内测版 · 全功能开放" : user?.trialActive ? "试用中 · 全功能体验（额度和重能力限次）" : user?.planName || "订阅状态"}</small>
          </div>
        </div>

        <div className="account-card">
          <strong>{user?.storeName || user?.name || "跨境卖家"}</strong>
          <span>{user?.email}</span>
          {isBetaMode && <em>内测版已开放全部功能</em>}
          {!isBetaMode && user?.trialActive && user?.trialQuota && (
            <div className="trial-quota">
              <span>试用额度 今日 {user.trialQuota.todayTotal}/{user.trialQuota.todayDailyCap} · 累计 {user.trialQuota.lifetimeUsed}/{user.trialQuota.lifetimeCap}</span>
              <span>5 Agent 运营 {user.trialQuota.autopilotToday}/{user.trialQuota.autopilotCap}/日 · 抓取 {user.trialQuota.scrapeToday}/{user.trialQuota.scrapeCap}/日</span>
            </div>
          )}
          {!isBetaMode && !user?.trialActive && user?.plan === "trial" && <em>试用期结束，请订阅后继续使用</em>}
          {!isBetaMode && !storeConnected && !(user?.plan === "trial" && user?.trialActive) && <em>建议配置店铺 API 以便付费套餐深度接入</em>}
          <button type="button" onClick={() => setShowSubscription(true)}>查看/升级订阅</button>
          <button type="button" onClick={() => setShowStoreApiModal(true)}>店铺 API 配置</button>
          <button type="button" onClick={() => setIsBetaMode((value) => !value)}>{isBetaMode ? "退出内测版" : "进入内测版"}</button>
          {user?.isAdmin && <button type="button" onClick={loadAdminSummary}>运营后台</button>}
          <button type="button" onClick={logout}>退出登录</button>
        </div>

        <button
          className={activeId === WORKSPACE_AUTOPILOT_ID ? "side-item active" : "side-item"}
          onClick={() => requestNavigateTo(WORKSPACE_AUTOPILOT_ID)}
        >
          <span>
            <Rocket size={19} />
          </span>
          <div>
            <strong>5 Agent 运营 · 一键生成</strong>
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

        <div className="side-label">{activeId === WORKSPACE_AUTOPILOT_ID ? "5 Agent 运营历史" : `${activeAgent?.name}历史`}</div>
        <input className="history-search" value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="搜索历史任务" />
        <div className="history-list">
          {visibleTasks.length ? (
            visibleTasks.slice(0, 5).map((task) => (
              <div className="history-item" key={task.id}>
                <button type="button" onClick={() => openTaskHistory(task)}>
                  <strong>{task.favorite ? "★ " : ""}{task.title}</strong>
                  <small>{new Date(task.createdAt).toLocaleString()}</small>
                </button>
                <button type="button" className="favorite-btn" onClick={() => toggleFavorite(task)}>{task.favorite ? "取消" : "收藏"}</button>
              </div>
            ))
          ) : (
            <p>暂无历史任务</p>
          )}
        </div>
      </aside>

      <section className="work-area">
        <header className="work-header">
          {!isBetaMode && user?.trialEndingSoon && user?.trialActive && (
            <div className="trial-end-banner" role="status">
              <span>试用将在 24 小时内结束，订阅可继续享受当前额度以上的调用与权益。</span>
              <button type="button" onClick={() => setShowSubscription(true)}>去订阅</button>
            </div>
          )}
          <div className="work-header-inner">
            <div>
              <p>OpenClaw Agent Console</p>
              <h2>{activeId === WORKSPACE_AUTOPILOT_ID ? "5 Agent 运营 · 一键生成" : activeAgent.name}</h2>
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
          </div>
        </header>

        <div className="content-layout">
          <section className="output-panel">
            {showOnboarding && (
              <div className="onboarding-card">
                <div>
                  <span>1</span>
                  <strong>选择平台和市场</strong>
                  <p>先描述你经营的平台、市场、类目和预算。</p>
                </div>
                <div>
                  <span>2</span>
                  <strong>配置店铺 API</strong>
                  <p>需要业绩、客服、利润数据时先保存店铺接口。</p>
                </div>
                <div>
                  <span>3</span>
                  <strong>运行第一个 Agent</strong>
                  <p>生成结果后可复制、导出和收藏历史任务。</p>
                </div>
                <button type="button" onClick={finishOnboarding}>我知道了</button>
              </div>
            )}
            <div className="output-top">
              <div className="output-icon">
                <ActiveIcon size={24} />
              </div>
              <div>
                <h3>{activeId === WORKSPACE_AUTOPILOT_ID ? "自动生成结果" : `${activeAgent.name} 输出`}</h3>
                <p>{activeId === WORKSPACE_AUTOPILOT_ID ? "单轮回复内依次输出：选品、内容、Listing、业绩诊断、广告库存利润；不含「AI 客服自动应答」（请在左侧单独使用客服 Agent 生成话术）。适合需要表格时请模型输出 Markdown 表格。" : activeAgent.desc}</p>
              </div>
              <div className="output-actions">
                <button type="button" onClick={copyAnswer}>复制</button>
                <button type="button" onClick={() => downloadAnswer("md")}>导出 Markdown</button>
                <button type="button" onClick={() => downloadAnswer("html")}>导出 HTML</button>
              </div>
            </div>
            <StructuredAgentPreview agentId={activeAgent?.id} />
            <ResultDocument content={panel.answer} streaming={isRunning && runningPanelId === activeId} />
          </section>
        </div>

        <section className="composer">
          {canUseScraper && (
            <div className="scrape-config">
              <label className="scrape-toggle">
                <input
                  type="checkbox"
                  checked={panel.scrape.enabled}
                  onChange={(event) =>
                    patchPanel(activeId, (prev) => ({
                      ...prev,
                      scrape: { ...prev.scrape, enabled: event.target.checked },
                    }))
                  }
                />
                启用 Python/Playwright 公开页面参考数据（非官方实时，可能失败或受站点反爬影响）
              </label>
              {panel.scrape.enabled && (
                <div className="scrape-fields">
                  <input
                    value={panel.scrape.platform}
                    onChange={(event) =>
                      patchPanel(activeId, (prev) => ({
                        ...prev,
                        scrape: { ...prev.scrape, platform: event.target.value },
                      }))
                    }
                    placeholder="例：TikTok Shop"
                  />
                  <input
                    value={panel.scrape.market}
                    onChange={(event) =>
                      patchPanel(activeId, (prev) => ({
                        ...prev,
                        scrape: { ...prev.scrape, market: event.target.value },
                      }))
                    }
                    placeholder="例：美国"
                  />
                  <input
                    value={panel.scrape.category}
                    onChange={(event) =>
                      patchPanel(activeId, (prev) => ({
                        ...prev,
                        scrape: { ...prev.scrape, category: event.target.value },
                      }))
                    }
                    placeholder="例：宠物用品"
                  />
                  <input
                    value={panel.scrape.url}
                    onChange={(event) =>
                      patchPanel(activeId, (prev) => ({
                        ...prev,
                        scrape: { ...prev.scrape, url: event.target.value },
                      }))
                    }
                    placeholder="例：https://www.tiktokshuju.com/goods/hot-sale"
                  />
                </div>
              )}
            </div>
          )}
          {activeAgent?.requiresStoreApi && activeId !== WORKSPACE_AUTOPILOT_ID && (
            <div className="store-snapshot-row">
              <label className="store-snapshot-label">
                <span>快照来源</span>
                <select
                  value={panel.snapshotPlatform}
                  onChange={(e) => patchPanel(activeId, { snapshotPlatform: e.target.value })}
                >
                  <option value="auto">自动（TikTok→Shopify→Woo→Amazon）</option>
                  <option value="tiktok">TikTok Shop</option>
                  <option value="amazon">Amazon</option>
                  <option value="shopify">Shopify</option>
                  <option value="woocommerce">WooCommerce</option>
                </select>
              </label>
              <label className="scrape-toggle">
                <input
                  type="checkbox"
                  checked={panel.attachStoreSnapshot}
                  onChange={(event) => patchPanel(activeId, { attachStoreSnapshot: event.target.checked })}
                  disabled={!storeConnected}
                />
                本次运行附带所选店铺的只读快照
              </label>
            </div>
          )}
          {panel.attachments.length > 0 && (
            <div className="attachment-row attachment-gallery">
              {panel.attachments.map((file) =>
                file.isImage && file.previewUrl ? (
                  <div key={file.id} className="attachment-chip attachment-chip--photo">
                    <div className="attachment-chip-photo-frame">
                      <img src={file.previewUrl} alt="" className="attachment-chip-photo-img" />
                      <button
                        type="button"
                        className="attachment-chip-close"
                        aria-label={`移除 ${file.name}`}
                        onClick={() => removeAttachment(file.id)}
                      >
                        <X size={8} strokeWidth={2.5} aria-hidden />
                      </button>
                    </div>
                    <span className="attachment-chip-caption" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                ) : (
                  <div key={file.id} className="attachment-chip attachment-chip--file">
                    <div className="attachment-chip-file-glyph" aria-hidden>
                      {file.isImage ? <Image size={18} strokeWidth={1.75} /> : <File size={18} strokeWidth={1.75} />}
                    </div>
                    <div className="attachment-chip-file-meta">
                      <span className="attachment-chip-caption" title={file.name}>
                        {file.name}
                      </span>
                      <span className="attachment-chip-size">
                        {file.isImage ? "图片" : "文件"} · {Math.max(1, Math.ceil(file.size / 1024))} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      className="attachment-chip-close attachment-chip-close--bare"
                      aria-label={`移除 ${file.name}`}
                      onClick={() => removeAttachment(file.id)}
                    >
                      <X size={14} strokeWidth={2} aria-hidden />
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
          {activeId === WORKSPACE_AUTOPILOT_ID ? (
            <div className="auto-form">
              <textarea
                value={panel.input}
                onChange={(event) => patchPanel(activeId, { input: event.target.value })}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
                  e.preventDefault();
                  void runAutopilot();
                }}
                placeholder="例：我是 Amazon 美国站卖家…（Enter 直接发送，Shift+Enter 换行）"
              />
              <div className="composer-toolbar">
                <label className="import-btn">
                  <UploadCloud size={16} aria-hidden />
                  本地导入
                  <input type="file" multiple accept="image/*,.csv,.json,.md,.txt,.log,.html,.xml,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleLocalImport} />
                </label>
                <button type="button" onClick={runAutopilot} disabled={isRunning}>
                  <Send size={16} aria-hidden />{" "}
                  {isRunning && runningPanelId === WORKSPACE_AUTOPILOT_ID ? "运行中..." : "一键生成"}
                </button>
              </div>
            </div>
          ) : (
            <div className="agent-composer">
              <textarea
                value={panel.input}
                onChange={(event) => patchPanel(activeId, { input: event.target.value })}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
                  e.preventDefault();
                  void runAgent();
                }}
                placeholder={`例：${activeAgent.prompt}（Enter 发送，Shift+Enter 换行）`}
              />
              <div className="composer-toolbar">
                <label className="import-btn">
                  <UploadCloud size={16} aria-hidden />
                  本地导入
                  <input type="file" multiple accept="image/*,.csv,.json,.md,.txt,.log,.html,.xml,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleLocalImport} />
                </label>
                <button type="button" onClick={runAgent} disabled={isRunning}>
                  <Bot size={16} aria-hidden />{" "}
                  {isRunning && runningPanelId === activeId ? "生成中..." : "发送给 Agent"}
                </button>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<Workspace />);
