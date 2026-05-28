const mockHistory = [
  { id: "1", title: "家居收纳类目机会", time: "10:20", agentId: "trend" },
  { id: "2", title: "榨汁杯脚本 ×5", time: "09:05", agentId: "content" },
  { id: "3", title: "主图排版 · 耳机", time: "昨天", agentId: "visual" },
  { id: "4", title: "宠物饮水机 Listing", time: "昨天", agentId: "listing" },
];

export function WorkbenchHistoryRail({ agentId, open, onClose, user }) {
  const items = mockHistory.filter((h) => h.agentId === agentId).slice(0, 8);

  if (!open) return null;

  return (
    <>
      <button type="button" className="ent-wb-history-backdrop" aria-label="关闭历史" onClick={onClose} />
      <aside className="ent-wb-history ent-wb-history--drawer">
        <div className="ent-wb-history-head">
          <h3>历史任务</h3>
          <button type="button" className="ent-wb-history-collapse" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <ul className="ent-wb-history-list">
          {items.length ? (
            items.map((h) => (
              <li key={h.id}>
                <button type="button" className="ent-wb-history-item">
                  <span className="ent-wb-history-title">{h.title}</span>
                  <span className="ent-wb-history-time">{h.time}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="ent-wb-history-empty">暂无</li>
          )}
        </ul>
      </aside>
    </>
  );
}
