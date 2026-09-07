const defaultItems = [
    { name: "CAPLANG", target: 11 },
    { name: "CLOSEP UP", target: 10 },
    { name: "COLLAGENA", target: 22 },
    { name: "GOOD DAY", target: 8 },
    { name: "HEAD&SHOUL", target: 4 },
    { name: "KANZLER", target: 27 },
    { name: "LEMINERAL", target: 327 },
    { name: "PANTENE", target: 3 },
    { name: "PRINGLES", target: 12 },
    { name: "ROMA", target: 17 },
    { name: "SEDAP MIE", target: 37 },
    { name: "SUNLIGHT", target: 34 }
];

let items = [];

function loadSavedData() {
    items = ambilData("salesReportItems", [...defaultItems]);

    const savedHeader = ambilTeks("salesReportHeader");
    if (savedHeader) {
        document.getElementById("headerText").value = savedHeader;
    }
}

function saveItems() {
    simpanData("salesReportItems", items);
}

function saveHeader() {
    const headerVal = document.getElementById("headerText").value;
    simpanTeks("salesReportHeader", headerVal);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    if (tabName === 'manual') {
        document.getElementById('tabManual').classList.add('active');
    } else if (tabName === 'convert') {
        document.getElementById('tabConvert').classList.add('active');
        updateItemsPreview();
    } else if (tabName === 'import') {
        document.getElementById('tabImport').classList.add('active');
    }
}

