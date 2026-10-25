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
function buatForm() {
  $('formKategori').innerHTML = KATEGORI.map((kat, i) => `
    <div class="kat-row">
      <div class="kat-label">${escapeHtml(kat)} (<span id="no-${i}">01</span>)</div>
      <div class="field"><label>BPB</label><input type="number" inputmode="numeric" id="bpb-${i}" placeholder="0"></div>
      <div class="field"><label>Sales</label><input type="number" inputmode="numeric" id="sales-${i}" placeholder="0"></div>
      <div class="field"><label>BAP</label><input type="number" inputmode="numeric" id="bap-${i}" placeholder="0"></div>
      <div class="field"><label>Status</label>
        <select id="stat-${i}">${STATUS.map(([v, t]) => `<option value="${escapeHtml(v)}">${t}</option>`).join('')}</select>
      </div>
    </div>`).join('');
}

function perbaruiNomor() {
  KATEGORI.forEach((kat, i) => { $(`no-${i}`).textContent = String(db[kat].length + 1).padStart(2, '0'); });
}

function tambahSemua() {
  let ada = false;
  KATEGORI.forEach((kat, i) => {
    const b = $(`bpb-${i}`).value, s = $(`sales-${i}`).value, bap = $(`bap-${i}`).value;
    if (b === '' && s === '' && bap === '') return;
    db[kat].push({ b: b || '0', s: s || '0', bap: bap || '0', stat: $(`stat-${i}`).value });
    ['bpb', 'sales', 'bap', 'stat'].forEach((p) => { $(`${p}-${i}`).value = ''; });
    ada = true;
  });
  if (!ada) return tampilkanToast('Isi minimal salah satu kolom BPB/Sales/BAP.', true);
  simpan(); render();
}

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
function render() {
  let txt = 'Permintaan pass bap ‼️\n\n';
  let baris = '';

  KATEGORI.forEach((kat, idx) => {
    txt += `*${kat}*\nMODUL/BPB/SALES/BAP \n`;
    let totalSales = 0;

    db[kat].forEach((d, i) => {
      const no = String(i + 1).padStart(2, '0');
      totalSales += parseInt(d.s) || 0;
      txt += `${no}_${PREFIX[kat]}_${d.b}_${d.s}_${d.bap}${d.stat}\n`;
      baris += `<tr>
        <td><b>${escapeHtml(PREFIX[kat])}</b></td><td>${no}</td><td>${escapeHtml(d.b)}</td>
        <td>${escapeHtml(d.s)}</td><td>${escapeHtml(d.bap)}</td><td>${escapeHtml(d.stat) || '-'}</td>
        <td><button class="btn btn-del" data-kat="${idx}" data-i="${i}">X</button></td></tr>`;
    });

    const n = db[kat].length;
    const rata = n ? totalSales / n : 0;
    txt += `\nTotal sales qty : ${totalSales}\nSpd sales  qty : ${Number.isInteger(rata) ? rata : rata.toFixed(2)}\n`;
    if (idx < KATEGORI.length - 1) txt += '———————————————————\n';
  });

  $('outputText').value = txt;
  $('tableBody').innerHTML = baris;
  perbaruiNomor();
}

document.addEventListener('DOMContentLoaded', () => {
  buatForm();
  render();
  $('btnTambah').onclick = tambahSemua;
  $('btnImport').onclick = imporTeks;
  $('btnReset').onclick = resetSemua;
  $('btnSalin').onclick = () => salinKeClipboard('outputText', { sukses: 'Teks laporan berhasil disalin!' });
  $('tableBody').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-kat]');
    if (b) hapusBaris(KATEGORI[b.dataset.kat], Number(b.dataset.i));
  });
});
