const KATEGORI_LIST = ['SAYBREAD', 'IFC', 'BAKPAO&DIMSUM', 'SOSIS'];
const prefix = { 'SAYBREAD': 'saybread', 'IFC': 'IFC', 'BAKPAO&DIMSUM': 'B&D', 'SOSIS': 'sosis' };
const reversePrefix = { 'saybread': 'SAYBREAD', 'ifc': 'IFC', '1fc': 'IFC', 'b&d': 'BAKPAO&DIMSUM', 'sosis': 'SOSIS' };

let db = ambilData('bap_laporan_data', { 'SAYBREAD':[], 'IFC':[], 'BAKPAO&DIMSUM':[], 'SOSIS':[] });

function simpanKeStorage() {
    simpanData('bap_laporan_data', db);
}

function updateNextNumbers() {
    KATEGORI_LIST.forEach(kat => {
        const nextNo = db[kat].length + 1;
        document.getElementById(`no-${kat}`).innerText = String(nextNo).padStart(2, '0');
    });
}

function prosesSemuaKategori() {
    let inputAdatersimpan = false;

    KATEGORI_LIST.forEach(kat => {
        const b = document.getElementById(`bpb-${kat}`).value;
        const s = document.getElementById(`sales-${kat}`).value;
        const bap = document.getElementById(`bap-${kat}`).value;
        const stat = document.getElementById(`stat-${kat}`).value;

        if (b !== '' || s !== '' || bap !== '') {
            db[kat].push({
                b: b || '0',
                s: s || '0',
                bap: bap || '0',
                stat: stat
            });
            
            document.getElementById(`bpb-${kat}`).value = '';
            document.getElementById(`sales-${kat}`).value = '';
            document.getElementById(`bap-${kat}`).value = '';
            document.getElementById(`stat-${kat}`).value = '';
            
            inputAdatersimpan = true;
        }
    });

    if (inputAdatersimpan) {
        simpanKeStorage();
        updateNextNumbers();
        render();
    } else {
        alert("Silakan isi minimal salah satu kolom BPB/Sales/BAP pada kategori yang ingin ditambahkan.");
    }
}

function hapusData(kategori, index) {
    if(confirm("Hapus baris ini dari laporan?")) {
        db[kategori].splice(index, 1);
        simpanKeStorage();
        updateNextNumbers();
        render();
    }
}

function resetSemuaData() {
    if(confirm("Apakah Anda yakin ingin menghapus seluruh isi laporan? Data yang tersimpan akan hilang.")) {
        db = { 'SAYBREAD':[], 'IFC':[], 'BAKPAO&DIMSUM':[], 'SOSIS':[] };
        simpanKeStorage();
        updateNextNumbers();
        render();
    }
}

function imporTeksLaporan() {
    const rawText = document.getElementById('importText').value.trim();
    if (!rawText) {
        alert("Silakan tempel teks laporan terlebih dahulu.");
        return;
    }

    const lines = rawText.split('\n');
    let countImported = 0;

    lines.forEach(line => {
        const cleanLine = line.trim();
        const match = cleanLine.match(/^\d+_(saybread|ifc|1fc|b&d|sosis)_(\d+)_(\d+)_(\d+)(.*)$/i);
        
        if (match) {
            const p = match[1].toLowerCase();
            const targetKat = reversePrefix[p];
            
            if (targetKat) {
                db[targetKat].push({
                    b: match[2],
                    s: match[3],
                    bap: match[4],
                    stat: match[5] || ''
                });
                countImported++;
            }
        }
    });

    if (countImported > 0) {
        simpanKeStorage();
        render();
        updateNextNumbers();
        document.getElementById('importText').value = '';
        alert(`Berhasil mengimpor ${countImported} baris data!`);
    } else {
        alert("Tidak ada baris data yang cocok dengan format laporan.");
    }
}

function render() {
    let txt = "Permintaan pass bap ‼️\n\n";
    const keysKat = Object.keys(db);
    let htmlTable = "";
    
    keysKat.forEach((kat, idx) => {
        txt += `*${kat}*\nMODUL/BPB/SALES/BAP \n`;
        
        let totalS = 0;
        const jumlahBaris = db[kat].length;

        db[kat].forEach((d, i) => {
            const no = i + 1;
            const formatNo = String(no).padStart(2, '0');

            totalS += parseInt(d.s) || 0;

            txt += `${formatNo}_${prefix[kat]}_${d.b}_${d.s}_${d.bap}${d.stat}\n`;

            htmlTable += `
                <tr>
                    <td><b>${prefix[kat]}</b></td>
                    <td>${formatNo}</td>
                    <td>${d.b}</td>
                    <td>${d.s}</td>
                    <td>${d.bap}</td>
                    <td>${d.stat || '-'}</td>
                    <td class="action-btns">
                        <button class="btn-delete" onclick="hapusData('${kat}', ${i})">X</button>
                    </td>
                </tr>
            `;
        });

        let spd = 0;
        if (jumlahBaris > 0) {
            let hitungSpd = totalS / jumlahBaris;
            spd = Number.isInteger(hitungSpd) ? hitungSpd : hitungSpd.toFixed(2);
        }

        txt += `\nTotal sales qty : ${totalS}\nSpd sales  qty : ${spd}\n`;
        if (idx < keysKat.length - 1) txt += "———————————————————\n";
    });
    
    document.getElementById('outputText').value = txt;
    document.getElementById('table-body').innerHTML = htmlTable;
}

function salinTeks() {
    salinKeClipboard("outputText", {
        successMessage: "Teks laporan berhasil disalin!"
    });
}

updateNextNumbers();
render();
