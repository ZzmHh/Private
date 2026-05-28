import { useEffect, useMemo, useState } from "react";
import {
  createProductOpportunity,
  listProductOpportunities,
  refreshProductOpportunities,
  rescoreProductOpportunity,
} from "../api/productOpportunityApi.js";
import { CsToast } from "../csStudio/CsToast.jsx";
import "../publishStudio/publishStudio.css";
import "./trendStudio.css";

const TARGET_PLATFORMS = [
  { value: "tiktok", label: "TikTok Shop" },
  { value: "shopee", label: "Shopee" },
  { value: "lazada", label: "Lazada" },
  { value: "amazon", label: "Amazon" },
  { value: "walmart", label: "Walmart" },
];

const MARKETS = [
  { value: "TH", label: "泰国" },
  { value: "SG", label: "新加坡" },
  { value: "MY", label: "马来西亚" },
  { value: "ID", label: "印尼" },
  { value: "VN", label: "越南" },
  { value: "PH", label: "菲律宾" },
  { value: "US", label: "美国" },
  { value: "RU", label: "俄罗斯" },
];

function scoreTone(value, inverse = false) {
  const n = Number(value || 0);
  const good = inverse ? n <= 35 : n >= 70;
  const warn = inverse ? n >= 65 : n < 50;
  return good ? "ok" : warn ? "warn" : "mid";
}

function fmtPrice(opportunity) {
  const cny = opportunity.supply?.priceCny ?? opportunity.price?.amount;
  if (cny == null || cny === "") return "待补";
  return `¥${Number(cny).toFixed(2)}`;
}

function sourceLabel(sourcePlatform) {
  const map = {
    "1688": "1688 货源",
    tiktok: "TikTok 趋势",
    tiktok_shop: "TikTok Shop",
    shopee: "Shopee 榜单",
    lazada: "Lazada 榜单",
    amazon: "Amazon 竞品",
    aliexpress: "AliExpress",
    temu: "Temu",
    shop: "自有店铺",
    manual: "手工导入",
  };
  return map[sourcePlatform] || sourcePlatform || "未知来源";
}

function emptyManualForm(targetPlatform, market) {
  return {
    title: "",
    sourcePlatform: "manual",
    sourceUrl: "",
    category: "",
    targetPlatform,
    market,
    priceCny: "",
    trendScore: "65",
    recommendation: "",
  };
}

