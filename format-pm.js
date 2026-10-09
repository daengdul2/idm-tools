const defaultHeader = {
    title: "Laporan Penjualan Paling Murah Area HSM",
    period: "10-16 SEPT 2026",
    storeCode: "T7YB"
};

const defaultItems = [
    { name: "", target: 0},
    { name: "", target: 0},
    { name: "", target: 0},
    { name: "", target: 0},
    { name: "", target: 0},
    { name: "", target: 0},
    { name: "", target: 0},
    { name: "", target: 0},
    { name: "", target: 0},
    { name: "", target: 0},
    { name: "", target: 0},
    { name: "", target: 0},
    { name: "", target: 0},
    
];

let items = [];

function loadSavedData() {
    items = ambilData("salesReportItems", [...defaultItems]);

    const savedHeader = ambilData("salesReportHeaderObj", null);
    if (savedHeader) {
        document.getElementById("headerTitle").value = savedHeader.title || defaultHeader.title;
        document.getElementById("headerPeriod").value = savedHeader.period || defaultHeader.period;
        document.getElementById("headerStoreCode").value = savedHeader.storeCode || defaultHeader.storeCode;
    } else {
        restoreDefaultHeader();
    }
}

function saveHeader() {
    const headerObj = {
        title: document.getElementById("headerTitle").value,
        period: document.getElementById("headerPeriod").value,
        storeCode: document.getElementById("headerStoreCode").value
    };
    simpanData("salesReportHeaderObj", headerObj);
}

function restoreDefaultHeader() {
    document.getElementById("headerTitle").value = defaultHeader.title;
    document.getElementById("headerPeriod").value = defaultHeader.period;
    document.getElementById("headerStoreCode").value = defaultHeader.storeCode;
    saveHeader();
}

function getFullHeaderText() {
    const title = document.getElementById("headerTitle").value.trim();
    const period = document.getElementById("headerPeriod").value.trim();
    const storeCode = document.getElementById("headerStoreCode").value.trim();

    let fullHeader = "";
    if (title || period) fullHeader += `${title} ${period}`.trim() + "\n\n";
    if (storeCode) fullHeader += `Kode toko : ${storeCode}\n`;
    fullHeader += `ITEM_TARGET_SALES_ACV`;

    return fullHeader;
}

