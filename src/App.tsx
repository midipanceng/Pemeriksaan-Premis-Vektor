import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { 
  Plus, 
  FileJson, 
  FileSpreadsheet, 
  Share2, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  ClipboardList, 
  LayoutDashboard,
  Search,
  Filter,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Home,
  MapPin,
  Users,
  Menu,
  X,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from './lib/utils';
import { VectorEntry } from './types';

const STORAGE_KEY = 'vektor_pkd_entries';

export default function App() {
  const [entries, setEntries] = useState<VectorEntry[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [officeNumber, setOfficeNumber] = useState('60123456789'); // Default
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedPhone = localStorage.getItem('vektor_office_phone');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setEntries(parsed);
        } else {
          setEntries([]);
        }
      } catch (e) { 
        console.error('Failed to parse entries', e);
        setEntries([]);
      }
    }
    if (savedPhone) setOfficeNumber(savedPhone);
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    localStorage.setItem('vektor_office_phone', officeNumber);
  }, [entries, officeNumber]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => 
      entry.namaJalan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.namaPegawai.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.premis.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, searchQuery]);

  const stats = useMemo(() => {
    return {
      totalPremis: entries.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0),
      totalPos: entries.reduce((acc, curr) => acc + (Number(curr.positive) || 0), 0),
      totalEntries: entries.length,
    };
  }, [entries]);

  const addEntry = (entry: Omit<VectorEntry, 'id' | 'timestamp'>) => {
    const newEntry: VectorEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    setEntries([newEntry, ...entries]);
    setIsFormOpen(false);
  };

  const updateEntry = (id: string, updatedFields: Partial<VectorEntry>) => {
    setEntries(entries.map(e => e.id === id ? { ...e, ...updatedFields } : e));
    setIsFormOpen(false);
    setEditingId(null);
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    setShowDeleteConfirm(null);
  };

  const generateCSVBlob = () => {
    const headers = [
      'Bil', 'Nama Pegawai / Pasukan', 'Nama Jalan / Blok', 'Premis', 'Periksa', 'Tutup', 'Kosong', 'Jumlah', 
      'Positive (+ve)', '(A.I)', 'Bekas', 'Bil. Diperiksa', 
      'Positive (+ve) - Dalam', 'A.Aeg (Dalam)', 'A.Albo (Dalam)', 'lain-lain (Dalam)', 
      'Positive (+ve) - Luar', 'A.Aeg (Luar)', 'A.Albo (Luar)', 'lain-lain (Luar)', 
      'JUM.', '( B.I )', '( C.I )', 
      'Risalah', 'tunjuk cara', 'Poster', 'perbincangan kump kecil', 'nasihat individu', 'dialog', 
      'Bil. Abate (grm)', 'Bil. Temebate (grm)', 'Acetellik (ml)', 'ACD', 
      'Penduduk dijumpai', 'kes dirujuk', 'CATATAN', 'Tarikh'
    ];

    const rows = entries.map(e => [
      e.bil, e.namaPegawai, e.namaJalan, e.premis, e.periksa, e.tutup, e.kosong, e.jumlah,
      e.positive, e.ai, e.bekas, e.bilDiperiksa,
      e.posDalam, e.aAegDalam, e.aAlboDalam, e.lainDalam,
      e.posLuar, e.aAegLuar, e.aAlboLuar, e.lainLuar,
      e.positive, e.jumBI, e.jumCI,
      e.risalah, e.tunjukCara, e.poster, e.perbincangan, e.nasihat, e.dialog,
      e.abate, e.temebate, e.acetellik, e.acd,
      e.pendudukDijumpai, e.kesDirujuk, e.catatan, format(e.timestamp, 'yyyy-MM-dd HH:mm')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  };

  const exportCSV = () => {
    const blob = generateCSVBlob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `data_vektor_${format(Date.now(), 'yyyyMMdd_HHmm')}.csv`;
    link.click();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `data_vektor_${format(Date.now(), 'yyyyMMdd_HHmm')}.json`;
    link.click();
  };

  const shareData = async () => {
    const summary = generateSummary(entries);
    const blob = generateCSVBlob();
    const fileName = `laporan_vektor_${format(Date.now(), 'yyyyMMdd')}.csv`;
    const file = new File([blob], fileName, { type: 'text/csv' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Laporan Vektor PKD Gombak',
          text: summary,
        });
      } catch (err) {
        console.error('Sharing file failed', err);
      }
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: 'Data Vektor PKD Gombak',
          text: summary,
        });
      } catch (err) {
        console.error('Sharing text failed', err);
      }
    } else {
      const emailBody = encodeURIComponent(summary);
      window.location.href = `mailto:?subject=Data Vektor PKD Gombak&body=${emailBody}`;
    }
  };

  const generateSummary = (data: VectorEntry[]) => {
    const totalP = data.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
    const totalPos = data.reduce((acc, curr) => acc + (Number(curr.positive) || 0), 0);
    
    let text = `*LAPORAN HARIAN UNIT VEKTOR PKD GOMBAK*\n`;
    text += `Tarikh: ${format(Date.now(), 'dd/MM/yyyy')}\n`;
    text += `--------------------------------\n`;
    text += `Total Entri: ${data.length}\n`;
    text += `Total Premis Diperiksa: ${totalP}\n`;
    text += `Total Positif (+ve): ${totalPos}\n`;
    text += `--------------------------------\n\n`;
    
    data.slice(0, 10).forEach((e, i) => {
      text += `*${i+1}. ${e.namaJalan}*\n`;
      text += `   Pegawai: ${e.namaPegawai}\n`;
      text += `   Premis: ${e.jumlah}, Pos: ${e.positive}\n`;
      text += `   BI: ${e.jumBI}, CI: ${e.jumCI}\n\n`;
    });
    
    if (data.length > 10) text += `...dan ${data.length - 10} entri lagi dalam fail CSV.`;
    
    return text;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center text-white">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Vektor PKD</h1>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Gombak • Mobile App</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Tetapan"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button 
              onClick={shareData}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Kongsi Data"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Entri" value={stats.totalEntries} icon={<ClipboardList className="w-4 h-4" />} />
          <StatCard label="Premis" value={stats.totalPremis} icon={<Home className="w-4 h-4" />} color="bg-emerald-50 text-emerald-700" />
          <StatCard label="Positif" value={stats.totalPos} icon={<AlertCircle className="w-4 h-4" />} color="bg-rose-50 text-rose-700" />
        </div>

        {/* Main Send Button Area */}
        {entries.length > 0 && !isFormOpen && (
          <div className="bg-gradient-to-br from-sky-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-sky-200">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold">Hantar Laporan</h2>
                <p className="text-sky-100 text-xs font-medium">Hantar {entries.length} data ke Pejabat Kesihatan.</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  const summary = generateSummary(entries);
                  const waUrl = `https://wa.me/${officeNumber}?text=${encodeURIComponent(summary)}`;
                  window.open(waUrl, '_blank');
                }}
                className="bg-white text-sky-700 font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                WhatsApp
              </button>
              <button 
                onClick={() => {
                  const summary = generateSummary(entries);
                  window.location.href = `mailto:?subject=Laporan Vektor PKD Gombak&body=${encodeURIComponent(summary)}`;
                }}
                className="bg-sky-500 text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 border border-sky-400 active:scale-95 transition-all shadow-sm"
              >
                Email
              </button>
            </div>
          </div>
        )}

        {/* Search & Actions */}
        {!isFormOpen && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari jalan, pegawai..." 
                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={exportCSV}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl py-2.5 text-xs font-semibold hover:bg-slate-50 shadow-sm transition-all active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel (CSV)
              </button>
              <button 
                onClick={exportJSON}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl py-2.5 text-xs font-semibold hover:bg-slate-50 shadow-sm transition-all active:scale-95"
              >
                <FileJson className="w-4 h-4 text-amber-600" /> JSON
              </button>
            </div>
          </div>
        )}

        {/* Entries List */}
        {!isFormOpen && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Senarai Entri</h2>
              <span className="text-[10px] font-medium bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                {filteredEntries.length} data
              </span>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => (
                    <motion.div 
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-sky-200 transition-colors cursor-pointer group"
                      onClick={() => {
                        setEditingId(entry.id);
                        setIsFormOpen(true);
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <h3 className="font-bold text-slate-900 line-clamp-1">{entry.namaJalan}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Users className="w-3 h-3" />
                            <span>{entry.namaPegawai}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-mono text-slate-400">
                            {format(entry.timestamp, 'HH:mm')}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {format(entry.timestamp, 'dd MMM')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <MinStat label="JUM" value={entry.jumlah} />
                        <MinStat label="POS" value={entry.positive} color="text-rose-600" />
                        <MinStat label="BI" value={entry.jumBI} />
                        <MinStat label="CI" value={entry.jumCI} />
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(entry.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          Kemas Kini <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <ClipboardList className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-medium">Tiada entri dijumpai.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {!isFormOpen && (
        <button 
          onClick={() => {
            setEditingId(null);
            setIsFormOpen(true);
          }}
          className="fixed right-6 bottom-8 w-14 h-14 bg-sky-600 text-white rounded-2xl shadow-xl shadow-sky-500/40 flex items-center justify-center active:scale-90 transition-transform z-50 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/10 group-active:bg-transparent transition-colors" />
          <Plus className="w-8 h-8" />
        </button>
      )}

      {/* Entry Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <EntryForm 
            initialData={editingId ? entries.find(e => e.id === editingId) : undefined}
            lastBil={entries.length > 0 ? entries[0].bil : 0}
            onSave={(data) => {
              if (editingId) {
                updateEntry(editingId, data);
              } else {
                addEntry(data as any);
              }
            }}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingId(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(null)}
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Padam Entri?</h3>
                <p className="text-slate-500 text-sm">Tindakan ini tidak boleh diundur. Entri akan dipadamkan selama-lamanya.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 bg-slate-100 rounded-2xl text-sm font-bold active:scale-95 transition-transform"
                >
                  Batal
                </button>
                <button 
                  onClick={() => deleteEntry(showDeleteConfirm)}
                  className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-sm font-bold active:scale-95 transition-transform shadow-lg shadow-rose-200"
                >
                  Ya, Padam
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsSettingsOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                  <Menu className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Tetapan</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">No. Telefon Pejabat (WhatsApp)</label>
                  <input 
                    type="tel" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    placeholder="e.g. 60123456789"
                    value={officeNumber}
                    onChange={(e) => setOfficeNumber(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 pl-1 mt-1">Mula dengan kod negara (contoh: 601...).</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                   <button 
                    onClick={() => {
                      if (confirm('Padam semua data dalam peranti ini?')) {
                        setEntries([]);
                        localStorage.removeItem(STORAGE_KEY);
                        setIsSettingsOpen(false);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 text-rose-600 font-bold text-sm bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Padam Semua Data
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-3 bg-sky-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-sky-200 active:scale-95 transition-transform"
              >
                Selesai
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon, color = "bg-sky-50 text-sky-700" }: { label: string, value: number, icon: ReactNode, color?: string }) {
  return (
    <div className={cn("rounded-2xl p-3 flex flex-col items-center justify-center space-y-1 shadow-sm", color)}>
      <div className="opacity-70">{icon}</div>
      <div className="text-xl font-black">{value}</div>
      <div className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</div>
    </div>
  );
}

function MinStat({ label, value, color = "text-slate-500" }: { label: string, value: any, color?: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-2 flex flex-col items-center border border-slate-100">
      <span className="text-[8px] font-bold text-slate-400 uppercase">{label}</span>
      <span className={cn("text-xs font-black", color)}>{value || 0}</span>
    </div>
  );
}

function EntryForm({ initialData, lastBil, onSave, onCancel }: { 
  initialData?: VectorEntry, 
  lastBil: number,
  onSave: (data: Partial<VectorEntry>) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState<Partial<VectorEntry>>(initialData || {
    bil: lastBil + 1,
    namaPegawai: '',
    namaJalan: '',
    premis: '',
    periksa: 0,
    tutup: 0,
    kosong: 0,
    jumlah: 0,
    positive: 0,
    ai: 0,
    bekas: 0,
    bilDiperiksa: 0,
    posDalam: 0,
    aAegDalam: 0,
    aAlboDalam: 0,
    lainDalam: 0,
    posLuar: 0,
    aAegLuar: 0,
    aAlboLuar: 0,
    lainLuar: 0,
    jumBI: 0,
    jumCI: 0,
    risalah: 0,
    tunjukCara: 0,
    poster: 0,
    perbincangan: 0,
    nasihat: 0,
    dialog: 0,
    abate: 0,
    temebate: 0,
    acetellik: 0,
    acd: 0,
    pendudukDijumpai: 0,
    kesDirujuk: 0,
    catatan: ''
  });

  const [activeTab, setActiveTab] = useState<'info' | 'stats' | 'keputusan' | 'edu' | 'rawatan'>('info');

  const updateField = (field: keyof VectorEntry, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: 'info', label: 'Info', icon: <MapPin className="w-4 h-4" /> },
    { id: 'stats', label: 'Stat', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'keputusan', label: 'Larva', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'edu', label: 'Edu', icon: <Users className="w-4 h-4" /> },
    { id: 'rawatan', label: 'Rawat', icon: <Plus className="w-4 h-4" /> },
  ] as const;

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-white flex flex-col"
    >
      {/* Form Header */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-400 hover:bg-slate-50 rounded-full">
          <X className="w-6 h-6" />
        </button>
        <h2 className="font-bold text-lg">{initialData ? 'Kemas Kini Entri' : 'Entri Baru'}</h2>
        <button 
          onClick={() => onSave(formData)}
          className="bg-sky-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-sky-200 active:scale-95 transition-transform flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Simpan
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-slate-50 p-1 mx-4 mt-4 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap",
              activeTab === tab.id ? "bg-white text-sky-600 shadow-sm font-bold" : "text-slate-400"
            )}
          >
            {tab.icon}
            <span className="text-[10px] uppercase font-bold tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {activeTab === 'info' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <FormField label="Bil" type="number" value={formData.bil} onChange={v => updateField('bil', v)} />
            <FormField label="Nama Pegawai / Pasukan" value={formData.namaPegawai} onChange={v => updateField('namaPegawai', v)} />
            <FormField label="Nama Jalan / Blok" value={formData.namaJalan} onChange={v => updateField('namaJalan', v)} />
            <FormField label="Premis" placeholder="e.g. Rumah, Kedai..." value={formData.premis} onChange={v => updateField('premis', v)} />
            <FormField label="CATATAN" type="textarea" value={formData.catatan} onChange={v => updateField('catatan', v)} />
          </motion.div>
        )}

        {activeTab === 'stats' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 flex items-center gap-3">
              <Info className="w-5 h-5 text-sky-600 shrink-0" />
              <p className="text-xs text-sky-700 leading-relaxed font-medium">Masukkan statistik pemeriksaan premis harian.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Periksa" type="number" value={formData.periksa} onChange={v => updateField('periksa', v)} />
              <FormField label="Tutup" type="number" value={formData.tutup} onChange={v => updateField('tutup', v)} />
              <FormField label="Kosong" type="number" value={formData.kosong} onChange={v => updateField('kosong', v)} />
              <FormField label="Jumlah" type="number" value={formData.jumlah} onChange={v => updateField('jumlah', v)} />
            </div>
            <div className="pt-4 border-t border-slate-100">
              <FormField label="Bil. Diperiksa (Total)" type="number" value={formData.bilDiperiksa} onChange={v => updateField('bilDiperiksa', v)} />
            </div>
          </motion.div>
        )}

        {activeTab === 'keputusan' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Keputusan Utama</h3>
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Positive (+ve)" type="number" value={formData.positive} onChange={v => updateField('positive', v)} />
                <FormField label="(A.I)" type="number" value={formData.ai} onChange={v => updateField('ai', v)} />
                <FormField label="Bekas" type="number" value={formData.bekas} onChange={v => updateField('bekas', v)} />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest pl-1">Larva Dalam</h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Positif" type="number" value={formData.posDalam} onChange={v => updateField('posDalam', v)} />
                <FormField label="A.Aeg" type="number" value={formData.aAegDalam} onChange={v => updateField('aAegDalam', v)} />
                <FormField label="A.Albo" type="number" value={formData.aAlboDalam} onChange={v => updateField('aAlboDalam', v)} />
                <FormField label="Lain-lain" type="number" value={formData.lainDalam} onChange={v => updateField('lainDalam', v)} />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest pl-1">Larva Luar</h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Positif" type="number" value={formData.posLuar} onChange={v => updateField('posLuar', v)} />
                <FormField label="A.Aeg" type="number" value={formData.aAegLuar} onChange={v => updateField('aAegLuar', v)} />
                <FormField label="A.Albo" type="number" value={formData.aAlboLuar} onChange={v => updateField('aAlboLuar', v)} />
                <FormField label="Lain-lain" type="number" value={formData.lainLuar} onChange={v => updateField('lainLuar', v)} />
              </div>
            </section>

            <section className="space-y-3 pt-4 border-t border-slate-100">
               <div className="grid grid-cols-2 gap-3">
                <FormField label="(B.I)" type="number" value={formData.jumBI} onChange={v => updateField('jumBI', v)} />
                <FormField label="(C.I)" type="number" value={formData.jumCI} onChange={v => updateField('jumCI', v)} />
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'edu' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Pendidikan Kesihatan</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Risalah" type="number" value={formData.risalah} onChange={v => updateField('risalah', v)} />
              <FormField label="Tunjuk Cara" type="number" value={formData.tunjukCara} onChange={v => updateField('tunjukCara', v)} />
              <FormField label="Poster" type="number" value={formData.poster} onChange={v => updateField('poster', v)} />
              <FormField label="Kump Kecil" type="number" value={formData.perbincangan} onChange={v => updateField('perbincangan', v)} />
              <FormField label="Nasihat Indiv" type="number" value={formData.nasihat} onChange={v => updateField('nasihat', v)} />
              <FormField label="Dialog" type="number" value={formData.dialog} onChange={v => updateField('dialog', v)} />
            </div>
            <div className="pt-6 space-y-4">
              <FormField label="Penduduk Dijumpai" type="number" value={formData.pendudukDijumpai} onChange={v => updateField('pendudukDijumpai', v)} />
              <FormField label="Kes Dirujuk" type="number" value={formData.kesDirujuk} onChange={v => updateField('kesDirujuk', v)} />
            </div>
          </motion.div>
        )}

        {activeTab === 'rawatan' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Bekalan & Rawatan</h3>
              <FormField label="Abate (grm)" type="number" value={formData.abate} onChange={v => updateField('abate', v)} />
              <FormField label="Temebate (grm)" type="number" value={formData.temebate} onChange={v => updateField('temebate', v)} />
              <FormField label="Acetellik (ml)" type="number" value={formData.acetellik} onChange={v => updateField('acetellik', v)} />
              <FormField label="ACD" type="number" value={formData.acd} onChange={v => updateField('acd', v)} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Form Bottom Nav for simple flow */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
         <button 
          disabled={activeTab === 'info'}
          onClick={() => {
            const idx = tabs.findIndex(t => t.id === activeTab);
            setActiveTab(tabs[idx-1].id as any);
          }}
          className="flex items-center gap-1 text-sm font-bold text-slate-400 disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" /> Kembali
        </button>
        <button 
          onClick={() => {
            if (activeTab === 'rawatan') {
              onSave(formData);
            } else {
              const idx = tabs.findIndex(t => t.id === activeTab);
              setActiveTab(tabs[idx+1].id as any);
            }
          }}
          className="flex items-center gap-1 text-sm font-bold text-sky-600"
        >
          {activeTab === 'rawatan' ? 'Selesai' : 'Seterusnya'} <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

function FormField({ label, type = 'text', value, onChange, placeholder }: { label: string, type?: string, value: any, onChange: (v: any) => void, placeholder?: string }) {
  return (
    <div className="space-y-1.5 flex-1 w-full">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">{label}</label>
      {type === 'textarea' ? (
        <textarea 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition-all transition-all min-h-[100px]"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input 
          type={type} 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition-all transition-all"
          value={value ?? ''}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
