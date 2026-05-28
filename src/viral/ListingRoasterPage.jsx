import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  Flame,
  Link2,
  Loader2,
  Share2,
  Sparkles,
  Zap,
} from "lucide-react";
import { trackEvent } from "../lib/analytics.js";
import "./viral.css";

const PLATFORMS = ["TikTok Shop", "Amazon", "Temu", "Shopify"];

const DEMO_LISTING = {
  title: "Portable Blender USB Rechargeable Mini Juicer Cup for Office",
  bullets: `• 304 stainless steel blades
• 2000mAh battery
• Easy to clean
• Good for travel
• BPA free material`,
};

function scoreTone(score) {
  if (score >= 85) return { label: "能打", color: "#16a34a" };
  if (score >= 70) return { label: "还行", color: "#0891b2" };
  if (score >= 50) return { label: "危险", color: "#ea580c" };
  return { label: "处刑", color: "#dc2626" };
}

function ReportScoreRing({ score, verdict }) {
  const tone = scoreTone(score);
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="viral-score-ring" style={{ "--score-color": tone.color }}>
      <svg viewBox="0 0 120 120" aria-hidden>
        <circle className="viral-score-track" cx="60" cy="60" r="52" />
        <circle
          className="viral-score-fill"
          cx="60"
          cy="60"
          r="52"
          style={{ strokeDashoffset: `${326 - (326 * pct) / 100}` }}
        />
      </svg>
      <div className="viral-score-center">
        <strong>{score}</strong>
        <span>{tone.label}</span>
        <em>{verdict}</em>
      </div>
    </div>
  );
}

function SharePanel({ report, shareUrl, onRegisterClick, publishing, onPublish }) {
  const [copied, setCopied] = useState("");
  const teaser = report?.result?.shareTeaser || `我的 Listing 只拿了 ${report?.score} 分，被 AI 公开处刑了…`;

  const socialText = useMemo(() => {
    const url = shareUrl || window.location.href;
    return `${teaser}\n\n得分 ${report?.score}/100 · ${report?.verdict}\n${url}\n\n#TikTokShop #跨境 #Listing优化`;
  }, [report, shareUrl, teaser]);

  async function copyText(label, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("fail");
    }
  }

  if (!report?.isPublic) {
    return (
      <div className="viral-share-panel">
        <h3>
          <Share2 size={18} /> 生成分享链接，让报告自己获客
        </h3>
        <p>发布后链接可发朋友圈、卖家群、短视频简介。每个查看的人都能一键「处刑自己的 Listing」。</p>
        <button type="button" className="viral-btn viral-btn-primary" disabled={publishing} onClick={onPublish}>
          {publishing ? <Loader2 size={16} className="viral-spin" /> : <Link2 size={16} />}
          生成公开分享链接
        </button>
      </div>
    );
  }

  return (
    <div className="viral-share-panel is-live">
      <h3>
        <Check size={18} /> 分享链接已就绪 · 已被查看 {report.views || 0} 次
      </h3>
      <div className="viral-share-url">
        <code>{shareUrl}</code>
        <button type="button" className="viral-btn viral-btn-ghost" onClick={() => copyText("url", shareUrl)}>
          {copied === "url" ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <div className="viral-share-actions">
        <button type="button" className="viral-btn viral-btn-glass" onClick={() => copyText("social", socialText)}>
          {copied === "social" ? "已复制文案" : "复制朋友圈/群文案"}
        </button>
        <button type="button" className="viral-btn viral-btn-primary" onClick={onRegisterClick}>
          注册解锁完整 Listing Agent <ArrowRight size={16} />
        </button>
      </div>
      {report.conversions > 0 ? (
        <p className="viral-share-stats">这条分享已带来 {report.conversions} 次注册 🎉</p>
      ) : null}
    </div>
  );
}

