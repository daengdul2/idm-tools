const DEFAULT_HEADER = {
  title: 'Laporan Penjualan Paling Murah Area HSM',
  period: '10-16 SEPT 2026',
  storeCode: 'T7YB',
};
const JUMLAH_ITEM_DEFAULT = 13;
const defaultItems = () => Array.from({ length: JUMLAH_ITEM_DEFAULT }, () => ({ name: '', target: 0 }));

let items = [];

/* ---------- Header ---------- */
function bacaHeader() {
  return {
    title: $('headerTitle').value,
    period: $('headerPeriod').value,
    storeCode: $('headerStoreCode').value,
  };
}

function isiHeader(h) {
  $('headerTitle').value = h.title;
  $('headerPeriod').value = h.period;
  $('headerStoreCode').value = h.storeCode;
}

function simpanHeader() { simpanData('salesReportHeaderObj', bacaHeader()); }

function teksHeader() {
  const { title, period, storeCode } = bacaHeader();
  let out = '';
  if (title.trim() || period.trim()) out += `${title.trim()} ${period.trim()}`.trim() + '\n\n';
  if (storeCode.trim()) out += `Kode toko : ${storeCode.trim()}\n`;
  return out + 'ITEM_TARGET_SALES_ACV';
}

/* ---------- Item ---------- */
function simpanItems() { simpanData('salesReportItems', items); }

function hitungAcv(sales, target) {
  const persen = target > 0 ? Math.round((sales / target) * 100) : 0;
  return persen + '%' + (persen >= 100 ? '✅' : '');
}

function renderForm() {
  const wadah = $('itemsContainer');
  wadah.innerHTML = items.map((it, i) => `
    <div class="item-card">
      <div class="item-head">
        <input type="text" data-f="name" data-i="${i}" value="${escapeHtml(it.name)}" placeholder="NAMA ITEM">
        <button class="btn btn-del" data-aksi="hapus" data-i="${i}">Hapus</button>
      </div>
      <div class="field-grid">
        <div class="field"><label>Target</label>
          <input type="number" inputmode="numeric" data-f="target" data-i="${i}" value="${it.target ?? ''}" placeholder="Target"></div>
        <div class="field"><label>Sales</label>
          <input type="number" inputmode="numeric" class="nav" data-f="sales" data-i="${i}" value="${it.sales ?? ''}" placeholder="Sales"></div>
        <div class="field"><label>ACV % (otomatis)</label>
          <input type="text" readonly data-f="acv" data-i="${i}" placeholder="0%"></div>
        <div class="field"><label>Stok (opsional)</label>
          <input type="number" inputmode="numeric" class="nav" data-f="stok" data-i="${i}" value="${it.stok ?? ''}" placeholder="Stok"></div>
      </div>
    </div>`).join('');
  items.forEach((_, i) => perbaruiAcv(i));
}

function perbaruiAcv(i) {
  const el = (f) => document.querySelector(`[data-f="${f}"][data-i="${i}"]`);
  el('acv').value = hitungAcv(parseFloat(el('sales').value) || 0, parseFloat(el('target').value) || 0);
}

function onInputItem(e) {
  const f = e.target.dataset.f;
  const i = Number(e.target.dataset.i);
  if (f === undefined || !items[i]) return;
  if (f === 'name') items[i].name = e.target.value;
  else if (f === 'target') items[i].target = parseFloat(e.target.value) || 0;
  else if (f === 'sales') items[i].sales = e.target.value;
  else if (f === 'stok') items[i].stok = e.target.value;
  else return;
  if (f === 'target' || f === 'sales') perbaruiAcv(i);
  simpanItems();
}

function onEnterItem(e) {
  if (e.key !== 'Enter' || !e.target.classList.contains('nav')) return;
  e.preventDefault();
  const navs = [...document.querySelectorAll('#itemsContainer .nav')];
  const next = navs[navs.indexOf(e.target) + 1];
  if (next) next.focus(); else buatTeks();
}

function onKlikItem(e) {
  const btn = e.target.closest('[data-aksi="hapus"]');
  if (!btn) return;
  const i = Number(btn.dataset.i);
  if (confirm(`Hapus item "${items[i].name}"?`)) {
    items.splice(i, 1);
    simpanItems();
    renderForm();
  }
}

function tambahItem() {
  items.push({ name: 'ITEM BARU', target: 0, sales: '', stok: '' });
  simpanItems();
  renderForm();
  document.querySelector(`[data-f="name"][data-i="${items.length - 1}"]`).focus();
}

function resetDefaultItems() {
  if (!confirm('Kembalikan daftar item ke susunan awal/default?')) return;
  items = defaultItems();
  simpanItems();
  renderForm();
}

function resetInput() {
  if (!confirm('Kosongkan nilai Sales dan Stok?')) return;
  items.forEach((it) => { it.sales = ''; it.stok = ''; });
  simpanItems();
  renderForm();
  $('outputManual').value = '';
}

/* ---------- Pembuat teks ---------- */
function barisLaporan(i, name, target, sales, acv, stok) {
  const tambahan = stok !== '' && stok != null ? `_${stok}` : '';
  return `${i + 1}. ${name}_${target}_${sales}_${acv}${tambahan}`;
}

