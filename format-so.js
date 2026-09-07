function convertText() {
    const input = document.getElementById('inputText').value;
    const lines = input.split('\n');
    const opsiTanggal = { day: 'numeric', month: 'long', year: 'numeric' };
    const tanggalHariIni = new Date().toLocaleDateString('id-ID', opsiTanggal);
    
    const resultLines = ["*HASIL SO PRODSUS*", `${tanggalHariIni} ( shift 4)`, ""];
    let currentCategory = "";
    let categoryItems = [];

    for (let line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        const matchDuaAngka = trimmedLine.match(/(\d+)[\/\s](\d+)\s*$/);
        const matchSatuAngka = trimmedLine.match(/(\d+)\s*$/);

        if (!trimmedLine.match(/^\d+,/)) {
            if (currentCategory && categoryItems.length > 0) {
                resultLines.push(`*${currentCategory}*`, ...categoryItems, "");
            }
            currentCategory = trimmedLine;
            categoryItems = [];
            continue;
        }

        let itemName = trimmedLine.split(',')[1].trim();

        if (matchDuaAngka) {
            const num1 = parseInt(matchDuaAngka[1], 10);
            const num2 = parseInt(matchDuaAngka[2], 10);
            if (num1 === num2) continue;
            itemName = itemName.replace(/(\d+)[\/\s](\d+)\s*$/, '').trim();
            const prefix = num1 < num2 ? `(+${num2 - num1})` : `(-${num1 - num2})`;
            categoryItems.push(`${prefix}${itemName}`);
        } else if (matchSatuAngka) {
            const num = matchSatuAngka[1];
            itemName = itemName.replace(/(\d+)\s*$/, '').trim();
            categoryItems.push(`(${num})${itemName}`);
        }
    }

    if (currentCategory && categoryItems.length > 0) {
        resultLines.push(`*${currentCategory}*`, ...categoryItems);
    }
    document.getElementById('outputText').value = resultLines.join('\n');
}
