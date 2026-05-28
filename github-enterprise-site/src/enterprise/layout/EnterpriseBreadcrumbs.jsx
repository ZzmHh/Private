export function EnterpriseBreadcrumbs({ crumbs }) {
  if (!crumbs?.length) return null;
  return (
    <nav className="enterprise-breadcrumbs" aria-label="面包屑">
      {crumbs.map((c, i) => (
        <span key={`${c}-${i}`}>
          {i > 0 ? " / " : ""}
          {c}
        </span>
      ))}
    </nav>
  );
}
