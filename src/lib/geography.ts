// ── Province definitions (all 34 provinces from GADM) ──────────────────────────

export const PROVINCES = [
  { value: "all", label: "Semua Provinsi" },
  { value: "aceh", label: "Aceh", lonMin: 95.0, lonMax: 98.3, latMin: 2.0, latMax: 6.1 },
  { value: "bali", label: "Bali", lonMin: 114.4, lonMax: 115.7, latMin: -8.8, latMax: -8.1 },
  { value: "bangka_belitung", label: "Bangka Belitung", lonMin: 105.1, lonMax: 108.8, latMin: -3.4, latMax: -1.5 },
  { value: "banten", label: "Banten", lonMin: 105.1, lonMax: 106.8, latMin: -7.0, latMax: -5.8 },
  { value: "bengkulu", label: "Bengkulu", lonMin: 101.0, lonMax: 103.8, latMin: -5.4, latMax: -2.3 },
  { value: "di_yogyakarta", label: "DI Yogyakarta", lonMin: 110.0, lonMax: 110.8, latMin: -8.2, latMax: -7.5 },
  { value: "dki_jakarta", label: "DKI Jakarta", lonMin: 106.4, lonMax: 107.0, latMin: -6.4, latMax: -5.2 },
  { value: "gorontalo", label: "Gorontalo", lonMin: 121.2, lonMax: 123.6, latMin: 0.3, latMax: 1.0 },
  { value: "jambi", label: "Jambi", lonMin: 101.1, lonMax: 104.5, latMin: -2.8, latMax: -0.7 },
  { value: "jawa_barat", label: "Jawa Barat", lonMin: 106.4, lonMax: 108.8, latMin: -7.8, latMax: -5.9 },
  { value: "jawa_tengah", label: "Jawa Tengah", lonMin: 108.6, lonMax: 111.7, latMin: -8.2, latMax: -5.7 },
  { value: "jawa_timur", label: "Jawa Timur", lonMin: 110.9, lonMax: 116.3, latMin: -8.8, latMax: -5.0 },
  { value: "kalimantan_barat", label: "Kalimantan Barat", lonMin: 108.7, lonMax: 114.2, latMin: -3.1, latMax: 2.1 },
  { value: "kalimantan_selatan", label: "Kalimantan Selatan", lonMin: 114.3, lonMax: 116.5, latMin: -4.7, latMax: -1.3 },
  { value: "kalimantan_tengah", label: "Kalimantan Tengah", lonMin: 110.7, lonMax: 115.8, latMin: -3.5, latMax: 0.8 },
  { value: "kalimantan_timur", label: "Kalimantan Timur", lonMin: 113.8, lonMax: 119.0, latMin: -2.4, latMax: 2.6 },
  { value: "kalimantan_utara", label: "Kalimantan Utara", lonMin: 114.6, lonMax: 118.0, latMin: 1.0, latMax: 4.4 },
  { value: "kepulauan_riau", label: "Kepulauan Riau", lonMin: 103.3, lonMax: 109.2, latMin: -1.3, latMax: 4.8 },
  { value: "lampung", label: "Lampung", lonMin: 103.6, lonMax: 106.2, latMin: -6.2, latMax: -3.7 },
  { value: "maluku", label: "Maluku", lonMin: 125.7, lonMax: 134.9, latMin: -8.3, latMax: -1.4 },
  { value: "maluku_utara", label: "Maluku Utara", lonMin: 124.3, lonMax: 129.7, latMin: -2.5, latMax: 2.6 },
  { value: "nusa_tenggara_barat", label: "Nusa Tenggara Barat", lonMin: 115.8, lonMax: 119.3, latMin: -9.1, latMax: -8.1 },
  { value: "nusa_tenggara_timur", label: "Nusa Tenggara Timur", lonMin: 118.9, lonMax: 125.2, latMin: -11.0, latMax: -8.1 },
  { value: "papua", label: "Papua", lonMin: 134.3, lonMax: 141.0, latMin: -9.1, latMax: 0.9 },
  { value: "papua_barat", label: "Papua Barat", lonMin: 129.3, lonMax: 135.3, latMin: -4.3, latMax: 0.6 },
  { value: "riau", label: "Riau", lonMin: 100.0, lonMax: 103.8, latMin: -1.1, latMax: 2.9 },
  { value: "sulawesi_barat", label: "Sulawesi Barat", lonMin: 117.1, lonMax: 119.9, latMin: -3.6, latMax: -0.8 },
  { value: "sulawesi_selatan", label: "Sulawesi Selatan", lonMin: 117.0, lonMax: 121.8, latMin: -7.8, latMax: -1.9 },
  { value: "sulawesi_tengah", label: "Sulawesi Tengah", lonMin: 119.4, lonMax: 124.2, latMin: -3.6, latMax: 1.4 },
  { value: "sulawesi_tenggara", label: "Sulawesi Tenggara", lonMin: 120.9, lonMax: 124.6, latMin: -6.2, latMax: -2.8 },
  { value: "sulawesi_utara", label: "Sulawesi Utara", lonMin: 123.1, lonMax: 127.2, latMin: 0.3, latMax: 5.6 },
  { value: "sumatera_barat", label: "Sumatera Barat", lonMin: 98.6, lonMax: 101.9, latMin: -3.3, latMax: 0.9 },
  { value: "sumatera_selatan", label: "Sumatera Selatan", lonMin: 102.1, lonMax: 106.2, latMin: -5.0, latMax: -1.6 },
  { value: "sumatera_utara", label: "Sumatera Utara", lonMin: 97.1, lonMax: 100.4, latMin: -0.6, latMax: 4.3 },
] as const;

