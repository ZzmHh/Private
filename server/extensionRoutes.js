/**
 * 凡梦 AI Chrome 插件 API
 */
import { agentSkills, buildAgentMessages } from "./agentSkills.js";
import { generateBuyerReplyText } from "./autoReply/generateBuyerReply.js";
import {
  ensureFeatureAccess,
  finalizeUsageLog,
  incrementUsage,
  saveTask,
} from "./db.js";
import {
  listExtensionSnapshots,
  saveExtensionSnapshot,
  getMergedExtensionContext,
} from "./extensionSync.js";

/**
 * @param {import("express").Express} app
 * @param {{ authMiddleware: Function, apiKey: string, providerName: string, model: string, callChatCompletions: Function }} deps
 */
export function registerExtensionRoutes(app, { authMiddleware, apiKey, providerName, model, callChatCompletions }) {
  app.use("/api/extension", (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (origin.startsWith("chrome-extension://") || origin.startsWith("http://127.0.0.1") || origin.startsWith("http://localhost"))) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  app.get("/api/extension/status", authMiddleware, (req, res) => {
    const platform = String(req.query.platform || "tiktok").toLowerCase();
    const snaps = listExtensionSnapshots(req.user.id, platform, 5);
    res.json({
      ok: true,
      user: { email: req.user.email, name: req.user.name },
      platform,
      snapshotCount: snaps.length,
      latestAt: snaps[0]?.pulledAt || null,
      pageTypes: [...new Set(snaps.map((s) => s.pageType))],
    });
  });

  app.post("/api/extension/snapshot", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      const { platform, pageType, pageUrl, title, data } = req.body || {};
      if (!data || typeof data !== "object") {
        return res.status(400).json({ error: "请提供 data 对象（页面抓取结果）。" });
      }
      const snapshot = saveExtensionSnapshot({
        userId: req.user.id,
        platform: platform || "tiktok",
        pageType: pageType || "unknown",
        pageUrl: pageUrl || "",
        title: title || "",
        data,
      });
      res.json({ ok: true, snapshot: { id: snapshot.id, pulledAt: snapshot.pulledAt, pageType: snapshot.pageType } });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "快照保存失败。" });
    }
  });

  app.post("/api/extension/cs/suggest", authMiddleware, async (req, res) => {
    const startedAt = Date.now();
    let usage;
    try {
      ensureFeatureAccess(req.user, "agent", "service");
      ensureFeatureAccess(req.user, "storeApiAgents");
      const { buyerText, shopName, platform, languageHint, orderContext } = req.body || {};
      if (!buyerText || !String(buyerText).trim()) {
        return res.status(400).json({ error: "请提供 buyerText。" });
      }

      usage = incrementUsage(req.user.id, "service");
      const merged = [
        String(buyerText).trim(),
        orderContext ? `\n\n【页面上下文（插件提供，未核实）】\n${String(orderContext).slice(0, 1500)}` : "",
      ].join("");

      const result = await generateBuyerReplyText({
        buyerText: merged,
        shopName: shopName || "",
        platform: platform || "TikTok Shop",
        languageHint: languageHint || "",
      });

      if (!result.ok) {
        finalizeUsageLog(usage.logId, { type: "service", status: "failed", error: result.error, startedAt });
        return res.status(500).json({ error: result.error });
      }

      finalizeUsageLog(usage.logId, {
        type: "service",
        status: "success",
        inputLength: merged.length,
        outputLength: result.text.length,
        startedAt,
      });

      res.json({
        ok: true,
        text: result.text,
        mode: "buyer-visible-draft",
        hint: "请人工核对后再发送；插件不会自动代发。",
        usage,
      });
    } catch (error) {
      if (usage?.logId) {
        finalizeUsageLog(usage.logId, { type: "service", status: "failed", error: error.message, startedAt });
      }
      res.status(error.status || 500).json({ error: error.message || "话术生成失败。" });
    }
  });

  app.post("/api/extension/analyze", authMiddleware, async (req, res) => {
    const startedAt = Date.now();
    let usage;
    try {
      const { agentId, input, platform, includeSnapshots } = req.body || {};
      const allowed = ["growth", "profit", "service"];
      if (!allowed.includes(agentId)) {
        return res.status(400).json({ error: `agentId 须为 ${allowed.join(" / ")} 之一。` });
      }
      if (!apiKey) {
        return res.status(400).json({ error: `还没有配置 ${providerName} API Key。` });
      }

      ensureFeatureAccess(req.user, "agent", agentId);
      ensureFeatureAccess(req.user, "storeApiAgents");

      usage = incrementUsage(req.user.id, agentId);
      const plat = String(platform || "tiktok").toLowerCase();
      let enrichedInput = typeof input === "string" && input.trim()
        ? input.trim()
        : agentId === "growth"
          ? "基于浏览器插件同步的 TikTok Shop 后台页面数据，做店铺业绩诊断（连接版）：给出 P0/P1 行动与需补充字段。"
          : agentId === "profit"
            ? "基于浏览器插件同步的数据，做广告与库存/利润方向分析；缺 SKU 成本时列待导入字段。"
            : "基于插件提供的上下文，输出客服策略摘要。";

      if (includeSnapshots !== false) {
        const ctx = getMergedExtensionContext(req.user.id, plat, 5);
        if (ctx) {
          enrichedInput = [
            enrichedInput,
            "",
            "## 浏览器插件同步的店铺页面快照（卖家已登录后台；非官方 API，可能不完整）",
            JSON.stringify(ctx, null, 2),
          ].join("\n");
        } else {
          enrichedInput = [
            enrichedInput,
            "",
            "## 浏览器插件快照",
            "当前无已同步页面。请先在 TikTok 卖家中心打开数据/订单/广告页，点击插件「同步本页」。",
          ].join("\n");
        }
      }

      const { response, data, endpoint } = await callChatCompletions({
        model,
        temperature: 0.45,
        max_tokens: usage.maxTokens,
        messages: buildAgentMessages(agentId, enrichedInput),
      });

      if (!response.ok) {
        finalizeUsageLog(usage.logId, {
          type: agentId,
          status: "failed",
          inputLength: enrichedInput.length,
          outputLength: JSON.stringify(data).length,
          error: data?.error?.message || data?.message,
          startedAt,
        });
        return res.status(response.status).json({
          error: data?.error?.message || data?.message || "模型调用失败。",
          endpoint,
        });
      }

      const answer = data?.choices?.[0]?.message?.content || "模型没有返回内容。";
      finalizeUsageLog(usage.logId, {
        type: agentId,
        status: "success",
        inputLength: enrichedInput.length,
        outputLength: answer.length,
        model,
        startedAt,
      });

      const task = saveTask({
        userId: req.user.id,
        type: agentId,
        title: `插件 · ${agentSkills[agentId]?.name || agentId}`,
        input: enrichedInput,
        answer,
        metadata: { source: "extension", usage },
      });

      res.json({ ok: true, agentId, answer, task, usage });
    } catch (error) {
      if (usage?.logId) {
        finalizeUsageLog(usage.logId, { type: req.body?.agentId || "extension", status: "failed", error: error.message, startedAt });
      }
      res.status(error.status || 500).json({ error: error.message || "分析失败。" });
    }
  });
}