function buatTeks() {
  const baris = items.map((it, i) =>
    barisLaporan(i, it.name.trim().toUpperCase(), it.target || 0, it.sales || 0,
      hitungAcv(parseFloat(it.sales) || 0, it.target || 0), it.stok ?? ''));
  $('outputManual').value = `${teksHeader()}\n\n${baris.join('\n')}\n`;
}

function convertTeks() {
  const raw = $('rawInput').value.trim();
  if (!raw) return tampilkanToast('Masukkan teks angka terlebih dahulu!', true);

  const [bagianSales, bagianStok = ''] = raw.split('/');
  const sales = bagianSales.trim().split(/\s+/).map(Number);
  const stok = bagianStok.trim() ? bagianStok.trim().split(/\s+/) : [];

  const baris = items.map((it, i) => {
    const s = Number.isFinite(sales[i]) ? sales[i] : 0;
    return barisLaporan(i, it.name.toUpperCase(), it.target || 0, s, hitungAcv(s, it.target || 0), stok[i] ?? '');
  });
  $('outputConvert').value = `${teksHeader()}\n\n${baris.join('\n')}\n`;
}

/* ---------- Import ---------- */
function parseLaporan(teks) {
  const bersih = teks.replace(/[\u200B-\u200F\uFEFF]/g, '');
  const baris = bersih.split('\n').map((l) => l.trim()).filter(Boolean);
  const header = { title: '', period: '', storeCode: '' };
  const hasil = [];
  // NAMA_TARGET_SALES_ACV% , NAMA_TARGET_SALES_TERJUAL_ACV% , NAMA_TARGET_SALES_ACV%_STOK
  const re = /^(?:\d+\.\s*)?(.+?)_(\d+)_(\d+)(?:_(\d+))?_(\d+%)?(?:✅)?(?:_(\d+))?$/;

  baris.forEach((line) => {
    const m = line.match(re);
    if (m) {
      let sales = parseFloat(m[3]) || 0;
      let stok = '';
      if (m[6] !== undefined) stok = m[6];
      else if (m[4] !== undefined && m[5] === undefined) sales = parseFloat(m[4]) || 0;
      hasil.push({ name: m[1].trim(), target: parseFloat(m[2]) || 0, sales, stok });
    } else if (/laporan penjualan/i.test(line)) {
      const bagian = line.split(/(?=\d{1,2}-\d{1,2})/);
      if (bagian.length > 1) { header.title = bagian[0].trim(); header.period = bagian.slice(1).join('').trim(); }
      else header.title = line;
    } else if (/kode toko/i.test(line)) {
      const k = line.match(/kode toko\s*:\s*(.*)/i);
      if (k) header.storeCode = k[1].trim();
    }
  });
  return { header, hasil };
}

function importLaporan() {
  const teks = $('importInput').value.trim();
  if (!teks) return tampilkanToast('Tempel teks laporan terlebih dahulu!', true);

  const { header, hasil } = parseLaporan(teks);
  if (!hasil.length) return tampilkanToast('Tidak ada item terdeteksi. Periksa format teks.', true);
  if (!confirm(`Terdeteksi ${hasil.length} item dari teks laporan.\n\nLanjutkan import ke form?`)) return;

  const h = bacaHeader();
  isiHeader({ title: header.title || h.title, period: header.period || h.period, storeCode: header.storeCode || h.storeCode });
  simpanHeader();
  items = hasil;
  simpanItems();
  renderForm();
  $('importInput').value = '';
  gantiTab('manual');
  buatTeks();
  tampilkanToast('Import berhasil!');
}

/* ---------- Tab ---------- */
function gantiTab(nama) {
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === nama));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + nama));
  if (nama === 'convert') {
    $('itemsPreview').innerHTML = `Jumlah item terdeteksi: <strong>${items.length}</strong> (mengikuti susunan dari tab Input)`;
  }
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  items = ambilData('salesReportItems', null) || defaultItems();
  isiHeader({ ...DEFAULT_HEADER, ...ambilData('salesReportHeaderObj', {}) });
  renderForm();

  document.querySelectorAll('.tab-btn').forEach((b) => b.addEventListener('click', () => gantiTab(b.dataset.tab)));
  ['headerTitle', 'headerPeriod', 'headerStoreCode'].forEach((id) => $(id).addEventListener('input', simpanHeader));
  $('btnResetHeader').onclick = () => { isiHeader(DEFAULT_HEADER); simpanHeader(); };

  const wadah = $('itemsContainer');
  wadah.addEventListener('input', onInputItem);
  wadah.addEventListener('keydown', onEnterItem);
  wadah.addEventListener('click', onKlikItem);

  $('btnAddItem').onclick = tambahItem;
  $('btnGenerate').onclick = buatTeks;
  $('btnCopyManual').onclick = () => salinKeClipboard('outputManual', { sukses: 'Laporan berhasil disalin!' });
  $('btnResetForm').onclick = resetInput;
  $('btnRestoreItems').onclick = resetDefaultItems;
  $('btnConvert').onclick = convertTeks;
  $('btnCopyConvert').onclick = () => salinKeClipboard('outputConvert', { sukses: 'Laporan berhasil disalin!' });
  $('btnImport').onclick = importLaporan;
});
