import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDefaultFormValues,
  defaultCreativeToolId,
  findCreativeTool,
  getCreativeStudio,
  mockCreativeGenerate,
} from "./creativeStudioConfig.js";
import {
  fileToDataUrl,
  generateImage,
  pollVideoTask,
  submitVideoTask,
  waitForVideoTask,
} from "../lib/creativeApi.js";
import "./creativeStudio.css";

function FieldControl({ field, formValues, onChange, onFiles }) {
  if (field.type === "collapsible") {
    return (
      <details className="ent-cs-collapsible">
        <summary>{field.label}</summary>
        <div className="ent-cs-collapsible-body">
          {field.children.map((child) => (
            <FieldControl
              key={child.key}
              field={child}
              formValues={formValues}
              onChange={onChange}
              onFiles={onFiles}
            />
          ))}
        </div>
      </details>
    );
  }

  const value = formValues[field.key];

  if (field.type === "select") {
    return (
      <label className="ent-cs-field">
        <span className="ent-cs-field-label">{field.label}</span>
        <select
          className="ent-cs-control"
          value={value ?? field.default ?? ""}
          onChange={(e) => onChange(field.key, e.target.value)}
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="ent-cs-field">
        <span className="ent-cs-field-label">{field.label}</span>
        <textarea
          className="ent-cs-control ent-cs-textarea"
          rows={field.rows || 3}
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      </label>
    );
  }

  if (field.type === "number") {
    return (
      <label className="ent-cs-field">
        <span className="ent-cs-field-label">{field.label}</span>
        <input
          className="ent-cs-control"
          type="number"
          min={field.min}
          max={field.max}
          value={value ?? field.default ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      </label>
    );
  }

  if (field.type === "text") {
    return (
      <label className="ent-cs-field">
        <span className="ent-cs-field-label">{field.label}</span>
        <input
          className="ent-cs-control"
          type="text"
          value={value ?? field.default ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      </label>
    );
  }

  if (field.type === "file") {
    return (
      <label className="ent-cs-field">
        <span className="ent-cs-field-label">{field.label}</span>
        <input
          className="ent-cs-file"
          type="file"
          accept={field.accept}
          multiple={field.multiple}
          onChange={(e) => onFiles(field.key, e.target.files)}
        />
      </label>
    );
  }

  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function CreativeStudioWorkbench({ studioId, user }) {
  const studio = useMemo(() => getCreativeStudio(studioId), [studioId]);
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(studio.groups.map((g) => [g.id, g.defaultOpen !== false])),
  );
  const [toolId, setToolId] = useState(() => defaultCreativeToolId(studio));
  const tool = findCreativeTool(studio, toolId);

  const [values, setValues] = useState(() => buildDefaultFormValues(tool));
  const [filePreviews, setFilePreviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [pollStatus, setPollStatus] = useState("");
  const [result, setResult] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [taskQueryId, setTaskQueryId] = useState("");
  const [error, setError] = useState("");
  const fileUrlsRef = useRef([]);
  const filesRef = useRef({});

  useEffect(() => {
    return () => {
      fileUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    const nextTool = findCreativeTool(studio, toolId);
    setValues(buildDefaultFormValues(nextTool));
    setFilePreviews([]);
    setResult(null);
    setPollStatus("");
    setTaskQueryId("");
    setError("");
    filesRef.current = {};
    fileUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    fileUrlsRef.current = [];
  }, [studioId, toolId, studio]);

  function toggleGroup(id) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function updateValue(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function handleFiles(key, fileList) {
    fileUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    const files = [...(fileList || [])];
    filesRef.current[key] = files;
    const previews = files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }));
    fileUrlsRef.current = previews.map((p) => p.url);
    setFilePreviews(previews);
  }

  async function collectRefImages() {
    const urls = String(values.refUrls || "")
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const localFiles = filesRef.current.localFiles || filesRef.current.firstFrame || filesRef.current.lastFrame || [];
    const dataUrls = await Promise.all(localFiles.map((f) => fileToDataUrl(f)));
    return { urls, dataUrls };
  }

  async function runSeedanceVideo() {
    const token = localStorage.getItem("enterprise_token");
    if (!token) {
      if (import.meta.env.DEV) {
        await sleep(800);
        return mockCreativeGenerate(tool, values, filePreviews);
      }
      throw new Error("请先登录企业账号");
    }

    const { urls, dataUrls } = await collectRefImages();
    setPollStatus("提交 Seedance 任务…");
    const task = await submitVideoTask({
      prompt: values.prompt,
      model: values.model,
      ratio: values.ratio,
      duration: Number(values.duration) || 5,
      resolution: values.resolution,
      refImageUrls: urls,
      refImagesBase64: dataUrls,
      generateAudio: values.generate_audio === "true",
      watermark: values.watermark === "true",
    });

    setTaskQueryId(task.id);
    let finalTask = task;

    if (values.autoWait !== "false") {
      const interval = (Number(values.pollInterval) || 5) * 1000;
      const max = Number(values.pollMax) || 120;
      finalTask = await waitForVideoTask(task.id, {
        intervalMs: interval,
        maxAttempts: max,
        onProgress: (t) => setPollStatus(`生成中：${t.status || "…"}`),
      });
    }

    return {
      kind: "video",
      taskId: finalTask.id,
      status: finalTask.status,
      previewUrl: finalTask.videoUrl || null,
      downloadUrl: finalTask.videoUrl || null,
      previewLabel: finalTask.videoUrl ? "视频已生成" : "任务已提交，请轮询或手动查询",
      log: { provider: "seedance", task: finalTask },
    };
  }

  async function runImageGenerate() {
    const token = localStorage.getItem("enterprise_token");
    if (!token) {
      if (import.meta.env.DEV) {
        await sleep(700);
        return mockCreativeGenerate(tool, values, filePreviews);
      }
      throw new Error("请先登录企业账号");
    }

    setPollStatus("调用图片模型…");
    const ratio = values.ratio === "default" ? "1:1" : values.ratio || "1:1";
    const gen = await generateImage({
      prompt: values.prompt,
      model: values.model,
      ratio,
    });

    return {
      kind: "image",
      previewUrl: gen.urls[0],
      downloadUrl: gen.urls[0],
      log: { provider: "openai-image", result: gen },
    };
  }

  async function runGenerate() {
    const prompt = values.prompt?.trim?.() || "";
    const promptField = tool.fields.find((f) => f.key === "prompt");
    if (promptField?.required && !prompt) return;

    setBusy(true);
    setResult(null);
    setError("");
    setPollStatus(tool.kind === "video" ? "提交任务中…" : "生成中…");

    try {
      let out;
      if (tool.id === "seedance2" && tool.kind === "video") {
        out = await runSeedanceVideo();
      } else if (tool.kind === "image") {
        out = await runImageGenerate();
      } else if (import.meta.env.DEV) {
        await sleep(800);
        out = mockCreativeGenerate(tool, values, filePreviews);
      } else {
        throw new Error("该工具尚未接入真实 API，目前仅 seedance2 视频与图文类工具可用。");
      }
      setResult(out);
      setTaskQueryId(out.taskId || "");
      setPollStatus(out.kind === "video" && out.downloadUrl ? "已完成" : out.status || "已完成");
      setLogOpen(true);
    } catch (err) {
      setError(err?.message || "生成失败");
      setPollStatus("");
    } finally {
      setBusy(false);
    }
  }

  async function queryTask() {
    const id = taskQueryId.trim();
    if (!id) return;
    setBusy(true);
    setPollStatus("查询中…");
    setError("");
    try {
      const token = localStorage.getItem("enterprise_token");
      if (!token) throw new Error("请先登录");
      const task = await pollVideoTask(id);
      setResult({
        kind: "video",
        taskId: task.id,
        status: task.status,
        previewUrl: task.videoUrl || null,
        downloadUrl: task.videoUrl || null,
        previewLabel: task.videoUrl ? "视频已生成" : `状态：${task.status}`,
        log: { provider: "seedance", task },
      });
      setPollStatus(task.videoUrl ? "已完成" : task.status || "已查询");
      setLogOpen(true);
    } catch (err) {
      setError(err?.message || "查询失败");
    } finally {
      setBusy(false);
    }
  }

  const userLabel = user?.name || user?.email || "未登录";
  const previewStatus = busy ? pollStatus || "处理中" : result ? "已完成" : "暂无任务";

  return (
    <div className="ent-cs-root">
      <aside className="ent-cs-sidebar">
        <div className="ent-cs-brand">
          <span className="ent-cs-brand-mark">AI</span>
          <div>
            <strong>{studio.brandTitle}</strong>
            <small>{studio.brandSubtitle}</small>
          </div>
        </div>

        <nav className="ent-cs-nav" aria-label={`${studio.brandTitle}工具`}>
          {studio.groups.map((group) => (
            <div className="ent-cs-nav-group" key={group.id}>
              <button type="button" className="ent-cs-nav-group-head" onClick={() => toggleGroup(group.id)}>
                <span>{group.label}</span>
                <span className="ent-cs-nav-caret">{openGroups[group.id] ? "⌄" : "›"}</span>
              </button>
              {openGroups[group.id]
                ? group.tools.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      className={`ent-cs-nav-item${t.id === toolId ? " is-active" : ""}`}
                      onClick={() => setToolId(t.id)}
                    >
                      <strong>{t.name}</strong>
                      <span>{t.desc}</span>
                    </button>
                  ))
                : null}
            </div>
          ))}
        </nav>
      </aside>

      <div className="ent-cs-main">
        <header className="ent-cs-header">
          <h1>{tool.name}</h1>
          <div className="ent-cs-header-user">
            <span className="ent-cs-user-avatar">{userLabel.slice(0, 1)}</span>
            <span>{userLabel}</span>
          </div>
        </header>

        <section className="ent-cs-panel">
          <div className="ent-cs-panel-head">
            <h2>功能操作区</h2>
            <p>左侧填写参数，右侧实时查看生成结果。Seedance / 图片 Key 配置在服务器 .env。</p>
          </div>

          {error ? <p className="ent-cs-session-error">{error}</p> : null}

          <div className="ent-cs-split">
            <div className="ent-cs-form">
              {tool.fields.map((field) => (
                <FieldControl
                  key={field.key}
                  field={field}
                  formValues={values}
                  onChange={updateValue}
                  onFiles={handleFiles}
                />
              ))}

              {filePreviews.length ? (
                <div className="ent-cs-thumb-row">
                  {filePreviews.map((f) => (
                    <img key={f.url} src={f.url} alt={f.name} title={f.name} />
                  ))}
                </div>
              ) : null}

              <button type="button" className="ent-cs-submit" disabled={busy} onClick={runGenerate}>
                {busy ? "处理中…" : `${tool.submitLabel}（¥${tool.price}）`}
              </button>

              {tool.taskQuery ? (
                <div className="ent-cs-task-query">
                  <label className="ent-cs-field">
                    <span className="ent-cs-field-label">任务 ID（手动查询）</span>
                    <input
                      className="ent-cs-control"
                      type="text"
                      value={taskQueryId}
                      placeholder="例如：task_xxxxxx"
                      onChange={(e) => setTaskQueryId(e.target.value)}
                    />
                  </label>
                  <button type="button" className="ent-cs-query-btn" disabled={busy} onClick={queryTask}>
                    查询任务
                  </button>
                </div>
              ) : null}
            </div>

            <div className="ent-cs-preview">
              <div className="ent-cs-preview-toolbar">
                <span className={`ent-cs-status ent-cs-status--${busy ? "busy" : result ? "ok" : "idle"}`}>
                  {previewStatus}
                </span>
                {result?.downloadUrl ? (
                  <a className="ent-cs-download" href={result.downloadUrl} target="_blank" rel="noreferrer">
                    {tool.downloadLabel}
                  </a>
                ) : (
                  <span className="ent-cs-download is-disabled">{tool.downloadLabel}</span>
                )}
              </div>

              <div className={`ent-cs-preview-stage ent-cs-preview-stage--${tool.kind}`}>
                {busy ? (
                  <div className="ent-cs-preview-loading">
                    <div className="ent-cs-spinner" />
                    <p>{pollStatus || "生成中…"}</p>
                  </div>
                ) : result?.previewUrl && result.kind === "video" ? (
                  <video src={result.previewUrl} controls className="ent-cs-preview-media" />
                ) : result?.previewUrl ? (
                  <img src={result.previewUrl} alt="生成结果" className="ent-cs-preview-media" />
                ) : result?.kind === "video" ? (
                  <div className="ent-cs-video-placeholder">
                    <div className="ent-cs-video-icon">▶</div>
                    <p>{result.previewLabel || "视频预览"}</p>
                    {result.taskId ? <code>{result.taskId}</code> : null}
                  </div>
                ) : (
                  <div className="ent-cs-empty">{tool.emptyPreview}</div>
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="ent-cs-log">
          <button type="button" className="ent-cs-log-toggle" onClick={() => setLogOpen((v) => !v)}>
            {logOpen ? "▼" : "▶"} 执行结果（{logOpen ? "点击收起" : "默认折叠，点击展开"}）
          </button>
          {logOpen ? (
            <pre className="ent-cs-log-body">{result ? JSON.stringify(result.log, null, 2) : "暂无执行记录"}</pre>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
