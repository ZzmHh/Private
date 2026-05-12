import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Check,
  Globe2,
  Headphones,
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
    features: ["每日 500 次 Agent 调用", "店铺 API 配置", "业绩诊断与利润分析", "AI 客服售后模板", "公开页参考抓取（Playwright）", "优先支持"],
    access: "开放全部 6 个 Agent、全自动运行；含公开页参考抓取（非官方实时）与店铺 API 配置相关 Agent。",
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

function readCaseSlugFromHash() {
  const raw = window.location.hash.replace(/^#/, "").trim();
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

function PublicLanding({ onLoginClick, onRegisterClick }) {
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
          <button type="button" className="pub-nav-link" onClick={() => go("#capabilities")}>产品能力</button>
          <button type="button" className="pub-nav-link" onClick={() => go("#cases")}>场景案例</button>
          <button type="button" className="pub-nav-link" onClick={() => go("#trust")}>信任与安全</button>
          <button type="button" className="pub-nav-link" onClick={() => go("#pricing-preview")}>定价</button>
          <button type="button" className="pub-nav-link" onClick={() => go("#trial-explainer")}>试用说明</button>
        </nav>
        <div className="pub-nav-actions">
          <button type="button" className="pub-btn pub-btn-ghost" onClick={onLoginClick}>登录</button>
          <button type="button" className="pub-btn pub-btn-primary" onClick={onRegisterClick}>
            免费注册 <ArrowRight size={16} aria-hidden />
          </button>
        </div>
      </header>

      <section id="top" className="pub-hero">
        <div className="pub-hero-copy">
          <p className="pub-eyebrow">
            <Globe2 size={17} aria-hidden /> 跨境电商 · 多 Agent 工作台
          </p>
          <h1>把选品、内容、Listing、诊断、客服和利润决策，收敛到一个登录后台。</h1>
          <p className="pub-lead">
            凡梦AI 面向 <strong>TikTok Shop / Amazon / Shopify</strong> 等卖家，将大模型能力封装成 6 个可点选的专业 Agent，
            您无需拼提示词也能跑完日常运营链路。浏览本页 <strong>无需登录</strong>；验证邮箱注册后可领取 3 天全功能试用。
          </p>
          <div className="pub-hero-cta">
            <button type="button" className="pub-btn pub-btn-primary pub-btn-lg" onClick={onRegisterClick}>
              免费注册并开启试用
            </button>
            <button type="button" className="pub-btn pub-btn-secondary pub-btn-lg" onClick={() => go("#capabilities")}>
              先了解能做什么
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
              <span>6 个专业 Agent</span>
            </div>
            <ul className="pub-mini-list">
              <li>选品与内容生产</li>
              <li>Listing 与转化文案</li>
              <li>业绩诊断与利润框架</li>
              <li>AI 客服话术与清单</li>
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

      <section id="capabilities" className="pub-section" aria-labelledby="cap-h">
        <div className="pub-section-head">
          <h2 id="cap-h">产品能力：6 个 Agent 覆盖主线运营</h2>
          <p>每个模块对应独立工作流与输出结构，避免「一个对话框装下所有业务」的混乱体验。</p>
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
            <p>新用户验证邮箱后可获得 <strong>3 天全功能试用</strong>（全自动与爬虫等重能力另有日限额）。试用结束再选择订阅套餐。</p>
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
          <h2 id="trial-h">试用机制：先逛页面，再登录体验</h2>
        </div>
        <div className="pub-trial-grid">
          <div>
            <h3>访客（无需登录）</h3>
            <p>您正在阅读的就是完整产品介绍与定价预览，适合决策前评估是否值得花时间注册。</p>
          </div>
          <div>
            <h3>注册并验证邮箱</h3>
            <p>通过邮件验证码激活账号后，进入工作台即可开启 <strong>3 天全功能试用</strong>，体验真实调用与任务历史。</p>
          </div>
          <div>
            <h3>订阅与店铺深度能力</h3>
            <p>标准版及以上开放店铺 API、诊断与利润等强数据 Agent；套餐内含调用额度与抓取日限额，详见下方价格。</p>
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
          <h2 id="final-cta-h">准备好让 Agent 接手重复劳动了吗？</h2>
          <p>向下滚动至 <strong>登录 / 注册</strong> 区域，验证邮箱后即可进入工作台。</p>
          <button type="button" className="pub-btn pub-btn-primary pub-btn-lg" onClick={onRegisterClick}>
            立即免费注册
          </button>
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

function LoginScreen({ onLogin, layout = "split", preferredAuthMode = "login", preferredAuthKey = 0 }) {
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
    setAuthMode(preferredAuthMode);
    setRegisterStep("email");
    setRegisterSendInfo(null);
    setVerificationCode("");
    setResendCooldownUntil(0);
    setPendingVerification(null);
    setPasswordReset(null);
    setResetStep("request");
    setAuthError("");
  }, [preferredAuthMode, preferredAuthKey]);

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
    <main id="account" className={layout === "stacked" ? "auth-page auth-page--stacked" : "auth-page"}>
      {layout !== "stacked" ? (
      <section className="auth-hero" aria-label="产品摘要">
        <div className="auth-badge">
          <ShieldCheck size={16} />
          登录后 3 天试用 · 全功能体验（全自动/抓取另计日限额）
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
            <Check size={16} /> 试用全功能 · 日限额保护成本
          </span>
          <span>
            <Check size={16} /> 店铺 API 授权
          </span>
        </div>
      </section>
      ) : (
        <section className="auth-stack-intro" aria-label="账户入口">
          <h2 className="auth-stack-heading">登录或注册账号</h2>
          <p className="auth-stack-sub">
            验证邮箱后即可开启 3 天全功能试用。全自动运行与网页抓取另计每日额度，可在工作台查看。
          </p>
        </section>
      )}

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
            <p>第一步：输入注册邮箱并发送验证码；第二步：查收邮件后填写验证码与密码完成注册。</p>
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
            <button type="button" className="register-link" onClick={() => { setAuthMode("login"); setResetStep("request"); setPasswordReset(null); }}>返回登录</button>
          </>
        ) : pendingVerification ? (
          <>
            <small>验证码 10 分钟内有效。没有收到邮件时，请检查垃圾邮箱或重新发送。</small>
            <button type="button" className="register-link" onClick={resendVerification} disabled={authLoading}>重新发送验证码</button>
            <button type="button" className="register-link" onClick={() => { setPendingVerification(null); setVerificationCode(""); }}>返回登录/注册</button>
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
                setAuthMode("login");
                resetRegisterFlow();
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
                  setAuthMode("login");
                  resetRegisterFlow();
                } else {
                  setAuthMode("register");
                  resetRegisterFlow();
                  setAuthForm((f) => ({ ...f, password: "", confirmPassword: "" }));
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
          <button type="button" onClick={onClose}>关闭</button>
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
      </section>
    </div>
  );
}

