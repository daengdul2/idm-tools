/* ============================================================
   COMMON.JS - Fungsi bersama untuk semua tools laporan
   Dipakai oleh: format-pm.html, Format-so.html, format-bap.html
   ============================================================ */

/**
 * Menyalin isi sebuah <textarea>/<input> ke clipboard.
 * Otomatis pakai Clipboard API modern, dengan fallback ke
 * execCommand untuk browser/webview lama.
 *
 * @param {string} elementId - id elemen yang isinya mau disalin
 * @param {object} [options]
 * @param {string}  [options.statusElementId] - id elemen buat menampilkan pesan status
 *        (kalau diisi, pesan ditulis di elemen ini & hilang otomatis;
 *        kalau tidak diisi, pesan ditampilkan lewat alert)
 * @param {string}  [options.emptyMessage]   - pesan saat elemen kosong
 * @param {string}  [options.successMessage] - pesan saat berhasil disalin
 */
function salinKeClipboard(elementId, options = {}) {
    const {
        statusElementId = null,
        emptyMessage = "Belum ada teks laporan yang dihasilkan!",
        successMessage = "Berhasil disalin ke clipboard!"
    } = options;

    const el = document.getElementById(elementId);
    if (!el || !el.value) {
        alert(emptyMessage);
        return;
    }

    const tampilkanSukses = () => {
        if (statusElementId) {
            const statusEl = document.getElementById(statusElementId);
            if (statusEl) {
                statusEl.innerText = successMessage;
                setTimeout(() => (statusEl.innerText = ""), 2000);
                return;
            }
        }
        alert(successMessage);
    };

    const salinFallback = () => {
        el.select();
        el.setSelectionRange(0, 99999);
        document.execCommand("copy");
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(el.value).then(tampilkanSukses).catch(() => {
            salinFallback();
            tampilkanSukses();
        });
    } else {
        salinFallback();
        tampilkanSukses();
    }
}

/**
 * Menyimpan data (object/array) ke localStorage dalam bentuk JSON.
 */
function simpanData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error("Gagal menyimpan data ke localStorage:", e);
    }
}

/**
 * Membaca data JSON dari localStorage.
 * Mengembalikan `fallback` jika data belum ada atau gagal di-parse.
 */
function ambilData(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

/**
 * Menyimpan teks polos (bukan JSON) ke localStorage, misalnya header laporan.
 */
function simpanTeks(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.error("Gagal menyimpan teks ke localStorage:", e);
    }
}

/**
 * Membaca teks polos dari localStorage. Mengembalikan null jika belum ada.
 */
function ambilTeks(key) {
    return localStorage.getItem(key);
}

/**
 * Menjalankan `callback` hanya jika user menekan OK pada dialog konfirmasi.
 * Dipakai untuk pola berulang "konfirmasi lalu hapus/reset data" yang muncul
 * di beberapa tools (hapus item, reset form, hapus semua data, dsb).
 *
 * @param {string} pesan - teks yang ditampilkan pada dialog confirm()
 * @param {function} callback - aksi yang dijalankan jika user menyetujui
 * @returns {boolean} true jika user menyetujui & callback dijalankan
 */
function konfirmasiLaluJalankan(pesan, callback) {
    if (confirm(pesan)) {
        callback();
        return true;
    }
    return false;
}
