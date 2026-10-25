/* ============================================================
   PORTAL — file manager lokal (halaman utama)
   ============================================================ */

/* ---------- Ikon (SVG inline, tanpa library eksternal) ---------- */
const IKON = {
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  'folder-tree': '<path d="M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"/><path d="M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"/><path d="M3 5a2 2 0 0 0 2 2h3"/><path d="M3 3v13a2 2 0 0 0 2 2h3"/>',
  'folder-open': '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
  'folder-x': '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="m9.5 10.5 5 5"/><path d="m14.5 10.5-5 5"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  'file-code': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  film: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
};

function ikon(nama, ukuran = 18) {
  return `<svg class="icon" width="${ukuran}" height="${ukuran}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IKON[nama] || IKON.file}</svg>`;
}

/* ---------- Tipe file ---------- */
const EXT = {
  image:   ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'],
  video:   ['mp4', 'webm', 'mov', 'ogv', 'm4v'],
  audio:   ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'],
  pdf:     ['pdf'],
  web:     ['html', 'htm'],
  code:    ['js', 'mjs', 'cjs', 'ts', 'jsx', 'tsx', 'json', 'css', 'scss', 'py', 'java', 'kt', 'xml', 'sh', 'bat', 'php', 'c', 'cpp', 'h', 'go', 'rs', 'sql', 'yml', 'yaml', 'toml', 'ini', 'env', 'gradle'],
  text:    ['txt', 'md', 'log', 'csv', 'tsv', 'conf', 'cfg'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'apk'],
};
const IKON_JENIS = { image: 'image', video: 'film', audio: 'music', pdf: 'file-text', web: 'globe', code: 'file-code', text: 'file-text', archive: 'archive', other: 'file' };

function jenisFile(nama) {
  const dot = nama.lastIndexOf('.');
  const ext = dot > 0 ? nama.slice(dot + 1).toLowerCase() : '';
  return Object.keys(EXT).find((k) => EXT[k].includes(ext)) || 'other';
}

function formatUkuran(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return bytes + ' B';
  const satuan = ['KB', 'MB', 'GB', 'TB'];
  let v = bytes / 1024, i = 0;
  while (v >= 1024 && i < satuan.length - 1) { v /= 1024; i++; }
  return v.toFixed(v < 10 ? 1 : 0) + ' ' + satuan[i];
}

const formatTanggal = (ms) => new Date(ms).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/* ---------- State ---------- */
let pathSekarang = '';
let semuaItem = [];
let itemTampil = [];
let tampilan = 'grid';
let urutan = 'name';
let idPermintaan = 0;
let indexUrl = null;

try {
  const v = localStorage.getItem('fm.view');
  const s = localStorage.getItem('fm.sort');
  if (v === 'grid' || v === 'list') tampilan = v;
  if (['name', 'size', 'date'].includes(s)) urutan = s;
} catch (e) { /* abaikan */ }

/* ---------- Navigasi ---------- */
function pathDariHash() {
  try {
    return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent).join('/');
  } catch (e) { return ''; }
}

function navigasi(path) {
  const hash = '#/' + path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  const sama = (location.hash || '#/') === hash || (!path && (location.hash === '' || location.hash === '#/' || location.hash === '#'));
  if (sama) muatFolder(path); else location.hash = hash;
}

/* ---------- Muat folder ---------- */
async function muatFolder(path = '') {
  const saya = ++idPermintaan;
  if (path !== pathSekarang) $('searchInput').value = '';
  pathSekarang = path;
  renderBreadcrumb();

  try {
    const res = await fetch('/api/files?path=' + encodeURIComponent(path));
    const data = await res.json().catch(() => ({}));
    if (saya !== idPermintaan) return;
    if (!res.ok) throw new Error(data.error || 'Gagal memuat folder.');
    semuaItem = data.items;
    indexUrl = data.indexUrl || null;
    renderTombolIndex();
    terapkanFilter();
  } catch (err) {
    if (saya !== idPermintaan) return;
    semuaItem = [];
    itemTampil = [];
    indexUrl = null;
    renderTombolIndex();
    $('itemCount').textContent = '';
    tampilkanPesan('folder-x', err.message, true);
  }
}

function terapkanFilter() {
  const q = $('searchInput').value.trim().toLowerCase();
  const hasil = q ? semuaItem.filter((i) => i.name.toLowerCase().includes(q)) : semuaItem.slice();

  hasil.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    if (urutan === 'size') return (b.size || 0) - (a.size || 0) || a.name.localeCompare(b.name);
    if (urutan === 'date') return b.mtime - a.mtime;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });

  itemTampil = hasil;
  renderItem(q);
}

