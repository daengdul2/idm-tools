const KUNCI_DATA = 'saybread_opname_data';   // dipertahankan agar data lama tetap terbaca
const KUNCI_TOKO = 'opname_store_name';
const KATEGORI_DEFAULT = 'Umum';

let products = [];
let storeName = '';
let filter = 'all';
let kataKunci = '';

/* ---------- Helper status hitung ---------- */
const sudahDihitung = (p) => p.physicalStock !== null && p.physicalStock !== undefined && p.physicalStock !== '';
const selisih = (p) => Number(p.physicalStock) - Number(p.systemStock);
const cari = (plu) => products.find((p) => p.plu === plu);

function simpan() {
  simpanData(KUNCI_DATA, products);
  isiDaftarKategori();
  perbaruiStatistik();
}

function simpanDanRender() { simpan(); renderTabel(); }

/* ---------- Tampilan ---------- */
function isiDaftarKategori() {
  const kategori = [...new Set(products.map((p) => (p.category || '').trim()).filter(Boolean))].sort();
  $('categoryList').innerHTML = kategori.map((c) => `<option value="${escapeHtml(c)}"></option>`).join('');
}

function perbaruiStatistik() {
  const dihitung = products.filter(sudahDihitung);
  const beda = dihitung.filter((p) => selisih(p) !== 0);
  const total = dihitung.reduce((acc, p) => acc + selisih(p), 0);

  $('statTotal').textContent = products.length;
  $('statDone').textContent = dihitung.length;
  $('statDiff').textContent = beda.length;
  const el = $('statVar');
  el.textContent = (total > 0 ? '+' : '') + total;
  el.className = 'stat-value ' + (total < 0 ? 'text-bad' : total > 0 ? 'text-ok' : '');
}

function lencana(p) {
  if (!sudahDihitung(p)) return { selisih: '<span class="note">-</span>', status: '<span class="badge">Belum</span>' };
  const d = selisih(p);
  if (d === 0) return { selisih: '<span class="badge badge-ok">0</span>', status: '<span class="badge badge-ok">Sesuai</span>' };
  if (d < 0) return { selisih: `<span class="badge badge-bad">${d}</span>`, status: '<span class="badge badge-bad">Kurang</span>' };
  return { selisih: `<span class="badge badge-info">+${d}</span>`, status: '<span class="badge badge-info">Lebih</span>' };
}

function stepper(plu, jenis, nilai, placeholder = '') {
  return `<div class="stepper">
    <button class="btn btn-ghost" data-aksi="kurang" data-jenis="${jenis}" data-plu="${escapeHtml(plu)}" aria-label="Kurangi">−</button>
    <input type="number" min="0" inputmode="numeric" value="${nilai}" placeholder="${placeholder}" data-aksi="ubah" data-jenis="${jenis}" data-plu="${escapeHtml(plu)}">
    <button class="btn btn-ghost" data-aksi="tambah" data-jenis="${jenis}" data-plu="${escapeHtml(plu)}" aria-label="Tambah">+</button>
  </div>`;
}

function renderTabel() {
  const q = kataKunci.toLowerCase();
  const daftar = products.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q) && !p.plu.toLowerCase().includes(q)) return false;
    const selesai = sudahDihitung(p);
    if (filter === 'discrepancy') return selesai && selisih(p) !== 0;
    if (filter === 'completed') return selesai;
    if (filter === 'pending') return !selesai;
    return true;
  });

  $('emptyState').classList.toggle('hidden', daftar.length > 0);
  $('tableBody').innerHTML = daftar.map((p) => {
    const b = lencana(p);
    return `<tr>
      <td>
        <div class="cell-title">${escapeHtml(p.name)}</div>
        <div class="cell-sub"><span>PLU: <b class="mono">${escapeHtml(p.plu)}</b></span><span class="badge badge-warn">${escapeHtml(p.category || KATEGORI_DEFAULT)}</span></div>
      </td>
      <td class="num">${stepper(p.plu, 'sistem', p.systemStock)}</td>
      <td class="num">${stepper(p.plu, 'fisik', sudahDihitung(p) ? Number(p.physicalStock) : '', '0')}</td>
      <td class="num">${b.selisih}</td>
      <td class="num">${b.status}</td>
      <td class="num"><button class="btn btn-del" data-aksi="hapus" data-plu="${escapeHtml(p.plu)}" title="Hapus item">🗑</button></td>
    </tr>`;
  }).join('');
}