function SubscriptionModal({ onClose, showToast, authHeaders, onUserUpdate }) {
  const [selectedPlanId, setSelectedPlanId] = useState("standard");
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", wechat: "", email: "", note: "" });
  const selectedPlan = pricingPlans.find((plan) => plan.id === selectedPlanId);

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

  async function createCheckoutOrder(plan, paymentMethod) {
    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/billing/orders", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ planId: plan.id, paymentMethod }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCheckoutOrder(data.order);
      showToast("订单已创建，正式支付通道接入后会展示二维码。");
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
                <strong>{checkoutOrder ? `订单 ${checkoutOrder.orderNo} · ${checkoutOrder.status}` : "等待创建订单"}</strong>
                <p>预计流程：创建订单 → 返回二维码 → 用户扫码 → 支付回调 → 开通套餐。</p>
              </div>
              <div className="pay-options">
                <button type="button" disabled={checkoutLoading} onClick={() => createCheckoutOrder(checkoutPlan, "wechat")}>微信支付 · 创建订单</button>
                <button type="button" disabled={checkoutLoading} onClick={() => createCheckoutOrder(checkoutPlan, "alipay")}>支付宝 · 创建订单</button>
              </div>
              {checkoutOrder && (
                <button type="button" disabled={checkoutLoading} onClick={simulatePayment}>开发/内测模拟支付成功</button>
              )}
            </div>
          )}
          <button className="back-to-plans" type="button" onClick={() => { setCheckoutPlan(null); setCheckoutOrder(null); }}>
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

