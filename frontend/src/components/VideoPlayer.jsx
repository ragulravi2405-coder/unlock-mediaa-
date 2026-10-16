import React, { useState } from 'react';
import { Download, ShieldCheck, Copy, Check, Play, Film } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function VideoPlayer({ media, streamUrl, downloadUrl, recoveryCode }) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleCopyCode = () => {
    if (!recoveryCode) return;
    navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    addToast('Recovery code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Recovery Code Banner */}
      {recoveryCode && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-900 block">
                Item Unlocked • Save Your Anonymous Recovery Code
              </span>
              <span className="font-mono font-bold text-sm text-emerald-800 tracking-wider">
                {recoveryCode}
              </span>
            </div>
          </div>
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      )}

      {/* Video Player Container */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl aspect-[16/9] flex items-center justify-center">
        <video
          src={streamUrl}
          controls
          controlsList="nodownload"
          playsInline
          autoPlay
          className="w-full h-full object-contain"
        >
          Your browser does not support HTML5 video playback.
        </video>

        {/* Video format chip */}
        <div className="absolute top-4 left-4 pointer-events-none">
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900/80 backdrop-blur-md text-brand-400 border border-white/10 flex items-center gap-1.5 shadow-md">
            <Film className="w-3.5 h-3.5" />
            4K 60FPS Master • Unrestricted Playback
          </span>
        </div>

        {/* Download original button (if owner allowed) */}
        {media.allowDownload && downloadUrl && (
          <div className="absolute top-4 right-4 z-10">
            <a
              href={downloadUrl}
              download
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-500/25"
              title="Download Master Video Clip"
            >
              <Download className="w-4 h-4" />
              <span>Download Master Video</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
