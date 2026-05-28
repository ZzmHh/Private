import { useEffect, useState } from "react";
import { EnterpriseIcon } from "./EnterpriseIcon.jsx";
import { goToShopAuthorization } from "./EnterpriseShopBindPrompt.jsx";
import { fetchAdminShops } from "../api/enterpriseShopsApi.js";

const STEPS = [
  { n: 1, title: "连接店铺", desc: "向导中选平台、站点并完成 OAuth 或填密钥" },
  { n: 2, title: "分配员工", desc: "勾选子账号可用店铺，员工选店即用" },
];

export function EnterpriseShopSetupWizard({ isOwner, onGoBind }) {
  const go = onGoBind || goToShopAuthorization;
  const [stats, setStats] = useState({ shops: 0, bound: 0, loading: true });

  useEffect(() => {
    if (!isOwner) {
      setStats({ shops: 0, bound: 0, loading: false });
      return;
    }
    fetchAdminShops()
      .then((data) => {
        const shops = data.shops || [];
        const bound = shops.filter((s) => s.connection?.status === "connected").length;
        setStats({ shops: shops.length, bound, loading: false });
      })
      .catch(() => setStats({ shops: 0, bound: 0, loading: false }));
  }, [isOwner]);

  if (!isOwner) return null;

  const allBound = stats.shops > 0 && stats.bound === stats.shops;
  const needsSetup = !stats.loading && stats.bound < stats.shops;

  return (
    <section className={`ent-shop-setup${needsSetup ? " ent-shop-setup--action" : allBound ? " ent-shop-setup--done" : ""}`}>
      <div className="ent-shop-setup-head">
        <div>
          <span className="enterprise-tag accent">开店必做</span>
          <h2>店铺 API 绑定（在网页完成，不用登服务器）</h2>
          <p>
            管理员在此绑定一次，凭证加密保存在应用服务器；员工登录后顶栏选店即可，<strong>无需每人再绑</strong>。
          </p>
        </div>
        <div className="ent-shop-setup-stats">
          {stats.loading ? (
            <span>加载中…</span>
          ) : (
            <>
              <div>
                <strong>{stats.shops}</strong>
                <span>已登记店铺</span>
              </div>
              <div>
                <strong>{stats.bound}</strong>
                <span>已绑定 API</span>
              </div>
            </>
          )}
        </div>
      </div>

      <ol className="ent-shop-setup-steps">
        {STEPS.map((step) => (
          <li key={step.n}>
            <span className="ent-shop-setup-num">{step.n}</span>
            <div>
              <strong>{step.title}</strong>
              <span>{step.desc}</span>
            </div>
          </li>
        ))}
      </ol>

      <div className="ent-shop-setup-foot">
        <button type="button" className="enterprise-btn enterprise-btn-primary" onClick={go}>
          <EnterpriseIcon name="store" size={16} />
          打开店铺授权
        </button>
        <code className="ent-shop-setup-path">控制台 → 组织 → 店铺授权</code>
        {needsSetup ? (
          <span className="ent-shop-setup-alert">
            还有 {stats.shops - stats.bound} 家店铺未绑定 API
          </span>
        ) : null}
      </div>
    </section>
  );
}
