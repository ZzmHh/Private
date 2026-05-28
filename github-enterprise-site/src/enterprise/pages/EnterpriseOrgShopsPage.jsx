import { Fragment, useCallback, useEffect, useState } from "react";
import { EnterpriseBreadcrumbs } from "../layout/EnterpriseBreadcrumbs.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import {
  PLATFORM_OAUTH_SLUG,
  platformUsesApiKeyForm,
  platformUsesOAuth,
} from "../config/platformCatalog.js";
import {
  connectShopApi,
  disconnectShopApi,
  fetchAdminShops,
  startShopOAuth,
  syncAdminShop,
  updateShopGrants,
} from "../api/enterpriseShopsApi.js";
import { EnterpriseAddShopWizard } from "../components/EnterpriseAddShopWizard.jsx";

function connectionLabel(conn) {
  if (!conn || conn.status !== "connected") return { tone: "muted", text: "未绑定" };
  if (conn.lastSyncStatus === "error") return { tone: "warn", text: "同步异常" };
  if (conn.lastSyncStatus === "ok") return { tone: "ok", text: "已绑定 · 已同步" };
  return { tone: "ok", text: "已绑定" };
}

function formatTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

function readOAuthFlash() {
  const params = new URLSearchParams(window.location.search);
  const oauth = params.get("ent_oauth");
  const msg = params.get("ent_msg");
  if (!oauth) return null;
  params.delete("ent_oauth");
  params.delete("ent_msg");
  const nextSearch = params.toString();
  const hash = window.location.hash || "";
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${hash}`;
  window.history.replaceState(null, "", nextUrl);
  return { ok: oauth === "ok", message: msg || (oauth === "ok" ? "店铺授权成功。" : "授权失败。") };
}

export function EnterpriseOrgShopsPage() {
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState(() => readOAuthFlash());
  const [busyShopId, setBusyShopId] = useState("");
  const [expandedShopId, setExpandedShopId] = useState("");
  const [connectShop, setConnectShop] = useState(null);
  const [apiToken, setApiToken] = useState("");
  const [ozonClientId, setOzonClientId] = useState("");
  const [ozonApiKey, setOzonApiKey] = useState("");
  const [showAddShop, setShowAddShop] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminShops();
      setShops(data.shops || []);
      setMembers(data.members || []);
    } catch (err) {
      setError(err?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handlePlatformOAuth(shop) {
    const slug = PLATFORM_OAUTH_SLUG[shop.platform];
    if (!slug) return;
    setBusyShopId(shop.id);
    setError("");
    try {
      const url = await startShopOAuth(shop.id, slug);
      window.location.href = url;
    } catch (err) {
      setError(err?.message || "授权启动失败");
      setBusyShopId("");
    }
  }

  async function handleConnectApi(event) {
    event.preventDefault();
    if (!connectShop) return;
    setBusyShopId(connectShop.id);
    setError("");
    try {
      if (connectShop && platformUsesApiKeyForm(connectShop.platform)) {
        await connectShopApi(connectShop.id, { clientId: ozonClientId, apiKey: ozonApiKey });
      } else {
        await connectShopApi(connectShop.id, { apiToken });
      }
      setConnectShop(null);
      setApiToken("");
      setOzonClientId("");
      setOzonApiKey("");
      await reload();
    } catch (err) {
      setError(err?.message || "绑定失败");
    } finally {
      setBusyShopId("");
    }
  }

  async function handleDisconnect(shopId) {
    if (!window.confirm("确定解除该店铺的 API 绑定？员工将无法同步该店数据。")) return;
    setBusyShopId(shopId);
    setError("");
    try {
      await disconnectShopApi(shopId);
      await reload();
    } catch (err) {
      setError(err?.message || "解除失败");
    } finally {
      setBusyShopId("");
    }
  }

  async function handleSync(shopId) {
    setBusyShopId(shopId);
    setError("");
    try {
      await syncAdminShop(shopId);
      await reload();
    } catch (err) {
      setError(err?.message || "同步失败");
    } finally {
      setBusyShopId("");
    }
  }

  async function toggleMemberGrant(shop, memberId, checked) {
    const current = new Set((shop.members || []).map((m) => m.memberUserId));
    if (checked) current.add(memberId);
    else current.delete(memberId);
    setBusyShopId(shop.id);
    setError("");
    try {
      await updateShopGrants(shop.id, [...current]);
      await reload();
    } catch (err) {
      setError(err?.message || "更新员工授权失败");
    } finally {
      setBusyShopId("");
    }
  }

  return (
    <>
      <EnterpriseBreadcrumbs crumbs={["控制台", "组织", "店铺授权"]} />
      <PageHeader
        title="店铺授权"
        description="在这里绑定各平台店铺 API（网页操作，无需登录服务器）。绑定一次后保存在应用服务器，全体员工选店即可使用。"
        actions={
          <button
            type="button"
            className="enterprise-btn enterprise-btn-primary"
            onClick={() => setShowAddShop(true)}
          >
            连接店铺
          </button>
        }
      />

      <div className="enterprise-panel ent-shop-auth-hero">
        <h3>如何绑定？</h3>
        <ol>
          <li>点击「连接店铺」，按向导选平台、站点并完成授权（或填写 Ozon 密钥）</li>
          <li>OAuth 平台会跳转官方页面，成功后自动回到本页</li>
          <li>绑定后点「同步」拉取商品/订单；在「员工」列勾选子账号可用店铺</li>
        </ol>
      </div>

      {flash ? (
        <div
          className={`enterprise-login-error enterprise-shop-flash ${flash.ok ? "is-ok" : ""}`}
          role="status"
        >
          {flash.message}
        </div>
      ) : null}

      {error ? (
        <div className="enterprise-login-error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="enterprise-panel enterprise-shop-intro">
        <p>
          <strong>组织级绑定：</strong>
          主账号完成 OAuth 或粘贴 API 凭证后，后台按店铺自动同步数据。在下方为子账号勾选可用店铺即可。
        </p>
      </div>

      <div className="enterprise-panel">
        <div className="enterprise-panel-head">
          <h2>已注册店铺</h2>
          <span className="enterprise-tag">{loading ? "加载中…" : `${shops.length} 家`}</span>
        </div>
        <div className="enterprise-panel-body" style={{ padding: 0 }}>
          <table className="enterprise-table enterprise-shop-table">
            <thead>
              <tr>
                <th>店铺</th>
                <th>平台 / 站点</th>
                <th>API 状态</th>
                <th>最近同步</th>
                <th>授权员工</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop) => {
                const conn = shop.connection;
                const status = connectionLabel(conn);
                const expanded = expandedShopId === shop.id;
                return (
                  <Fragment key={shop.id}>
                    <tr>
                      <td>
                        <strong>{shop.shopName}</strong>
                        <div className="enterprise-shop-meta">{shop.externalShopId}</div>
                      </td>
                      <td>
                        {shop.platformLabel}
                        <div className="enterprise-shop-meta">{shop.marketLabel}</div>
                      </td>
                      <td>
                        <span className={`enterprise-shop-status is-${status.tone}`}>{status.text}</span>
                        {conn?.lastSyncError ? (
                          <div className="enterprise-shop-meta is-error">{conn.lastSyncError}</div>
                        ) : null}
                      </td>
                      <td>{formatTime(conn?.lastSyncAt)}</td>
                      <td>{shop.grantCount || 0} 人</td>
                      <td>
                        <div className="enterprise-shop-actions">
                          {platformUsesOAuth(shop.platform) && PLATFORM_OAUTH_SLUG[shop.platform] ? (
                            <button
                              type="button"
                              className="enterprise-btn enterprise-btn-ghost"
                              disabled={busyShopId === shop.id}
                              onClick={() => handlePlatformOAuth(shop)}
                            >
                              {shop.platformLabel || shop.platform} 授权
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="enterprise-btn enterprise-btn-ghost"
                            disabled={busyShopId === shop.id}
                            onClick={() => {
                              setConnectShop(shop);
                              setApiToken("");
                              setOzonClientId("");
                              setOzonApiKey("");
                            }}
                          >
                            {platformUsesApiKeyForm(shop.platform) ? "填写密钥" : "粘贴 API"}
                          </button>
                          {conn?.status === "connected" ? (
                            <>
                              <button
                                type="button"
                                className="enterprise-btn enterprise-btn-ghost"
                                disabled={busyShopId === shop.id}
                                onClick={() => handleSync(shop.id)}
                              >
                                同步
                              </button>
                              <button
                                type="button"
                                className="enterprise-btn enterprise-btn-ghost"
                                disabled={busyShopId === shop.id}
                                onClick={() => handleDisconnect(shop.id)}
                              >
                                解绑
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            className="enterprise-btn enterprise-btn-ghost"
                            onClick={() => setExpandedShopId(expanded ? "" : shop.id)}
                          >
                            {expanded ? "收起" : "员工"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr key={`${shop.id}-grants`} className="enterprise-shop-grants-row">
                        <td colSpan={6}>
                          <div className="enterprise-shop-grants">
                            <strong>子账号可用此店铺</strong>
                            {members.length ? (
                              <ul>
                                {members.map((member) => {
                                  const checked = (shop.members || []).some(
                                    (m) => m.memberUserId === member.id,
                                  );
                                  return (
                                    <li key={member.id}>
                                      <label>
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          disabled={busyShopId === shop.id}
                                          onChange={(e) =>
                                            toggleMemberGrant(shop, member.id, e.target.checked)
                                          }
                                        />
                                        <span>
                                          {member.displayName} ({member.loginName})
                                        </span>
                                      </label>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="enterprise-shop-meta">暂无子账号，可在「子账号」模块创建。</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
              {!loading && !shops.length ? (
                <tr>
                  <td colSpan={6} className="enterprise-shop-empty">
                    暂无店铺，点击「连接店铺」开始配置。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <EnterpriseAddShopWizard
        open={showAddShop}
        onClose={() => setShowAddShop(false)}
        onComplete={reload}
      />

      {connectShop ? (
        <div className="enterprise-modal-backdrop" role="presentation" onClick={() => setConnectShop(null)}>
          <div
            className="enterprise-modal"
            role="dialog"
            aria-labelledby="connect-shop-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="enterprise-modal-head">
              <h2 id="connect-shop-title">绑定 API · {connectShop.shopName}</h2>
              <button type="button" className="enterprise-icon-btn" onClick={() => setConnectShop(null)}>
                ×
              </button>
            </header>
            <form className="enterprise-modal-body" onSubmit={handleConnectApi}>
              <p className="enterprise-shop-meta">
                {platformUsesApiKeyForm(connectShop.platform)
                  ? "在 Ozon Seller 后台创建 Client-Id 与 Api-Key，粘贴后加密保存在服务器，全员复用。"
                  : "粘贴平台 API Token 或 OAuth JSON（推荐用「平台授权」按钮）。凭证加密保存在服务器，全员复用。"}
              </p>
              {platformUsesApiKeyForm(connectShop.platform) ? (
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
              ) : (
                <label className="enterprise-login-field">
                  <span>API 凭证</span>
                  <textarea
                    required
                    rows={6}
                    value={apiToken}
                    placeholder='例如 {"access_token":"...","shop_id":"..."}'
                    onChange={(e) => setApiToken(e.target.value)}
                  />
                </label>
              )}
              <footer className="enterprise-modal-foot">
                <button
                  type="button"
                  className="enterprise-btn enterprise-btn-secondary"
                  onClick={() => setConnectShop(null)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="enterprise-btn enterprise-btn-primary"
                  disabled={busyShopId === connectShop.id}
                >
                  保存并绑定
                </button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
