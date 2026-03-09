'use client';

import { useState } from 'react';
import { Copy, CheckCircle, ExternalLink } from 'lucide-react';

interface LinkItem {
  path: string;
  label: string;
  hint?: string;
}

export function TestBotLinks({ items }: { items: LinkItem[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const base = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopy = (path: string) => {
    navigator.clipboard.writeText(`${base}${path}`);
    setCopied(path);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-2">
      {items.map(({ path, label, hint }) => (
        <div key={path} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
          <a
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0"
          >
            <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1">
              {label}
              <ExternalLink size={12} className="text-gray-400 flex-shrink-0" />
            </p>
            <code className="text-xs text-gray-500 truncate block">{path}</code>
            {hint && <p className="text-xs text-primary mt-0.5">{hint}</p>}
          </a>
          <button
            onClick={() => handleCopy(path)}
            className="p-2 text-gray-400 hover:text-primary transition-colors flex-shrink-0"
            title="Copy URL"
          >
            {copied === path ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>
      ))}
    </div>
  );
}