function AdminModal({ summary, onClose }) {
  if (!summary) return null;

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
          <section>
            <h3>最近用户</h3>
            {(summary.users || []).slice(0, 8).map((item) => (
              <p key={item.id}>{item.email} · {item.planName} · {item.accessActive ? "可用" : "已过期"}</p>
            ))}
          </section>
          <section>
            <h3>最近订单</h3>
            {(summary.orders || []).slice(0, 8).map((item) => (
              <p key={item.id}>{item.orderNo} · {item.planName} · ¥{item.amount} · {item.status}</p>
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

function Workspace() {
  const [activeId, setActiveId] = useState("autopilot");
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
  const [isRunning, setIsRunning] = useState(false);
  const [answer, setAnswer] = useState("登录后已开启 3 天免费试用（试用内可体验全部 Agent，全自动与抓取另计每日额度）。请选择左侧模块，输入要求后由 OpenClaw 生成结果。");
  const [input, setInput] = useState("");
  const [autoInput, setAutoInput] = useState("");
  const [scrapeConfig, setScrapeConfig] = useState({
    enabled: false,
    platform: "",
    market: "",
    category: "",
    url: "",
  });
  const [storeBlocks, setStoreBlocks] = useState(defaultStoreBlocks);
  const [snapshotPlatform, setSnapshotPlatform] = useState("auto");
  const [attachStoreSnapshot, setAttachStoreSnapshot] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [landingAuthMode, setLandingAuthMode] = useState("login");
  const [landingAuthKey, setLandingAuthKey] = useState(0);
  const [caseSlug, setCaseSlug] = useState(() => readCaseSlugFromHash());

  const activeAgent = useMemo(() => agents.find((agent) => agent.id === activeId), [activeId]);
  const visibleTasks = useMemo(
    () => tasks.filter((task) => task.type === activeId && `${task.title} ${task.input} ${task.answer}`.toLowerCase().includes(historyQuery.toLowerCase())),
    [tasks, activeId, historyQuery],
  );
  const storeConnected = STORE_PLATFORM_ORDER.some((p) => isPlatformBlockReady(p, storeBlocks[p]));
  const accessActive = isBetaMode || user?.accessActive;

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
    if (!token || !user?.trialEndingSoon || isBetaMode) return;
    const key = "fanmeng_trial_last24_nudge";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    setToast("试用剩余不足 24 小时，订阅可锁定更高调用额度与权益。");
    window.setTimeout(() => setToast(""), 4200);
    setShowSubscription(true);
  }, [token, user?.trialEndingSoon, isBetaMode]);

  useEffect(() => {
    const handler = () => setCaseSlug(readCaseSlugFromHash());
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

  function finishOnboarding() {
    localStorage.setItem("fanmeng_onboarding_done", "1");
    setShowOnboarding(false);
  }

  function updateUser(nextUser) {
    setUser(nextUser);
  }

  function scrollAccountIntoView() {
    window.requestAnimationFrame(() => {
      document.getElementById("account")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function goPublicLogin() {
    setLandingAuthMode("login");
    setLandingAuthKey((k) => k + 1);
    scrollAccountIntoView();
  }

  function goPublicRegister() {
    setLandingAuthMode("register");
    setLandingAuthKey((k) => k + 1);
    scrollAccountIntoView();
  }

  function goMarketingHome() {
    window.location.hash = "";
    window.scrollTo(0, 0);
  }

  function goMarketingCases() {
    window.location.hash = "#cases";
    window.requestAnimationFrame(() => {
      document.getElementById("cases")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  useEffect(() => {
    if (token) return;
    const raw = window.location.hash.replace(/^#/, "");
    if (raw === "register" || raw === "login") {
      setLandingAuthMode(raw === "register" ? "register" : "login");
      setLandingAuthKey((k) => k + 1);
      window.requestAnimationFrame(() => {
        document.getElementById("account")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [token]);

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
    return (
      <>
        <PublicLanding onLoginClick={goPublicLogin} onRegisterClick={goPublicRegister} />
        <LoginScreen
          onLogin={handleLogin}
          layout="stacked"
          preferredAuthMode={landingAuthMode}
          preferredAuthKey={landingAuthKey}
        />
      </>
    );
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
    navigator.clipboard.writeText(answer || "");
    showToast("结果已复制。");
  }

  function downloadAnswer(format) {
    const extension = format === "html" ? "html" : "md";
    const content = format === "html"
      ? `<!doctype html><meta charset="utf-8"><title>凡梦AI结果</title><article>${(answer || "").split("\n").map((line) => `<p>${line}</p>`).join("")}</article>`
      : `# 凡梦AI生成结果\n\n${answer || ""}`;
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
    if (!accessActive) {
      showToast(user?.plan === "trial" ? "3 天免费试用已结束，请先订阅套餐后继续使用。" : "当前套餐已到期，请续费后继续使用。");
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
    setAnswer("OpenClaw 正在按 6 个业务模块生成结构化方案（单轮输出，各模块自洽）...");
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
      if (data.task) setTasks((current) => [data.task, ...current].slice(0, user?.planFeatures?.historyLimit || 30));
      void refreshMeProfile();
    } catch (error) {
      setAnswer(formatError(error));
    } finally {
      setIsRunning(false);
    }
  }

  async function runAgent() {
    if (!accessActive) {
      showToast(user?.plan === "trial" ? "3 天免费试用已结束，请先订阅套餐后继续使用。" : "当前套餐已到期，请续费后继续使用。");
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
      if (user?.plan === "trial" && user?.trialActive) {
        showToast("试用已开放该 Agent：建议配置店铺 API 或在输入框粘贴数据，结果会更贴近真实经营。");
      } else {
        showToast("该 Agent 需要先配置店铺 API。");
        setShowStoreApiModal(true);
        return;
      }
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
            storeConnected ? `\n店铺 API 已分平台配置：${storeApiSummary}。` : "",
          ].join(""),
          scrape: activeAgent.id === "trend" && scrapeConfig.enabled ? scrapeConfig : { enabled: false },
          useStoreSnapshot:
            attachStoreSnapshot && ["growth", "service", "profit"].includes(activeAgent.id) && storeConnected,
          storeSnapshotPlatform: snapshotPlatform === "auto" ? undefined : snapshotPlatform,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAnswer(data.answer);
      if (data.task) setTasks((current) => [data.task, ...current].slice(0, user?.planFeatures?.historyLimit || 30));
      void refreshMeProfile();
    } catch (error) {
      setAnswer(formatError(error));
    } finally {
      setIsRunning(false);
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
  const canUseScraper = activeId === "autopilot" || activeAgent?.id === "trend";

  const storeApiSummary = storeConnected
    ? STORE_PLATFORM_ORDER.filter((p) => isPlatformBlockReady(p, storeBlocks[p]))
        .map((p) => `${STORE_PLATFORM_LABELS[p]}（${storeBlocks[p].storeName || "未命名"}）`)
        .join("；")
    : "";

  return (
    <main className="app-shell">
      {toast && <div className="toast-message">{toast}</div>}
      {showSubscription && (
        <SubscriptionModal
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
        <AdminModal summary={adminSummary} onClose={() => setShowAdmin(false)} />
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
              <span>全自动 {user.trialQuota.autopilotToday}/{user.trialQuota.autopilotCap}/日 · 抓取 {user.trialQuota.scrapeToday}/{user.trialQuota.scrapeCap}/日</span>
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
                <h3>{activeId === "autopilot" ? "自动生成结果" : `${activeAgent.name} 输出`}</h3>
                <p>{activeId === "autopilot" ? "单次回复内按选品、内容、Listing、业绩、客服、利润六段结构化输出；非独立多 Agent 实时调度。" : activeAgent.desc}</p>
              </div>
              <div className="output-actions">
                <button type="button" onClick={copyAnswer}>复制</button>
                <button type="button" onClick={() => downloadAnswer("md")}>导出 Markdown</button>
                <button type="button" onClick={() => downloadAnswer("html")}>导出 HTML</button>
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
                启用 Python/Playwright 公开页面参考数据（非官方实时，易失败或被反爬，仅供参考）
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
          {activeAgent?.requiresStoreApi && activeId !== "autopilot" && (
            <div className="store-snapshot-row">
              <label className="store-snapshot-label">
                <span>快照来源</span>
                <select value={snapshotPlatform} onChange={(e) => setSnapshotPlatform(e.target.value)}>
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
                  checked={attachStoreSnapshot}
                  onChange={(event) => setAttachStoreSnapshot(event.target.checked)}
                  disabled={!storeConnected}
                />
                本次运行附带所选店铺的只读快照
              </label>
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
