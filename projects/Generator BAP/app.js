const KATEGORI = ['SAYBREAD', 'IFC', 'BAKPAO&DIMSUM', 'SOSIS'];
const PREFIX = { 'SAYBREAD': 'saybread', 'IFC': 'IFC', 'BAKPAO&DIMSUM': 'B&D', 'SOSIS': 'sosis' };
const DARI_PREFIX = { saybread: 'SAYBREAD', ifc: 'IFC', '1fc': 'IFC', 'b&d': 'BAKPAO&DIMSUM', sosis: 'SOSIS' };
const STATUS = [
  ['', 'Normal'],
  ['✅', 'Centang (✅)'],
  [' (blm bpb minyak SK)', 'blm bpb minyak SK'],
  [' (belum BPB minyak SK)', 'belum BPB minyak SK'],
];
const KUNCI = 'bap_laporan_data';

const kosong = () => Object.fromEntries(KATEGORI.map((k) => [k, []]));
let db = { ...kosong(), ...ambilData(KUNCI, {}) };

const simpan = () => simpanData(KUNCI, db);

/* ---------- Form per kategori (dibuat dari daftar KATEGORI) ---------- */
const KOLOM = ['bpb', 'sales', 'bap'];

function buatForm() {
  $('formKategori').innerHTML = KATEGORI.map((kat, i) => `
    <div class="kat-row kat-row-banyak">
      <div class="kat-label">${escapeHtml(kat)} (<span id="no-${i}">01</span>)</div>
      <div class="field"><label>BPB</label><input type="text" id="bpb-${i}" placeholder="10 12" autocomplete="off" spellcheck="false"></div>
      <div class="field"><label>Sales</label><input type="text" id="sales-${i}" placeholder="5 4" autocomplete="off" spellcheck="false"></div>
      <div class="field"><label>BAP</label><input type="text" id="bap-${i}" placeholder="2 1" autocomplete="off" spellcheck="false"></div>
      <div class="field"><label>Status</label>
        <select id="stat-${i}">${STATUS.map(([v, t]) => `<option value="${escapeHtml(v)}">${t}</option>`).join('')}</select>
      </div>
      <button class="btn btn-success btn-tambah" data-tambah="${i}">+ Tambah</button>
    </div>`).join('');
}

function perbaruiNomor() {
  KATEGORI.forEach((kat, i) => { $(`no-${i}`).textContent = String(db[kat].length + 1).padStart(2, '0'); });
}

/* Tiap kolom berisi banyak nilai dipisah spasi/koma. Nilai ke-n dari BPB, Sales, dan BAP
   membentuk baris ke-n. Contoh: "10 12", "5 4", "2 1" -> 2 baris. Kolom kosong diisi 0. */
function parseBanyak(teks) {
  const daftar = teks.map((t) => (t.trim() ? t.trim().split(/[\s,]+/) : []));
  if (daftar.some((l) => l.some((v) => !/^\d+$/.test(v)))) throw new Error('semua nilai harus berupa angka.');
  const n = Math.max(...daftar.map((l) => l.length));
  if (daftar.some((l) => l.length && l.length !== n)) {
    throw new Error(`jumlah nilai tidak sama (BPB ${daftar[0].length}, Sales ${daftar[1].length}, BAP ${daftar[2].length}).`);
  }
  return Array.from({ length: n }, (_, r) => ({ b: daftar[0][r] ?? '0', s: daftar[1][r] ?? '0', bap: daftar[2][r] ?? '0' }));
}

function kumpulkan(idxs) {
  const hasil = [];
  idxs.forEach((i) => {
    const kat = KATEGORI[i];
    const teks = KOLOM.map((p) => $(`${p}-${i}`).value);
    if (teks.every((t) => !t.trim())) return;
    let baris;
    try { baris = parseBanyak(teks); } catch (err) { throw new Error(`${kat}: ${err.message}`); }
    const stat = $(`stat-${i}`).value;
    baris.forEach((r) => hasil.push([kat, { ...r, stat }]));
  });
  return hasil;
}

/* Tambah data dari kategori yang diberikan; jika ada kesalahan, tidak ada data yang ditambahkan. */
function tambahData(idxs) {
  let tambahan;
  try { tambahan = kumpulkan(idxs); } catch (err) { return tampilkanToast(err.message, true); }
  if (!tambahan.length) return tampilkanToast('Isi minimal salah satu kolom BPB/Sales/BAP.', true);

  tambahan.forEach(([kat, d]) => db[kat].push(d));
  idxs.forEach((i) => { KOLOM.forEach((p) => { $(`${p}-${i}`).value = ''; }); $(`stat-${i}`).value = ''; });
  simpan(); render();
  const wrap = document.querySelector('.table-wrap');
  if (wrap) wrap.scrollTop = wrap.scrollHeight;
  tampilkanToast(`${tambahan.length} baris ditambahkan.`);
}

function tambahSemua() { tambahData(KATEGORI.map((_, i) => i)); }

function hapusBaris(kat, i) {
  if (!confirm('Hapus baris ini dari laporan?')) return;
  db[kat].splice(i, 1);
  simpan(); render();
}