function renderForm() {
    const container = document.getElementById("itemsContainer");
    container.innerHTML = "";

    items.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "item-card";
        card.innerHTML = `
            <div class="item-header-group">
                <input type="text" id="name_${index}" class="input-item-name" value="${item.name}" placeholder="NAMA ITEM" oninput="updateItemName(${index}, this.value)">
                <button class="btn-delete-item" onclick="deleteItem(${index})">Hapus</button>
            </div>
            <div class="field-grid">
                <div class="field-group">
                    <label>TARGET:</label>
                    <input type="number" id="target_${index}" value="${item.target !== undefined ? item.target : ''}" placeholder="Target" oninput="calculateAcv(${index})">
                </div>
                <div class="field-group">
                    <label>SALES:</label>
                    <input type="number" id="sales_${index}" class="input-nav" placeholder="Sales" oninput="calculateAcv(${index})">
                </div>
                <div class="field-group">
                    <label>ACV % (OTOMATIS):</label>
                    <input type="text" id="acv_${index}" readonly placeholder="0%">
                </div>
                <div class="field-group">
                    <label>STOK (OPSIONAL):</label>
                    <input type="number" id="stok_${index}" class="input-nav" placeholder="Stok">
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    setupEnterNavigation();
}

function updateItemName(index, value) {
    items[index].name = value;
    saveItems();
}

function calculateAcv(index) {
    const targetVal = parseFloat(document.getElementById(`target_${index}`).value) || 0;
    const salesVal = parseFloat(document.getElementById(`sales_${index}`).value) || 0;
    const acvInput = document.getElementById(`acv_${index}`);

    if (targetVal > 0) {
        const acv = Math.round((salesVal / targetVal) * 100);
        acvInput.value = `${acv}%`;
    } else {
        acvInput.value = "0%";
    }

    items[index].target = targetVal;
    saveItems();
}

function setupEnterNavigation() {
    const inputs = Array.from(document.querySelectorAll(".input-nav"));
    inputs.forEach((input, index) => {
        input.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                const nextInput = inputs[index + 1];
                if (nextInput) {
                    nextInput.focus();
                } else {
                    generateReport();
                }
            }
        });
    });
}

function addItem() {
    items.push({ name: "ITEM BARU", target: 0 });
    saveItems();
    renderForm();
    const lastIndex = items.length - 1;
    document.getElementById(`name_${lastIndex}`).focus();
}

function deleteItem(index) {
    if (confirm(`Hapus item "${items[index].name}"?`)) {
        items.splice(index, 1);
        saveItems();
        renderForm();
    }
}

function restoreDefaultItems() {
    if (confirm("Kembalikan daftar item ke susunan awal/default? Semua perubahan item kustom akan diset ulang.")) {
        items = JSON.parse(JSON.stringify(defaultItems));
        saveItems();
        renderForm();
    }
}

function updateItemsPreview() {
    const previewEl = document.getElementById("itemsPreview");
    previewEl.innerHTML = `Jumlah item terdeteksi: <strong>${items.length} item</strong> (Mengikuti susunan dari tab Input/Pengaturan)`;
}

function formatRow(index, name, target, sales, acv, stok) {
    let row = `${index + 1}. ${name}_${target}_${sales}_${acv}`;
    if (stok !== "" && stok !== undefined && stok !== null) {
        row += `_${stok}`;
    }
    return row;
}

function generateReport() {
    const header = document.getElementById("headerText").value;
    let result = `${header}\n\n`;

    items.forEach((item, index) => {
        const itemName = document.getElementById(`name_${index}`).value.trim();
        const target = document.getElementById(`target_${index}`).value || "0";
        const sales = document.getElementById(`sales_${index}`).value || "0";
        const acv = document.getElementById(`acv_${index}`).value || "0%";
        const stok = document.getElementById(`stok_${index}`).value;

        result += `${formatRow(index, itemName.toUpperCase(), target, sales, acv, stok)}\n`;
    });

    document.getElementById("outputManual").value = result;
}

function convertTextToReport() {
    const rawText = document.getElementById("rawInput").value.trim();
    if (!rawText) {
        alert("Masukkan teks angka terlebih dahulu!");
        return;
    }

    const parts = rawText.split('/');
    const salesArray = parts[0].trim().split(/\s+/).map(Number);
    const stokArray = parts[1] ? parts[1].trim().split(/\s+/).map(v => v.trim()) : [];

    const header = document.getElementById("headerText").value;
    let result = `${header}\n\n`;

    items.forEach((item, index) => {
        const sales = salesArray[index] !== undefined && !isNaN(salesArray[index]) ? salesArray[index] : 0;
        const stok = stokArray[index] !== undefined ? stokArray[index] : "";
        
        let acv = "0%";
        if (item.target > 0) {
            acv = `${Math.round((sales / item.target) * 100)}%`;
        }

        result += `${formatRow(index, item.name.toUpperCase(), item.target || 0, sales, acv, stok)}\n`;
    });

    document.getElementById("outputConvert").value = result;
}

function parseReportText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let headerLines = [];
    const parsedItems = [];

    lines.forEach(line => {
        // Format baris: 1. NAMA_TARGET_SALES_ACV%_STOK atau tanpa stok
        const match = line.match(/^\d+\.\s*(.+?)_(\d+)_(\d+)_(\d+%)?(?:_(\d+))?$/);
        if (match) {
            parsedItems.push({
                name: match[1].trim(),
                target: parseFloat(match[2]) || 0,
                sales: parseFloat(match[3]) || 0,
                stok: match[5] !== undefined ? match[5] : ""
            });
        } else {
            headerLines.push(line);
        }
    });

    return { header: headerLines.join('\n'), parsedItems };
}

function importFromReportText() {
    const text = document.getElementById("importInput").value.trim();
    if (!text) {
        alert("Tempel teks laporan terlebih dahulu!");
        return;
    }

    const { header, parsedItems } = parseReportText(text);

    if (parsedItems.length === 0) {
        alert("Tidak ada item yang terdeteksi. Periksa kembali format teks laporan.\n\nContoh format:\n1. CAPLANG_11_1_9%_1");
        return;
    }

    const konfirmasi = confirm(`Terdeteksi ${parsedItems.length} item dari teks laporan.\n\nIni akan MENGGANTI daftar item dan nilai yang ada. Lanjutkan?`);
    if (!konfirmasi) return;

    if (header) {
        document.getElementById("headerText").value = header;
        saveHeader();
    }

    items = parsedItems.map(p => ({ name: p.name, target: p.target }));
    saveItems();
    renderForm();

    parsedItems.forEach((p, index) => {
        const salesInput = document.getElementById(`sales_${index}`);
        const stokInput = document.getElementById(`stok_${index}`);
        if (salesInput) salesInput.value = p.sales;
        if (stokInput) stokInput.value = p.stok;
        calculateAcv(index);
    });

    document.getElementById("importInput").value = "";
    switchTab('manual');
    alert("Import berhasil! Data telah diisi ke form Input/Pengaturan Item.");
}

function copyReport(targetId) {
    salinKeClipboard(targetId, {
        successMessage: "Laporan berhasil disalin ke clipboard!"
    });
}

function resetForm() {
    if (confirm("Kosongkan nilai Sales dan Stok?")) {
        items.forEach((_, index) => {
            document.getElementById(`sales_${index}`).value = "";
            document.getElementById(`stok_${index}`).value = "";
            document.getElementById(`acv_${index}`).value = "0%";
        });
        document.getElementById("outputManual").value = "";
        const firstSales = document.getElementById("sales_0");
        if (firstSales) firstSales.focus();
    }
}

window.onload = function() {
    loadSavedData();
    renderForm();
};
