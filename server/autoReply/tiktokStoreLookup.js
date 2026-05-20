import { readDb } from "../repositories/index.js";
import { parseTikTokShopCredentials } from "../integrations/storeApi/tiktok/tiktokShopConnector.js";

/**
 * 通过 shop_cipher 找到保存了 TikTok 凭据的连接（每个用户一条 storeConnections 记录）
 * @param {string} shopCipher
 */
export function findTikTokConnectionByShopCipher(shopCipher) {
  const needle = String(shopCipher || "").trim();
  if (!needle) return null;

  const db = readDb();
  for (const c of db.storeConnections) {
    if (String(c.platform || "").toLowerCase() !== "tiktok") continue;
    if (!c.apiTokenEncrypted) continue;
    try {
      const raw = Buffer.from(c.apiTokenEncrypted, "base64").toString("utf8");
      const parsed = parseTikTokShopCredentials(raw);
      if (!parsed?.shopCipher) continue;
      if (parsed.shopCipher === needle || decodeURIComponent(parsed.shopCipher) === needle) {
        return { connection: c, parsed };
      }
    } catch {
      continue;
    }
  }
  return null;
}
