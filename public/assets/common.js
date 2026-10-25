/* ============================================================
   COMMON.JS — fungsi bersama semua halaman
   ============================================================ */

/* ---- Tema: terapkan pilihan tersimpan sebelum halaman tampil ---- */
(function () {
  try {
    const t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  } catch (e) { /* abaikan */ }
})();

function aturTema(mode) {
  if (mode === 'light' || mode === 'dark') {
    document.documentElement.dataset.theme = mode;
    try { localStorage.setItem('theme', mode); } catch (e) { /* abaikan */ }
  } else {
    delete document.documentElement.dataset.theme;
    try { localStorage.removeItem('theme'); } catch (e) { /* abaikan */ }
  }
}

function temaAktif() {
  const t = document.documentElement.dataset.theme;
  if (t) return t;
  return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/* ---- Util umum ---- */
const $ = (id) => document.getElementById(id);

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* ---- Toast ---- */
let _toastTimer;
function tampilkanToast(pesan, galat) {
  let el = $('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = pesan;
  el.classList.toggle('err', !!galat);
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

/* ---- Clipboard ---- */
function salinTeks(teks) {
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = teks;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { /* abaikan */ }
    document.body.removeChild(ta);
    return ok;
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(teks).then(() => true, () => fallback());
  }
  return Promise.resolve(fallback());
}

/** Salin isi <textarea>/<input> ber-id `elementId`, lalu tampilkan toast. */
async function salinKeClipboard(elementId, { kosong = 'Belum ada teks untuk disalin!', sukses = 'Berhasil disalin!' } = {}) {
  const el = $(elementId);
  const teks = el ? (el.value !== undefined ? el.value : el.textContent) : '';
  if (!teks) return tampilkanToast(kosong, true);
  const ok = await salinTeks(teks);
  tampilkanToast(ok ? sukses : 'Gagal menyalin', !ok);
}

/* ---- localStorage (JSON) ---- */
function simpanData(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { console.error('Gagal menyimpan data:', e); }
}

function ambilData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}

/* ---- Unduh file ---- */
function unduhBlob(blob, namaFile) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = namaFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Ubah elemen SVG menjadi PNG (data URL) beserta ukurannya. */
function svgKePng(svgEl, skala = 3) {
  return new Promise((resolve, reject) => {
    const xml = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * skala;
      canvas.height = img.height * skala;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.width, height: img.height });
    };
    img.onerror = () => reject(new Error('Gagal membuat gambar'));
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
  });
}
