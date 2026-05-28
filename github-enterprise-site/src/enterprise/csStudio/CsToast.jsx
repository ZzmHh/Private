import { useEffect } from "react";

export function CsToast({ message, onClear }) {
  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => onClear?.(), 3200);
    return () => clearTimeout(t);
  }, [message, onClear]);

  if (!message) return null;
  return (
    <div className="ent-cs-toast" role="status">
      {message}
    </div>
  );
}
