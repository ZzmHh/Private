/**
 * 业绩诊断 / 广告库存利润 · 插件侧就绪检查与引导文案
 */
const FanmengAnalyzeGuide = {
  AGENT_META: {
    growth: {
      label: "业绩诊断",
      webHash: "growth-run",
      needPack: true,
    },
    profit: {
      label: "广告库存利润",
      webHash: "profit-run",
      needPack: false,
    },
  },

  build(agentId, { entitlements, summary, shop, packProgress } = {}) {
    const meta = this.AGENT_META[agentId] || { label: agentId, webHash: `${agentId}-run` };
    const blockers = [];
    const steps = [];
    let ready = false;
    let profitMode = "framework";
    let canOpenWeb = false;

    if (!entitlements?.extensionAllowed) {
      blockers.push(entitlements?.extensionBlockReason || "请先登录并订阅后使用插件。");
      steps.push("打开插件弹窗 → 登录凡梦账号");
      steps.push("在网站完成订阅（成长版及以上含业绩/利润 Agent）");
      return { agentId, meta, ready: false, blockers, steps, canOpenWeb: false };
    }

    const agents = entitlements.agents || [];
    if (!agents.includes(agentId)) {
      blockers.push(
        `当前套餐不含「${meta.label}」（需成长版 / 专业版 / 试用含 6 Agent）。`,
      );
      steps.push("打开网站 → 订阅套餐 → 升级成长版或专业版");
      steps.push("升级后回到卖家中心，用插件同步页面");
      return { agentId, meta, ready: false, blockers, steps, canOpenWeb: true, webAction: "subscription" };
    }

    if (!shop?.id) {
      blockers.push("尚未绑定 TikTok 店铺。");
      steps.push("在卖家中心任意页面点击插件「绑定本页店铺」");
      steps.push("绑定后打开数据/订单/广告/商品页，逐页点「同步本页」");
      return { agentId, meta, ready: false, blockers, steps, canOpenWeb: false };
    }

    const done = summary?.diagnosisPack?.done ?? packProgress?.done ?? 0;
    const total = summary?.diagnosisPack?.total ?? packProgress?.total ?? 4;
    const missingKeys = packProgress?.missing?.length
      ? packProgress.missing
      : ["analytics", "orders", "ads", "inventory"].filter((k) => !summary?.diagnosisPack?.pages?.[k]?.synced);
    const missingLabels = missingKeys.map((k) => FanmengDiagnosisPack.labelForKey(k));

    steps.push("在卖家中心打开下方缺失页面 → 插件点「同步本页」（每类页面各一次）");

    if (agentId === "growth") {
      if (!summary?.growthReady) {
        blockers.push(`诊断包 ${done}/${total}，还缺：${missingLabels.join("、") || "页面数据"}`);
        steps.push("至少同步 2 类：数据概览 / 订单 / 广告 / 库存·商品");
        if (missingLabels.length) {
          steps.push(`建议依次打开：${missingLabels.join(" → ")}`);
        }
        steps.push("同步完成后点「重新检查并打开网站」");
        return { agentId, meta, ready: false, blockers, steps, canOpenWeb: false, missingLabels, packDone: done };
      }
      ready = true;
      steps.length = 0;
      steps.push("诊断包已就绪，将打开网站运行业绩诊断并展示结果。");
      canOpenWeb = true;
      return { agentId, meta, ready, blockers, steps, canOpenWeb, packDone: done };
    }

    if (agentId === "profit") {
      const profit = summary?.profit || {};
      profitMode = profit.canRunPrecise ? "precise" : profit.canRunTrend ? "trend" : "framework";
      if (profit.recommendedActions?.length) {
        for (const a of profit.recommendedActions.slice(0, 4)) {
          steps.push(a.label);
        }
      }
      if (profitMode === "framework") {
        blockers.push("广告/库存页尚未同步，网站将先用「框架模式」分析（精度较低）。");
      } else {
        blockers.push(`将使用「${profit.modeLabel || profitMode}」在网站生成分析。`);
      }
      ready = true;
      canOpenWeb = true;
      steps.push("将打开网站「广告库存利润」工作台输出完整结果。");
      return { agentId, meta, ready, blockers, steps, canOpenWeb, profitMode, packDone: done };
    }

    return { agentId, meta, ready: false, blockers: ["未知分析类型"], steps, canOpenWeb: false };
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengAnalyzeGuide = FanmengAnalyzeGuide;
}
