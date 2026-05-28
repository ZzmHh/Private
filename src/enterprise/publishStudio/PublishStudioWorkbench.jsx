import { useCallback, useEffect, useState } from "react";
import { EnterpriseIcon } from "../components/EnterpriseIcon.jsx";
import { useEnterpriseScope } from "../scope/EnterpriseScopeContext.jsx";
import { CsToast } from "../csStudio/CsToast.jsx";
import {
  PIPELINE_STEPS,
  SOURCE_TABS,
  FULFILLMENT_OPTIONS,
  publishStudio,
  defaultPublishDraft,
} from "./publishStudioConfig.js";
import {
  SEA_MARKET_OPTIONS,
  WORKBENCH_PLATFORM_OPTIONS,
} from "../config/workbenchScopeOptions.js";
import { mockPriceBreakdown } from "./publishStudioMocks.js";
import {
  listCollectItems,
  createCollectItem,
  generateListing,
  listPublishJobs,
  createPublishJob,
  markPublishJobPublished,
  markPublishJobFailed,
} from "../lib/publishApi.js";
import "../creativeStudio/creativeStudio.css";
import "../csStudio/csStudio.css";
import "../opsStudio/opsStudio.css";
import "./publishStudio.css";

const JOB_STATUS_LABEL = {
  ready: "待填表",
  filled: "已填表",
  published: "已上架",
  failed: "失败",
};

function stepIndex(stepId) {
  return PIPELINE_STEPS.findIndex((s) => s.id === stepId);
}

function formatJobDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function ShopScopeChip({ scope, loading }) {
  if (loading) return <span className="ent-publish-scope is-loading">加载店铺…</span>;
  if (!scope?.shopId) {
    return <span className="ent-publish-scope is-warn">请先在顶栏选择目标店铺</span>;
  }
  return (
    <span className="ent-publish-scope is-ok">
      {scope.platformLabel} · {scope.marketLabel} · {scope.shopName}
    </span>
  );
}

