const textInput = $('textInput');
const amountInput = $('amountInput');
const barcodeEl = $('barcode');
const qrEl = $('qrcode');
const downloadBtn = $('downloadBtn');
const heightSlider = $('barcodeHeight');
const widthSlider = $('barcodeWidth');

let jenisAktif = null; // 'barcode' | 'qrcode'

/** Teks yang dikodekan: "B" + PLU + jumlah 4 digit; jumlah 0 = PLU apa adanya. */
function formatTeks() {
  const jumlah = amountInput.value;
  const jumlahFmt = jumlah === '0' ? '' : String(jumlah).padStart(4, '0');
  const teks = textInput.value;
  if (jumlahFmt === '') return teks;
  return teks === '' ? ' ' : 'B' + teks + jumlahFmt;
}

function tampilkan(jenis) {
  barcodeEl.classList.toggle('hidden', jenis !== 'barcode');
  qrEl.classList.toggle('hidden', jenis !== 'qrcode');
  downloadBtn.classList.remove('hidden');
  jenisAktif = jenis;
}

function buatBarcode() {
  const tinggi = parseInt(heightSlider.value, 10);
  const lebar = parseInt(widthSlider.value, 10);
  $('heightValue').textContent = tinggi;
  $('widthValue').textContent = lebar;
  qrEl.innerHTML = '';
  tampilkan('barcode');
  JsBarcode(barcodeEl, formatTeks() || ' ', {
    format: 'CODE128', lineColor: '#000', width: lebar, height: tinggi, displayValue: false, margin: 10,
  });
}

function buatQR() {
  qrEl.innerHTML = '';
  tampilkan('qrcode');
  new QRCode(qrEl, { text: formatTeks() || ' ', width: 200, height: 200 });
}

function perbaruiPratinjau() {
  if (jenisAktif === 'barcode') buatBarcode();
  else if (jenisAktif === 'qrcode') buatQR();
}

async function unduhGambar() {
  let dataUrl, nama;
  if (jenisAktif === 'barcode') {
    dataUrl = (await svgKePng(barcodeEl, 2)).dataUrl;
    nama = 'barcode.png';
  } else if (jenisAktif === 'qrcode') {
    const canvas = qrEl.querySelector('canvas');
    if (!canvas) return;
    dataUrl = canvas.toDataURL('image/png');
    nama = 'qrcode.png';
  } else return;
  unduhBlob(await (await fetch(dataUrl)).blob(), nama);
}

/* ---------- Event ---------- */
$('barcodeBtn').addEventListener('click', buatBarcode);
$('qrBtn').addEventListener('click', buatQR);
downloadBtn.addEventListener('click', unduhGambar);
textInput.addEventListener('input', perbaruiPratinjau);
heightSlider.addEventListener('input', perbaruiPratinjau);
widthSlider.addEventListener('input', perbaruiPratinjau);
$('toggleSlider').addEventListener('change', (e) => $('sliderSection').classList.toggle('hidden', !e.target.checked));
amountInput.addEventListener('input', function () {
  if (this.value.length === 0) this.value = 0;
  else if (this.value.length === 2) this.value = +this.value;   // hilangkan nol di depan
  else if (this.value.length > 3) this.value = this.value.slice(0, 3);
  perbaruiPratinjau();
});