function saveItems() {
    simpanData("salesReportItems", items);
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
                    <input type="number" id="sales_${index}" class="input-nav" placeholder="Sales" value="${item.sales !== undefined ? item.sales : ''}" oninput="calculateAcv(${index})">
                </div>
                <div class="field-group">
                    <label>ACV % (OTOMATIS):</label>
                    <input type="text" id="acv_${index}" readonly placeholder="0%">
                </div>
                <div class="field-group">
                    <label>STOK (OPSIONAL):</label>
                    <input type="number" id="stok_${index}" class="input-nav" placeholder="Stok" value="${item.stok !== undefined ? item.stok : ''}">
                </div>
            </div>
        `;
        container.appendChild(card);
        calculateAcv(index);
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

    let acvPercent = 0;
    if (targetVal > 0) {
        acvPercent = Math.round((salesVal / targetVal) * 100);
    }

    let acvText = `${acvPercent}%`;
    if (acvPercent >= 100) {
        acvText += "✅";
    }

    acvInput.value = acvText;
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
    items.push({ name: "ITEM BARU", target: 0, sales: 0, stok: "" });
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
    if (confirm("Kembalikan daftar item ke susunan awal/default?")) {
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
    const header = getFullHeaderText();
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

    const header = getFullHeaderText();
    let result = `${header}\n\n`;

    items.forEach((item, index) => {
        const sales = salesArray[index] !== undefined && !isNaN(salesArray[index]) ? salesArray[index] : 0;
        const stok = stokArray[index] !== undefined ? stokArray[index] : "";
        
        let acvPercent = 0;
        if (item.target > 0) {
            acvPercent = Math.round((sales / item.target) * 100);
        }
        let acv = `${acvPercent}%`;
        if (acvPercent >= 100) acv += "✅";

        result += `${formatRow(index, item.name.toUpperCase(), item.target || 0, sales, acv, stok)}\n`;
    });

    document.getElementById("outputConvert").value = result;
}

function parseReportText(text) {
    // Bersihkan karakter tersembunyi seperti Left-to-Right Mark (\u200e)
    const cleanText = text.replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, "");
    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let headerInfo = {
        title: "",
        period: "",
        storeCode: ""
    };
    const parsedItems = [];

    lines.forEach(line => {
        // Cek pola baris item: 
        // 1. NAMA_TARGET_SALES_ACV%
        // 2. NAMA_TARGET_SALES_TERJUAL_ACV%
        // 3. NAMA_TARGET_SALES_ACV%_STOK
        const itemRegex = /^(?:\d+\.\s*)?(.+?)_(\d+)_(\d+)(?:_(\d+))?_(\d+%)?(?:✅)?(?:_(\d+))?$/;
        const match = line.match(itemRegex);

        if (match) {
            const name = match[1].trim();
            const target = parseFloat(match[2]) || 0;
            let sales = parseFloat(match[3]) || 0;
            let stok = "";

            if (match[6] !== undefined) {
                stok = match[6];
            } else if (match[4] !== undefined && match[5] === undefined) {
                // Jika ada 4 angka tanpa lambang % di pertengahan
                sales = parseFloat(match[4]) || 0;
            }

            parsedItems.push({ name, target, sales, stok });
        } else {
            // Deteksi baris header
            if (line.toLowerCase().includes("laporan penjualan")) {
                const parts = line.split(/(?=\d{1,2}-\d{1,2})/);
                if (parts.length > 1) {
                    headerInfo.title = parts[0].trim();
                    headerInfo.period = parts.slice(1).join("").trim();
                } else {
                    headerInfo.title = line;
                }
            } else if (line.toLowerCase().includes("kode toko")) {
                const codeMatch = line.match(/kode toko\s*:\s*(.*)/i);
                if (codeMatch) {
                    headerInfo.storeCode = codeMatch[1].trim();
                }
            }
        }
    });

    return { headerInfo, parsedItems };
}

function importFromReportText() {
    const text = document.getElementById("importInput").value.trim();
    if (!text) {
        alert("Tempel teks laporan terlebih dahulu!");
        return;
    }

    const { headerInfo, parsedItems } = parseReportText(text);

    if (parsedItems.length === 0) {
        alert("Tidak ada item yang terdeteksi. Periksa kembali format teks laporan.");
        return;
    }

    const konfirmasi = confirm(`Terdeteksi ${parsedItems.length} item dari teks laporan.\n\nLanjutkan import ke form?`);
    if (!konfirmasi) return;

    if (headerInfo.title) document.getElementById("headerTitle").value = headerInfo.title;
    if (headerInfo.period) document.getElementById("headerPeriod").value = headerInfo.period;
    if (headerInfo.storeCode) document.getElementById("headerStoreCode").value = headerInfo.storeCode;
    saveHeader();

    items = parsedItems.map(p => ({
        name: p.name,
        target: p.target,
        sales: p.sales,
        stok: p.stok
    }));
    
    saveItems();
    renderForm();

    document.getElementById("importInput").value = "";
    switchTab('manual');
    generateReport();
    alert("Import berhasil!");
}

function copyReport(targetId) {
    salinKeClipboard(targetId, {
        successMessage: "Laporan berhasil disalin ke clipboard!"
    });
}

function resetForm() {
    if (confirm("Kosongkan nilai Sales dan Stok?")) {
        items.forEach((item, index) => {
            item.sales = "";
            item.stok = "";
            document.getElementById(`sales_${index}`).value = "";
            document.getElementById(`stok_${index}`).value = "";
            document.getElementById(`acv_${index}`).value = "0%";
        });
        saveItems();
        document.getElementById("outputManual").value = "";
    }
}

window.onload = function() {
    loadSavedData();
    renderForm();
};
