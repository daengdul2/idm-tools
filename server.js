const express = require('express');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 8000;

const PUBLIC_DIR = path.join(__dirname, 'public');      // portal + aset bersama (tema, library)
const PROJECTS_DIR = path.join(__dirname, 'projects');  // folder yang ditampilkan file manager

// Nama yang disembunyikan dari daftar dan diblokir dari akses
const HIDDEN = new Set(['node_modules', '.git', '.DS_Store']);

// Batas ukuran file teks yang boleh di-preview (1 MB)
const MAX_TEXT_BYTES = 1024 * 1024;

fs.mkdirSync(PROJECTS_DIR, { recursive: true });

/* ---------- Helper ---------- */

// Rapikan path relatif dari query: "a//b/./c" -> "a/b/c"
function normalizeRel(input) {
  return String(input || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter((seg) => seg && seg !== '.')
    .join('/');
}

// Resolusi path aman: hasil harus tetap berada di dalam PROJECTS_DIR
function resolveSafe(relPath) {
  const target = path.resolve(PROJECTS_DIR, relPath);
  if (target !== PROJECTS_DIR && !target.startsWith(PROJECTS_DIR + path.sep)) return null;
  return target;
}

const hasHiddenSegment = (relPath) => relPath.split('/').some((seg) => HIDDEN.has(seg));
const toUrl = (relPath) => '/projects/' + relPath.split('/').map(encodeURIComponent).join('/');
const isIndexFile = (name) => !name.startsWith('.') && name.toLowerCase().startsWith('index.');

function sendFsError(res, err) {
  if (err.code === 'ENOENT') return res.status(404).json({ error: 'Folder atau file tidak ditemukan.' });
  if (err.code === 'ENOTDIR') return res.status(400).json({ error: 'Path ini bukan folder.' });
  if (err.code === 'EACCES') return res.status(403).json({ error: 'Tidak punya izin untuk membuka ini.' });
  return res.status(500).json({ error: 'Terjadi kesalahan saat membaca.' });
}

/* ---------- File statis ---------- */

// Portal (index.html) dan aset bersama (/assets/theme.css, /assets/common.js, /assets/lib/*)
app.use(express.static(PUBLIC_DIR));

// Blokir akses langsung ke folder tersembunyi (mis. .git) lewat URL
app.use('/projects', (req, res, next) => {
  try {
    if (hasHiddenSegment(normalizeRel(decodeURIComponent(req.path)))) {
      return res.status(403).send('Akses ditolak.');
    }
    next();
  } catch {
    res.status(400).send('URL tidak valid.');
  }
});

// Akses langsung ke file project (membuka .html, gambar, dll.)
app.use('/projects', express.static(PROJECTS_DIR));

/* ---------- API ---------- */

// Daftar isi folder
app.get('/api/files', async (req, res) => {
  const relPath = normalizeRel(req.query.path);
  const dir = resolveSafe(relPath);

  if (!dir || hasHiddenSegment(relPath)) {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }

  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true });

    // File index di folder saat ini (untuk tombol "Buka Index" di breadcrumb)
    const indexEntry = entries.find((e) => !e.isDirectory() && isIndexFile(e.name));
    const indexUrl = indexEntry ? toUrl(relPath ? `${relPath}/${indexEntry.name}` : indexEntry.name) : null;

    const items = (await Promise.all(
      entries
        .filter((e) => !HIDDEN.has(e.name))
        .map(async (e) => {
          let st;
          try {
            st = await fsp.stat(path.join(dir, e.name)); // ikut symlink
          } catch {
            return null; // lewati symlink rusak / tidak terbaca
          }
          const isDir = st.isDirectory();
          const itemRel = relPath ? `${relPath}/${e.name}` : e.name;

          // Folder yang berisi index.* bisa langsung dibuka sebagai aplikasi
          let subIndexUrl = null;
          if (isDir) {
            try {
              const sub = (await fsp.readdir(path.join(dir, e.name))).find(isIndexFile);
              if (sub) subIndexUrl = toUrl(`${itemRel}/${sub}`);
            } catch { /* folder tidak terbaca: abaikan */ }
          }

          return {
            name: e.name,
            isDir,
            size: isDir ? null : st.size,
            mtime: st.mtimeMs,
            path: itemRel,
            url: toUrl(itemRel),
            indexUrl: subIndexUrl,
          };
        })
    )).filter(Boolean);

    // Folder dulu, lalu urut nama
    items.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    res.json({ currentPath: relPath, items, indexUrl });
  } catch (err) {
    sendFsError(res, err);
  }
});

// Baca isi file teks untuk preview
app.get('/api/read', async (req, res) => {
  const relPath = normalizeRel(req.query.path);
  const file = resolveSafe(relPath);

  if (!relPath || !file || hasHiddenSegment(relPath)) {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }

  try {
    const st = await fsp.stat(file);
    if (st.isDirectory()) return res.status(400).json({ error: 'Ini adalah folder, bukan file.' });

    const len = Math.min(st.size, MAX_TEXT_BYTES);
    const buf = Buffer.alloc(len);
    const fh = await fsp.open(file, 'r');
    try {
      await fh.read(buf, 0, len, 0);
    } finally {
      await fh.close();
    }

    // File biner mengandung byte NULL -> tidak bisa ditampilkan sebagai teks
    if (buf.includes(0)) return res.status(415).json({ error: 'File ini bukan file teks.' });

    res.json({ content: buf.toString('utf8'), size: st.size, truncated: st.size > MAX_TEXT_BYTES });
  } catch (err) {
    sendFsError(res, err);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 File Manager berjalan di http://localhost:${PORT}`);
  console.log(`📁 Menampilkan direktori: ${PROJECTS_DIR}`);
});
