'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Check, QrCode, Download } from 'lucide-react';
import QRCode from 'qrcode';

interface TouristLinkProps {
  guideSlug: string;
  groupSlug: string;
}

export function TouristLink({ guideSlug, groupSlug }: TouristLinkProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/t/${guideSlug}/${groupSlug}`
    : `/t/${guideSlug}/${groupSlug}`;

  useEffect(() => {
    if (showQR && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
    }
  }, [showQR, url]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `qr-${guideSlug}-${groupSlug}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={url}
          readOnly
          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono truncate"
        />
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={() => setShowQR(!showQR)}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <QrCode size={16} />
        </button>
      </div>

      {showQR && (
        <div className="flex flex-col items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl">
          <canvas ref={canvasRef} />
          <button
            onClick={handleDownloadQR}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            Download QR
          </button>
        </div>
      )}
    </div>
  );
}
