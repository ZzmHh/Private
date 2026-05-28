import { useEffect, useMemo, useState } from "react";
import {
  PLATFORM_CATALOG,
  PLATFORM_OAUTH_SLUG,
  defaultMarketForPlatform,
  marketsForPlatform,
  platformUsesApiKeyForm,
  platformUsesOAuth,
} from "../config/platformCatalog.js";
import {
  connectShopApi,
  createAdminShop,
  startShopOAuth,
} from "../api/enterpriseShopsApi.js";

const STEPS = [
  { id: "platform", label: "选平台" },
  { id: "market", label: "选站点" },
  { id: "connect", label: "连接" },
];

function platformAuthHint(platform) {
  const meta = PLATFORM_CATALOG[platform];
  if (platformUsesApiKeyForm(platform)) {
    return "在 Ozon Seller 后台创建 API 密钥，填写 Client-Id 与 Api-Key 即可完成绑定。";
  }
  if (platformUsesOAuth(platform)) {
    return `将跳转到 ${meta?.label || platform} 官方授权页，授权成功后自动回到本页并完成绑定。`;
  }
  return "粘贴平台 API 凭证 JSON 完成绑定。";
}

/**
 * 一步向导：选平台 → 选站点 → 创建并连接（OAuth 或密钥）
 * 替代「先创建空店铺、再回表格点授权」的两段式流程。
 */