/* ---------- Aksi pada baris tabel ---------- */
function ubahStok(plu, jenis, fn) {
  const p = cari(plu);
  if (!p) return;
  if (jenis === 'sistem') p.systemStock = Math.max(0, fn(Number(p.systemStock) || 0));
  else p.physicalStock = Math.max(0, fn(sudahDihitung(p) ? Number(p.physicalStock) : 0));
  simpanDanRender();
}

function aksiTabel(e) {
  const el = e.target.closest('[data-aksi]');
  if (!el) return;
  const { aksi, jenis, plu } = el.dataset;

  if (aksi === 'tambah') ubahStok(plu, jenis, (n) => n + 1);
  else if (aksi === 'kurang') ubahStok(plu, jenis, (n) => n - 1);
  else if (aksi === 'hapus') {
    if (!confirm(`Apakah Anda yakin ingin menghapus item PLU ${plu} dari daftar?`)) return;
    products = products.filter((p) => p.plu !== plu);
    simpanDanRender();
    tampilkanToast('Item berhasil dihapus');
  }
}

function inputTabel(e) {
  const el = e.target;
  if (el.dataset.aksi !== 'ubah' || e.type !== 'change') return;
  const p = cari(el.dataset.plu);
  if (!p) return;
  if (el.dataset.jenis === 'sistem') p.systemStock = Math.max(0, parseInt(el.value, 10) || 0);
  else p.physicalStock = el.value === '' ? null : Math.max(0, parseInt(el.value, 10) || 0);
  simpanDanRender();
}

/* ---------- Modal ---------- */
const bukaModal = (id) => $(id).classList.remove('hidden');
const tutupModal = (id) => $(id).classList.add('hidden');

function tambahItem(e) {
  e.preventDefault();
  const plu = $('newPlu').value.trim();
  if (cari(plu)) return tampilkanToast('PLU sudah ada dalam daftar opname!', true);
  products.unshift({
    plu,
    name: $('newName').value.trim(),
    category: $('newCategory').value.trim() || KATEGORI_DEFAULT,
    systemStock: parseInt($('newStock').value, 10) || 0,
    physicalStock: null,
  });
  simpanDanRender();
  $('addForm').reset();
  $('newCategory').value = KATEGORI_DEFAULT;
  tutupModal('addModal');
  tampilkanToast('Item berhasil ditambahkan');
}

function prosesImport() {
  const kategori = $('importCategory').value.trim() || KATEGORI_DEFAULT;
  let tambah = 0, lewat = 0;

  $('importText').value.split('\n').forEach((baris) => {
    const teks = baris.trim();
    const koma = teks.indexOf(',');
    if (!teks || koma === -1) return;

    const plu = teks.slice(0, koma).trim();
    const sisa = teks.slice(koma + 1).trim();
    const m = sisa.match(/(.*?)\s+(\d+)$/);   // angka di akhir = stok sistem
    if (cari(plu)) { lewat++; return; }
    products.push({
      plu,
      name: m ? m[1].trim() : sisa,
      category: kategori,
      systemStock: m ? parseInt(m[2], 10) : 0,
      physicalStock: null,
    });
    tambah++;
  });

  if (!tambah) return tampilkanToast('Tidak ada item baru. Periksa format atau PLU sudah ada.', true);
  simpanDanRender();
  tampilkanToast(`${tambah} item berhasil diimport` + (lewat ? ` (${lewat} dilewati)` : ''));
  $('importText').value = '';
  tutupModal('importModal');
}

/* ---------- Ekspor ---------- */
const csvSel = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function unduhCsv() {
  $('exportMenu').classList.add('hidden');
  const baris = ['PLU,Nama Produk,Kategori,Stok Sistem,Stok Fisik,Selisih,Status'];
  products.forEach((p) => {
    const selesai = sudahDihitung(p);
    const d = selesai ? selisih(p) : '';
    const status = !selesai ? 'Belum' : d === 0 ? 'Sesuai' : d < 0 ? 'Kurang' : 'Lebih';
    baris.push([csvSel(p.plu), csvSel(p.name), csvSel(p.category), p.systemStock, selesai ? p.physicalStock : '', d, csvSel(status)].join(','));
  });

  const slug = storeName ? storeName.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') + '_' : '';
  const blob = new Blob(['\uFEFF' + baris.join('\n')], { type: 'text/csv;charset=utf-8' });
  unduhBlob(blob, `Stok_Opname_${slug}${new Date().toISOString().slice(0, 10)}.csv`);
  tampilkanToast('File CSV berhasil diunduh');
}

