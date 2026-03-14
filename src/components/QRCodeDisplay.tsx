'use client';

import { QRCodeSVG } from 'qrcode.react';
import { getJoinUrl } from '@/lib/utils';

interface QRCodeDisplayProps {
  sessionCode: string;
  size?: number;
  showUrl?: boolean;
  className?: string;
}

export default function QRCodeDisplay({
  sessionCode,
  size = 200,
  showUrl = true,
  className = '',
}: QRCodeDisplayProps) {
  const url = getJoinUrl(sessionCode);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="rounded-2xl bg-white p-4 shadow-2xl">
        <QRCodeSVG
          value={url}
          size={size}
          level="M"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#1e1b4b"
        />
      </div>
      {showUrl && (
        <div className="text-center">
          <p className="text-sm text-zinc-400 font-mono tracking-wider">
            {url.replace(/^https?:\/\//, '')}
          </p>
          <p className="text-2xl font-black tracking-widest text-white mt-1">
            {sessionCode}
          </p>
        </div>
      )}
    </div>
  );
}
