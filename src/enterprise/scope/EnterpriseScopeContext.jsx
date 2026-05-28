import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchScopeOptions,
  readStoredConsoleView,
  readStoredScope,
  resolveWorkbenchScope,
  writeStoredConsoleView,
  writeStoredScope,
} from "./enterpriseScopeApi.js";

const EnterpriseScopeContext = createContext(null);

function pickInitialWorkbenchScope(options, stored) {
  if (!options?.platforms?.length) return null;
  if (stored?.shopId) {
    for (const platform of options.platforms) {
      for (const market of platform.markets) {
        const hit = market.shops.find((s) => s.id === stored.shopId);
        if (hit) {
          return {
            platform: platform.id,
            market: market.id,
            shopId: hit.id,
            shopName: hit.name,
            platformLabel: platform.label,
            marketLabel: market.label,
          };
        }
      }
    }
  }
  return options.defaultScope || null;
}

export function EnterpriseScopeProvider({ children, mode = "workbench", isOwner = false }) {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState(null);
  const [workbenchScope, setWorkbenchScopeState] = useState(null);
  const [consoleView, setConsoleViewState] = useState(() => readStoredConsoleView() || "all");
  const [error, setError] = useState("");

  const apiMode = mode === "console" && isOwner ? "console" : "workbench";

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchScopeOptions(apiMode);
      setOptions(data);
      if (apiMode === "workbench") {
        const initial = pickInitialWorkbenchScope(data, readStoredScope());
        setWorkbenchScopeState(initial);
        if (initial) writeStoredScope(initial);
      } else if (data.defaultConsoleView && !readStoredConsoleView()) {
        setConsoleViewState(data.defaultConsoleView);
      }
    } catch (err) {
      setError(err?.message || "经营范围加载失败");
    } finally {
      setLoading(false);
    }
  }, [apiMode]);

  useEffect(() => {
    reload();
  }, [reload, mode]);

  const setWorkbenchScope = useCallback(async (partial) => {
    const next = { ...workbenchScope, ...partial };
    try {
      const result = await resolveWorkbenchScope({
        platform: next.platform,
        market: next.market,
        shopId: next.shopId,
      });
      setWorkbenchScopeState(result.scope);
      writeStoredScope(result.scope);
    } catch (err) {
      setError(err?.message || "切换店铺失败");
    }
  }, [workbenchScope]);

  const setPlatform = useCallback(
    (platformId) => {
      if (!options?.platforms?.length) return;
      const platform = options.platforms.find((p) => p.id === platformId);
      const market = platform?.markets?.[0];
      const shop = market?.shops?.[0];
      if (!platform || !market || !shop) return;
      setWorkbenchScope({
        platform: platform.id,
        market: market.id,
        shopId: shop.id,
        shopName: shop.name,
        platformLabel: platform.label,
        marketLabel: market.label,
      });
    },
    [options, setWorkbenchScope],
  );

  const setMarket = useCallback(
    (marketId) => {
      if (!workbenchScope?.platform || !options?.platforms?.length) return;
      const platform = options.platforms.find((p) => p.id === workbenchScope.platform);
      const market = platform?.markets?.find((m) => m.id === marketId);
      const shop = market?.shops?.[0];
      if (!market || !shop) return;
      setWorkbenchScope({
        platform: platform.id,
        market: market.id,
        shopId: shop.id,
        shopName: shop.name,
        platformLabel: platform.label,
        marketLabel: market.label,
      });
    },
    [workbenchScope, options, setWorkbenchScope],
  );

  const setShop = useCallback(
    (shopId) => {
      if (!workbenchScope?.platform || !workbenchScope?.market) return;
      setWorkbenchScope({ shopId });
    },
    [workbenchScope, setWorkbenchScope],
  );

  const setConsoleView = useCallback((viewId) => {
    setConsoleViewState(viewId);
    writeStoredConsoleView(viewId);
  }, []);

  const platformOptions = useMemo(() => options?.platforms || [], [options]);
  const marketOptions = useMemo(() => {
    if (!workbenchScope?.platform) return [];
    return platformOptions.find((p) => p.id === workbenchScope.platform)?.markets || [];
  }, [platformOptions, workbenchScope?.platform]);

  const shopOptions = useMemo(() => {
    if (!workbenchScope?.market) return [];
    return marketOptions.find((m) => m.id === workbenchScope.market)?.shops || [];
  }, [marketOptions, workbenchScope?.market]);

  const value = useMemo(
    () => ({
      loading,
      error,
      options,
      workbenchScope,
      consoleView,
      platformOptions,
      marketOptions,
      shopOptions,
      consoleViews: options?.consoleViews || [],
      setPlatform,
      setMarket,
      setShop,
      setConsoleView,
      reload,
    }),
    [
      loading,
      error,
      options,
      workbenchScope,
      consoleView,
      platformOptions,
      marketOptions,
      shopOptions,
      setPlatform,
      setMarket,
      setShop,
      setConsoleView,
      reload,
    ],
  );

  return (
    <EnterpriseScopeContext.Provider value={value}>{children}</EnterpriseScopeContext.Provider>
  );
}

export function useEnterpriseScope() {
  const ctx = useContext(EnterpriseScopeContext);
  if (!ctx) {
    throw new Error("useEnterpriseScope 必须在 EnterpriseScopeProvider 内使用");
  }
  return ctx;
}