function resetSemua() {
  if (!confirm('Apakah Anda yakin ingin menghapus seluruh isi laporan? Data yang tersimpan akan hilang.')) return;
  db = kosong();
  simpan(); render();
}

function imporTeks() {
  const teks = $('importText').value.trim();
  if (!teks) return tampilkanToast('Tempel teks laporan terlebih dahulu.', true);

  let jumlah = 0;
  teks.split('\n').forEach((line) => {
    const m = line.trim().match(/^\d+_(saybread|ifc|1fc|b&d|sosis)_(\d+)_(\d+)_(\d+)(.*)$/i);
    const kat = m && DARI_PREFIX[m[1].toLowerCase()];
    if (!kat) return;
    db[kat].push({ b: m[2], s: m[3], bap: m[4], stat: m[5] || '' });
    jumlah++;
  });

  if (!jumlah) return tampilkanToast('Tidak ada baris yang cocok dengan format laporan.', true);
  simpan(); render();
  $('importText').value = '';
  tampilkanToast(`Berhasil mengimpor ${jumlah} baris data!`);
}

/* ---------- Tampilan & teks laporan ---------- */
function opsiStatus(nilai) {
  const daftar = STATUS.some(([v]) => v === nilai) ? STATUS : [...STATUS, [nilai, nilai.trim()]];
  return daftar.map(([v, t]) => `<option value="${escapeHtml(v)}"${v === nilai ? ' selected' : ''}>${escapeHtml(t)}</option>`).join('');
}

function inputAngka(idx, i, f, nilai) {
  return `<input type="number" inputmode="numeric" min="0" class="edit-cell" data-kat="${idx}" data-i="${i}" data-f="${f}" value="${escapeHtml(nilai)}">`;
}

function renderTabel() {
  let baris = '';
  KATEGORI.forEach((kat, idx) => {
    db[kat].forEach((d, i) => {
      const no = String(i + 1).padStart(2, '0');
      baris += `<tr>
        <td><b>${escapeHtml(PREFIX[kat])}</b></td><td>${no}</td>
        <td>${inputAngka(idx, i, 'b', d.b)}</td>
        <td>${inputAngka(idx, i, 's', d.s)}</td>
        <td>${inputAngka(idx, i, 'bap', d.bap)}</td>
        <td><select class="edit-cell" data-kat="${idx}" data-i="${i}" data-f="stat">${opsiStatus(d.stat)}</select></td>
        <td><button class="btn btn-del" data-kat="${idx}" data-i="${i}">X</button></td></tr>`;
    });
  });
  $('tableBody').innerHTML = baris;
}

function renderTeks() {
  let txt = 'Permintaan pass bap ‼️\n\n';

  KATEGORI.forEach((kat, idx) => {
    txt += `*${kat}*\nMODUL/BPB/SALES/BAP \n`;
    let totalSales = 0;

    db[kat].forEach((d, i) => {
      const no = String(i + 1).padStart(2, '0');
      totalSales += parseInt(d.s) || 0;
      txt += `${no}_${PREFIX[kat]}_${d.b}_${d.s}_${d.bap}${d.stat}\n`;
    });

    const n = db[kat].length;
    const rata = n ? totalSales / n : 0;
    txt += `\nTotal sales qty : ${totalSales}\nSpd sales  qty : ${Number.isInteger(rata) ? rata : rata.toFixed(2)}\n`;
    if (idx < KATEGORI.length - 1) txt += '———————————————————\n';
  });

  $('outputText').value = txt;
}

function render() {
  renderTabel();
  renderTeks();
  perbaruiNomor();
}

/* Edit nilai langsung di tabel: simpan & perbarui teks tanpa membangun ulang tabel (fokus tetap) */
function editSel(e) {
  const el = e.target.closest('.edit-cell');
  if (!el) return;
  const d = db[KATEGORI[el.dataset.kat]][Number(el.dataset.i)];
  if (!d) return;
  d[el.dataset.f] = el.dataset.f !== 'stat' && el.value === '' ? '0' : el.value;
  simpan();
  renderTeks();
}

document.addEventListener('DOMContentLoaded', () => {
  buatForm();
  render();
  $('btnTambah').onclick = tambahSemua;
  $('formKategori').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tambah]');
    if (b) tambahData([Number(b.dataset.tambah)]);
  });
  $('formKategori').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
    e.preventDefault();
    tambahData([Number(e.target.id.split('-')[1])]);
  });
  $('btnImport').onclick = imporTeks;
  $('btnReset').onclick = resetSemua;
  $('btnSalin').onclick = () => salinKeClipboard('outputText', { sukses: 'Teks laporan berhasil disalin!' });
  $('tableBody').addEventListener('input', editSel);
  $('tableBody').addEventListener('change', (e) => {
    const el = e.target.closest('input.edit-cell');
    if (el && el.value === '') el.value = '0';
    editSel(e);
  });
  $('tableBody').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-kat]');
    if (b) hapusBaris(KATEGORI[b.dataset.kat], Number(b.dataset.i));
  });
});
