const KUNCI = 'laporanItemV1';
let items = [];
let mode = 1;

/* ---------- Penyimpanan ---------- */
function muat() {
  const d = ambilData(KUNCI, null);
  if (!d) return;
  items = d.items || [];
  mode = d.mode || 1;
  if (d.store) $('store').value = d.store;
  if (d.title) $('title').value = d.title;
  if (d.kode) $('kode').value = d.kode;
}

function simpan() {
  simpanData(KUNCI, { store: $('store').value, title: $('title').value, kode: $('kode').value, mode, items });
}

/* ---------- Util ---------- */
const bersih = (v) => String(v == null ? '' : v).trim();
const angka = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isNaN(n) ? null : n; };

function acv(it) {
  const t = angka(it.t), a = angka(it.a);
  return t && t > 0 && a !== null ? Math.round((a / t) * 100) : 0;
}
const acvTeks = (it, pemisah = '') => `${acv(it)}%${acv(it) >= 100 ? pemisah + '✅' : ''}`;

function pesan(id, teks, galat) {
  const el = $(id);
  el.textContent = teks;
  el.className = 'msg' + (galat ? ' err' : '');
}

/** Tambah item baru (return 1) atau perbarui yang sudah ada (return 2); 0 jika nama kosong. */
function upsert(nama, t, s, a) {
  nama = bersih(nama).replace(/\*/g, '').toUpperCase();
  if (!nama) return 0;
  const ada = items.find((it) => it.n.toLowerCase() === nama.toLowerCase());
  if (ada) {
    ada.t = bersih(t);
    ada.s = bersih(s);
    if (a !== undefined) ada.a = bersih(a);
    return 2;
  }
  items.push({ n: nama, t: bersih(t), s: bersih(s), a: bersih(a) });
  return 1;
}

/* ---------- Tampilan ---------- */
function render() {
  if (!items.length) {
    $('tbl').innerHTML = '<div class="empty">Belum ada item.</div>';
  } else {
    const baris = items.map((it, i) => `
      <tr>
        <td><input class="left" data-i="${i}" data-f="n" value="${escapeHtml(it.n)}" aria-label="Nama"></td>
        ${['t', 's', 'a'].map((f) => `<td><input data-i="${i}" data-f="${f}" value="${escapeHtml(it[f])}" aria-label="${f}"></td>`).join('')}
        <td class="num" id="acv${i}"><b>${acvTeks(it, ' ')}</b></td>
        <td><button class="btn btn-del" data-d="${i}" aria-label="Hapus">&times;</button></td>
      </tr>`).join('');
    $('tbl').innerHTML = `<div class="table-wrap"><table style="min-width:480px">
      <thead><tr><th>Item</th><th>Target</th><th>Sales</th><th>Akm</th><th>Acv</th><th></th></tr></thead>
      <tbody>${baris}</tbody></table></div>`;
  }
  $('f1').classList.toggle('hidden', mode === 2);
  $('f2').classList.toggle('hidden', mode !== 2);
  perbaruiHasil();
}

function perbaruiHasil() {
  let baris;
  if (mode === 2) {
    baris = [bersih($('title').value), '', 'Kode toko : ' + bersih($('kode').value).toUpperCase(), 'ITEM_TARGET_SALES_AKM_ACV', ''];
    items.forEach((it, i) => baris.push(`${i + 1}. ${it.n}_${it.t || 0}_${it.s || 0}_${it.a || 0}_${acvTeks(it)}`));
  } else {
    baris = ['*TOKO: ' + bersih($('store').value).toUpperCase() + '*', 'Item/Target/Sales/Akm/Acv', ''];
    items.forEach((it) => baris.push(`*${it.n}=${it.t || 0}/${it.s || 0}/${it.a || 0}/${acv(it)}%*${acv(it) >= 100 ? '✅' : ''}`));
  }
  $('out').textContent = baris.join('\n');
  simpan();
}

