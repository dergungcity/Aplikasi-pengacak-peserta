import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  Smartphone, 
  Laptop, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  Key, 
  DownloadCloud, 
  Search, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  Share2,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { Tournament } from '../types';
import { fetchTournamentByCode, fetchTournamentById, searchTournamentsInCloud } from '../lib/firebase';

interface CrossDeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTournament: Tournament | null;
  onSelectTournament: (tournament: Tournament) => void;
}

export const CrossDeviceSyncModal: React.FC<CrossDeviceSyncModalProps> = ({
  isOpen,
  onClose,
  currentTournament,
  onSelectTournament
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'open' | 'search'>('share');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // State for opening by code/link
  const [inputCode, setInputCode] = useState('');
  const [isLoadingOpen, setIsLoadingOpen] = useState(false);
  const [openStatusMessage, setOpenStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State for cloud search
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Tournament[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  // Build the direct cross-device link
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const syncCode = currentTournament?.shareCode || currentTournament?.id || '';
  const directShareUrl = currentTournament 
    ? `${currentOrigin}${currentPath}?code=${encodeURIComponent(syncCode)}`
    : '';

  const handleCopyLink = () => {
    if (!directShareUrl) return;
    navigator.clipboard.writeText(directShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!syncCode) return;
    navigator.clipboard.writeText(syncCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleOpenFromCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim();
    if (!clean) {
      setOpenStatusMessage({ type: 'error', text: 'Harap masukkan Kode Lomba atau Link Turnamen.' });
      return;
    }

    setIsLoadingOpen(true);
    setOpenStatusMessage(null);

    try {
      // Extract code if user pasted a full URL
      let codeToSearch = clean;
      if (clean.includes('?code=') || clean.includes('&code=')) {
        try {
          const url = new URL(clean);
          codeToSearch = url.searchParams.get('code') || codeToSearch;
        } catch {
          const match = clean.match(/[?&]code=([^&]+)/);
          if (match) codeToSearch = decodeURIComponent(match[1]);
        }
      } else if (clean.includes('?t=') || clean.includes('&t=')) {
        try {
          const url = new URL(clean);
          codeToSearch = url.searchParams.get('t') || codeToSearch;
        } catch {
          const match = clean.match(/[?&]t=([^&]+)/);
          if (match) codeToSearch = decodeURIComponent(match[1]);
        }
      }

      const tournament = await fetchTournamentByCode(codeToSearch);
      if (tournament) {
        setOpenStatusMessage({
          type: 'success',
          text: `Berhasil menemukan lomba: "${tournament.name}". Sedang memuat...`
        });
        setTimeout(() => {
          onSelectTournament(tournament);
          onClose();
        }, 600);
      } else {
        setOpenStatusMessage({
          type: 'error',
          text: `Lomba dengan kode/link "${clean}" tidak ditemukan di cloud. Pastikan kode sudah benar.`
        });
      }
    } catch (err: any) {
      setOpenStatusMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan saat memuat lomba dari cloud.'
      });
    } finally {
      setIsLoadingOpen(false);
    }
  };

  const handleCloudSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchTournamentsInCloud(searchTerm.trim());
      setSearchResults(results);
    } catch (e) {
      console.warn('Search error:', e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4 bg-gradient-to-r from-indigo-50/50 via-white to-blue-50/40 dark:from-slate-900 dark:to-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                <span>Sinkronisasi & Buka di HP / Laptop Lain</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lanjutkan undian, input skor juri, dan bagan turnamen di perangkat apa pun secara live
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-5 pt-2 gap-2">
          <button
            id="tab-sync-share"
            type="button"
            onClick={() => setActiveTab('share')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'share'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Bagikan ke HP / Laptop ({syncCode || 'Aktif'})</span>
          </button>

          <button
            id="tab-sync-open"
            type="button"
            onClick={() => setActiveTab('open')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'open'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <DownloadCloud className="h-3.5 w-3.5" />
            <span>Buka Kode dari Perangkat Lain</span>
          </button>

          <button
            id="tab-sync-search"
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Cari di Cloud</span>
          </button>
        </div>

        {/* Tab 1: Share Current Tournament to Mobile / Other Laptop */}
        {activeTab === 'share' && (
          <div className="p-5 space-y-4">
            {currentTournament ? (
              <>
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Lomba Aktif</span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{currentTournament.name}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {currentTournament.participants.length} Peserta • {currentTournament.rounds.length} Babak/Sesi
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kode Akses</span>
                      <div className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                        {syncCode}
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code & Scan Option */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 text-center">
                    <div className="bg-white p-2.5 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-700 inline-block mb-2">
                      <QRCodeSVG
                        value={directShareUrl}
                        size={130}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Scan dengan Kamera HP
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Langsung terbuka di browser smartphone Anda
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Share Code Copy */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                        Kode Lomba Singkat
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={syncCode}
                          className="flex-1 rounded-xl border border-slate-300 bg-slate-100 py-2 px-3 text-xs font-mono font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <button
                          id="btn-copy-sync-code"
                          type="button"
                          onClick={handleCopyCode}
                          className="flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white px-3 py-2 text-xs font-bold text-white dark:text-slate-900 hover:opacity-90 transition-all cursor-pointer shrink-0"
                        >
                          {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedCode ? 'Disalin!' : 'Salin Kode'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Direct URL Copy */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                        Link Langsung (URL Lengkap)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={directShareUrl}
                          className="flex-1 rounded-xl border border-slate-300 bg-slate-100 py-2 px-3 text-[11px] text-slate-600 truncate dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        />
                        <button
                          id="btn-copy-sync-url"
                          type="button"
                          onClick={handleCopyLink}
                          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer shrink-0"
                        >
                          {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedLink ? 'Tersalin' : 'Salin Link'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Sinkronisasi Live:</strong> Segala perubahan undian giliran, input skor juri, atau pemenang yang Anda buat di laptop akan langsung ter-update di HP dan perangkat lainnya secara otomatis.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FolderOpen className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-bold">Belum ada lomba aktif yang dipilih.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Open From Code / Link */}
        {activeTab === 'open' && (
          <div className="p-5 space-y-4">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Pindahkan pekerjaan ke laptop atau smartphone baru dengan memasukkan <strong>Kode Lomba</strong> (contoh: <code>TRN-8291</code>) atau <strong>Link Lengkap</strong> yang dibagikan dari perangkat sebelumnya.
            </div>

            {openStatusMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                openStatusMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
              }`}>
                {openStatusMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                )}
                <span>{openStatusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleOpenFromCode} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1.5">
                  Kode Lomba / ID Turnamen / URL
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="input-sync-code-open"
                    type="text"
                    required
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Contoh: TRN-8921 atau tempel link turnamen..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3.5 text-xs font-mono font-bold text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <button
                id="btn-submit-open-code"
                type="submit"
                disabled={isLoadingOpen}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isLoadingOpen ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Mencari di Cloud Firestore...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="h-4 w-4" />
                    <span>Buka & Lanjutkan di Perangkat Ini</span>
                  </>
                )}
              </button>
            </form>

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Tips Pergantian Perangkat:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Setelah dibuka di perangkat ini, lomba akan otomatis tersimpan di daftar riwayat Anda.</li>
                <li>Setiap skor yang dimasukkan oleh dewan juri di HP akan langsung muncul di layar utama laptop.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: Search in Cloud Database */}
        {activeTab === 'search' && (
          <div className="p-5 space-y-4">
            <form onSubmit={handleCloudSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="input-cloud-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ketik nama lomba, kategori, atau nama panitia..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <button
                id="btn-cloud-search-submit"
                type="submit"
                disabled={isSearching}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-all cursor-pointer shrink-0 disabled:opacity-60"
              >
                {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span>Cari</span>
              </button>
            </form>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {searchResults.length > 0 ? (
                searchResults.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-indigo-800 transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{t.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Kode: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{t.shareCode || t.id}</span> • {t.participants?.length || 0} Peserta • {t.panitiaName || 'Panitia'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTournament(t);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      Buka
                    </button>
                  </div>
                ))
              ) : hasSearched ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Tidak ditemukan lomba dengan kata kunci "{searchTerm}". Coba masukkan Kode Akses di tab sebelumnya.
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Masukkan nama turnamen untuk mencari data lomba yang pernah Anda simpan di cloud.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
