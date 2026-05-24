import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Image, Loader2, Sparkles, UploadCloud, Video, X } from "lucide-react";

/** 尚未开通时的界面预览数据（不调用 API） */
const VIBECLIP_DEMO = {
  quota: { remaining: 12, limit: 15, used: 3 },
  productHint: "桌面香薰摆件 · 极简家居",
  fileName: "demo-home-decor.jpg",
  imageDataUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="640" viewBox="0 0 360 640"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f5ebe0"/><stop offset="100%" stop-color="#e8dcc8"/></linearGradient></defs><rect width="360" height="640" fill="url(#g)"/><rect x="130" y="220" width="100" height="180" rx="12" fill="#c4a882" opacity="0.85"/><ellipse cx="180" cy="210" rx="48" ry="14" fill="#a8896a"/><text x="180" y="460" text-anchor="middle" fill="#8b7355" font-family="sans-serif" font-size="14">商品图预览</text></svg>`,
    ),
  analysis: {
    categoryId: "home_decor",
    categoryLabel: "家居摆件",
    recommendedMoodId: "minimal_luxury",
    recommendedMoodLabel: "极简高级",
    analysisNote: "根据素材信息识别为「家居摆件」，推荐「极简高级」氛围。（界面预览示例）",
    availableMoods: [
      { id: "minimal_luxury", label: "极简高级", tagline: "强调质感，让人想放在显眼的位置", accent: "#c4a882" },
      { id: "dreamy_soft", label: "梦幻治愈", tagline: "柔光氛围，拉停留、建信任", accent: "#e8b4cb" },
      { id: "promo_energy", label: "促销转化", tagline: "快节奏、醒目字幕，适合冲单", accent: "#ff6b35" },
    ],
  },
  selectedMoodId: "minimal_luxury",
  job: {
    id: "demo-preview",
    imageThumb: "",
    publishPack: {
      suggestedCaption: "放在桌上，像一件小艺术品 · 家居摆件",
      hashtags: ["#TikTokShop", "#musthave", "#家居摆件"],
      bestTimeHint: "建议本地时间 19:00–22:00 发布（TikTok 晚间活跃段）",
    },
    selectedVariantId: "demo-v1",
    variants: [
      {
        id: "demo-v1",
        label: "A",
        headline: "放在桌上，像一件小艺术品",
        bullets: ["强调材质与光影", "适合主图视频 / 质感展示", "9:16 竖屏 · 无口播"],
        moodLabel: "极简高级",
        durationSec: 14,
        aspectRatio: "9:16",
        bgm: "soft_minimal_piano",
        colorGrade: "warm_beige",
        accent: "#c4a882",
        previewNote: "正式版将提供 MP4 下载与店铺导入。",
        publishTitle: "放在桌上，像一件小艺术品 · 家居摆件",
        hashtags: ["#TikTokShop", "#musthave", "#家居摆件"],
      },
      {
        id: "demo-v2",
        label: "B",
        headline: "给房间添一抹 quietly 的高级感",
        bullets: ["强调材质与光影", "适合主图视频 / 质感展示", "9:16 竖屏 · 无口播"],
        moodLabel: "极简高级",
        durationSec: 14,
        aspectRatio: "9:16",
        bgm: "soft_minimal_piano",
        colorGrade: "warm_beige",
        accent: "#c4a882",
        previewNote: "正式版将提供 MP4 下载与店铺导入。",
      },
      {
        id: "demo-v3",
        label: "C",
        headline: "不是摆件，是日常里的仪式感",
        bullets: ["强调材质与光影", "适合主图视频 / 质感展示", "9:16 竖屏 · 无口播"],
        moodLabel: "极简高级",
        durationSec: 14,
        aspectRatio: "9:16",
        bgm: "soft_minimal_piano",
        colorGrade: "warm_beige",
        accent: "#c4a882",
        previewNote: "正式版将提供 MP4 下载与店铺导入。",
      },
    ],
  },
};