/* ---------- Aksi ---------- */
function tambahMassal() {
  let tambah = 0, ubah = 0, lewat = 0;
  const catat = (r) => { if (r === 1) tambah++; else if (r === 2) ubah++; else lewat++; };

  $('bulk').value.split(/\r?\n/).forEach((raw) => {
    const ln = bersih(raw).replace(/\*/g, '').trim();
    if (!ln) return;
    if (/^toko\s*:/i.test(ln)) { $('store').value = ln.replace(/^toko\s*:/i, '').trim().toUpperCase(); return; }
    if (/^item\s*[\/_]/i.test(ln)) return;
    const kode = ln.match(/^kode\s*toko\s*:\s*(.*)$/i);
    if (kode) { $('kode').value = kode[1].trim().toUpperCase(); return; }
    if (/^laporan\s/i.test(ln)) { $('title').value = ln; return; }

    const u = ln.replace(/^\d+\s*[.)]\s*/, '');
    if (!u.includes('=') && u.indexOf('_') > 0) {
      const q = u.split('_');
      if (q.length >= 5) {
        catat(upsert(q.slice(0, q.length - 4).join('_'), q[q.length - 4], q[q.length - 3], q[q.length - 2]));
        return;
      }
    }
    const m = ln.match(/^(.+?)\s*=\s*(.*)$/);
    if (!m) { lewat++; return; }
    const p = m[2].split('/');
    catat(upsert(m[1], p[0], p[1], p[2]));
  });

  $('bulk').value = '';
  render();
  pesan('mBulk', `${tambah} ditambah, ${ubah} diperbarui${lewat ? `, ${lewat} baris dilewati` : ''}`);
}

function tambahSatuan() {
  if (!bersih($('sN').value)) return pesan('mOne', 'Nama item kosong', true);
  upsert($('sN').value, $('sT').value, $('sS').value, $('sA').value);
  ['sN', 'sT', 'sS', 'sA'].forEach((id) => { $(id).value = ''; });
  pesan('mOne', '');
  render();
  $('sN').focus();
}

function isiCepat() {
  if (!items.length) return pesan('mQuick', 'Tambahkan item dulu', true);
  const deret = $('quick').value.split('/').map((g) => g.trim().split(/\s+/).filter(Boolean)).filter((g) => g.length);
  if (deret.length < 1 || deret.length > 3) return pesan('mQuick', 'Harus 1 sampai 3 deret dipisah /', true);
  for (let k = 0; k < deret.length; k++) {
    if (deret[k].length !== items.length) {
      return pesan('mQuick', `Deret ke-${k + 1} berisi ${deret[k].length} angka, sedangkan item ada ${items.length}`, true);
    }
  }
  const kolom = deret.length === 3 ? ['t', 's', 'a'] : deret.length === 2 ? ['s', 'a'] : ['a'];
  deret.forEach((g, k) => g.forEach((v, i) => { items[i][kolom[k]] = v; }));
  const nama = { t: 'Target', s: 'Sales', a: 'Akm' };
  $('quick').value = '';
  render();
  pesan('mQuick', 'Terisi: ' + kolom.map((f) => nama[f]).join(', '));
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  muat();
  $('mode').value = mode;
  render();

  $('tbl').addEventListener('input', (e) => {
    const { i, f } = e.target.dataset;
    if (i === undefined) return;
    items[i][f] = f === 'n' ? e.target.value.toUpperCase() : e.target.value;
    const sel = $('acv' + i);
    if (sel) sel.innerHTML = `<b>${acvTeks(items[i], ' ')}</b>`;
    perbaruiHasil();
  });
  $('tbl').addEventListener('click', (e) => {
    const b = e.target.closest('[data-d]');
    if (b) { items.splice(Number(b.dataset.d), 1); render(); }
  });
  ['store', 'title', 'kode'].forEach((id) => $(id).addEventListener('input', perbaruiHasil));
  $('mode').addEventListener('change', (e) => { mode = Number(e.target.value); render(); });

  $('bBulk').onclick = tambahMassal;
  $('bOne').onclick = tambahSatuan;
  $('bQuick').onclick = isiCepat;
  $('bSort').onclick = () => { items.sort((a, b) => a.n.localeCompare(b.n)); render(); };
  $('bZero').onclick = () => { if (confirm('Kosongkan semua Sales dan Akm?')) { items.forEach((it) => { it.s = ''; it.a = ''; }); render(); } };
  $('bClear').onclick = () => { if (confirm('Hapus semua item?')) { items = []; render(); } };
  $('bCopy').onclick = async () => {
    const ok = await salinTeks($('out').textContent);
    tampilkanToast(ok ? 'Laporan tersalin' : 'Gagal menyalin', !ok);
  };
});