export function ListingRoasterPage({
  onLoginClick,
  onRegisterClick,
  onHomeClick,
  shareRefCode = null,
}) {
  const [platform, setPlatform] = useState("TikTok Shop");
  const [title, setTitle] = useState("");
  const [bullets, setBullets] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [quota, setQuota] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [loadingShare, setLoadingShare] = useState(Boolean(shareRefCode));

  const loadSharedReport = useCallback(async (ref) => {
    setLoadingShare(true);
    setError("");
    try {
      const res = await fetch(`/api/viral/reports/${encodeURIComponent(ref)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "加载失败");
      if (!data.report?.isPublic && !data.preview) {
        throw new Error("该报告尚未公开分享。");
      }
      setReport(data.report);
      if (data.report?.isPublic) {
        setShareUrl(`${window.location.origin}/r/${data.report.refCode}`);
      }
      trackEvent("viral_report_view", { refCode: ref, score: data.report?.score });
    } catch (err) {
      setError(err.message || "报告加载失败");
    } finally {
      setLoadingShare(false);
    }
  }, []);

  useEffect(() => {
    if (shareRefCode) {
      try {
        localStorage.setItem("fanmeng_viral_ref", shareRefCode);
      } catch {
        /* ignore */
      }
      loadSharedReport(shareRefCode);
    }
  }, [shareRefCode, loadSharedReport]);

  function fillDemo() {
    setTitle(DEMO_LISTING.title);
    setBullets(DEMO_LISTING.bullets);
    setPlatform("TikTok Shop");
  }

  async function runRoast(event) {
    event?.preventDefault();
    setError("");
    setBusy(true);
    setReport(null);
    setShareUrl("");
    trackEvent("viral_roast_start", { platform });

    try {
      const res = await fetch("/api/viral/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, bullets, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "处刑失败");
      setReport(data.report);
      setQuota(data.quota);
      trackEvent("viral_roast_complete", { score: data.report?.score, refCode: data.report?.refCode });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "请求失败");
    } finally {
      setBusy(false);
    }
  }

  async function publishReport() {
    if (!report?.id) return;
    setPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/viral/reports/${report.id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "发布失败");
      setReport(data.report);
      setShareUrl(data.shareUrl || "");
      trackEvent("viral_report_publish", { refCode: data.report?.refCode });
    } catch (err) {
      setError(err.message || "发布失败");
    } finally {
      setPublishing(false);
    }
  }

  const showForm = !shareRefCode || !loadingShare;

  return (
    <div className="viral-landing">
      <div className="viral-bg" aria-hidden>
        <div className="viral-orb viral-orb-a" />
        <div className="viral-orb viral-orb-b" />
      </div>

      <header className="viral-nav">
        <button type="button" className="viral-brand" onClick={onHomeClick}>
          <Sparkles size={18} />
          <span>
            凡梦AI <em>Listing 处刑仪</em>
          </span>
        </button>
        <div className="viral-nav-actions">
          <button type="button" className="viral-btn viral-btn-ghost" onClick={onLoginClick}>
            登录
          </button>
          <button type="button" className="viral-btn viral-btn-primary" onClick={onRegisterClick}>
            免费注册
          </button>
        </div>
      </header>

      <main className="viral-main">
        <section className="viral-hero">
          <p className="viral-kicker">
            <Flame size={15} /> 免费 · 无需登录 · 30 秒出结果
          </p>
          <h1>
            你的 Listing，老外会
            <span className="viral-gradient"> 3 秒划走 </span>
            吗？
          </h1>
          <p className="viral-lead">
            粘贴标题和五点描述，AI 毒舌处刑 + 直接给出可替换的英文优化稿。生成分享链接，报告自己会传播。
          </p>
          {quota ? (
            <p className="viral-quota">今日剩余免费次数：{quota.remaining}</p>
          ) : null}
        </section>

        {loadingShare ? (
          <div className="viral-loading">
            <Loader2 size={28} className="viral-spin" />
            <span>加载处刑报告…</span>
          </div>
        ) : null}

        {error ? (
          <div className="viral-error" role="alert">
            <AlertTriangle size={16} /> {error}
            {error.includes("次数") ? (
              <button type="button" className="viral-btn viral-btn-primary viral-error-cta" onClick={onRegisterClick}>
                注册获取更多额度
              </button>
            ) : null}
          </div>
        ) : null}

        {showForm && !report ? (
          <form className="viral-form" onSubmit={runRoast}>
            <div className="viral-form-row">
              <label>
                平台
                <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="viral-demo-btn" onClick={fillDemo}>
                填入示例 Listing
              </button>
            </div>
            <label>
              商品标题（英文）
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Portable Blender USB Rechargeable..."
                maxLength={500}
              />
            </label>
            <label>
              五点 / 描述（英文，可选）
              <textarea
                value={bullets}
                onChange={(e) => setBullets(e.target.value)}
                placeholder="• Benefit-focused bullet 1&#10;• ..."
                rows={7}
                maxLength={4000}
              />
            </label>
            <button type="submit" className="viral-btn viral-btn-primary viral-btn-xl" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 size={18} className="viral-spin" /> AI 正在处刑…
                </>
              ) : (
                <>
                  <Zap size={18} /> 开始公开处刑
                </>
              )}
            </button>
          </form>
        ) : null}

        {report ? (
          <div className="viral-result">
            <div className="viral-result-head">
              <ReportScoreRing score={report.score} verdict={report.verdict} />
              <div className="viral-result-meta">
                <span className="viral-platform-tag">{report.platform || platform}</span>
                <h2>{report.titlePreview}</h2>
                <p className="viral-hook">{report.result?.hookLine}</p>
              </div>
            </div>

            <div className="viral-columns">
              <article className="viral-card viral-card-roast">
                <h3>🔥 毒舌处刑</h3>
                <ul>
                  {(report.result?.roasts || []).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </article>
              <article className="viral-card viral-card-fix">
                <h3>✅ 立刻能改</h3>
                <ul>
                  {(report.result?.fixes || []).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </article>
            </div>

            <article className="viral-card viral-card-improved">
              <h3>📝 AI 优化稿（可直接替换）</h3>
              <div className="viral-improved-title">
                <small>Title</small>
                <p>{report.result?.improvedTitle}</p>
              </div>
              <ol>
                {(report.result?.improvedBullets || []).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            </article>

            <SharePanel
              report={report}
              shareUrl={shareUrl}
              publishing={publishing}
              onPublish={publishReport}
              onRegisterClick={onRegisterClick}
            />

            <div className="viral-upsell">
              <div>
                <strong>想要 6 个 Agent 跑完整运营链路？</strong>
                <p>Listing 只是开始。选品、脚本、诊断、客服、利润——凡梦AI 注册即享 7 天专业版。</p>
              </div>
              <button type="button" className="viral-btn viral-btn-primary" onClick={onRegisterClick}>
                免费注册 <ArrowRight size={16} />
              </button>
            </div>

            {!shareRefCode ? (
              <button
                type="button"
                className="viral-btn viral-btn-glass viral-reset"
                onClick={() => {
                  setReport(null);
                  setShareUrl("");
                  setTitle("");
                  setBullets("");
                }}
              >
                再处刑一个 Listing
              </button>
            ) : (
              <button type="button" className="viral-btn viral-btn-primary viral-reset" onClick={() => onHomeClick?.()}>
                我也要处刑我的 Listing
              </button>
            )}
          </div>
        ) : null}
      </main>

      <footer className="viral-footer">
        <span>凡梦AI · Listing 处刑仪 · 报告带分享链接，帮你自动获客</span>
        <button type="button" onClick={onHomeClick}>
          返回官网
        </button>
      </footer>
    </div>
  );
}

export function parseViralRouteHash(raw) {
  const hash = String(raw || "").trim();
  if (hash === "roast") return { kind: "tool" };
  if (hash.startsWith("r/")) {
    const refCode = hash.slice(2).split(/[/?#]/)[0];
    if (refCode) return { kind: "share", refCode };
  }
  return null;
}

export function captureViralRef(refCode) {
  const code = String(refCode || "").trim();
  if (!code) return;
  try {
    localStorage.setItem("fanmeng_viral_ref", code);
  } catch {
    /* ignore */
  }
}

export function getStoredViralRef() {
  try {
    return localStorage.getItem("fanmeng_viral_ref") || "";
  } catch {
    return "";
  }
}
