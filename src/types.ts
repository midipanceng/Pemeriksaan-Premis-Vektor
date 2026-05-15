export interface VectorEntry {
  id: string;
  timestamp: number;
  bil: number;
  namaPegawai: string;
  namaJalan: string;
  premis: string;
  
  // Statistik
  periksa: number;
  tutup: number;
  kosong: number;
  jumlah: number;
  
  // Keputusan
  positive: number;
  ai: number;
  bekas: number;
  bilDiperiksa: number;

  // Dalam
  posDalam: number;
  aAegDalam: number;
  aAlboDalam: number;
  lainDalam: number;

  // Luar
  posLuar: number;
  aAegLuar: number;
  aAlboLuar: number;
  lainLuar: number;

  // Jum
  jumBI: number;
  jumCI: number;

  // Pendidikan Kesihatan
  risalah: number;
  tunjukCara: number;
  poster: number;
  perbincangan: number;
  nasihat: number;
  dialog: number;

  // Rawatan
  abate: number;
  temebate: number;
  acetellik: number;

  // Others
  acd: number;
  pendudukDijumpai: number;
  kesDirujuk: number;
  catatan: string;
}

export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT';
