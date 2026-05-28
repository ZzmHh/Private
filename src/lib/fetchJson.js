/**
 * 安全解析 API JSON，避免空响应时出现 "Unexpected end of JSON input"
 */
export async function fetchJson(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error("无法连接后端。请先运行 npm run dev:server，并确认 .env 里的 PORT 与 Vite 代理一致。");
  }

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `后端返回了无效数据（HTTP ${response.status}）。请确认 npm run dev:server 已启动且无报错。`,
      );
    }
  }

  if (!text && !response.ok) {
    throw new Error(
      `后端无响应（HTTP ${response.status}）。请先运行 npm run dev:server；若 .env 里 PORT 不是 8787，需重启 npm run dev 让代理生效。`,
    );
  }

  if (!response.ok && data?.error === "接口不存在。" && data?.path) {
    data.error = `接口不存在：${data.path}。请确认已运行 npm run dev:server 且后端已重启到最新代码。`;
  }

  return { response, data: data ?? {} };
}
