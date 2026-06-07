import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import ShareModal from './ShareModal';

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const ClockIcon = ({ color = '#BA7517' }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const PrinterIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
  </svg>
);
const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const WAIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.121 1.524 5.855L.057 23.215a.5.5 0 0 0 .625.601l5.498-1.44A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.936 9.936 0 0 1-5.058-1.378l-.36-.214-3.737.979.999-3.645-.235-.374A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);

export default function QRPoster({ camp, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const posterRef = useRef(null);
  const campUrl = `https://blooddonation.store/camps/${camp.campId || camp._id}`;
  const slotsLeft = (camp.totalSlots || 100) - (camp.registeredCount || 0);

  useEffect(() => {
    QRCode.toDataURL(campUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#1a1a2e', light: '#ffffff' },
      errorCorrectionLevel: 'H'
    }).then(url => setQrDataUrl(url));
  }, [campUrl]);

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
  });

  const formatFullDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3, useCORS: true, backgroundColor: '#ffffff', logging: false
      });
      const link = document.createElement('a');
      link.download = `camp_poster_${camp.campId || camp._id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    if (!posterRef.current) return;
    const canvas = await html2canvas(posterRef.current, {
      scale: 3, useCORS: true, backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/png');
    const pw = window.open('', '_blank');
    pw.document.write(`<!DOCTYPE html><html><head><title>${camp.title} - QR Poster</title>
      <style>*{margin:0;padding:0}body{display:flex;align-items:center;justify-content:center;min-height:100vh}
      img{max-width:400px;width:100%}@media print{img{width:100%;max-width:100%}}</style></head>
      <body><img src="${imgData}"/>
      <script>window.onload=()=>{setTimeout(()=>{window.print()},500)}</script></body></html>`);
    pw.document.close();
  };

  const handleWhatsAppShare = async (phone) => {
    const token = localStorage.getItem('organizer-token');
    const msg =
      '🩸 *Blood Donation Camp!*\n\n' +
      '*' + camp.title + '*\n' +
      '📅 ' + formatDate(camp.date) + '\n' +
      '\u23F0 9:00 AM \u2013 4:00 PM\n' +
      '📍 ' + camp.venue + ', ' + (camp.city || '') + '\n\n' +
      'Register karne ke liye:\n' + campUrl + '\n\n' +
      'Free \u2022 No login needed \u2764\uFE0F\n_Raktdaan_';

    const res = await fetch('/api/wa/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ phone, message: msg })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Message nahi gaya');
  };

  const s = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px'
    },
    modal: {
      background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px',
      overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
      maxHeight: '95vh', display: 'flex', flexDirection: 'column'
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 16px', borderBottom: '0.5px solid #f0f0f0', flexShrink: 0
    },
    scrollArea: { overflowY: 'auto', flex: 1, padding: '16px' }
  };

  return (
    <div style={s.overlay} onClick={handleOverlayClick}>
      <div style={s.modal}>

        {/* ── HEADER ── */}
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, background: '#E24B4A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              🩸
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', margin: 0 }}>Camp QR Poster</p>
              <p style={{ fontSize: 11, color: '#888', margin: 0 }}>Print, download ya WhatsApp pe share karo</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f5f5f5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#555' }}>
            ×
          </button>
        </div>

        {/* ── SCROLL AREA ── */}
        <div style={s.scrollArea}>

          {/* ===== POSTER ===== */}
          <div ref={posterRef} style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', marginBottom: 14 }}>

            {/* POSTER TOP — Red gradient */}
            <div style={{
              background: 'linear-gradient(135deg, #E24B4A, #C23B3A)',
              padding: '16px 16px 14px',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Decorative circles */}
              <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ position: 'absolute', bottom: -20, left: -20, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                {/* Left */}
                <div style={{ flex: 1, marginRight: 12 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 10px', marginBottom: 8 }}>
                    <span style={{ fontSize: 10 }}>🩸</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Blood Donation Camp</span>
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 4px', lineHeight: 1.25 }}>{camp.title}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: 0, fontFamily: 'monospace' }}>#{camp.campId || camp._id}</p>
                </div>
                {/* Right — Slots */}
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 12px', flexShrink: 0 }}>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Slots left</p>
                  <p style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1 }}>{slotsLeft}</p>
                </div>
              </div>
            </div>

            {/* POSTER BODY — White, 2-col grid */}
            <div style={{ background: '#fff', padding: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'start' }}>

                {/* LEFT — Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                  {/* Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, background: '#FCEBEB', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CalendarIcon />
                    </div>
                    <div>
                      <p style={{ fontSize: 9, color: '#aaa', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Date</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{formatDate(camp.date)}</p>
                    </div>
                  </div>

                  {/* Time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, background: '#FAEEDA', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ClockIcon color="#BA7517" />
                    </div>
                    <div>
                      <p style={{ fontSize: 9, color: '#aaa', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Time</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>9:00 AM – 4:00 PM</p>
                    </div>
                  </div>

                  {/* Venue */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ width: 28, height: 28, background: '#E1F5EE', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <MapPinIcon />
                    </div>
                    <div>
                      <p style={{ fontSize: 9, color: '#aaa', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Venue</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', margin: '0 0 1px' }}>{camp.venue}</p>
                      {camp.city && <p style={{ fontSize: 10, color: '#888', margin: 0 }}>{camp.city}</p>}
                    </div>
                  </div>

                  {/* URL box */}
                  <div style={{ background: '#f8f8f8', borderRadius: 6, padding: '6px 8px', marginTop: 2 }}>
                    <p style={{ fontSize: 9, color: '#aaa', margin: 0, wordBreak: 'break-all', lineHeight: 1.4 }}>blooddonation.store/camps/{camp.campId || camp._id}</p>
                  </div>
                </div>

                {/* RIGHT — QR Code */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontSize: 9, color: '#aaa', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', fontWeight: 700, lineHeight: 1.4 }}>Scan to<br />Register</p>

                  <div style={{ background: '#fff', border: '2px solid #E24B4A', borderRadius: 10, padding: 8 }}>
                    {qrDataUrl ? (
                      <img src={qrDataUrl} width="110" height="110" alt="QR Code" style={{ display: 'block' }} />
                    ) : (
                      <div style={{ width: 110, height: 110, background: '#f5f5f5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 24, height: 24, border: '3px solid #ddd', borderTopColor: '#E24B4A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      </div>
                    )}
                  </div>

                  <div style={{ background: '#E24B4A', borderRadius: 6, padding: '4px 12px' }}>
                    <p style={{ fontSize: 10, color: '#fff', fontWeight: 700, margin: 0 }}>FREE</p>
                  </div>
                </div>
              </div>
            </div>

            {/* POSTER FOOTER */}
            <div style={{ background: '#1a1a2e', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>No login needed • Free entry</p>
              <p style={{ fontSize: 10, margin: 0 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Powered by </span>
                <span style={{ color: '#E24B4A', fontWeight: 700 }}>Raktdaan</span>
              </p>
            </div>
          </div>

          {/* ── ACTION BUTTONS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', border: '1px solid #e0e0e0', borderRadius: 10, background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#333' }}>
              <PrinterIcon /> Print
            </button>
            <button onClick={handleDownload} disabled={downloading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', border: '1px solid #e0e0e0', borderRadius: 10, background: '#fff', cursor: downloading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 500, color: '#333', opacity: downloading ? 0.6 : 1 }}>
              <DownloadIcon /> {downloading ? '...' : 'Download'}
            </button>
            <button onClick={() => setShowShareModal(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', border: 'none', borderRadius: 10, background: '#25D366', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#fff' }}>
              <WAIcon /> WhatsApp
            </button>
          </div>

          {/* ── EXPIRY INFO ── */}
          <div style={{ background: '#FAEEDA', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <ClockIcon color="#BA7517" />
            <p style={{ fontSize: 11, color: '#633806', margin: 0, lineHeight: 1.5 }}>
              QR code <strong>{formatFullDate(camp.date)}</strong> tak valid — camp ke baad expire ho jayega
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Share Modal — Baileys ke through */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSend={handleWhatsAppShare}
        title={`Share "${camp.title}" ka QR link`}
      />
    </div>
  );
}
