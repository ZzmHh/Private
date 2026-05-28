export function PageHeader({ title, description, actions = null }) {
  return (
    <header className="enterprise-page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="enterprise-page-actions">{actions}</div> : null}
    </header>
  );
}
