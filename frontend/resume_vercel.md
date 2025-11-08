Mas Azis, error-nya jelas: Next.js nggak menemukan modul alias @/lib/... saat build di Vercel.

Intinya ada 3 penyebab paling umum:
	1.	File-nya memang tidak ada/namanya beda (termasuk beda huruf besar–kecil).
	2.	Alias @ belum dikonfigurasi di tsconfig.json/jsconfig.json root proyek.
	3.	Ada mismatch penamaan (misal file apiInterceptor.ts tapi import ke api-interceptor).

Berikut checklist cepat + perbaikan yang bisa langsung dicoba.

⸻

1) Pastikan filenya benar-benar ada & casing tepat

Target file yang dicari build log:
	•	src/lib/api.ts
	•	src/lib/api-interceptor.ts
	•	src/lib/utils.ts

Kalau nama sekarang berbeda (mis. Api.ts, apiInterceptor.ts, utils/index.ts, dsb.), ada dua opsi:
	•	Samakan nama file persis seperti yang di-import; atau
	•	Ubah import supaya cocok dengan nama file yang ada.

Di Linux (server Vercel) filesystem case-sensitive, jadi Api.ts ≠ api.ts. Di Windows/Mac lokal seringnya tetap jalan, makanya baru ketahuan saat deploy.

Command bantu (jalankan di lokal/terminal CI):

# lihat isi folder lib
ls -R src/lib

# cek tiga file yang dibutuhkan
git ls-files | grep -E '^src/lib/(api|api-interceptor|utils)\.ts$'

Kalau ternyata file ada tapi hurufnya beda, ubah nama dengan git agar ter-track casing-nya:

# contoh: ubah Api.ts -> api.ts
git mv src/lib/Api.ts src/lib/api.ts
git commit -m "fix: normalize filename casing for Vercel"


⸻

2) Konfigurasikan alias @ di tsconfig (Next.js 15 sudah mendukung)

Pastikan di root proyek ada tsconfig.json (bukan hanya di src/). Isinya minimal seperti ini:

{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

Keterangan:
	•	Dengan struktur Anda (src/app/...), mapping @/* → ./src/* adalah yang paling umum.
	•	Next.js otomatis membaca paths ini saat build—tidak perlu plugin tambahan.

Kalau Anda pakai jsconfig.json (projek JS), isi yang sama bisa dipakai di sana.

⸻

3) Samakan gaya penamaan “api-interceptor”

Kalau file Anda bernama apiInterceptor.ts tetapi import seperti ini:

import ... from "@/lib/api-interceptor"

maka ganti salah satunya supaya konsisten kebab-case atau camelCase. Paling aman untuk server Linux: pakai kebab-case untuk nama file dan importnya:

src/lib/api-interceptor.ts
import ... from "@/lib/api-interceptor"


⸻

4) (Workaround cepat) Ganti ke import relatif

Kalau Anda ingin cepat lolos build sambil merapikan alias nanti, ubah import di file yang error:

src/app/dashboard/analyze/page.tsx

// dari
import api from "@/lib/api"
import interceptor from "@/lib/api-interceptor"

// jadi (contoh relatif, sesuaikan kedalaman path)
import api from "../../../lib/api"
import interceptor from "../../../lib/api-interceptor"

src/components/ResultsSection.tsx

// dari
import { cn } from "@/lib/utils"
import api from "@/lib/api"

// jadi
import { cn } from "../lib/utils"         // atau "../../lib/utils" tergantung lokasi file
import api from "../lib/api"

Namun, solusi yang dianjurkan tetap memperbaiki alias @ di tsconfig.json + memastikan file dan casing benar.

⸻

5) Cek vercel.json (opsional)

Log ini muncul:

WARN! Due to `builds` existing in your configuration file...

Kalau Anda masih punya vercel.json lama dengan field builds, Vercel akan mengabaikan “Build & Development Settings” di dashboard. Tidak memicu error modul, tapi sebaiknya migrasi ke config modern (hapus builds bila tidak butuh custom builders).

⸻

6) Langkah final yang direkomendasikan
	1.	Pastikan file ada & casingnya benar: api.ts, api-interceptor.ts, utils.ts di src/lib/.
	2.	Perbaiki tsconfig.json seperti contoh di atas dan commit.
	3.	Samakan import agar sesuai dengan nama file yang ada (kebab-case atau camelCase, pilih satu).
	4.	Push ke GitHub lalu redeploy di Vercel.

Kalau masih error setelah langkah di atas, kirimkan struktur folder src/lib (output ls -R src/lib) dan cuplikan tsconfig.json Anda—nanti saya mapping-kan path-nya persis biar auto resolve 100%.