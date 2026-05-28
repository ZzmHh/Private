import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Check,
  Flame,
  Globe2,
  Headphones,
  LineChart,
  LockKeyhole,
  PackageSearch,
  PenLine,
  Play,
  Quote,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  INTRO_AGENTS,
  INTRO_CASES,
  INTRO_PLATFORMS,
  INTRO_PRICING,
  INTRO_STATS,
  PAIN_SOLUTIONS_WEB,
} from "./introData.js";
import { useCountUp, useScrollReveal } from "./useScrollReveal.js";

const AGENT_ICONS = {
  trend: PackageSearch,
  content: PenLine,
  listing: Sparkles,
  growth: BarChart3,
  service: Headphones,
  profit: LineChart,
};

function Reveal({ children, className = "", delay = 0, as: Tag = "div" }) {
  const [ref, visible] = useScrollReveal();
  return (
    <Tag
      ref={ref}
      className={`intro-reveal ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

function StatItem({ stat, active }) {
  const count = useCountUp(stat.value, active);
  return (
    <div className="intro-stat">
      <strong>
        {count}
        <span>{stat.suffix}</span>
      </strong>
      <span>{stat.label}</span>
    </div>
  );
}

function ExtensionDemo() {
  const buyer = "Where is my order? It's been 10 days...";
  const reply =
    "Hi! I checked your tracking — cleared customs yesterday. ETA 2–3 days. Happy to help!";
  const [buyerLen, setBuyerLen] = useState(0);
  const [replyLen, setReplyLen] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (phase === 0) {
      if (buyerLen < buyer.length) {
        const t = setTimeout(() => setBuyerLen((n) => n + 1), 28);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase(1), 500);
      return () => clearTimeout(t);
    }
    if (phase === 1) {
      if (replyLen < reply.length) {
        const t = setTimeout(() => setReplyLen((n) => n + 1), 18);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => {
        setBuyerLen(0);
        setReplyLen(0);
        setPhase(0);
      }, 3200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, buyerLen, replyLen, buyer.length, reply.length]);

  return (
    <div className="intro-chat-demo">
      <div className="intro-chat-bar">
        <span>TikTok Seller Center</span>
        <span className="intro-chat-badge">凡梦AI 面板</span>
      </div>
      <div className="intro-chat-body">
        <div className="intro-chat-bubble is-buyer">{buyer.slice(0, buyerLen)}</div>
        {replyLen > 0 ? (
          <div className="intro-chat-bubble is-seller">{reply.slice(0, replyLen)}</div>
        ) : null}
        {replyLen === reply.length ? (
          <div className="intro-chat-sent">✓ AI 话术已自动填入并发送</div>
        ) : null}
      </div>
    </div>
  );
}

export function ProductIntroPage({ onLoginClick, onRegisterClick, onRoastClick, scrollSectionId }) {
  const [mounted, setMounted] = useState(false);
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });
  const [statsRef, statsVisible] = useScrollReveal({ threshold: 0.3 });
  const [activeAgent, setActiveAgent] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAgent((i) => (i + 1) % INTRO_AGENTS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!scrollSectionId) return;
    const id = scrollSectionId === "top" ? "top" : scrollSectionId;
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [scrollSectionId]);

  function go(href) {
    document.getElementById(href.replace("#", ""))?.scrollIntoView({ behavior: "smooth" });
  }

  function onHeroMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
    setHeroTilt({ x, y });
  }

  const current = INTRO_AGENTS[activeAgent];
  const CurrentIcon = AGENT_ICONS[current.id] || Bot;

  return (
    <div className={`intro-landing ${mounted ? "is-mounted" : ""}`}>
      <div className="intro-bg" aria-hidden>
        <div className="intro-orb intro-orb-a" />
        <div className="intro-orb intro-orb-b" />
        <div className="intro-grid" />
      </div>

      <header className="intro-nav">
        <a className="intro-brand" href="#top" onClick={(e) => { e.preventDefault(); go("#top"); }}>
          <img className="intro-brand-logo" src="/media/fanmeng-ai-logo.png" alt="凡梦AI" />
        </a>
        <nav className="intro-nav-links" aria-label="页面导航">
          {[
            ["#pain-solution", "痛点解法"],
            ["#capabilities", "产品能力"],
            ["#extension", "TikTok 插件"],
            ["#cases", "场景案例"],
            ["#pricing-preview", "定价"],
          ].map(([href, label]) => (
            <button key={href} type="button" className="intro-nav-link" onClick={() => go(href)}>
              {label}
            </button>
          ))}
          {onRoastClick ? (
            <button type="button" className="intro-nav-link intro-nav-roast" onClick={onRoastClick}>
              <Flame size={14} /> Listing 处刑
            </button>
          ) : null}
        </nav>
        <div className="intro-nav-actions">
          <button type="button" className="intro-btn intro-btn-ghost" onClick={onLoginClick}>
            登录
          </button>
          <button type="button" className="intro-btn intro-btn-primary" onClick={onRegisterClick}>
            免费注册 <ArrowRight size={16} />
          </button>
        </div>
      </header>

      <section
        id="top"
        className="intro-hero"
        onMouseMove={onHeroMove}
        onMouseLeave={() => setHeroTilt({ x: 0, y: 0 })}
      >
        <div className="intro-hero-copy">
          <p className="intro-eyebrow intro-stagger" style={{ "--i": 0 }}>
            <Globe2 size={16} /> 跨境电商 · 6 大模块 · 5 Agent 一键运营
          </p>
          <h1 className="intro-stagger" style={{ "--i": 1 }}>
            懂卖家痛点的
            <br />
            <span className="intro-gradient-text">AI 运营团队</span>
          </h1>
          <p className="intro-lead intro-stagger" style={{ "--i": 2 }}>
            选品靠猜、内容难产、Listing 不出单、数据看不懂、客服拖垮人、利润算不清——
            凡梦AI 六大模块 + TikTok 插件，逐个击破，输出可直接执行的方案。
          </p>
          <div className="intro-hero-cta intro-stagger" style={{ "--i": 3 }}>
            <button type="button" className="intro-btn intro-btn-primary intro-btn-lg" onClick={onRegisterClick}>
              免费注册 · 7 天专业版 <Play size={17} />
            </button>
            {onRoastClick ? (
              <button type="button" className="intro-btn intro-btn-roast intro-btn-lg" onClick={onRoastClick}>
                <Flame size={17} /> 免费 Listing 处刑 · 无需登录
              </button>
            ) : (
              <button type="button" className="intro-btn intro-btn-glass intro-btn-lg" onClick={onLoginClick}>
                已有账号登录
              </button>
            )}
          </div>
          <p className="intro-footnote intro-stagger" style={{ "--i": 4 }}>
            <BadgeCheck size={14} /> 注册即享免费版 + 7 天专业版全功能体验
          </p>
        </div>

        <div
          className="intro-hero-visual"
          style={{ transform: `perspective(900px) rotateX(${-heroTilt.y}deg) rotateY(${heroTilt.x}deg)` }}
        >
          <div className="intro-visual-glow" style={{ background: current.gradient }} />
          <div className="intro-visual-card">
            <div className="intro-visual-head">
              <span className="intro-pulse-dot" />
              Live Agent Console
            </div>
            <div className="intro-visual-agent" style={{ background: current.gradient }}>
              <CurrentIcon size={28} />
            </div>
            <div className="intro-visual-name">{current.name}</div>
            <div className="intro-visual-short">{current.short}</div>
            <div className="intro-visual-dots">
              {INTRO_AGENTS.map((a, i) => (
                <span key={a.id} className={i === activeAgent ? "is-active" : ""} style={{ background: a.accent }} />
              ))}
            </div>
          </div>
          <div className="intro-float-chip intro-float-a">
            <Zap size={14} /> 5 Agent 一键运营
          </div>
          <div className="intro-float-chip intro-float-b">
            <TrendingUp size={14} /> 机会评分 +238%
          </div>
        </div>
      </section>

      <div className="intro-marquee" aria-hidden>
        <div className="intro-marquee-track">
          {[...INTRO_PLATFORMS, ...INTRO_PLATFORMS].map((p, i) => (
            <span key={`${p}-${i}`}>{p}</span>
          ))}
        </div>
      </div>

      <section ref={statsRef} className="intro-stats-row" aria-label="产品数据">
        {INTRO_STATS.map((stat) => (
          <StatItem key={stat.label} stat={stat} active={statsVisible} />
        ))}
      </section>

      <section id="pain-solution" className="intro-section intro-section-dark-block">
        <Reveal className="intro-section-head intro-section-head-center">
          <p className="intro-kicker intro-kicker-light">Pain → Solution</p>
          <h2>每个痛点，都有凡梦AI 精准解法</h2>
          <p>不是泛泛而谈的 AI 对话——是针对跨境卖家真实困境的专业模块</p>
        </Reveal>
        <div className="intro-ps-grid">
          {PAIN_SOLUTIONS_WEB.map((item, i) => (
            <Reveal key={item.id} className="intro-ps-card" delay={i * 70}>
              <div className="intro-ps-pain">
                <span className="intro-ps-label intro-ps-label-pain">😰 痛点</span>
                <h3>{item.painTitle}</h3>
                <p className="intro-ps-quote">「{item.painScene}」</p>
              </div>
              <div className="intro-ps-arrow" style={{ color: item.accent }}>→</div>
              <div className="intro-ps-solution" style={{ borderColor: `${item.accent}55` }}>
                <span className="intro-ps-label" style={{ color: item.accent }}>⚡ {item.agentName}</span>
                <p>{item.solution}</p>
              </div>
              <div className="intro-ps-outcome">
                <span className="intro-ps-label intro-ps-label-win">✅ 结果</span>
                <strong>{item.outcome}</strong>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="showreel" className="intro-section intro-section-cinema">
        <Reveal className="intro-section-head intro-section-head-center">
          <p className="intro-kicker intro-kicker-light">Product Film</p>
          <h2>完整产品宣传片 · 约 113 秒</h2>
          <p>
            深度剖析卖家痛点 → 逐一展示凡梦AI 如何击破 → TikTok 插件 + 定价 + 上手全流程
          </p>
        </Reveal>
        <Reveal delay={100}>
          <div className="intro-video-wrap">
            <video
              className="intro-video intro-video-landscape"
              src="/media/fanmeng-ai-promo-landscape.mp4"
              controls
              playsInline
              preload="metadata"
            />
            <p className="intro-video-hint">🔊 柔和氛围配乐 · 播放时请打开音量</p>
          </div>
        </Reveal>
      </section>

      <section id="capabilities" className="intro-section">
        <Reveal className="intro-section-head">
          <p className="intro-kicker">Product Modules</p>
          <h2>六大模块 · 逐个击破卖家难题</h2>
          <p>每个 Agent 对应一个真实业务场景，输入商品或店铺数据，输出可执行方案。</p>
        </Reveal>
        <div className="intro-agent-grid">
          {INTRO_AGENTS.map((agent, i) => {
            const Icon = AGENT_ICONS[agent.id] || Bot;
            return (
              <Reveal key={agent.id} className="intro-agent-card" delay={i * 80}>
                <div className="intro-agent-icon" style={{ background: agent.gradient }}>
                  <Icon size={22} />
                </div>
                <h3>{agent.name}</h3>
                <p>{agent.short}</p>
                <div className="intro-agent-shine" style={{ background: agent.gradient }} />
              </Reveal>
            );
          })}
        </div>
      </section>

      <section id="extension" className="intro-section intro-section-dark">
        <div className="intro-split">
          <Reveal>
            <p className="intro-kicker intro-kicker-light">TikTok Shop Extension</p>
            <h2>Chrome 插件 · 卖家中心内直接执行</h2>
            <p className="intro-split-lead">
              同步店铺 KPI、自动生成多语言客服话术、FAQ 夜间自动回复。与网站共用账号与套餐，无需额外配置。
            </p>
            <ul className="intro-check-list">
              {["同步本页数据到凡梦", "FAQ / 问候 / 夜间 AI 自动发送", "诊断包：概览 / 订单 / 广告 / 库存"].map((t) => (
                <li key={t}>
                  <Check size={16} /> {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <ExtensionDemo />
          </Reveal>
        </div>
      </section>

      <section id="flow" className="intro-section">
        <Reveal className="intro-section-head">
          <p className="intro-kicker">How It Works</p>
          <h2>三步上手，从了解到执行</h2>
        </Reveal>
        <div className="intro-flow">
          {[
            { n: "01", title: "了解产品", desc: "浏览模块能力、定价与试用规则，无需账号。" },
            { n: "02", title: "注册登录", desc: "验证邮箱后进入工作台，自动开启 7 天专业版体验。" },
            { n: "03", title: "运行 Agent", desc: "单模块调用或 5 Agent 一键串联，插件同步 TikTok 数据。" },
          ].map((step, i) => (
            <Reveal key={step.n} className="intro-flow-step" delay={i * 100}>
              <span className="intro-flow-num">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="cases" className="intro-section intro-section-alt">
        <Reveal className="intro-section-head">
          <p className="intro-kicker">Use Cases</p>
          <h2>典型跨境团队怎么用</h2>
          <p>以下为常见场景归纳，便于评估是否匹配；非单一客户背书。</p>
        </Reveal>
        <div className="intro-case-grid">
          {INTRO_CASES.map((item, i) => (
            <Reveal key={item.slug} delay={i * 90}>
              <a className="intro-case-card" href={`#case/${item.slug}`}>
                <Quote size={20} className="intro-quote-icon" />
                <p>「{item.quote}」</p>
                <div className="intro-case-tags">
                  {item.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <small>{item.kpi}</small>
                <strong>{item.title}</strong>
                <span className="intro-case-more">查看详情 →</span>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="trust" className="intro-section">
        <Reveal className="intro-section-head">
          <p className="intro-kicker">Trust & Security</p>
          <h2>数据敏感，我们默认最小权限</h2>
        </Reveal>
        <div className="intro-trust-grid">
          {[
            { icon: Users, title: "跨境 + AI 团队", desc: "聚焦能进工作流的产品，而非演示级对话。" },
            { icon: ShieldCheck, title: "加密存储", desc: "店铺 API 密钥服务器侧加密；须人工确认项会明确提示。" },
            { icon: LockKeyhole, title: "试用透明", desc: "7 天专业版体验结束后自动回免费版，账号与数据保留。" },
            { icon: TrendingUp, title: "小步试跑", desc: "支持从手动粘贴起步，再逐步接入 API 与插件。" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} className="intro-trust-card" delay={i * 70}>
                <Icon size={22} />
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section id="pricing-preview" className="intro-section intro-section-alt">
        <Reveal className="intro-section-head">
          <p className="intro-kicker">Pricing</p>
          <h2>按阶段选择套餐</h2>
          <p>专业版 / 团队版早鸟价 ¥299 / ¥699 · 限前 100 名或至 2026年8月31日</p>
        </Reveal>
        <div className="intro-pricing-grid">
          {INTRO_PRICING.map((plan, i) => (
            <Reveal
              key={plan.id}
              className={`intro-price-card ${plan.recommended ? "is-recommended" : ""}`}
              delay={i * 80}
            >
              {plan.recommended ? <span className="intro-rec-badge">推荐</span> : null}
              <h3>{plan.name}</h3>
              <p className="intro-price-line">
                {plan.price === "0" ? (
                  <strong>免费</strong>
                ) : (
                  <>
                    <span>¥</span>
                    <strong>{plan.priceEarlyBird || plan.price}</strong>
                    <small>/ 月起</small>
                    {plan.priceEarlyBird ? <em>¥{plan.price}</em> : null}
                  </>
                )}
              </p>
              <p className="intro-price-desc">{plan.desc}</p>
              <ul>
                {plan.features.map((f) => (
                  <li key={f}>
                    <Check size={14} /> {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`intro-btn ${plan.recommended ? "intro-btn-primary" : "intro-btn-glass"} intro-btn-block`}
                onClick={onRegisterClick}
              >
                {plan.price === "0" ? "免费注册" : "选择并注册"}
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="intro-cta-final">
        <Reveal className="intro-cta-inner">
          <h2>准备好就开通账号</h2>
          <p>免费注册 · 7 天专业版全功能体验 · TikTok 插件即装即用</p>
          <div className="intro-cta-buttons">
            <button type="button" className="intro-btn intro-btn-primary intro-btn-lg intro-btn-shimmer" onClick={onRegisterClick}>
              立即免费注册
            </button>
            <button type="button" className="intro-btn intro-btn-glass intro-btn-lg" onClick={onLoginClick}>
              已有账号 · 登录
            </button>
          </div>
        </Reveal>
      </section>

      <footer className="intro-footer">
        <div className="intro-footer-inner">
          <div className="intro-footer-brand">
            <Sparkles size={18} />
            <span>凡梦AI — 跨境电商多智能体工作台</span>
          </div>
          <p>产品介绍页 · 以登录后控制台为准</p>
          <button type="button" className="intro-footer-top" onClick={() => go("#top")}>
            回到顶部
          </button>
        </div>
      </footer>
    </div>
  );
}
