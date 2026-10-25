const CONTOH = `8991234567890, Kopi Sachet 20gr
8991234567891, Teh Celup Isi 25
8991234567892, Gula Pasir 1kg
8991234567893, Minyak Goreng 1L`;
const KOSONG = '<div class="empty">Belum ada barcode. Masukkan data lalu klik Generate.</div>';

function parseBaris(raw) {
  return raw.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
    const idx = line.indexOf(',');
    return idx === -1
      ? { code: line, label: '' }
      : { code: line.slice(0, idx).trim(), label: line.slice(idx + 1).trim() };
  });
}

function generate() {
  const format = $('format').value;
  const lebar = parseFloat($('lineWidth').value) || 2;
  const tinggi = parseFloat($('barHeight').value) || 60;
  const grid = $('grid');
  const items = parseBaris($('input').value);

  $('errorBox').innerHTML = '';
  grid.innerHTML = '';

  if (!items.length) {
    grid.innerHTML = KOSONG;
    $('exportBtns').classList.add('hidden');
    return;
  }

  const galat = [];
  items.forEach((item, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'barcode-item';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    wrap.appendChild(svg);

    try {
      JsBarcode(svg, item.code, { format, lineColor: '#000', width: lebar, height: tinggi, displayValue: true, fontSize: 14, margin: 8 });
    } catch (e) {
      galat.push(`Baris ${i + 1} ("${escapeHtml(item.code)}"): ${escapeHtml(e.message)}`);
      wrap.innerHTML = `<div class="text-bad" style="font-size:.8rem;padding:20px 0">Gagal: ${escapeHtml(item.code)}</div>`;
    }

    if (item.label) {
      const cap = document.createElement('div');
      cap.className = 'caption';
      cap.textContent = item.label;
      wrap.appendChild(cap);
    }
    grid.appendChild(wrap);
  });

  if (galat.length) $('errorBox').innerHTML = `<div class="alert">${galat.length} barcode gagal dibuat:<br>${galat.join('<br>')}</div>`;
  $('exportBtns').classList.remove('hidden');
}

async function simpanPDF() {
  const items = document.querySelectorAll('.barcode-item');
  if (!items.length) return;

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const halamanW = 210, halamanH = 297, kolom = 3, margin = 10, jarak = 6;
  const selW = (halamanW - margin * 2 - jarak * (kolom - 1)) / kolom;
  const selH = 45;
  let x = margin, y = margin, k = 0;

  for (const item of items) {
    const svg = item.querySelector('svg');
    if (!svg) continue;
    const { dataUrl, width, height } = await svgKePng(svg, 4);
    const label = item.querySelector('.caption');

    if (y + selH > halamanH - margin) { pdf.addPage(); x = margin; y = margin; k = 0; }

    // pertahankan rasio asli gambar, batasi agar muat di sel
    let w = selW, h = w * (height / width);
    const maksH = selH - 10;
    if (h > maksH) { h = maksH; w = h * (width / height); }
    pdf.addImage(dataUrl, 'PNG', x + (selW - w) / 2, y, w, h);

    if (label) {
      pdf.setFontSize(9);
      pdf.text(label.textContent, x + selW / 2, y + h + 5, { align: 'center', maxWidth: selW });
    }

    if (++k >= kolom) { k = 0; x = margin; y += selH; } else { x += selW + jarak; }
  }
  pdf.save('barcodes.pdf');
}

async function simpanPNG() {
  const items = document.querySelectorAll('.barcode-item');
  for (let i = 0; i < items.length; i++) {
    const svg = items[i].querySelector('svg');
    if (!svg) continue;
    const { dataUrl } = await svgKePng(svg, 4);
    const label = items[i].querySelector('.caption');
    const nama = label ? label.textContent.replace(/[^a-z0-9]/gi, '_') : `barcode_${i + 1}`;
    unduhBlob(await (await fetch(dataUrl)).blob(), `${nama}.png`);
    await new Promise((r) => setTimeout(r, 150));
  }
}

$('btnGenerate').onclick = generate;
$('btnSample').onclick = () => { $('input').value = CONTOH; };
$('btnPrint').onclick = () => window.print();
$('btnPdf').onclick = simpanPDF;
$('btnPng').onclick = simpanPNG;
