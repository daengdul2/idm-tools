const RE_DUA_ANGKA = /(\d+)[\/\s](\d+)\s*$/;
const RE_SATU_ANGKA = /(\d+)\s*$/;

function konversi(teks) {
  const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const hasil = ['*HASIL SO PRODSUS*', `${tanggal} ( shift 4)`, ''];
  let kategori = '';
  let item = [];

  const tutupKategori = (akhir) => {
    if (kategori && item.length) hasil.push(`*${kategori}*`, ...item, ...(akhir ? [] : ['']));
  };

  for (const baris of teks.split('\n')) {
    const line = baris.trim();
    if (!line) continue;

    // Baris tanpa "angka," di awal = judul kategori baru
    if (!/^\d+,/.test(line)) {
      tutupKategori(false);
      kategori = line;
      item = [];
      continue;
    }

    let nama = line.split(',')[1].trim();
    const dua = line.match(RE_DUA_ANGKA);
    const satu = line.match(RE_SATU_ANGKA);

    if (dua) {
      const a = parseInt(dua[1], 10);
      const b = parseInt(dua[2], 10);
      if (a === b) continue; // selisih 0 dilewati
      nama = nama.replace(RE_DUA_ANGKA, '').trim();
      item.push(`${a < b ? `(+${b - a})` : `(-${a - b})`}${nama}`);
    } else if (satu) {
      nama = nama.replace(RE_SATU_ANGKA, '').trim();
      item.push(`(${satu[1]})${nama}`);
    }
  }
  tutupKategori(true);
  return hasil.join('\n');
}

document.addEventListener('DOMContentLoaded', () => {
  $('btnConvert').onclick = () => { $('outputText').value = konversi($('inputText').value); };
  $('btnCopy').onclick = () => salinKeClipboard('outputText', { kosong: 'Belum ada hasil untuk disalin!', sukses: 'Hasil berhasil disalin!' });
});
