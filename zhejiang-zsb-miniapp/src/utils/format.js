/** 金额：分 → 元字符串 */
export function fenToYuan(fen, digits = 1) {
  if (fen == null) return '0'
  return (fen / 100).toFixed(digits)
}

/** 打卡进度百分比 */
export function checkinPercent(validDays, target = 25) {
  return Math.min(100, Math.round((validDays / target) * 100))
}

/** 延迟模拟网络 */
export function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