export function EnterpriseAddShopWizard({ open, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState("tiktok");
  const [market, setMarket] = useState(defaultMarketForPlatform("tiktok"));
  const [shopName, setShopName] = useState("");
  const [ozonClientId, setOzonClientId] = useState("");
  const [ozonApiKey, setOzonApiKey] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const platformOptions = useMemo(() => Object.entries(PLATFORM_CATALOG), []);
  const marketOptions = useMemo(() => marketsForPlatform(platform), [platform]);
  const platformMeta = PLATFORM_CATALOG[platform] || {};
  const isOzon = platformUsesApiKeyForm(platform);
  const isOAuth = platformUsesOAuth(platform) && PLATFORM_OAUTH_SLUG[platform];
  const canSubmitOzon = Boolean(shopName.trim() && ozonClientId.trim() && ozonApiKey.trim());
  const canSubmitOAuth = Boolean(shopName.trim());
  const canSubmitPaste = Boolean(shopName.trim() && apiToken.trim());

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setPlatform("tiktok");
    setMarket(defaultMarketForPlatform("tiktok"));
    setShopName("");
    setOzonClientId("");
    setOzonApiKey("");
    setApiToken("");
    setBusy(false);
    setError("");
  }, [open]);

  useEffect(() => {
    const allowed = marketsForPlatform(platform).map((m) => m.value);
    if (!allowed.includes(market)) {
      setMarket(defaultMarketForPlatform(platform));
    }
  }, [platform, market]);

  function pickPlatform(id) {
    setPlatform(id);
    setMarket(defaultMarketForPlatform(id));
    setStep(1);
    setError("");
  }

  function pickMarket(value) {
    setMarket(value);
    setStep(2);
    setError("");
  }

  async function createShopRecord() {
    const name =
      shopName.trim() ||
      `${platformMeta.label || platform} ${marketsForPlatform(platform).find((m) => m.value === market)?.label || market}`;
    const shop = await createAdminShop({
      platform,
      market,
      shopName: name,
    });
    return shop;
  }

  async function handleOzonSubmit(event) {
    event.preventDefault();
    if (!canSubmitOzon) return;
    setBusy(true);
    setError("");
    try {
      const shop = await createShopRecord();
      await connectShopApi(shop.id, { clientId: ozonClientId.trim(), apiKey: ozonApiKey.trim() });
      onComplete?.();
      onClose();
    } catch (err) {
      setError(err?.message || "绑定失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleOAuthSubmit(event) {
    event.preventDefault();
    if (!canSubmitOAuth) return;
    setBusy(true);
    setError("");
    try {
      const shop = await createShopRecord();
      const url = await startShopOAuth(shop.id, PLATFORM_OAUTH_SLUG[platform]);
      window.location.href = url;
    } catch (err) {
      setError(err?.message || "无法发起授权");
      setBusy(false);
    }
  }

  async function handlePasteSubmit(event) {
    event.preventDefault();
    if (!canSubmitPaste) return;
    setBusy(true);
    setError("");
    try {
      const shop = await createShopRecord();
      await connectShopApi(shop.id, { apiToken: apiToken.trim() });
      onComplete?.();
      onClose();
    } catch (err) {
      setError(err?.message || "绑定失败");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const stepId = STEPS[step]?.id;

  return (
    <div className="enterprise-modal-backdrop" role="presentation" onClick={() => !busy && onClose()}>
      <div
        className="enterprise-modal ent-add-shop-wizard"
        role="dialog"
        aria-labelledby="add-shop-wizard-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="enterprise-modal-head">
          <div>
            <h2 id="add-shop-wizard-title">连接店铺</h2>
            <p className="ent-wizard-sub">选择平台并完成授权，一次操作即可供全员使用</p>
          </div>
          <button type="button" className="enterprise-icon-btn" disabled={busy} onClick={onClose}>
            ×
          </button>
        </header>

        <nav className="ent-wizard-steps" aria-label="连接步骤">
          {STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              className={`ent-wizard-step${idx === step ? " is-active" : ""}${idx < step ? " is-done" : ""}`}
              disabled={busy || idx > step}
              onClick={() => idx < step && setStep(idx)}
            >
              <span className="ent-wizard-step-num">{idx + 1}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </nav>

        <div className="enterprise-modal-body ent-wizard-body">
          {error ? (
            <div className="enterprise-login-error" role="alert">
              {error}
            </div>
          ) : null}

          {stepId === "platform" ? (
            <div className="ent-platform-grid">
              {platformOptions.map(([id, meta]) => (
                <button
                  key={id}
                  type="button"
                  className={`ent-platform-card${platform === id ? " is-selected" : ""}`}
                  style={{ "--platform-color": meta.color }}
                  onClick={() => pickPlatform(id)}
                >
                  <span className="ent-platform-dot" aria-hidden />
                  <strong>{meta.label}</strong>
                  <span className="ent-platform-auth">
                    {platformUsesApiKeyForm(id) ? "API 密钥" : "OAuth 授权"}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {stepId === "market" ? (
            <>
              <p className="enterprise-shop-meta">
                已选 <strong>{platformMeta.label}</strong>，请选择该店铺所在站点。
              </p>
              <div className="ent-market-grid">
                {marketOptions.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`ent-market-chip${market === m.value ? " is-selected" : ""}`}
                    onClick={() => pickMarket(m.value)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="ent-wizard-nav">
                <button type="button" className="enterprise-btn enterprise-btn-ghost" onClick={() => setStep(0)}>
                  上一步
                </button>
              </div>
            </>
          ) : null}

          {stepId === "connect" ? (
            <form
              className="ent-wizard-connect-form"
              onSubmit={isOzon ? handleOzonSubmit : isOAuth ? handleOAuthSubmit : handlePasteSubmit}
            >
              <div className="ent-wizard-summary">
                <span className="ent-wizard-badge" style={{ "--platform-color": platformMeta.color }}>
                  {platformMeta.label}
                </span>
                <span className="ent-wizard-badge is-muted">
                  {marketOptions.find((m) => m.value === market)?.label || market}
                </span>
              </div>

              <p className="enterprise-shop-meta">{platformAuthHint(platform)}</p>

              <label className="enterprise-login-field">
                <span>店铺备注名</span>
                <input
                  required
                  value={shopName}
                  placeholder={`例如 ${platformMeta.label} ${marketOptions.find((m) => m.value === market)?.label || ""} · 主店`}
                  onChange={(e) => setShopName(e.target.value)}
                />
              </label>

              {isOzon ? (
                <>
                  <label className="enterprise-login-field">
                    <span>Client-Id</span>
                    <input
                      required
                      value={ozonClientId}
                      placeholder="Ozon Seller API Client-Id"
                      onChange={(e) => setOzonClientId(e.target.value)}
                    />
                  </label>
                  <label className="enterprise-login-field">
                    <span>Api-Key</span>
                    <input
                      required
                      type="password"
                      value={ozonApiKey}
                      placeholder="Ozon Seller API Key"
                      onChange={(e) => setOzonApiKey(e.target.value)}
                    />
                  </label>
                </>
              ) : isOAuth ? null : (
                <label className="enterprise-login-field">
                  <span>API 凭证 JSON</span>
                  <textarea
                    required
                    rows={5}
                    value={apiToken}
                    placeholder='{"access_token":"..."}'
                    onChange={(e) => setApiToken(e.target.value)}
                  />
                </label>
              )}

              <footer className="enterprise-modal-foot ent-wizard-foot">
                <button
                  type="button"
                  className="enterprise-btn enterprise-btn-secondary"
                  disabled={busy}
                  onClick={() => setStep(1)}
                >
                  上一步
                </button>
                <button
                  type="submit"
                  className="enterprise-btn enterprise-btn-primary"
                  disabled={
                    busy ||
                    (isOzon ? !canSubmitOzon : isOAuth ? !canSubmitOAuth : !canSubmitPaste)
                  }
                >
                  {busy
                    ? "处理中…"
                    : isOzon
                      ? "创建并绑定"
                      : isOAuth
                        ? "创建并去授权"
                        : "创建并绑定"}
                </button>
              </footer>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