export function TrendStudioWorkbench() {
  const [targetPlatform, setTargetPlatform] = useState("tiktok");
  const [market, setMarket] = useState("TH");
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState(() => emptyManualForm("tiktok", "TH"));

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) || items[0] || null,
    [items, selectedId],
  );

  async function load() {
    setBusy(true);
    try {
      const next = await listProductOpportunities({ targetPlatform, market, limit: 80 });
      setItems(next);
      setSelectedId((prev) => (next.some((item) => item.id === prev) ? prev : next[0]?.id || ""));
    } catch (err) {
      setToast(err?.message || "加载失败");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    setManual((prev) => ({ ...prev, targetPlatform, market }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPlatform, market]);

  async function handleRefresh() {
    setBusy(true);
    try {
      const data = await refreshProductOpportunities({ targetPlatform, market, limit: 80 });
      setItems(data.opportunities || []);
      setSelectedId(data.opportunities?.[0]?.id || "");
      setToast(`已从采集箱/自有店铺刷新 ${data.imported || 0} 条信号。`);
    } catch (err) {
      setToast(err?.message || "刷新失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleManualSubmit(event) {
    event.preventDefault();
    if (!manual.title.trim()) {
      setToast("请填写商品或机会名称。");
      return;
    }
    setBusy(true);
    try {
      const created = await createProductOpportunity({
        ...manual,
        priceCny: manual.priceCny ? Number(manual.priceCny) : undefined,
        trendSignals: { trendScore: Number(manual.trendScore) || 65 },
      });
      setItems((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      setSelectedId(created.id);
      setManual(emptyManualForm(targetPlatform, market));
      setManualOpen(false);
      setToast("趋势信号已导入选品池。");
    } catch (err) {
      setToast(err?.message || "导入失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleRescore() {
    if (!selected) return;
    setBusy(true);
    try {
      const next = await rescoreProductOpportunity(selected.id, {});
      setItems((prev) => prev.map((item) => (item.id === next.id ? next : item)));
      setToast("已按最新信号重新评分。");
    } catch (err) {
      setToast(err?.message || "评分失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="trend-studio">
      <CsToast message={toast} onClear={() => setToast("")} />

      <section className="trend-hero">
        <div>
          <p className="trend-eyebrow">跨平台爆款选品 Agent</p>
          <h1>统一 1688 货源、自有店铺和榜单趋势，先做可落地的候选池。</h1>
          <p>
            现在先用采集箱和手工/第三方信号跑评分；服务器上线后，TikTok、Shopee、Lazada、Amazon
            等 connector 只需要继续写入这个机会池。
          </p>
        </div>
        <div className="trend-filter-card">
          <label>
            <span>目标平台</span>
            <select value={targetPlatform} onChange={(e) => setTargetPlatform(e.target.value)}>
              {TARGET_PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>目标市场</span>
            <select value={market} onChange={(e) => setMarket(e.target.value)}>
              {MARKETS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="enterprise-btn enterprise-btn-primary" disabled={busy} onClick={handleRefresh}>
            {busy ? "刷新中…" : "从采集箱/店铺刷新"}
          </button>
          <button type="button" className="enterprise-btn enterprise-btn-ghost" onClick={() => setManualOpen((v) => !v)}>
            导入榜单信号
          </button>
        </div>
      </section>

      {manualOpen ? (
        <form className="trend-manual-form" onSubmit={handleManualSubmit}>
          <label>
            <span>商品/机会名称</span>
            <input value={manual.title} onChange={(e) => setManual((p) => ({ ...p, title: e.target.value }))} />
          </label>
          <label>
            <span>来源平台</span>
            <select
              value={manual.sourcePlatform}
              onChange={(e) => setManual((p) => ({ ...p, sourcePlatform: e.target.value }))}
            >
              <option value="manual">手工信号</option>
              <option value="tiktok">TikTok</option>
              <option value="shopee">Shopee</option>
              <option value="lazada">Lazada</option>
              <option value="amazon">Amazon</option>
              <option value="temu">Temu</option>
              <option value="aliexpress">AliExpress</option>
              <option value="1688">1688</option>
            </select>
          </label>
          <label>
            <span>采购价 CNY</span>
            <input value={manual.priceCny} onChange={(e) => setManual((p) => ({ ...p, priceCny: e.target.value }))} />
          </label>
          <label>
            <span>趋势分</span>
            <input value={manual.trendScore} onChange={(e) => setManual((p) => ({ ...p, trendScore: e.target.value }))} />
          </label>
          <label className="trend-form-wide">
            <span>来源链接</span>
            <input value={manual.sourceUrl} onChange={(e) => setManual((p) => ({ ...p, sourceUrl: e.target.value }))} />
          </label>
          <label className="trend-form-wide">
            <span>推荐备注</span>
            <textarea
              rows={2}
              value={manual.recommendation}
              onChange={(e) => setManual((p) => ({ ...p, recommendation: e.target.value }))}
            />
          </label>
          <button type="submit" className="enterprise-btn enterprise-btn-primary" disabled={busy}>
            保存到选品池
          </button>
        </form>
      ) : null}

      <section className="trend-grid">
        <div className="trend-list">
          <div className="trend-list-head">
            <h2>机会清单</h2>
            <span>{items.length} 条</span>
          </div>
          {items.length ? (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`trend-row${selected?.id === item.id ? " is-active" : ""}`}
                onClick={() => setSelectedId(item.id)}
              >
                <span className={`trend-score trend-score--${scoreTone(item.score?.overall)}`}>
                  {item.score?.overall ?? 0}
                </span>
                <span className="trend-row-main">
                  <strong>{item.title}</strong>
                  <small>
                    {sourceLabel(item.sourcePlatform)} · {item.market} · {fmtPrice(item)}
                  </small>
                </span>
              </button>
            ))
          ) : (
            <div className="trend-empty">
              还没有选品机会。先在 1688 页面用插件采集，或点击“导入榜单信号”手工录入一条。
            </div>
          )}
        </div>

        <div className="trend-detail">
          {selected ? (
            <>
              <div className="trend-detail-head">
                <div>
                  <p>{sourceLabel(selected.sourcePlatform)}</p>
                  <h2>{selected.title}</h2>
                </div>
                <button type="button" className="enterprise-btn enterprise-btn-ghost" disabled={busy} onClick={handleRescore}>
                  重新评分
                </button>
              </div>

              <div className="trend-score-grid">
                {[
                  ["综合", selected.score?.overall, false],
                  ["趋势", selected.score?.trend, false],
                  ["供应链", selected.score?.supply, false],
                  ["毛利", selected.score?.margin, false],
                  ["店铺适配", selected.score?.shopFit, false],
                  ["风险", selected.score?.risk, true],
                ].map(([label, value, inverse]) => (
                  <div className="trend-score-card" key={label}>
                    <span>{label}</span>
                    <strong className={`trend-metric--${scoreTone(value, inverse)}`}>{value ?? 0}</strong>
                  </div>
                ))}
              </div>

              <div className="trend-detail-body">
                <div>
                  <h3>推荐判断</h3>
                  <ul>
                    {(selected.reasons || []).map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                  {selected.recommendation ? <p>{selected.recommendation}</p> : null}
                </div>
                <div>
                  <h3>关键数据</h3>
                  <dl className="trend-facts">
                    <dt>目标平台</dt>
                    <dd>{selected.targetPlatform}</dd>
                    <dt>目标市场</dt>
                    <dd>{selected.market}</dd>
                    <dt>采购价</dt>
                    <dd>{fmtPrice(selected)}</dd>
                    <dt>起批量</dt>
                    <dd>{selected.supply?.moq ?? "待补"}</dd>
                    <dt>发货地</dt>
                    <dd>{selected.supply?.shipFrom || "待补"}</dd>
                  </dl>
                </div>
              </div>

              {selected.sourceUrl ? (
                <a className="trend-source-link" href={selected.sourceUrl} target="_blank" rel="noreferrer">
                  打开来源链接
                </a>
              ) : null}
            </>
          ) : (
            <div className="trend-empty">选择一条机会查看评分详情。</div>
          )}
        </div>
      </section>
    </div>
  );
}
