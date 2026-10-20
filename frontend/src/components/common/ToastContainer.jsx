import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { selectAccentColor } from '../../store/themeSlice';

export default function ToastContainer() {
  const accentColor = useSelector(selectAccentColor);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let timer = null;

    const handleToast = (e) => {
      const detail = e.detail;
      let rawMsg = typeof detail === 'string' ? detail : detail?.message;
      if (typeof rawMsg === 'object' && rawMsg !== null) {
        rawMsg = rawMsg.message || '';
      }
      const message = String(rawMsg || '').trim();
      const type = detail?.type || 'success';

      if (!message) return;

      if (timer) clearTimeout(timer);
      setToast({ message, type });

      timer = setTimeout(() => {
        setToast(null);
      }, 2500);
    };

    window.addEventListener('pulsebeat-toast', handleToast);
    return () => {
      window.removeEventListener('pulsebeat-toast', handleToast);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-3">
      <div
        className="px-5 py-2.5 rounded-full bg-sidebar/95 backdrop-blur-xl border border-brd shadow-2xl flex items-center gap-2.5 text-sm font-semibold text-txt"
        style={{
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        {toast.type === 'error' ? (
          <AlertCircle size={16} className="text-red-500 shrink-0" />
        ) : toast.type === 'info' ? (
          <Info size={16} className="shrink-0" style={{ color: accentColor }} />
        ) : (
          <CheckCircle2 size={16} className="shrink-0" style={{ color: accentColor }} />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
