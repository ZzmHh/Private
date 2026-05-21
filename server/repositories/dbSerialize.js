/** 串行化 DB 读-改-写，避免 JSON/SQLite 全量快照模式下的并发覆盖 */
let chain = Promise.resolve();

/**
 * @template T
 * @param {() => T | Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withDbLock(fn) {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const prev = chain;
  chain = prev.then(() => gate);
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}