/* ---------- Render ---------- */
function renderTombolIndex() {
  $('indexAction').innerHTML = indexUrl
    ? `<a href="${escapeHtml(indexUrl)}" target="_blank" class="btn btn-soft btn-sm" title="Buka file index folder ini">${ikon('globe', 14)} Buka Index</a>`
    : '';
}

function renderBreadcrumb() {
  const segmen = pathSekarang ? pathSekarang.split('/') : [];
  const crumb = (label, path, terakhir) => terakhir
    ? `<span>${escapeHtml(label)}</span>`
    : `<button data-path="${escapeHtml(path)}">${escapeHtml(label)}</button>`;

  let html = crumb('projects', '', segmen.length === 0);
  let acc = '';
  segmen.forEach((seg, i) => {
    acc += (acc ? '/' : '') + seg;
    html += ikon('chevron', 14) + crumb(seg, acc, i === segmen.length - 1);
  });
  $('breadcrumb').innerHTML = html;
  $('upBtn').disabled = !pathSekarang;
}

function tampilkanPesan(ikonNama, teks, tombolRoot = false) {
  $('fileContainer').innerHTML = `
    <div class="empty-box">
      ${ikon(ikonNama, 40)}
      <p style="margin:0">${escapeHtml(teks)}</p>
      ${tombolRoot ? '<button data-root class="btn btn-ghost btn-sm">Kembali ke root</button>' : ''}
    </div>`;
}

function renderItem(query = '') {
  $('itemCount').textContent = `${itemTampil.length} item`;
  $('viewToggle').innerHTML = ikon(tampilan === 'grid' ? 'list' : 'grid');

  if (!itemTampil.length) {
    tampilkanPesan(query ? 'search' : 'folder-open', query ? `Tidak ada hasil untuk "${query}".` : 'Folder ini kosong.');
    return;
  }

  const baris = itemTampil.map((item, i) => {
    const jenis = item.isDir ? 'folder' : jenisFile(item.name);
    const namaIkon = item.isDir ? 'folder' : IKON_JENIS[jenis];
    const nama = escapeHtml(item.name);
    const sub = item.isDir ? 'Folder' : `${formatUkuran(item.size)} · ${formatTanggal(item.mtime)}`;
    const badgeIndex = item.isDir && item.indexUrl ? `<span class="has-index" title="Memiliki file index">${ikon('globe', 14)}</span>` : '';
    const aksi = item.isDir
      ? `<div class="file-actions">${badgeIndex}<button data-enter class="btn btn-ghost btn-icon" title="Buka folder">${ikon('chevron')}</button></div>`
      : `<div class="file-actions"><button data-newtab class="btn btn-ghost btn-icon" title="Buka di tab baru">${ikon('external')}</button></div>`;
    const ic = `<div class="ic ic-${jenis}">${ikon(namaIkon, tampilan === 'list' ? 16 : 20)}</div>`;

    if (tampilan === 'list') {
      return `<div class="file" data-i="${i}" tabindex="0">${ic}
        <div class="file-info"><p class="file-name">${nama}</p></div>
        <span class="file-meta">${item.isDir ? '' : formatUkuran(item.size)}</span>
        <span class="file-meta wide">${formatTanggal(item.mtime)}</span>${aksi}</div>`;
    }
    return `<div class="file" data-i="${i}" tabindex="0">${ic}
      <div class="file-info"><p class="file-name">${nama}</p><p class="file-sub">${sub}</p></div>${aksi}</div>`;
  }).join('');

  $('fileContainer').innerHTML = `<div class="${tampilan === 'list' ? 'file-list' : 'file-grid'}">${baris}</div>`;
}

