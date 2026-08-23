import { X } from 'lucide-react';

interface QRModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QRModal({ open, onClose }: QRModalProps) {
  if (!open) return null;
  const url = window.location.href.split('?')[0];
  const qrSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(url);

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/70 px-5" onClick={onClose}>
      <div className="bg-[#141416] ring-1 ring-white/10 rounded-2xl p-6 flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="self-end text-white/50 hover:text-white -mt-2 -mr-2" aria-label="Cerrar">
          <X size={18} />
        </button>
        <img src={qrSrc} alt="Código QR del dashboard" className="rounded-lg bg-white p-2" width={220} height={220} />
        <p className="text-xs text-white/40 text-center break-all">{url}</p>
      </div>
    </div>
  );
}
