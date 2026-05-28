/** @typedef {{ id: string, path: string, label: string, icon: string }} NavItem */

const iconPaths = {
  "layout-dashboard":
    "M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h5v8H3v-8zm7 3h11v5H10v-5z",
  users: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM6 21v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1",
  shield: "M12 3l8 4v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z",
  store: "M4 10V6l8-3 8 3v4M4 10l8 4 8-4M4 10v10h16V10",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.3-4.3",
  "file-text": "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  image: "M4 5h16v14H4V5zm2 2l4 5 3-4 5 7H6V7z",
  package: "M12 22 2 17V7l10-5 10 5v10l-10 5zm0-11 8-4-8-4-8 4 8 4z",
  boxes: "M12 3 2 8l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  tag: "M20 12V8l-6-6H6a2 2 0 0 0-2 2v8l8 8 8-8zM9 9h.01",
  activity: "M22 12h-4l-3 9-4-18-3 9H2",
  "trending-up": "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  "bar-chart": "M12 20V10M18 20V4M6 20v-4",
  "message-square": "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  "book-open": "M2 4h7v16H2V4zm9 0h11v16H11V4z",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.7 21a2 2 0 0 1-3.4 0",
  workflow: "M6 6h4v4H6V6zm8 0h4v4h-4V6zM6 14h4v4H6v-4zm8 0h4v4h-4v-4z",
  cpu: "M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2M7 7h10v10H7V7z",
  folder: "M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z",
  sparkles: "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z",
  palette: "M12 3a9 9 0 1 0 9 9c0-1.5-1-2-2-2h-1.5a1.5 1.5 0 0 1 0-3H19a2 2 0 0 0 2-2 9 9 0 0 0-7-5z",
  "scroll-text": "M8 2h8v4H8V2zm0 6h8v14l-4-2-4 2V8z",
  menu: "M4 6h16M4 12h16M4 18h16",
  upload: "M12 16V4m0 0-4 4m4-4 4 4M4 20h16",
  chevron: "M15 18l-6-6 6-6",
};

export function EnterpriseIcon({ name, size = 18 }) {
  const d = iconPaths[name] || iconPaths["layout-dashboard"];
  return (
    <svg
      className="enterprise-nav-icon-svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}
