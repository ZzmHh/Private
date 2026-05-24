import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Image, Loader2, Sparkles, UploadCloud, Video } from "lucide-react";

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

  const canUse = hasFeature?.("vibeClip") !== false;

  const reloadMeta = useCallback(async () => {
    if (!canUse) return;
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
  }, [authHeaders, canUse]);

  useEffect(() => {
    reloadMeta();
  }, [reloadMeta]);

  const moods = templates?.moods || analysis?.availableMoods || [];

  const selectedVariant = useMemo(
    () => job?.variants?.find((v) => v.id === selectedVariantId) || job?.variants?.[0] || null,
    [job, selectedVariantId],
  );

  async function handleFilePick(file) {
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

  if (notYetOpen) {
    return (
      <div className="vc-panel">
        <div className="vc-callout vc-callout-soon">
          <Video size={20} aria-hidden />
          <div>
            <strong>氛围成片</strong>
            <p className="vc-soon-badge">该功能尚未开通</p>
            <p>
              规划能力：上传商品图 → AI 识别品类与氛围 → 生成 TikTok 9:16 短视频方案与发布文案。
              当前仍在开发中（含视频渲染接入），正式版上线后将在此开放。
            </p>
          </div>
        </div>
      </div>
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
    <div className="vc-panel">
      <div className="vc-head">
        <div>
          <p className="vc-kicker">VibeClip · 氛围成片</p>
          <h4>上传商品图 → 选氛围 → 拿 3 版 A/B 方案</h4>
          <p className="vc-sub">
            MVP 骨架：品类识别、氛围模板、感官文案与发布包；下一阶段接入 FFmpeg 输出 9:16 MP4。
          </p>
        </div>
        {quota ? (
          <div className="vc-quota">
            <span>本月额度</span>
            <strong>
              {quota.remaining}/{quota.limit}
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
          <span key={id} className={step === id || (step === "generating" && id === "style") ? "vc-step is-active" : "vc-step"}>
            {label}
          </span>
        ))}
      </div>

      <div className="vc-grid">
        <section className="vc-card">
          {step === "upload" || !imageDataUrl ? (
            <>
              <div
                className="vc-upload"
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
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
                  value={productHint}
                  onChange={(e) => setProductHint(e.target.value)}
                  placeholder="例：桌面香薰摆件 / 保湿面霜 / 手机壳"
                />
              </label>
            </>
          ) : (
            <div className="vc-preview-layout">
              <div className="vc-phone">
                {imageDataUrl ? <img src={imageDataUrl} alt="商品预览" /> : <Image size={32} aria-hidden />}
              </div>
              <div className="vc-analysis">
                {analysis ? (
                  <>
                    <p>
                      识别品类：<strong>{analysis.categoryLabel}</strong>
                    </p>
                    <p>{analysis.analysisNote}</p>
                  </>
                ) : (
                  <p>正在分析商品…</p>
                )}
                <label className="vc-field">
                  <span>补充描述</span>
                  <input
                    value={productHint}
                    onChange={(e) => setProductHint(e.target.value)}
                    placeholder="可选：更准确的品类/卖点"
                  />
                </label>
                <button type="button" className="vc-link-btn" onClick={() => fileRef.current?.click()}>
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

          {imageDataUrl && step !== "preview" ? (
            <>
              <div className="vc-mood-grid">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    type="button"
                    className={selectedMoodId === mood.id ? "vc-mood is-selected" : "vc-mood"}
                    style={{ "--vc-accent": mood.accent }}
                    onClick={() => setSelectedMoodId(mood.id)}
                  >
                    <span className="vc-mood-dot" />
                    <strong>{mood.label}</strong>
                    <small>{mood.tagline}</small>
                  </button>
                ))}
              </div>
              <button type="button" className="vc-primary" disabled={busy || !selectedMoodId} onClick={handleGenerate}>
                {busy ? <Loader2 size={18} className="vc-spin" aria-hidden /> : <Sparkles size={18} aria-hidden />}
                {busy ? "生成中…" : "生成 3 版氛围预览"}
              </button>
            </>
          ) : null}
        </section>

        <section className="vc-card">
          {step === "generating" ? (
            <div className="vc-loading">
              <Loader2 size={28} className="vc-spin" aria-hidden />
              <p>正在匹配 BGM 与感官文案…</p>
              <small>骨架版同步返回；接入渲染 Worker 后将显示进度条。</small>
            </div>
          ) : step === "preview" && job?.variants?.length ? (
            <>
              <div className="vc-variant-grid">
                {job.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    className={selectedVariantId === variant.id ? "vc-variant is-selected" : "vc-variant"}
                    onClick={() => setSelectedVariantId(variant.id)}
                  >
                    <span className="vc-variant-label">版本 {variant.label}</span>
                    <strong>{variant.headline}</strong>
                    <small>{variant.moodLabel} · {variant.durationSec}s · {variant.aspectRatio}</small>
                  </button>
                ))}
              </div>

              {selectedVariant ? (
                <div className="vc-result">
                  <div className="vc-phone is-filled" style={{ "--vc-accent": selectedVariant.accent }}>
                    <img src={job.imageThumb || imageDataUrl} alt="" />
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
                <button type="button" disabled title="MP4 渲染接入后开放">
                  <Download size={16} aria-hidden /> 下载 MP4（待接入）
                </button>
              </div>

              {job.publishPack ? (
                <div className="vc-publish-pack">
                  <h5>发布建议</h5>
                  <p>{job.publishPack.suggestedCaption}</p>
                  <p>{(job.publishPack.hashtags || []).join(" ")}</p>
                  <small>{job.publishPack.bestTimeHint}</small>
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

      {history.length ? (
        <section className="vc-history">
          <h5>最近生成</h5>
          <div className="vc-history-list">
            {history.slice(0, 6).map((item) => (
              <button
                key={item.id}
                type="button"
                className="vc-history-item"
                onClick={() => {
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
