import React, { useState } from 'react';
import { Download, Maximize2, ShieldCheck, Copy, Check, Eye } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function PhotoViewer({ media, streamUrl, downloadUrl, recoveryCode }) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { addToast } = useToast();

  const handleCopyCode = () => {
    if (!recoveryCode) return;
    navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    addToast('Recovery code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    const el = document.getElementById('photo-display-container');
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
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

      {/* High-Resolution Photo Viewer Container */}
      <div
        id="photo-display-container"
        className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center min-h-[420px] max-h-[750px]"
      >
        <img
          src={streamUrl}
          alt={media.title}
          className="max-h-[750px] w-auto h-auto object-contain mx-auto select-none"
        />

        {/* Toolbar floating overlay */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md text-white hover:bg-slate-900 transition-colors shadow-lg border border-white/10"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          
          {media.allowDownload && downloadUrl && (
            <a
              href={downloadUrl}
              download
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-500/25"
              title="Download Master Resolution Image"
            >
              <Download className="w-4 h-4" />
              <span>Download Original Master</span>
            </a>
          )}
        </div>

        {/* Unlocked watermark-free indicator */}
        <div className="absolute bottom-4 left-4 pointer-events-none">
          <span className="px-3 py-1 rounded-lg text-[11px] font-bold bg-slate-900/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Original Resolution Master • Protected Stream Active
          </span>
        </div>
      </div>
    </div>
  );
}