function PipelineStepper({ currentStep, completedThrough, onGo }) {
  return (
    <ol className="ent-publish-stepper" aria-label="上架流水线步骤">
      {PIPELINE_STEPS.map((step, idx) => {
        const done = idx <= completedThrough;
        const active = step.id === currentStep;
        return (
          <li
            key={step.id}
            className={`ent-publish-step${active ? " is-active" : ""}${done ? " is-done" : ""}`}
          >
            <button type="button" className="ent-publish-step-btn" onClick={() => onGo(step.id)}>
              <span className="ent-publish-step-num">{step.order}</span>
              <span className="ent-publish-step-label">{step.name}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function OpportunityStep({ draft, selectedItem, onChange, onNext }) {
  return (
    <div className="ent-publish-split">
      <div className="ent-cs-form ent-publish-form">
        {selectedItem ? (
          <div className="ent-publish-import-card">
            <span className="enterprise-tag accent">采集箱商品</span>
            <h3>{selectedItem.title}</h3>
            <p>
              {selectedItem.sourcePlatform} · {selectedItem.sourceUrl?.slice(0, 60)}
              {selectedItem.sourceUrl?.length > 60 ? "…" : ""}
            </p>
            {selectedItem.priceCny != null ? (
              <p className="ent-publish-meta">批发价 ¥{selectedItem.priceCny}</p>
            ) : null}
          </div>
        ) : (
          <p className="ent-cs-form-intro">请先在「货源匹配」步骤从采集箱选择商品，或粘贴链接采集。</p>
        )}

        <label className="ent-cs-field">
          <span className="ent-cs-field-label">机会名称</span>
          <input
            className="ent-cs-control"
            value={draft.opportunityTitle}
            onChange={(e) => onChange({ opportunityTitle: e.target.value })}
          />
        </label>
        <label className="ent-cs-field">
          <span className="ent-cs-field-label">目标市场</span>
          <select
            className="ent-cs-control"
            value={draft.market}
            onChange={(e) => onChange({ market: e.target.value })}
          >
            {SEA_MARKET_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="ent-cs-field">
          <span className="ent-cs-field-label">目标平台</span>
          <select
            className="ent-cs-control"
            value={draft.platform}
            onChange={(e) => onChange({ platform: e.target.value })}
          >
            {WORKBENCH_PLATFORM_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="ent-cs-field">
          <span className="ent-cs-field-label">备注（可选）</span>
          <textarea
            className="ent-cs-control ent-cs-textarea"
            rows={2}
            value={draft.notes}
            placeholder="差异化方向、禁售提醒…"
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </label>
        <button type="button" className="ent-cs-submit" onClick={onNext}>
          确认机会 · 去找货源
        </button>
      </div>

      <div className="ent-cs-preview ent-publish-preview">
        <div className="ent-cs-preview-toolbar">
          <span className={`ent-cs-status ${selectedItem ? "ent-cs-status--ok" : "ent-cs-status--idle"}`}>
            {selectedItem ? "已选采集项" : "未选择"}
          </span>
        </div>
        <div className="ent-cs-preview-stage ent-ops-preview-scroll">
          {selectedItem?.listing ? (
            <div className="ent-publish-card">
              <h4>已有 Listing 草稿</h4>
              <p>{selectedItem.listing.title}</p>
            </div>
          ) : (
            <div className="ent-publish-empty">选择采集项后可在此查看 Listing 预览</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SourceStep({
  draft,
  collectItems,
  loading,
  onRefresh,
  onAddUrl,
  onChange,
  onNext,
  onBack,
  sourceTab,
  onSourceTab,
}) {
  const selected = collectItems.find((s) => s.id === draft.selectedSourceId);
  const filtered =
    sourceTab === "1688"
      ? collectItems.filter((i) => i.sourcePlatform === "1688" || !i.sourcePlatform)
      : collectItems.filter((i) => i.sourcePlatform === sourceTab);

  return (
    <div className="ent-publish-split ent-publish-split--source">
      <div className="ent-cs-form ent-publish-form">
        <div className="ent-publish-source-tabs">
          {SOURCE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`ent-publish-source-tab${sourceTab === tab.id ? " is-active" : ""}`}
              onClick={() => onSourceTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <p className="ent-cs-form-intro">
          从<strong>采集箱</strong>选择货源，或粘贴链接加入采集箱。也可在 1688 页面用企业插件「采集到企业站」。
        </p>

        <label className="ent-cs-field">
          <span className="ent-cs-field-label">粘贴商品链接</span>
          <div className="ent-publish-row-2">
            <input
              className="ent-cs-control"
              value={draft.manualSourceUrl}
              placeholder="https://detail.1688.com/..."
              onChange={(e) => onChange({ manualSourceUrl: e.target.value })}
            />
            <button type="button" className="enterprise-btn enterprise-btn-secondary" onClick={onAddUrl}>
              加入采集箱
            </button>
          </div>
        </label>

        <button type="button" className="enterprise-btn enterprise-btn-ghost" onClick={onRefresh} disabled={loading}>
          {loading ? "刷新中…" : "刷新采集箱"}
        </button>

        <div className="ent-publish-source-list">
          {filtered.length === 0 ? (
            <div className="ent-publish-empty">采集箱为空 — 粘贴链接或插件采集</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`ent-publish-source-card${draft.selectedSourceId === item.id ? " is-selected" : ""}`}
                onClick={() =>
                  onChange({
                    selectedSourceId: item.id,
                    opportunityTitle: item.title,
                  })
                }
              >
                <span className="ent-publish-source-thumb">{item.images?.[0] ? "🖼" : "📦"}</span>
                <div className="ent-publish-source-body">
                  <strong>{item.title}</strong>
                  <span>
                    {item.priceCny != null ? `¥${item.priceCny}` : "价格待补"}
                    {item.moq != null ? ` · MOQ ${item.moq}` : ""}
                    {item.shipFrom ? ` · ${item.shipFrom}` : ""}
                  </span>
                  <div className="ent-publish-tags">
                    <span className="ent-publish-tag">{item.sourcePlatform || "1688"}</span>
                    {item.status === "listed" ? <span className="ent-publish-tag is-score">已有 Listing</span> : null}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="ent-publish-nav-row">
          <button type="button" className="enterprise-btn enterprise-btn-ghost" onClick={onBack}>
            上一步
          </button>
          <button
            type="button"
            className="ent-cs-submit ent-publish-nav-primary"
            disabled={!draft.selectedSourceId}
            onClick={onNext}
          >
            确认货源 · 生成 Listing
          </button>
        </div>
      </div>

      <div className="ent-cs-preview ent-publish-preview">
        <div className="ent-cs-preview-toolbar">
          <span className={`ent-cs-status ${selected ? "ent-cs-status--ok" : "ent-cs-status--idle"}`}>
            {selected ? "已选货源" : "未选择"}
          </span>
        </div>
        <div className="ent-cs-preview-stage ent-ops-preview-scroll">
          {selected ? (
            <>
              <div className="ent-publish-card">
                <h4>供货摘要</h4>
                <dl className="ent-publish-dl">
                  <dt>批发价</dt>
                  <dd>{selected.priceCny != null ? `¥${selected.priceCny}` : "—"}</dd>
                  <dt>起订量</dt>
                  <dd>{selected.moq != null ? `${selected.moq} 件` : "—"}</dd>
                  <dt>发货地</dt>
                  <dd>{selected.shipFrom || "—"}</dd>
                  <dt>来源</dt>
                  <dd>
                    <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
                      打开链接
                    </a>
                  </dd>
                </dl>
              </div>
              {selected.priceCny != null ? (
                <div className="ent-publish-card">
                  <h4>粗略毛利测算</h4>
                  {(() => {
                    const p = mockPriceBreakdown(selected.priceCny);
                    return (
                      <dl className="ent-publish-dl">
                        <dt>建议泰铢售价</dt>
                        <dd>≈ ฿{p.suggestedThb}</dd>
                        <dt>含佣金+物流+35%毛利</dt>
                        <dd>
                          汇率 {p.rate} · 国际段 ¥{p.intlShip}
                        </dd>
                      </dl>
                    );
                  })()}
                </div>
              ) : null}
            </>
          ) : (
            <div className="ent-publish-empty">← 左侧选择采集项，或粘贴链接加入采集箱</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListingStep({ listingPreview, onNext, onBack, busy, onGenerate, listingReady }) {
  return (
    <div className="ent-publish-split">
      <div className="ent-cs-form ent-publish-form">
        <p className="ent-cs-form-intro">
          基于<strong>当前店铺</strong>平台规则生成 Listing；主图可跳转「图文美化」微调。
        </p>
        <label className="ent-cs-field">
          <span className="ent-cs-field-label">文案语言</span>
          <select className="ent-cs-control" defaultValue="th-en">
            <option value="th-en">泰语 + 英语（TikTok TH）</option>
            <option value="en">英语</option>
            <option value="zh">中文草稿</option>
          </select>
        </label>
        <button type="button" className="ent-cs-submit" disabled={busy} onClick={onGenerate}>
          {busy ? "生成中…" : "AI 生成 Listing 方案"}
        </button>
        <div className="ent-publish-nav-row">
          <button type="button" className="enterprise-btn enterprise-btn-ghost" onClick={onBack}>
            上一步
          </button>
          <button
            type="button"
            className="enterprise-btn enterprise-btn-primary"
            disabled={!listingReady}
            onClick={onNext}
          >
            进入审核定价
          </button>
        </div>
      </div>

      <div className="ent-cs-preview ent-publish-preview">
        <div className="ent-cs-preview-toolbar">
          <span className={`ent-cs-status ${listingReady ? "ent-cs-status--ok" : "ent-cs-status--idle"}`}>
            {listingReady ? "Listing 已生成" : "等待生成"}
          </span>
        </div>
        <div className="ent-cs-preview-stage ent-ops-preview-scroll">
          {listingReady && listingPreview ? (
            <>
              <div className="ent-publish-listing-title">{listingPreview.title}</div>
              <ul className="ent-wb-listing-bullets">
                {(listingPreview.bullets || []).map((b) => (
                  <li key={b.slice(0, 24)}>{b}</li>
                ))}
              </ul>
              {listingPreview.keywords ? (
                <p className="ent-publish-meta">关键词：{listingPreview.keywords}</p>
              ) : null}
              {listingPreview.categoryHint ? (
                <p className="ent-publish-meta">类目建议：{listingPreview.categoryHint}</p>
              ) : null}
            </>
          ) : (
            <div className="ent-publish-empty">点击左侧生成 Listing 预览</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ draft, selectedItem, onChange, onNext, onBack }) {
  const price = mockPriceBreakdown(selectedItem?.priceCny || 18.5);
  const allChecked = Object.values(draft.compliance).every(Boolean);

  function toggleCompliance(key) {
    onChange({
      compliance: { ...draft.compliance, [key]: !draft.compliance[key] },
    });
  }

  return (
    <div className="ent-publish-split">
      <div className="ent-cs-form ent-publish-form">
        <label className="ent-cs-field">
          <span className="ent-cs-field-label">售价（泰铢）</span>
          <input
            className="ent-cs-control"
            value={draft.salePrice || price.suggestedThb}
            onChange={(e) => onChange({ salePrice: e.target.value })}
          />
        </label>
        <label className="ent-cs-field">
          <span className="ent-cs-field-label">库存</span>
          <input
            className="ent-cs-control"
            value={draft.stock}
            onChange={(e) => onChange({ stock: e.target.value })}
          />
        </label>
        <label className="ent-cs-field">
          <span className="ent-cs-field-label">履约方式</span>
          <select
            className="ent-cs-control"
            value={draft.fulfillment}
            onChange={(e) => onChange({ fulfillment: e.target.value })}
          >
            {FULFILLMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <div className="ent-publish-card">
          <h4>发布前确认（必勾）</h4>
          <ul className="ent-publish-compliance">
            {[
              ["noBrand", "标题/主图无未授权品牌"],
              ["categoryOk", "类目与属性符合平台要求"],
              ["imagesOk", "主图尺寸与语言已本地化"],
              ["priceOk", "售价覆盖成本、佣金与物流"],
            ].map(([key, label]) => (
              <li key={key}>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.compliance[key]}
                    onChange={() => toggleCompliance(key)}
                  />
                  {label}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="ent-publish-nav-row">
          <button type="button" className="enterprise-btn enterprise-btn-ghost" onClick={onBack}>
            上一步
          </button>
          <button
            type="button"
            className="ent-cs-submit ent-publish-nav-primary"
            disabled={!allChecked}
            onClick={onNext}
          >
            确认审核 · 准备发布
          </button>
        </div>
      </div>

      <div className="ent-cs-preview ent-publish-preview">
        <div className="ent-cs-preview-toolbar">
          <span className={`ent-cs-status ${allChecked ? "ent-cs-status--ok" : "ent-cs-status--busy"}`}>
            {allChecked ? "可发布" : "待确认"}
          </span>
        </div>
        <div className="ent-cs-preview-stage ent-ops-preview-scroll">
          <div className="ent-publish-card">
            <h4>定价拆解</h4>
            <dl className="ent-publish-dl">
              <dt>1688 拿货</dt>
              <dd>¥{price.sourceCny}</dd>
              <dt>建议售价</dt>
              <dd>฿{draft.salePrice || price.suggestedThb}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function PublishStep({
  draft,
  onBack,
  publishing,
  published,
  onPublish,
  publishJobs,
  lastJob,
  onMarkPublished,
  onMarkFailed,
  scope,
}) {
  return (
    <div className="ent-publish-split ent-publish-split--single">
      <div className="ent-publish-publish-pane">
        {!published ? (
          <>
            <div className="ent-publish-summary">
              <h3>{draft.opportunityTitle}</h3>
              <p>
                将创建发布任务到 {scope?.shopName || "当前店铺"} · 库存 {draft.stock}
              </p>
            </div>
            <p className="ent-publish-meta">
              提交后请打开 TikTok 卖家中心「新建商品」页，用企业插件「填入上架包」半自动填表，确认后点发布。
            </p>
            <div className="ent-publish-nav-row ent-publish-nav-row--center">
              <button type="button" className="enterprise-btn enterprise-btn-ghost" onClick={onBack}>
                返回修改
              </button>
              <button
                type="button"
                className="enterprise-btn enterprise-btn-primary ent-publish-publish-btn"
                disabled={publishing}
                onClick={onPublish}
              >
                {publishing ? "创建任务中…" : "创建发布任务"}
              </button>
            </div>
          </>
        ) : (
          <div className="ent-publish-success">
            <span className="ent-publish-success-icon">✓</span>
            <h3>发布任务已创建</h3>
            {lastJob ? (
              <>
                <p>
                  任务 ID：<code>{lastJob.id}</code>
                </p>
                <p className="ent-publish-meta">
                  状态：{JOB_STATUS_LABEL[lastJob.status] || lastJob.status}。在插件弹窗可填入此 ID，或在 TikTok 新建商品页点「填入上架包」。
                </p>
              </>
            ) : null}
            <div className="ent-publish-nav-row ent-publish-nav-row--center">
              <button type="button" className="enterprise-btn enterprise-btn-secondary" onClick={onMarkPublished}>
                我已在卖家中心点发布
              </button>
              <button type="button" className="enterprise-btn enterprise-btn-ghost" onClick={onMarkFailed}>
                标记失败
              </button>
            </div>
          </div>
        )}

        <div className="ent-publish-jobs">
          <h4>最近上架任务</h4>
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>商品</th>
                <th>任务 ID</th>
                <th>状态</th>
                <th>更新</th>
              </tr>
            </thead>
            <tbody>
              {publishJobs.length === 0 ? (
                <tr>
                  <td colSpan={4}>暂无任务</td>
                </tr>
              ) : (
                publishJobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.title}</td>
                    <td>
                      <code>{job.id.slice(0, 8)}</code>
                    </td>
                    <td>
                      <span className={`ent-publish-job-status is-${job.status}`}>
                        {JOB_STATUS_LABEL[job.status] || job.status}
                      </span>
                      {job.error ? <div className="ent-publish-meta">{job.error}</div> : null}
                    </td>
                    <td>{formatJobDate(job.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function PublishStudioWorkbench({ user }) {
  const scopeCtx = useEnterpriseScope();
  const scope = scopeCtx.workbenchScope;
  const [step, setStep] = useState("source");
  const [completedThrough, setCompletedThrough] = useState(-1);
  const [draft, setDraft] = useState(defaultPublishDraft);
  const [sourceTab, setSourceTab] = useState("1688");
  const [listingPreview, setListingPreview] = useState(null);
  const [listingBusy, setListingBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [lastJob, setLastJob] = useState(null);
  const [toast, setToast] = useState("");
  const [viewJobs, setViewJobs] = useState(false);
  const [collectItems, setCollectItems] = useState([]);
  const [collectLoading, setCollectLoading] = useState(false);
  const [publishJobs, setPublishJobs] = useState([]);

  const userLabel = user?.displayName || user?.name || user?.loginName || "用户";
  const currentStepMeta = PIPELINE_STEPS.find((s) => s.id === step);
  const selectedItem = collectItems.find((i) => i.id === draft.selectedSourceId) || null;

  const refreshCollect = useCallback(async () => {
    setCollectLoading(true);
    try {
      const items = await listCollectItems();
      setCollectItems(items);
    } catch (err) {
      setToast(err.message || "加载采集箱失败");
    } finally {
      setCollectLoading(false);
    }
  }, []);

  const refreshJobs = useCallback(async () => {
    if (!scope?.shopId) return;
    try {
      const jobs = await listPublishJobs(scope.shopId);
      setPublishJobs(jobs);
    } catch {
      /* ignore on load */
    }
  }, [scope?.shopId]);

  useEffect(() => {
    refreshCollect();
  }, [refreshCollect]);

  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  useEffect(() => {
    if (selectedItem?.listing) {
      setListingPreview(selectedItem.listing);
    }
  }, [selectedItem?.id, selectedItem?.listing]);

  function patchDraft(partial) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function goStep(nextId) {
    const nextIdx = stepIndex(nextId);
    setCompletedThrough((prev) => Math.max(prev, nextIdx - 1));
    setStep(nextId);
  }

  async function handleAddUrl() {
    const url = draft.manualSourceUrl.trim();
    if (!url) {
      setToast("请粘贴商品链接。");
      return;
    }
    try {
      const item = await createCollectItem({
        sourceUrl: url,
        sourcePlatform: sourceTab,
        title: draft.opportunityTitle || "待完善标题",
      });
      setCollectItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
      patchDraft({ selectedSourceId: item.id, manualSourceUrl: "" });
      setToast("已加入采集箱");
    } catch (err) {
      setToast(err.message || "采集失败");
    }
  }

  function nextFromOpportunity() {
    goStep("source");
  }

  function nextFromSource() {
    if (!draft.selectedSourceId) {
      setToast("请从采集箱选择一条货源。");
      return;
    }
    goStep("listing");
  }

  async function generateListingHandler() {
    if (!draft.selectedSourceId) {
      setToast("请先选择采集项。");
      return;
    }
    setListingBusy(true);
    try {
      const data = await generateListing(draft.selectedSourceId, {
        market: draft.market,
        language: "th-en",
      });
      setListingPreview(data.listing || data.item?.listing);
      setCollectItems((prev) =>
        prev.map((i) => (i.id === data.item?.id ? data.item : i)),
      );
      setToast("Listing 已生成");
    } catch (err) {
      setToast(err.message || "生成失败");
    } finally {
      setListingBusy(false);
    }
  }

  async function handlePublish() {
    if (!scope?.shopId) {
      setToast("请先选择目标店铺。");
      return;
    }
    if (!draft.selectedSourceId) {
      setToast("请先选择采集项。");
      return;
    }
    setPublishing(true);
    try {
      const job = await createPublishJob(
        {
          collectItemId: draft.selectedSourceId,
          salePrice: draft.salePrice,
          stock: draft.stock,
          fulfillment: draft.fulfillment,
          listing: listingPreview,
        },
        scope.shopId,
      );
      setLastJob(job);
      setPublished(true);
      setCompletedThrough(PIPELINE_STEPS.length - 1);
      await refreshJobs();
      setToast("发布任务已创建");
    } catch (err) {
      setToast(err.message || "创建任务失败");
    } finally {
      setPublishing(false);
    }
  }

  async function handleMarkPublished() {
    if (!lastJob?.id) return;
    try {
      const job = await markPublishJobPublished(lastJob.id);
      setLastJob(job);
      await refreshJobs();
      setToast("已标记为已上架");
    } catch (err) {
      setToast(err.message || "更新失败");
    }
  }

  async function handleMarkFailed() {
    if (!lastJob?.id) return;
    const reason = window.prompt("请输入失败原因", "平台页面校验未通过");
    if (reason == null) return;
    try {
      const job = await markPublishJobFailed(lastJob.id, reason);
      setLastJob(job);
      await refreshJobs();
      setToast("已标记为失败");
    } catch (err) {
      setToast(err.message || "更新失败");
    }
  }

  const mainContent = (() => {
    if (viewJobs) {
      return (
        <PublishStep
          draft={draft}
          onBack={() => setViewJobs(false)}
          publishing={false}
          published={false}
          onPublish={() => {}}
          publishJobs={publishJobs}
          lastJob={null}
          onMarkPublished={() => {}}
          onMarkFailed={() => {}}
          scope={scope}
        />
      );
    }
    switch (step) {
      case "opportunity":
        return (
          <OpportunityStep
            draft={draft}
            selectedItem={selectedItem}
            onChange={patchDraft}
            onNext={nextFromOpportunity}
          />
        );
      case "source":
        return (
          <SourceStep
            draft={draft}
            collectItems={collectItems}
            loading={collectLoading}
            onRefresh={refreshCollect}
            onAddUrl={handleAddUrl}
            onChange={patchDraft}
            onNext={nextFromSource}
            onBack={() => goStep("opportunity")}
            sourceTab={sourceTab}
            onSourceTab={setSourceTab}
          />
        );
      case "listing":
        return (
          <ListingStep
            listingPreview={listingPreview}
            onNext={() => goStep("review")}
            onBack={() => goStep("source")}
            busy={listingBusy}
            onGenerate={generateListingHandler}
            listingReady={Boolean(listingPreview?.title)}
          />
        );
      case "review":
        return (
          <ReviewStep
            draft={draft}
            selectedItem={selectedItem}
            onChange={patchDraft}
            onNext={() => goStep("publish")}
            onBack={() => goStep("listing")}
          />
        );
      case "publish":
        return (
          <PublishStep
            draft={draft}
            onBack={() => goStep("review")}
            publishing={publishing}
            published={published}
            onPublish={handlePublish}
            publishJobs={publishJobs}
            lastJob={lastJob}
            onMarkPublished={handleMarkPublished}
            onMarkFailed={handleMarkFailed}
            scope={scope}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <div className="ent-cs-root ent-ops-root ent-publish-root">
      <aside className="ent-cs-sidebar">
        <div className="ent-cs-brand">
          <span className="ent-cs-brand-mark ent-ops-brand-mark ent-ops-brand-mark--publish">PB</span>
          <div>
            <strong>{publishStudio.brandTitle}</strong>
            <small>{publishStudio.brandSubtitle}</small>
          </div>
        </div>

        <nav className="ent-cs-nav" aria-label="上架流水线">
          <div className="ent-cs-nav-group">
            <div className="ent-cs-nav-group-head ent-publish-nav-static">
              <span>上架流水线</span>
            </div>
            {PIPELINE_STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`ent-cs-nav-item ent-publish-nav-item${s.id === step && !viewJobs ? " is-active" : ""}`}
                onClick={() => {
                  setViewJobs(false);
                  goStep(s.id);
                }}
              >
                <strong>
                  <EnterpriseIcon name={s.icon} size={14} /> {s.order}. {s.name}
                </strong>
                <span>{s.desc}</span>
              </button>
            ))}
          </div>
          <div className="ent-cs-nav-group">
            <button
              type="button"
              className={`ent-cs-nav-item ent-publish-nav-item${viewJobs ? " is-active" : ""}`}
              onClick={() => setViewJobs(true)}
            >
              <strong>
                <EnterpriseIcon name="folder" size={14} /> 任务队列
              </strong>
              <span>历史上架与失败重试</span>
            </button>
          </div>
        </nav>
      </aside>

      <div className="ent-cs-main">
        <header className="ent-cs-header ent-publish-header">
          <div>
            <h1>{viewJobs ? "上架任务队列" : currentStepMeta?.name}</h1>
            <p className="ent-cs-header-intro">{publishStudio.intro}</p>
            <ShopScopeChip scope={scope} loading={scopeCtx.loading} />
          </div>
          <div className="ent-cs-header-user">
            <span className="ent-cs-user-avatar">{userLabel.slice(0, 1)}</span>
            <span>{userLabel}</span>
          </div>
        </header>

        {!viewJobs ? (
          <PipelineStepper currentStep={step} completedThrough={completedThrough} onGo={goStep} />
        ) : null}

        <section className="ent-cs-panel ent-publish-panel">
          <CsToast message={toast} onClear={() => setToast("")} />
          {mainContent}
        </section>
      </div>
    </div>
  );
}