function VibeClipSoonModal({ onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="vc-soon-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vc-soon-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="vc-soon-kicker">VibeClip · 氛围成片</p>
            <h2 id="vc-soon-title">该功能尚未开通</h2>
            <p>您当前看到的是<strong>界面预览</strong>，正式版上线后将支持上传商品图、AI 匹配氛围并生成 TikTok 9:16 短视频方案。</p>
          </div>
          <button type="button" aria-label="关闭" onClick={onClose}>
            <X size={18} aria-hidden />
          </button>
        </div>
        <ul className="vc-soon-list">
          <li>上传商品图 → 识别品类与氛围</li>
          <li>一次生成 3 版 A/B 文案与发布包</li>
          <li>下一阶段接入 MP4 渲染与店铺导入</li>
        </ul>
        <div className="vc-soon-actions">
          <button type="button" className="vc-primary" onClick={onClose}>
            我知道了，继续浏览预览
          </button>
        </div>
      </div>
    </div>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });
}

export function VibeClipPanel({ authHeaders, showToast, formatError, hasFeature, notYetOpen = false }) {
  const fileRef = useRef(null);
  const [soonOpen, setSoonOpen] = useState(false);
  const [previewVariantId, setPreviewVariantId] = useState(VIBECLIP_DEMO.job.selectedVariantId);
  const [step, setStep] = useState("upload");
  const [busy, setBusy] = useState(false);
  const [quota, setQuota] = useState(null);
  const [templates, setTemplates] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [productHint, setProductHint] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [selectedMoodId, setSelectedMoodId] = useState("");
  const [job, setJob] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [history, setHistory] = useState([]);

  const isPreview = notYetOpen;
  const canUse = isPreview || hasFeature?.("vibeClip") !== false;

  useEffect(() => {
    if (isPreview) setSoonOpen(true);
  }, [isPreview]);

  function guardPreview() {
    if (!isPreview) return false;
    setSoonOpen(true);
    return true;
  }

  const reloadMeta = useCallback(async () => {
    if (!canUse || isPreview) return;
    try {
      const [quotaRes, tplRes, jobsRes] = await Promise.all([
        fetch("/api/vibeclip/quota", { headers: authHeaders() }),
        fetch("/api/vibeclip/templates", { headers: authHeaders() }),
        fetch("/api/vibeclip/jobs", { headers: authHeaders() }),
      ]);
      const quotaData = await quotaRes.json();
      const tplData = await tplRes.json();
      const jobsData = await jobsRes.json();
      if (quotaRes.ok) setQuota(quotaData);
      if (tplRes.ok) setTemplates(tplData);
      if (jobsRes.ok) setHistory(jobsData.jobs || []);
    } catch {
      /* ignore bootstrap errors */
    }
  }, [authHeaders, canUse, isPreview]);

  useEffect(() => {
    reloadMeta();
  }, [reloadMeta]);

  const displayQuota = isPreview ? VIBECLIP_DEMO.quota : quota;
  const displayStep = isPreview ? "preview" : step;
  const displayImage = isPreview ? VIBECLIP_DEMO.imageDataUrl : imageDataUrl;
  const displayProductHint = isPreview ? VIBECLIP_DEMO.productHint : productHint;
  const displayAnalysis = isPreview ? VIBECLIP_DEMO.analysis : analysis;
  const displaySelectedMoodId = isPreview ? VIBECLIP_DEMO.selectedMoodId : selectedMoodId;
  const displayJob = isPreview ? VIBECLIP_DEMO.job : job;
  const displaySelectedVariantId = isPreview ? previewVariantId : selectedVariantId;
  const displayHistory = isPreview ? [] : history;

  const moods = templates?.moods || displayAnalysis?.availableMoods || [];

  const selectedVariant = useMemo(
    () =>
      displayJob?.variants?.find((v) => v.id === displaySelectedVariantId) ||
      displayJob?.variants?.[0] ||
      null,
    [displayJob, displaySelectedVariantId],
  );

  async function handleFilePick(file) {
    if (guardPreview()) return;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast?.("请上传 JPG / PNG / WebP 商品图。");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImageDataUrl(dataUrl);
      setFileName(file.name);
      setStep("style");
      const res = await fetch("/api/vibeclip/analyze", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, productHint }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "分析失败");
      setAnalysis(data.analysis);
      setSelectedMoodId(data.analysis.recommendedMoodId);
    } catch (error) {
      showToast?.(formatError?.(error) || error.message || "上传失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerate() {
    if (guardPreview()) return;
    if (!imageDataUrl) {
      showToast?.("请先上传商品图。");
      return;
    }
    setBusy(true);
    setStep("generating");
    try {
      const res = await fetch("/api/vibeclip/generate", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl,
          fileName,
          productHint,
          moodId: selectedMoodId,
          categoryId: analysis?.categoryId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成失败");
      setJob(data.job);
      setSelectedVariantId(data.job.selectedVariantId || data.job.variants?.[0]?.id || "");
      setQuota((prev) =>
        prev
          ? { ...prev, used: (prev.used || 0) + 1, remaining: data.quota?.remaining ?? prev.remaining }
          : data.quota,
      );
      setStep("preview");
      showToast?.("已生成 3 版氛围方案（MVP 骨架：文案与参数就绪，MP4 渲染待接入）");
      reloadMeta();
    } catch (error) {
      setStep("style");
      showToast?.(formatError?.(error) || error.message || "生成失败");
    } finally {
      setBusy(false);
    }
  }

  function copyPublishText() {
    if (guardPreview()) return;
    if (!selectedVariant || !job?.publishPack) return;
    const text = [
      selectedVariant.publishTitle || job.publishPack.suggestedCaption,
      "",
      selectedVariant.headline,
      ...(selectedVariant.bullets || []).map((b) => `· ${b}`),
      "",
      (job.publishPack.hashtags || selectedVariant.hashtags || []).join(" "),
    ].join("\n");
    navigator.clipboard.writeText(text).then(
      () => showToast?.("发布文案已复制"),
      () => showToast?.("复制失败，请手动选择文本"),
    );
  }

  if (!canUse) {
    return (
      <div className="vc-panel">
        <div className="vc-callout">
          <Video size={20} aria-hidden />
          <div>
            <strong>氛围成片</strong>
            <p>当前套餐未开通此模块，请升级成长版或更高套餐。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isPreview ? "vc-panel vc-panel-preview" : "vc-panel"}>
      {soonOpen ? <VibeClipSoonModal onClose={() => setSoonOpen(false)} /> : null}

      {isPreview ? (
        <div className="vc-preview-banner">
          <Video size={18} aria-hidden />
          <div>
            <strong>界面预览</strong>
            <span>该功能尚未开通 · 以下为即将上线的氛围成片工作区，点击操作会提示开通状态</span>
          </div>
          <button type="button" className="vc-preview-banner-btn" onClick={() => setSoonOpen(true)}>
            了解详情
          </button>
        </div>
      ) : null}

      <div className="vc-head">
        <div>
          <p className="vc-kicker">VibeClip · 氛围成片</p>
          <h4>上传商品图 → 选氛围 → 拿 3 版 A/B 方案</h4>
          <p className="vc-sub">
            {isPreview
              ? "预览示例：品类识别、氛围模板、感官文案与发布包；正式版接入 FFmpeg 输出 9:16 MP4。"
              : "MVP 骨架：品类识别、氛围模板、感官文案与发布包；下一阶段接入 FFmpeg 输出 9:16 MP4。"}
          </p>
        </div>
        {displayQuota ? (
          <div className="vc-quota">
            <span>本月额度</span>
            <strong>
              {displayQuota.remaining}/{displayQuota.limit}
            </strong>
          </div>
        ) : null}
      </div>

      <div className="vc-steps" aria-label="创建步骤">
        {[
          ["upload", "1. 上传"],
          ["style", "2. 选氛围"],
          ["preview", "3. 选版下载"],
        ].map(([id, label]) => (
          <span
            key={id}
            className={
              displayStep === id || (displayStep === "generating" && id === "style") ? "vc-step is-active" : "vc-step"
            }
          >
            {label}
          </span>
        ))}
      </div>

      <div className="vc-grid">
        <section className="vc-card">
          {displayStep === "upload" || !displayImage ? (
            <>
              <div
                className="vc-upload"
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (guardPreview()) return;
                  fileRef.current?.click();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (guardPreview()) return;
                    fileRef.current?.click();
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFilePick(e.dataTransfer.files?.[0]);
                }}
              >
                <UploadCloud size={28} aria-hidden />
                <strong>拖入商品图，或点击上传</strong>
                <small>JPG / PNG / WebP · 建议白底或主体清晰</small>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleFilePick(e.target.files?.[0])}
                />
              </div>
              <label className="vc-field">
                <span>商品描述（可选，帮助识别品类）</span>
                <input
                  value={displayProductHint}
                  readOnly={isPreview}
                  onChange={(e) => {
                    if (guardPreview()) return;
                    setProductHint(e.target.value);
                  }}
                  onFocus={() => guardPreview()}
                  placeholder="例：桌面香薰摆件 / 保湿面霜 / 手机壳"
                />
              </label>
            </>
          ) : (
            <div className="vc-preview-layout">
              <div className="vc-phone">
                {displayImage ? <img src={displayImage} alt="商品预览" /> : <Image size={32} aria-hidden />}
              </div>
              <div className="vc-analysis">
                {displayAnalysis ? (
                  <>
                    <p>
                      识别品类：<strong>{displayAnalysis.categoryLabel}</strong>
                    </p>
                    <p>{displayAnalysis.analysisNote}</p>
                  </>
                ) : (
                  <p>正在分析商品…</p>
                )}
                <label className="vc-field">
                  <span>补充描述</span>
                  <input
                    value={displayProductHint}
                    readOnly={isPreview}
                    onChange={(e) => {
                      if (guardPreview()) return;
                      setProductHint(e.target.value);
                    }}
                    onFocus={() => guardPreview()}
                    placeholder="可选：更准确的品类/卖点"
                  />
                </label>
                <button
                  type="button"
                  className="vc-link-btn"
                  onClick={() => {
                    if (guardPreview()) return;
                    fileRef.current?.click();
                  }}
                >
                  更换图片
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleFilePick(e.target.files?.[0])}
                />
              </div>
            </div>
          )}

          {displayImage && displayStep !== "preview" ? (
            <>
              <div className="vc-mood-grid">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    type="button"
                    className={displaySelectedMoodId === mood.id ? "vc-mood is-selected" : "vc-mood"}
                    style={{ "--vc-accent": mood.accent }}
                    onClick={() => {
                      if (guardPreview()) return;
                      setSelectedMoodId(mood.id);
                    }}
                  >
                    <span className="vc-mood-dot" />
                    <strong>{mood.label}</strong>
                    <small>{mood.tagline}</small>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="vc-primary"
                disabled={busy || !displaySelectedMoodId}
                onClick={handleGenerate}
              >
                {busy ? <Loader2 size={18} className="vc-spin" aria-hidden /> : <Sparkles size={18} aria-hidden />}
                {busy ? "生成中…" : "生成 3 版氛围预览"}
              </button>
            </>
          ) : null}

          {isPreview && displayImage ? (
            <>
              <div className="vc-mood-grid">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    type="button"
                    className={displaySelectedMoodId === mood.id ? "vc-mood is-selected" : "vc-mood"}
                    style={{ "--vc-accent": mood.accent }}
                    onClick={() => guardPreview()}
                  >
                    <span className="vc-mood-dot" />
                    <strong>{mood.label}</strong>
                    <small>{mood.tagline}</small>
                  </button>
                ))}
              </div>
              <button type="button" className="vc-primary" onClick={() => guardPreview()}>
                <Sparkles size={18} aria-hidden />
                生成 3 版氛围预览
              </button>
            </>
          ) : null}
        </section>

        <section className="vc-card">
          {displayStep === "generating" ? (
            <div className="vc-loading">
              <Loader2 size={28} className="vc-spin" aria-hidden />
              <p>正在匹配 BGM 与感官文案…</p>
              <small>骨架版同步返回；接入渲染 Worker 后将显示进度条。</small>
            </div>
          ) : displayStep === "preview" && displayJob?.variants?.length ? (
            <>
              <div className="vc-variant-grid">
                {displayJob.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    className={displaySelectedVariantId === variant.id ? "vc-variant is-selected" : "vc-variant"}
                    onClick={() => {
                      if (isPreview) {
                        setPreviewVariantId(variant.id);
                        return;
                      }
                      setSelectedVariantId(variant.id);
                    }}
                  >
                    <span className="vc-variant-label">版本 {variant.label}</span>
                    <strong>{variant.headline}</strong>
                    <small>
                      {variant.moodLabel} · {variant.durationSec}s · {variant.aspectRatio}
                    </small>
                  </button>
                ))}
              </div>

              {selectedVariant ? (
                <div className="vc-result">
                  <div className="vc-phone is-filled" style={{ "--vc-accent": selectedVariant.accent }}>
                    <img src={displayJob.imageThumb || displayImage} alt="" />
                    <div className="vc-overlay">
                      <p>{selectedVariant.headline}</p>
                    </div>
                  </div>
                  <div className="vc-copy-block">
                    <h5>感官文案</h5>
                    <p className="vc-headline">{selectedVariant.headline}</p>
                    <ul>
                      {(selectedVariant.bullets || []).map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                    <p className="vc-meta">
                      BGM：{selectedVariant.bgm} · 调色：{selectedVariant.colorGrade}
                    </p>
                    <p className="vc-note">{selectedVariant.previewNote}</p>
                  </div>
                </div>
              ) : null}

              <div className="vc-actions">
                <button type="button" onClick={copyPublishText}>
                  <Copy size={16} aria-hidden /> 复制发布文案
                </button>
                <button
                  type="button"
                  disabled={!isPreview}
                  title={isPreview ? "功能尚未开通" : "MP4 渲染接入后开放"}
                  onClick={() => guardPreview()}
                >
                  <Download size={16} aria-hidden /> 下载 MP4（待接入）
                </button>
              </div>

              {displayJob.publishPack ? (
                <div className="vc-publish-pack">
                  <h5>发布建议</h5>
                  <p>{displayJob.publishPack.suggestedCaption}</p>
                  <p>{(displayJob.publishPack.hashtags || []).join(" ")}</p>
                  <small>{displayJob.publishPack.bestTimeHint}</small>
                </div>
              ) : null}
            </>
          ) : (
            <div className="vc-empty">
              <Video size={28} aria-hidden />
              <p>上传商品图并选择氛围后，这里会出现 3 版 A/B 方案。</p>
              <ul>
                <li>版本 A/B/C：不同开头文案与节奏</li>
                <li>一键复制 TikTok 发布文案与标签</li>
                <li>下一阶段：真实 MP4 下载与店铺导入</li>
              </ul>
            </div>
          )}
        </section>
      </div>

      {displayHistory.length ? (
        <section className="vc-history">
          <h5>最近生成</h5>
          <div className="vc-history-list">
            {displayHistory.slice(0, 6).map((item) => (
              <button
                key={item.id}
                type="button"
                className="vc-history-item"
                onClick={() => {
                  if (guardPreview()) return;
                  setJob(item);
                  setSelectedVariantId(item.selectedVariantId || item.variants?.[0]?.id || "");
                  setImageDataUrl(item.imageThumb || "");
                  setStep("preview");
                }}
              >
                <Check size={14} aria-hidden />
                <span>{item.analysis?.categoryLabel || "商品视频"}</span>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
