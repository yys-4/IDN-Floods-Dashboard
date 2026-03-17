# 🌊 Banjir Indonesia - Flood Visualisation

*(English version available below)*

---

## 🇮🇩 Bahasa Indonesia

### 📖 Deskripsi Proyek
Proyek ini merupakan visualisasi interaktif data kejadian banjir di seluruh wilayah Indonesia yang bersumber dari observasi satelit (*ground-source data*). Melalui repositori ini, saya menghadirkan antarmuka (frontend) berperforma tinggi untuk memproses lebih dari 370.000 catatan data luasan banjir pada rentang tahun 2000 hingga awal 2026. 

Aplikasi ini dirancang untuk memanfaatkan teknologi WebAssembly (WASM), sehingga proses komputasi data tidak membebani server dan langsung berjalan dengan sangat cepat di perangkat peramban (*browser*) para pengguna. Informasi spasial rumit disajikan secara intuitif, sehingga sangat mudah dipahami baik oleh peneliti data spasial, pengembang piranti lunak, pembuat kebijakan pemerintahan, maupun masyarakat awam.

### ✨ Fitur Utama
*   **Pemrosesan Data Skala Besar Langsung di Browser**: Menganalisis sumber data raksasa dengan format modern `.parquet` menggunakan **DuckDB-WASM** tanpa harus menunggu respons dari *backend* server.
*   **Visualisasi Peta Responsif Berkualitas Tinggi**: Pemetaan grafis dan poligon geometri spasial yang efisien menggunakan perpaduan **Deck.gl** dan **MapLibre**. 
*   **Antarmuka Dinamis & Interaktif**: Menghadirkan seleksi dan filter rentang tanggal banjir, pemetaan lokasi, grafis interaktif, dengan estetika web modern yang ramah pengguna.

### 🛠️ Teknologi yang Digunakan
*   **Framework (*Frontend*)**: Next.js 16 & React 19
*   **Data Processing / Query**: DuckDB-WASM
*   **Geospasial / Visualisasi Peta**: @deck.gl/react & MapLibre
*   **Styling**: Tailwind CSS v4 & Lucide React

### 🚀 Cara Menjalankan Aplikasi (Instruksi Developer)

Jika Anda developer atau peneliti yang ingin menjalankan *source code* di mesin pribadi Anda:

1.  Pastikan lingkungan Anda mendukung **Node.js** (versi 20 atau di atasnya).
2.  Buka direktori proyek (dalam direktori `web`) dan jalankan instalasi *package*:
    ```bash
    npm install
    # atau `yarn install` / `pnpm install`
    ```
3.  Konfigurasi dan jalankan server pengembangan (*development server*):
    ```bash
    npm run dev
    ```
    > **Catatan Teknis DuckDB**: Eksekusi perintah `run dev` di proyek ini menggunakan instruksi spesifik `--webpack`. Modul DuckDB-WASM rentan terjadi konflik (*bug*) bila disandingkan dengan utilitas *bundler* Next yang baru (Turbopack).
4.  Akses antarmuka utama proyek pada peramban web di alamat: [http://localhost:3000](http://localhost:3000).

### 🤝 Peluang Kolaborasi Riset
Sistem proyek ini pada awalnya dibangun karena sebuah minat, namun rancangannya terbuka sepenuhnya untuk wadah **Kolaborasi Riset Akademis dan Analisis** di masa kini maupun di masa mendatang!

Bagi mahasiswa, sivitas akademika, lembaga pemerintahan/kebencanaan, akademisi luar negeri, hingga pegiat sains dan teknologi—apakah Anda memiliki hipotesis seperti:
*   "Apakah integrasi Machine Learning dapat memprediksi lokasi kerentanan banjir selanjutnya berdasarkan tren DuckDB ini?"
*   "Mungkinkah kita mengevaluasi jejak ketahanan infrastruktur di pulau-pulau terdalam dari set data spasial ini?"
*   "Dapatkah ini diekstensi untuk menjadi arsitektur aplikasi *micro-compute* spasial generasi terbaru?"

Sampaikan gagasan riset Anda! Saya menyambut segala eksperimen dan kerja sama formal/informal. Ajukan `Issue` pada repositori, luncurkan *Pull Request*, atau gunakan kontak profil GitHub ini untuk menyapa kami.

---

## 🇬🇧 English

### 📖 Project Overview
This project presents an interactive web-based visualisation of flood events across the entire **Indonesian archipelago**, sourced from multi-decade ground-source satellite observational data. The **`web`** application directory houses a highly-optimized frontend graphical interface capable of processing and illuminating over 370,000 respective flood data points spanning dynamically from early 2000 up to 2026.

Fundamentally built utilizing cutting-edge WebAssembly (WASM), complex analytics operate entirely safely inside the user’s local browser context. No expensive backend computing is required. We designed the experience to be immensely intuitive and smooth. It effortlessly conveys nuanced geographical trends not only to data scientists or software developers, but equally to policymakers and the broader general public.

### ✨ Key Features
*   **High-Speed In-Browser Analytics**: Transparently maps and queries massive `.parquet` dataset files locally utilizing **DuckDB-WASM** without network latency logic.
*   **High-Fidelity Interactive Map Engine**: Unlocks performant and smooth spatial geometry rendering pipelines powered dynamically by **Deck.gl** and **MapLibre**.
*   **Dynamic Data Exploration**: Granular metric configurations and immersive time-frame mapping parameters utilizing an elegant native UI schema.

### 🛠️ Tech Stack Ecosystem
*   **Web Framework**: Next.js 16 & React 19
*   **Database Engine**: DuckDB-WASM 
*   **Map Projection Platform**: @deck.gl/react & MapLibre
*   **Styling Libraries**: Tailwind CSS v4 & Lucide React

### 🚀 Getting Started (Developer Setup)

To bootstrap this Next.js project locally to construct your own iteration:

1.  Confirm that an up-to-date version of **Node.js** (v20+) is installed.
2.  Install all requisite JS dependencies inside the `web` folder:
    ```bash
    npm install
    # or alternatively `yarn`, `pnpm`
    ```
3.  Boot the application's development preview server:
    ```bash
    npm run dev
    ```
    > **WASM Concurrency Note**: The scripts implement the `--webpack` flag implicitly. DuckDB WebAssembly builds are presently incompatible with Next.js newer 'Turbopack' implementations.
4.  Navigate to [http://localhost:3000](http://localhost:3000) inside your web browser.

### 🤝 Research Collaboration Opportunities
This endeavor was architected purposely to promote **Extensive Academic and Inter-Disciplinary Research Collaborations** natively!

To students, university academics, crisis-response agencies, and impassioned geospatial researchers—are you exploring the following queries?
*   "Can we harness Machine Learning topologies over these distributed data frameworks to infer accurate hydrological predictive thresholds?"
*   "What constitutes socio-infrastructural damage ratios based on recurrent geographical patterns from these archives?"
*   "How could we mutate these WebAssembly constraints into advanced distributed geotech frameworks?"

I would absolute love to hear what problems you're trying to validate. Feel absolutely free to open a repository `Issue`, propose architectural modifications via a *Pull Request*, or ping these profiles directly! You are immensely encouraged to formulate collaborative projects!