export type ProvinceValue = (typeof PROVINCES)[number]["value"];

// ── Intensity options ─────────────────────────────────────────────────────────

export const INTENSITY_OPTIONS = [
  { value: "all",      label: "Semua Peristiwa",         min: 0 },
  { value: "minor",    label: "Ringan (< 10 km²)",       min: 0,   max: 10   },
  { value: "moderate", label: "Sedang (10–100 km²)",     min: 10,  max: 100  },
  { value: "severe",   label: "Parah (100–1000 km²)",    min: 100, max: 1000 },
  { value: "extreme",  label: "Ekstrem (> 1000 km²)",    min: 1000            },
] as const;

export type IntensityValue = (typeof INTENSITY_OPTIONS)[number]["value"];

// ── Kabupaten definitions (approximate bounding boxes) ────────────────────────

type KabupatenEntry = { name: string; lonMin: number; lonMax: number; latMin: number; latMax: number };

export const KABUPATEN_MAP: Record<string, KabupatenEntry[]> = {
  aceh: [
    { name: "Aceh Besar",  lonMin: 95.0,  lonMax: 96.2,  latMin: 5.0,  latMax: 5.9  },
    { name: "Pidie",       lonMin: 96.1,  lonMax: 97.0,  latMin: 4.5,  latMax: 5.3  },
    { name: "Bireuen",     lonMin: 96.9,  lonMax: 97.4,  latMin: 4.8,  latMax: 5.3  },
    { name: "Aceh Utara",  lonMin: 97.1,  lonMax: 97.7,  latMin: 4.8,  latMax: 5.3  },
    { name: "Aceh Timur",  lonMin: 97.6,  lonMax: 98.3,  latMin: 4.3,  latMax: 5.0  },
    { name: "Aceh Tengah", lonMin: 96.0,  lonMax: 97.5,  latMin: 3.8,  latMax: 4.8  },
    { name: "Nagan Raya",  lonMin: 96.0,  lonMax: 96.8,  latMin: 3.5,  latMax: 4.2  },
    { name: "Aceh Selatan",lonMin: 96.5,  lonMax: 97.5,  latMin: 2.5,  latMax: 3.8  },
  ],
  sumatera_utara: [
    { name: "Deli Serdang",  lonMin: 98.4,  lonMax: 99.2,  latMin: 3.0,  latMax: 4.0  },
    { name: "Langkat",       lonMin: 97.9,  lonMax: 98.5,  latMin: 3.3,  latMax: 4.3  },
    { name: "Simalungun",    lonMin: 98.7,  lonMax: 99.3,  latMin: 2.5,  latMax: 3.5  },
    { name: "Asahan",        lonMin: 99.2,  lonMax: 100.0, latMin: 2.5,  latMax: 3.3  },
    { name: "Labuhanbatu",   lonMin: 99.5,  lonMax: 100.5, latMin: 1.8,  latMax: 2.7  },
    { name: "Toba Samosir",  lonMin: 98.7,  lonMax: 99.5,  latMin: 2.2,  latMax: 2.9  },
    { name: "Tapanuli Utara",lonMin: 98.8,  lonMax: 99.5,  latMin: 1.8,  latMax: 2.5  },
    { name: "Batu Bara",     lonMin: 99.2,  lonMax: 99.8,  latMin: 3.0,  latMax: 3.7  },
  ],
  sumatera_barat: [
    { name: "Padang Pariaman", lonMin: 99.6,  lonMax: 100.4, latMin: -0.7, latMax: 0.3  },
    { name: "Agam",            lonMin: 99.8,  lonMax: 100.5, latMin: -0.3, latMax: 0.5  },
    { name: "Lima Puluh Kota", lonMin: 100.3, lonMax: 101.0, latMin: -0.3, latMax: 0.4  },
    { name: "Pesisir Selatan", lonMin: 100.3, lonMax: 101.5, latMin: -2.8, latMax: -1.0 },
    { name: "Solok",           lonMin: 100.5, lonMax: 101.4, latMin: -1.5, latMax: -0.5 },
    { name: "Sijunjung",       lonMin: 100.8, lonMax: 101.6, latMin: -1.0, latMax: 0.0  },
    { name: "Dharmasraya",     lonMin: 101.3, lonMax: 101.8, latMin: -1.8, latMax: -0.8 },
    { name: "Pasaman",         lonMin: 99.5,  lonMax: 100.2, latMin: 0.4,  latMax: 1.5  },
  ],
  riau: [
    { name: "Kampar",      lonMin: 100.4, lonMax: 101.5, latMin: 0.0,  latMax: 1.5  },
    { name: "Pelalawan",   lonMin: 101.5, lonMax: 103.0, latMin: -0.5, latMax: 0.8  },
    { name: "Indragiri Hulu",  lonMin: 101.5, lonMax: 103.0, latMin: -1.0, latMax: 0.0 },
    { name: "Indragiri Hilir", lonMin: 102.5, lonMax: 104.0, latMin: -1.5, latMax: 0.0 },
    { name: "Bengkalis",   lonMin: 101.8, lonMax: 103.0, latMin: 1.0,  latMax: 2.5  },
    { name: "Rokan Hulu",  lonMin: 100.0, lonMax: 101.0, latMin: 0.5,  latMax: 2.0  },
    { name: "Siak",        lonMin: 101.5, lonMax: 102.2, latMin: 0.0,  latMax: 1.5  },
    { name: "Kepulauan Meranti", lonMin: 102.5, lonMax: 103.5, latMin: 0.5, latMax: 1.5 },
  ],
  jambi: [
    { name: "Batanghari",   lonMin: 102.5, lonMax: 103.4, latMin: -2.0, latMax: -1.0 },
    { name: "Muaro Jambi",  lonMin: 103.0, lonMax: 104.0, latMin: -2.0, latMax: -1.0 },
    { name: "Tanjab Timur", lonMin: 103.5, lonMax: 104.5, latMin: -1.8, latMax: -0.8 },
    { name: "Tanjab Barat", lonMin: 102.8, lonMax: 103.5, latMin: -1.5, latMax: -0.5 },
    { name: "Merangin",     lonMin: 101.8, lonMax: 102.8, latMin: -2.5, latMax: -1.5 },
    { name: "Sarolangun",   lonMin: 102.5, lonMax: 103.5, latMin: -2.5, latMax: -1.5 },
    { name: "Bungo",        lonMin: 101.5, lonMax: 102.3, latMin: -1.8, latMax: -0.8 },
  ],
  sumatera_selatan: [
    { name: "Musi Banyuasin", lonMin: 103.5, lonMax: 104.5, latMin: -2.5, latMax: -1.5 },
    { name: "Banyuasin",      lonMin: 104.2, lonMax: 105.3, latMin: -3.0, latMax: -1.8 },
    { name: "Musi Rawas",     lonMin: 102.5, lonMax: 104.0, latMin: -3.5, latMax: -2.5 },
    { name: "OKU",            lonMin: 103.5, lonMax: 104.5, latMin: -4.5, latMax: -3.5 },
    { name: "OKI",            lonMin: 104.5, lonMax: 106.0, latMin: -4.5, latMax: -3.0 },
    { name: "Muara Enim",     lonMin: 103.0, lonMax: 104.0, latMin: -4.0, latMax: -3.0 },
    { name: "Lahat",          lonMin: 102.5, lonMax: 103.3, latMin: -4.0, latMax: -3.3 },
    { name: "Ogan Ilir",      lonMin: 104.2, lonMax: 105.0, latMin: -3.5, latMax: -2.8 },
  ],
  lampung: [
    { name: "Lampung Selatan", lonMin: 105.1, lonMax: 105.7, latMin: -5.8, latMax: -5.2 },
    { name: "Lampung Tengah",  lonMin: 104.8, lonMax: 105.4, latMin: -5.2, latMax: -4.5 },
    { name: "Lampung Utara",   lonMin: 104.5, lonMax: 105.1, latMin: -4.5, latMax: -4.0 },
    { name: "Way Kanan",       lonMin: 104.2, lonMax: 104.8, latMin: -4.5, latMax: -3.9 },
    { name: "Tanggamus",       lonMin: 104.4, lonMax: 105.3, latMin: -5.5, latMax: -5.0 },
    { name: "Pringsewu",       lonMin: 104.8, lonMax: 105.1, latMin: -5.4, latMax: -5.0 },
    { name: "Pesawaran",       lonMin: 105.0, lonMax: 105.4, latMin: -5.6, latMax: -5.2 },
  ],
  dki_jakarta: [
    { name: "Jakarta Utara",  lonMin: 106.74, lonMax: 107.0,  latMin: -6.15, latMax: -6.05 },
    { name: "Jakarta Barat",  lonMin: 106.68, lonMax: 106.78, latMin: -6.22, latMax: -6.13 },
    { name: "Jakarta Pusat",  lonMin: 106.78, lonMax: 106.88, latMin: -6.22, latMax: -6.12 },
    { name: "Jakarta Selatan",lonMin: 106.76, lonMax: 106.88, latMin: -6.32, latMax: -6.22 },
    { name: "Jakarta Timur",  lonMin: 106.85, lonMax: 107.0,  latMin: -6.33, latMax: -6.10 },
  ],
  jawa_barat: [
    { name: "Bandung",    lonMin: 107.45, lonMax: 108.2, latMin: -7.2,  latMax: -6.8  },
    { name: "Bogor",      lonMin: 106.6,  lonMax: 107.1, latMin: -6.8,  latMax: -6.4  },
    { name: "Karawang",   lonMin: 107.2,  lonMax: 107.6, latMin: -6.5,  latMax: -6.1  },
    { name: "Bekasi",     lonMin: 106.9,  lonMax: 107.2, latMin: -6.5,  latMax: -6.1  },
    { name: "Subang",     lonMin: 107.5,  lonMax: 108.0, latMin: -6.6,  latMax: -6.2  },
    { name: "Indramayu",  lonMin: 107.9,  lonMax: 108.5, latMin: -6.6,  latMax: -6.1  },
    { name: "Cirebon",    lonMin: 108.4,  lonMax: 108.8, latMin: -6.9,  latMax: -6.6  },
    { name: "Garut",      lonMin: 107.7,  lonMax: 108.2, latMin: -7.5,  latMax: -7.0  },
    { name: "Tasikmalaya",lonMin: 108.0,  lonMax: 108.5, latMin: -7.5,  latMax: -7.1  },
    { name: "Sukabumi",   lonMin: 106.6,  lonMax: 107.1, latMin: -7.2,  latMax: -6.8  },
  ],
  jawa_tengah: [
    { name: "Semarang",   lonMin: 110.2, lonMax: 110.7, latMin: -7.2, latMax: -6.9 },
    { name: "Demak",      lonMin: 110.5, lonMax: 110.9, latMin: -7.0, latMax: -6.8 },
    { name: "Kendal",     lonMin: 110.0, lonMax: 110.3, latMin: -7.1, latMax: -6.9 },
    { name: "Brebes",     lonMin: 108.7, lonMax: 109.1, latMin: -7.1, latMax: -6.8 },
    { name: "Tegal",      lonMin: 109.1, lonMax: 109.4, latMin: -7.0, latMax: -6.8 },
    { name: "Pekalongan", lonMin: 109.5, lonMax: 110.1, latMin: -7.1, latMax: -6.9 },
    { name: "Cilacap",    lonMin: 108.7, lonMax: 109.5, latMin: -7.8, latMax: -7.5 },
    { name: "Banyumas",   lonMin: 108.9, lonMax: 109.4, latMin: -7.7, latMax: -7.3 },
    { name: "Kebumen",    lonMin: 109.5, lonMax: 109.9, latMin: -7.8, latMax: -7.5 },
    { name: "Kudus",      lonMin: 110.7, lonMax: 111.0, latMin: -6.9, latMax: -6.7 },
  ],
  jawa_timur: [
    { name: "Surabaya",   lonMin: 112.6, lonMax: 112.8, latMin: -7.4, latMax: -7.2 },
    { name: "Sidoarjo",   lonMin: 112.6, lonMax: 112.9, latMin: -7.6, latMax: -7.3 },
    { name: "Lamongan",   lonMin: 112.2, lonMax: 112.5, latMin: -7.1, latMax: -6.8 },
    { name: "Gresik",     lonMin: 112.5, lonMax: 112.7, latMin: -7.2, latMax: -7.0 },
    { name: "Tuban",      lonMin: 111.8, lonMax: 112.2, latMin: -7.0, latMax: -6.8 },
    { name: "Bojonegoro", lonMin: 111.6, lonMax: 112.0, latMin: -7.2, latMax: -6.9 },
    { name: "Jombang",    lonMin: 112.0, lonMax: 112.3, latMin: -7.6, latMax: -7.3 },
    { name: "Malang",     lonMin: 112.5, lonMax: 112.9, latMin: -8.2, latMax: -7.8 },
    { name: "Kediri",     lonMin: 111.9, lonMax: 112.2, latMin: -7.9, latMax: -7.6 },
    { name: "Lumajang",   lonMin: 113.0, lonMax: 113.3, latMin: -8.4, latMax: -7.9 },
  ],
  bali: [
    { name: "Buleleng",   lonMin: 114.4, lonMax: 115.2, latMin: -8.3, latMax: -8.0 },
    { name: "Jembrana",   lonMin: 114.4, lonMax: 114.8, latMin: -8.7, latMax: -8.3 },
    { name: "Tabanan",    lonMin: 114.8, lonMax: 115.2, latMin: -8.7, latMax: -8.3 },
    { name: "Badung",     lonMin: 115.0, lonMax: 115.3, latMin: -8.8, latMax: -8.5 },
    { name: "Gianyar",    lonMin: 115.2, lonMax: 115.5, latMin: -8.7, latMax: -8.5 },
    { name: "Bangli",     lonMin: 115.2, lonMax: 115.5, latMin: -8.5, latMax: -8.2 },
    { name: "Klungkung",  lonMin: 115.3, lonMax: 115.6, latMin: -8.8, latMax: -8.5 },
    { name: "Karangasem", lonMin: 115.5, lonMax: 115.8, latMin: -8.8, latMax: -8.3 },
  ],
  kalimantan_barat: [
    { name: "Kubu Raya",   lonMin: 109.0, lonMax: 109.7, latMin: -0.5, latMax: 0.1  },
    { name: "Sanggau",     lonMin: 109.5, lonMax: 110.4, latMin: 0.0,  latMax: 1.0  },
    { name: "Landak",      lonMin: 109.3, lonMax: 109.8, latMin: 0.0,  latMax: 0.8  },
    { name: "Ketapang",    lonMin: 109.8, lonMax: 110.5, latMin: -2.5, latMax: -1.0 },
    { name: "Sintang",     lonMin: 110.6, lonMax: 111.5, latMin: 0.0,  latMax: 1.2  },
    { name: "Kapuas Hulu", lonMin: 112.0, lonMax: 114.0, latMin: 0.5,  latMax: 2.1  },
    { name: "Sekadau",     lonMin: 110.5, lonMax: 111.0, latMin: -0.5, latMax: 0.5  },
    { name: "Melawi",      lonMin: 111.0, lonMax: 112.0, latMin: -0.5, latMax: 0.5  },
  ],
  kalimantan_tengah: [
    { name: "Kotawaringin Barat",  lonMin: 111.0, lonMax: 112.0, latMin: -3.0, latMax: -1.5 },
    { name: "Kotawaringin Timur",  lonMin: 112.0, lonMax: 113.5, latMin: -3.5, latMax: -1.8 },
    { name: "Kapuas",              lonMin: 113.5, lonMax: 115.5, latMin: -3.5, latMax: -2.0 },
    { name: "Seruyan",             lonMin: 111.8, lonMax: 112.8, latMin: -3.5, latMax: -2.0 },
    { name: "Katingan",            lonMin: 112.5, lonMax: 113.5, latMin: -2.5, latMax: -1.0 },
    { name: "Pulang Pisau",        lonMin: 113.5, lonMax: 114.5, latMin: -2.8, latMax: -1.8 },
    { name: "Gunung Mas",          lonMin: 113.2, lonMax: 114.0, latMin: -1.5, latMax: -0.5 },
    { name: "Barito Selatan",      lonMin: 114.5, lonMax: 115.5, latMin: -2.5, latMax: -1.5 },
  ],
  kalimantan_selatan: [
    { name: "Banjar",       lonMin: 114.7, lonMax: 115.4, latMin: -3.7, latMax: -3.0 },
    { name: "Barito Kuala", lonMin: 114.5, lonMax: 115.0, latMin: -3.5, latMax: -2.8 },
    { name: "Tapin",        lonMin: 115.0, lonMax: 115.5, latMin: -3.5, latMax: -3.0 },
    { name: "Hulu Sungai Tengah", lonMin: 115.2, lonMax: 115.7, latMin: -2.8, latMax: -2.2 },
    { name: "Hulu Sungai Selatan", lonMin: 115.5, lonMax: 116.0, latMin: -3.2, latMax: -2.5 },
    { name: "Tabalong",     lonMin: 115.5, lonMax: 116.5, latMin: -2.2, latMax: -1.8 },
    { name: "Kotabaru",     lonMin: 115.5, lonMax: 117.0, latMin: -4.2, latMax: -3.5 },
    { name: "Tanah Laut",   lonMin: 114.7, lonMax: 115.3, latMin: -4.0, latMax: -3.5 },
  ],
  kalimantan_timur: [
    { name: "Kutai Kartanegara", lonMin: 115.5, lonMax: 117.0, latMin: -0.5, latMax: 1.0  },
    { name: "Berau",             lonMin: 116.5, lonMax: 118.0, latMin: 1.5,  latMax: 2.5  },
    { name: "Kutai Barat",       lonMin: 115.0, lonMax: 116.0, latMin: -0.5, latMax: 1.0  },
    { name: "Kutai Timur",       lonMin: 116.5, lonMax: 118.0, latMin: 0.0,  latMax: 1.5  },
    { name: "Penajam Paser Utara", lonMin: 116.0, lonMax: 116.7, latMin: -1.5, latMax: -1.0 },
    { name: "Paser",             lonMin: 115.5, lonMax: 116.5, latMin: -2.0, latMax: -1.0 },
    { name: "Mahakam Ulu",       lonMin: 114.0, lonMax: 116.0, latMin: -0.5, latMax: 1.5  },
  ],
  sulawesi_selatan: [
    { name: "Gowa",    lonMin: 119.5, lonMax: 120.0, latMin: -5.5, latMax: -5.0 },
    { name: "Maros",   lonMin: 119.5, lonMax: 119.9, latMin: -5.0, latMax: -4.7 },
    { name: "Pangkep", lonMin: 119.4, lonMax: 119.7, latMin: -4.8, latMax: -4.5 },
    { name: "Bone",    lonMin: 120.1, lonMax: 121.0, latMin: -5.0, latMax: -4.0 },
    { name: "Wajo",    lonMin: 120.0, lonMax: 120.7, latMin: -4.0, latMax: -3.5 },
    { name: "Luwu",    lonMin: 119.8, lonMax: 120.8, latMin: -3.5, latMax: -2.5 },
    { name: "Pinrang", lonMin: 119.0, lonMax: 119.6, latMin: -3.8, latMax: -3.2 },
    { name: "Sinjai",  lonMin: 120.2, lonMax: 120.6, latMin: -5.4, latMax: -5.1 },
  ],
  sulawesi_utara: [
    { name: "Minahasa",           lonMin: 124.5, lonMax: 125.2, latMin: 1.1, latMax: 1.7 },
    { name: "Minahasa Utara",     lonMin: 125.0, lonMax: 125.6, latMin: 1.5, latMax: 1.8 },
    { name: "Minahasa Selatan",   lonMin: 124.0, lonMax: 124.5, latMin: 0.9, latMax: 1.4 },
    { name: "Bolaang Mongondow",  lonMin: 123.5, lonMax: 124.5, latMin: 0.5, latMax: 0.9 },
    { name: "Kepulauan Sangihe",  lonMin: 125.3, lonMax: 126.0, latMin: 1.5, latMax: 1.8 },
    { name: "Sitaro",             lonMin: 125.1, lonMax: 125.5, latMin: 1.5, latMax: 1.7 },
  ],
  papua: [
    { name: "Jayapura",   lonMin: 140.3, lonMax: 141.0, latMin: -3.0, latMax: -1.5 },
    { name: "Sorong",     lonMin: 131.0, lonMax: 132.0, latMin: -1.0, latMax: 0.0  },
    { name: "Manokwari",  lonMin: 133.5, lonMax: 134.5, latMin: -1.0, latMax: 0.0  },
    { name: "Mimika",     lonMin: 135.5, lonMax: 137.0, latMin: -5.0, latMax: -3.5 },
    { name: "Merauke",    lonMin: 138.5, lonMax: 141.0, latMin: -9.0, latMax: -6.5 },
    { name: "Biak Numfor",lonMin: 135.5, lonMax: 136.5, latMin: -2.0, latMax: -1.0 },
    { name: "Nabire",     lonMin: 135.0, lonMax: 136.0, latMin: -4.5, latMax: -3.4 },
    { name: "Sarmi",      lonMin: 138.0, lonMax: 139.5, latMin: -2.5, latMax: -1.5 },
  ],
  nusa_tenggara_timur: [
    { name: "Flores Timur",   lonMin: 122.4, lonMax: 123.0, latMin: -8.7, latMax: -8.2 },
    { name: "Sikka",          lonMin: 121.9, lonMax: 122.4, latMin: -8.7, latMax: -8.2 },
    { name: "Lembata",        lonMin: 123.0, lonMax: 123.8, latMin: -8.8, latMax: -8.3 },
    { name: "Alor",           lonMin: 124.4, lonMax: 125.0, latMin: -8.4, latMax: -8.0 },
    { name: "Kupang",         lonMin: 123.4, lonMax: 124.0, latMin: -10.5, latMax: -9.8 },
    { name: "Timor Tengah Selatan", lonMin: 124.0, lonMax: 124.7, latMin: -10.5, latMax: -9.5 },
    { name: "Belu",           lonMin: 124.7, lonMax: 125.5, latMin: -9.5,  latMax: -8.9 },
    { name: "Manggarai",      lonMin: 119.0, lonMax: 120.0, latMin: -8.8, latMax: -8.2 },
  ],
  maluku: [
    { name: "Maluku Tengah",  lonMin: 128.0, lonMax: 130.0, latMin: -4.0, latMax: -2.5 },
    { name: "Seram Bagian Barat", lonMin: 128.0, lonMax: 129.0, latMin: -3.5, latMax: -2.5 },
    { name: "Seram Bagian Timur", lonMin: 129.5, lonMax: 131.0, latMin: -4.0, latMax: -2.8 },
    { name: "Buru",           lonMin: 126.0, lonMax: 127.5, latMin: -3.8, latMax: -3.0 },
    { name: "Kepulauan Tanimbar", lonMin: 131.0, lonMax: 132.0, latMin: -8.0, latMax: -7.0 },
    { name: "Maluku Tenggara",lonMin: 132.0, lonMax: 133.5, latMin: -6.0, latMax: -5.0 },
    { name: "Kepulauan Aru",  lonMin: 133.5, lonMax: 135.0, latMin: -8.5, latMax: -6.5 },
  ],
};