/* ---------- Buka file ---------- */
async function bukaFile(item) {
  const jenis = jenisFile(item.name);
  if (jenis === 'web' || jenis === 'archive') return void window.open(item.url, '_blank');

  bukaModal(item, '<p class="note">Memuat...</p>');
  const url = escapeHtml(item.url);

  if (jenis === 'image') isiModal(`<img class="preview-img" src="${url}" alt="${escapeHtml(item.name)}">`);
  else if (jenis === 'video') isiModal(`<video src="${url}" controls style="width:100%;max-height:75vh;background:#000;border-radius:8px"></video>`);
  else if (jenis === 'audio') isiModal(`<audio src="${url}" controls style="width:100%"></audio>`);
  else if (jenis === 'pdf') isiModal(`<iframe class="preview-frame" src="${url}"></iframe>`);
  else {
    try {
      const res = await fetch('/api/read?path=' + encodeURIComponent(item.path));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        tutupModal();
        if (res.status === 415) window.open(item.url, '_blank');
        else tampilkanToast(data.error || 'Gagal membuka file.', true);
        return;
      }
      const catatan = data.truncated
        ? `<p class="alert" style="margin:0 0 10px">File besar (${formatUkuran(data.size)}), hanya 1 MB pertama yang ditampilkan.</p>`
        : '';
      isiModal(`${catatan}<pre id="textPreview" class="output-pre"></pre>`);
      $('textPreview').textContent = data.content || '(file kosong)';
    } catch (e) {
      tutupModal();
      tampilkanToast('Gagal membuka file.', true);
    }
  }
}

function bukaModal(item, html) {
  $('modalTitle').textContent = item.name;
  $('modalNewTab').href = item.url;
  $('modalDownload').href = item.url;
  $('modalDownload').setAttribute('download', item.name);
  isiModal(html);
  $('modal').classList.remove('hidden');
  document.body.classList.add('no-scroll');
}

const isiModal = (html) => { $('modalBody').innerHTML = html; };

function tutupModal() {
  $('modal').classList.add('hidden');
  $('modalBody').innerHTML = '';
  document.body.classList.remove('no-scroll');
}

/* ---------- Tema ---------- */
function renderTombolTema() {
  $('themeBtn').innerHTML = ikon(temaAktif() === 'dark' ? 'sun' : 'moon');
}

/* ---------- Event ---------- */
function itemDariBaris(el) {
  const row = el.closest('[data-i]');
  return row ? itemTampil[Number(row.dataset.i)] : null;
}

$('fileContainer').addEventListener('click', (e) => {
  if (e.target.closest('[data-root]')) return navigasi('');

  if (e.target.closest('[data-enter]')) {
    const item = itemDariBaris(e.target);
    if (item) navigasi(item.path);
    return;
  }
  if (e.target.closest('[data-newtab]')) {
    const item = itemDariBaris(e.target);
    if (item) window.open(item.url, '_blank');
    return;
  }

  const item = itemDariBaris(e.target);
  if (!item) return;
  if (!item.isDir) return void bukaFile(item);
  // Folder: buka index jika ada, jika tidak masuk ke folder
  if (item.indexUrl) window.open(item.indexUrl, '_blank'); else navigasi(item.path);
});

$('fileContainer').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const row = e.target.closest('[data-i]');
  if (row) row.click();
});

$('breadcrumb').addEventListener('click', (e) => {
  const b = e.target.closest('[data-path]');
  if (b) navigasi(b.dataset.path);
});
$('upBtn').addEventListener('click', () => navigasi(pathSekarang.split('/').slice(0, -1).join('/')));
$('refreshBtn').addEventListener('click', () => muatFolder(pathSekarang));
$('searchInput').addEventListener('input', terapkanFilter);
$('sortSelect').addEventListener('change', (e) => {
  urutan = e.target.value;
  try { localStorage.setItem('fm.sort', urutan); } catch (err) { /* abaikan */ }
  terapkanFilter();
});
$('viewToggle').addEventListener('click', () => {
  tampilan = tampilan === 'grid' ? 'list' : 'grid';
  try { localStorage.setItem('fm.view', tampilan); } catch (err) { /* abaikan */ }
  renderItem($('searchInput').value.trim());
});
$('themeBtn').addEventListener('click', () => {
  aturTema(temaAktif() === 'dark' ? 'light' : 'dark');
  renderTombolTema();
});
$('modalClose').addEventListener('click', tutupModal);
$('modal').addEventListener('click', (e) => { if (e.target === $('modal')) tutupModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') tutupModal(); });
window.addEventListener('hashchange', () => muatFolder(pathDariHash()));

/* ---------- Mulai ---------- */
$('brandIcon').innerHTML = ikon('folder-tree', 28);
$('upBtn').innerHTML = ikon('up');
$('refreshBtn').innerHTML = ikon('refresh');
$('modalNewTab').innerHTML = ikon('external');
$('modalDownload').innerHTML = ikon('download');
$('modalClose').innerHTML = ikon('x');
$('sortSelect').value = urutan;
renderTombolTema();
muatFolder(pathDariHash());