function buatBap() {
  $('exportMenu').classList.add('hidden');
  const now = new Date();
  const dihitung = products.filter(sudahDihitung);
  const beda = dihitung.filter((p) => selisih(p) !== 0);
  const garis = '='.repeat(49);

  let t = `${garis}\n      BERITA ACARA STOK OPNAME (BAP)\n${garis}\n`;
  t += `Toko          : ${storeName || '-'}\n`;
  t += `Tanggal Audit : ${now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
  t += `Waktu Selesai : ${now.toLocaleTimeString('id-ID')}\n${'-'.repeat(49)}\n`;
  t += `RINGKASAN AUDIT:\n- Total SKU/PLU        : ${products.length} Item\n- Terhitung            : ${dihitung.length} Item\n- Terdapat Selisih     : ${beda.length} Item\n${'-'.repeat(49)}\n\n`;
  t += 'RINCIAN ITEM SELISIH / DISCREPANCY:\n';

  if (!beda.length) {
    t += '(Tidak ada selisih ditemukan. Semua stok fisik sesuai sistem)\n';
  } else {
    t += 'PLU           | NAMA ITEM                    | SIS | FIS | SELISIH\n';
    t += '--------------+------------------------------+-----+-----+--------\n';
    beda.forEach((p) => {
      const d = selisih(p);
      t += `${p.plu.slice(0, 13).padEnd(13)} | ${p.name.slice(0, 28).padEnd(28)} | ${String(p.systemStock).padStart(3)} | ${String(p.physicalStock).padStart(3)} | ${(d > 0 ? '+' + d : String(d)).padStart(6)}\n`;
    });
  }
  t += `\n${garis}\nDibuat Oleh,                   Disetujui Oleh,\n\n\n\n( Petugas Opname )             ( Store Manager )\n`;

  $('bapContent').textContent = t;
  bukaModal('bapModal');
}

/* ---------- Init ---------- */
function tampilkanNamaToko() {
  $('storeLabel').textContent = storeName || 'Pencatatan stok fisik seluruh item';
}

document.addEventListener('DOMContentLoaded', () => {
  const tersimpan = ambilData(KUNCI_DATA, []);
  products = Array.isArray(tersimpan) ? tersimpan : [];
  storeName = localStorage.getItem(KUNCI_TOKO) || '';
  tampilkanNamaToko();
  isiDaftarKategori();
  renderTabel();
  perbaruiStatistik();

  const tbody = $('tableBody');
  tbody.addEventListener('click', aksiTabel);
  tbody.addEventListener('change', inputTabel);

  $('search').addEventListener('input', (e) => { kataKunci = e.target.value.trim(); renderTabel(); });
  $('filters').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-filter]');
    if (!b) return;
    filter = b.dataset.filter;
    document.querySelectorAll('#filters button').forEach((x) => x.classList.toggle('active', x === b));
    renderTabel();
  });

  $('btnAdd').onclick = () => bukaModal('addModal');
  $('btnImport').onclick = () => bukaModal('importModal');
  $('addForm').addEventListener('submit', tambahItem);
  $('btnProsesImport').onclick = prosesImport;
  document.querySelectorAll('[data-tutup]').forEach((b) => b.addEventListener('click', () => tutupModal(b.dataset.tutup)));
  document.querySelectorAll('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); }));

  $('btnExport').onclick = () => $('exportMenu').classList.toggle('hidden');
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) $('exportMenu').classList.add('hidden');
  });
  $('btnCsv').onclick = unduhCsv;
  $('btnBap').onclick = buatBap;
  $('btnCopyBap').onclick = async () => {
    const ok = await salinTeks($('bapContent').textContent);
    tampilkanToast(ok ? 'Teks berhasil disalin ke clipboard!' : 'Gagal menyalin', !ok);
  };

  $('btnStoreName').onclick = () => {
    const input = prompt('Masukkan nama toko:', storeName);
    if (input === null) return;
    storeName = input.trim();
    localStorage.setItem(KUNCI_TOKO, storeName);
    tampilkanNamaToko();
    tampilkanToast(storeName ? 'Nama toko disimpan' : 'Nama toko dikosongkan');
  };
  $('btnResetAll').onclick = () => {
    if (!confirm('Apakah Anda yakin ingin mengosongkan semua data hitungan fisik? (Nilai stok fisik akan kembali kosong)')) return;
    products.forEach((p) => { p.physicalStock = null; });
    simpanDanRender();
    tampilkanToast('Data stok opname berhasil direset');
  };
});