// ── Build kabupaten CASE/WHEN SQL expression ──────────────────────────────────

export function buildKabupatenCaseSQL(provinceValue: string): string {
  const kabupatens = KABUPATEN_MAP[provinceValue];
  if (!kabupatens || kabupatens.length === 0) return "'Lainnya'";

  const cases = kabupatens
    .map(
      (k) =>
        `WHEN centroid_lon >= ${k.lonMin} AND centroid_lon <= ${k.lonMax} ` +
        `AND centroid_lat >= ${k.latMin} AND centroid_lat <= ${k.latMax} THEN '${k.name}'`
    )
    .join("\n            ");

  return `CASE\n            ${cases}\n            ELSE 'Lainnya'\n          END`;
}

// ── Province CASE/WHEN SQL expression (all 34 provinces) ────────────────────────

export const PROVINCE_CASE_SQL = `CASE
    WHEN centroid_lon >= 95.0 AND centroid_lon <= 98.3 AND centroid_lat >= 2.0 AND centroid_lat <= 6.1 THEN 'Aceh'
    WHEN centroid_lon >= 114.4 AND centroid_lon <= 115.7 AND centroid_lat >= -8.8 AND centroid_lat <= -8.1 THEN 'Bali'
    WHEN centroid_lon >= 105.1 AND centroid_lon <= 108.8 AND centroid_lat >= -3.4 AND centroid_lat <= -1.5 THEN 'Bangka Belitung'
    WHEN centroid_lon >= 105.1 AND centroid_lon <= 106.8 AND centroid_lat >= -7.0 AND centroid_lat <= -5.8 THEN 'Banten'
    WHEN centroid_lon >= 101.0 AND centroid_lon <= 103.8 AND centroid_lat >= -5.4 AND centroid_lat <= -2.3 THEN 'Bengkulu'
    WHEN centroid_lon >= 110.0 AND centroid_lon <= 110.8 AND centroid_lat >= -8.2 AND centroid_lat <= -7.5 THEN 'DI Yogyakarta'
    WHEN centroid_lon >= 106.4 AND centroid_lon <= 107.0 AND centroid_lat >= -6.4 AND centroid_lat <= -5.2 THEN 'DKI Jakarta'
    WHEN centroid_lon >= 121.2 AND centroid_lon <= 123.6 AND centroid_lat >= 0.3 AND centroid_lat <= 1.0 THEN 'Gorontalo'
    WHEN centroid_lon >= 101.1 AND centroid_lon <= 104.5 AND centroid_lat >= -2.8 AND centroid_lat <= -0.7 THEN 'Jambi'
    WHEN centroid_lon >= 106.4 AND centroid_lon <= 108.8 AND centroid_lat >= -7.8 AND centroid_lat <= -5.9 THEN 'Jawa Barat'
    WHEN centroid_lon >= 108.6 AND centroid_lon <= 111.7 AND centroid_lat >= -8.2 AND centroid_lat <= -5.7 THEN 'Jawa Tengah'
    WHEN centroid_lon >= 110.9 AND centroid_lon <= 116.3 AND centroid_lat >= -8.8 AND centroid_lat <= -5.0 THEN 'Jawa Timur'
    WHEN centroid_lon >= 108.7 AND centroid_lon <= 114.2 AND centroid_lat >= -3.1 AND centroid_lat <= 2.1 THEN 'Kalimantan Barat'
    WHEN centroid_lon >= 114.3 AND centroid_lon <= 116.5 AND centroid_lat >= -4.7 AND centroid_lat <= -1.3 THEN 'Kalimantan Selatan'
    WHEN centroid_lon >= 110.7 AND centroid_lon <= 115.8 AND centroid_lat >= -3.5 AND centroid_lat <= 0.8 THEN 'Kalimantan Tengah'
    WHEN centroid_lon >= 113.8 AND centroid_lon <= 119.0 AND centroid_lat >= -2.4 AND centroid_lat <= 2.6 THEN 'Kalimantan Timur'
    WHEN centroid_lon >= 114.6 AND centroid_lon <= 118.0 AND centroid_lat >= 1.0 AND centroid_lat <= 4.4 THEN 'Kalimantan Utara'
    WHEN centroid_lon >= 103.3 AND centroid_lon <= 109.2 AND centroid_lat >= -1.3 AND centroid_lat <= 4.8 THEN 'Kepulauan Riau'
    WHEN centroid_lon >= 103.6 AND centroid_lon <= 106.2 AND centroid_lat >= -6.2 AND centroid_lat <= -3.7 THEN 'Lampung'
    WHEN centroid_lon >= 125.7 AND centroid_lon <= 134.9 AND centroid_lat >= -8.3 AND centroid_lat <= -1.4 THEN 'Maluku'
    WHEN centroid_lon >= 124.3 AND centroid_lon <= 129.7 AND centroid_lat >= -2.5 AND centroid_lat <= 2.6 THEN 'Maluku Utara'
    WHEN centroid_lon >= 115.8 AND centroid_lon <= 119.3 AND centroid_lat >= -9.1 AND centroid_lat <= -8.1 THEN 'Nusa Tenggara Barat'
    WHEN centroid_lon >= 118.9 AND centroid_lon <= 125.2 AND centroid_lat >= -11.0 AND centroid_lat <= -8.1 THEN 'Nusa Tenggara Timur'
    WHEN centroid_lon >= 134.3 AND centroid_lon <= 141.0 AND centroid_lat >= -9.1 AND centroid_lat <= 0.9 THEN 'Papua'
    WHEN centroid_lon >= 129.3 AND centroid_lon <= 135.3 AND centroid_lat >= -4.3 AND centroid_lat <= 0.6 THEN 'Papua Barat'
    WHEN centroid_lon >= 100.0 AND centroid_lon <= 103.8 AND centroid_lat >= -1.1 AND centroid_lat <= 2.9 THEN 'Riau'
    WHEN centroid_lon >= 117.1 AND centroid_lon <= 119.9 AND centroid_lat >= -3.6 AND centroid_lat <= -0.8 THEN 'Sulawesi Barat'
    WHEN centroid_lon >= 117.0 AND centroid_lon <= 121.8 AND centroid_lat >= -7.8 AND centroid_lat <= -1.9 THEN 'Sulawesi Selatan'
    WHEN centroid_lon >= 119.4 AND centroid_lon <= 124.2 AND centroid_lat >= -3.6 AND centroid_lat <= 1.4 THEN 'Sulawesi Tengah'
    WHEN centroid_lon >= 120.9 AND centroid_lon <= 124.6 AND centroid_lat >= -6.2 AND centroid_lat <= -2.8 THEN 'Sulawesi Tenggara'
    WHEN centroid_lon >= 123.1 AND centroid_lon <= 127.2 AND centroid_lat >= 0.3 AND centroid_lat <= 5.6 THEN 'Sulawesi Utara'
    WHEN centroid_lon >= 98.6 AND centroid_lon <= 101.9 AND centroid_lat >= -3.3 AND centroid_lat <= 0.9 THEN 'Sumatera Barat'
    WHEN centroid_lon >= 102.1 AND centroid_lon <= 106.2 AND centroid_lat >= -5.0 AND centroid_lat <= -1.6 THEN 'Sumatera Selatan'
    WHEN centroid_lon >= 97.1 AND centroid_lon <= 100.4 AND centroid_lat >= -0.6 AND centroid_lat <= 4.3 THEN 'Sumatera Utara'
    ELSE 'Lainnya'
  END`;
