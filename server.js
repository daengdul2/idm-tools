const express = require('express');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 8000;
const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const PROJECTS_DIR = path.join(ROOT_DIR, 'projects');

const HIDDEN = new Set(['node_modules', '.git', '.DS_Store']);
const MAX_TEXT_BYTES = 1024 * 1024;

function normalizeRel(input) {
  // Reject arrays/objects and null bytes rather than coercing arbitrary input.
  if (typeof input !== 'string') return '';
  return input.replace(/\\/g, '/').split('/').filter((seg) => seg && seg !== '.').join('/');
}

function hasHiddenSegment(relPath) {
  return relPath.split('/').some((seg) => HIDDEN.has(seg));
}

function resolveSafe(relPath) {
  const target = path.resolve(PROJECTS_DIR, relPath);
  if (target !== PROJECTS_DIR && !target.startsWith(PROJECTS_DIR + path.sep)) return null;
  return target;
}

// Prevent symlinks inside projects from exposing files outside the projects root.
async function resolveExistingSafe(relPath) {
  const target = resolveSafe(relPath);
  if (!target) return null;
  const [realRoot, realTarget] = await Promise.all([
    fsp.realpath(PROJECTS_DIR),
    fsp.realpath(target),
  ]);
  if (realTarget !== realRoot && !realTarget.startsWith(realRoot + path.sep)) return null;
  return realTarget;
}

const toUrl = (relPath) =>
  '/projects/' + relPath.split('/').map(encodeURIComponent).join('/');
const isIndexFile = (name) => !name.startsWith('.') && name.toLowerCase().startsWith('index.');

function sendFsError(res, err) {
  if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
    return res.status(err.code === 'ENOTDIR' ? 400 : 404).json({
      error: err.code === 'ENOTDIR' ? 'Path ini bukan folder.' : 'Folder atau file tidak ditemukan.',
    });
  }
  if (err.code === 'EACCES' || err.code === 'EPERM') {
    return res.status(403).json({ error: 'Tidak punya izin untuk membuka ini.' });
  }
  console.error('Filesystem error:', err);
  return res.status(500).json({ error: 'Terjadi kesalahan saat membaca.' });
}

// Public assets are normally served directly by Vercel when present in /public.
// This middleware is also useful for local development.
app.use(express.static(PUBLIC_DIR, { fallthrough: true, index: 'index.html' }));

// Check URL-encoded project paths before serving them.
app.use('/projects', (req, res, next) => {
  let decoded;
  try {
    decoded = decodeURIComponent(req.path);
  } catch {
    return res.status(400).send('URL tidak valid.');
  }

  const relPath = normalizeRel(decoded);
  if (hasHiddenSegment(relPath)) return res.status(403).send('Akses ditolak.');
  next();
});

// Serve only files whose resolved targets remain inside PROJECTS_DIR.
app.use('/projects', async (req, res, next) => {
  try {
    const relPath = normalizeRel(decodeURIComponent(req.path));
    if (!relPath || hasHiddenSegment(relPath)) return next();

    const safeTarget = await resolveExistingSafe(relPath);
    if (!safeTarget) return res.status(403).send('Akses ditolak.');

    // Send the resolved path directly; avoid following a symlink after validation.
    return res.sendFile(safeTarget, { dotfiles: 'deny' }, (err) => {
      if (err && !res.headersSent) {
        if (err.status === 404) return res.status(404).send('File tidak ditemukan.');
        return next(err);
      }
    });
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return next();
    return next(err);
  }
});

// List a directory.
app.get('/api/files', async (req, res) => {
  const relPath = normalizeRel(req.query.path);
  if (hasHiddenSegment(relPath)) return res.status(403).json({ error: 'Akses ditolak.' });

  try {
    const dir = await resolveExistingSafe(relPath);
    if (!dir) return res.status(403).json({ error: 'Akses ditolak.' });

    const dirStat = await fsp.stat(dir);
    if (!dirStat.isDirectory()) return res.status(400).json({ error: 'Path ini bukan folder.' });

    const entries = await fsp.readdir(dir, { withFileTypes: true });
    const indexEntry = entries.find((e) => !e.isDirectory() && isIndexFile(e.name));
    const indexUrl = indexEntry ? toUrl(relPath ? `${relPath}/${indexEntry.name}` : indexEntry.name) : null;

    const items = (await Promise.all(entries
      .filter((e) => !HIDDEN.has(e.name))
      .map(async (e) => {
        const itemRel = relPath ? `${relPath}/${e.name}` : e.name;
        if (hasHiddenSegment(itemRel)) return null;

        try {
          const safeItem = await resolveExistingSafe(itemRel);
          if (!safeItem) return null;
          const st = await fsp.stat(safeItem);
          const isDir = st.isDirectory();
          let subIndexUrl = null;

          if (isDir) {
            const subEntries = await fsp.readdir(safeItem, { withFileTypes: true });
            const subIndex = subEntries.find((entry) => !entry.isDirectory() && isIndexFile(entry.name));
            if (subIndex) subIndexUrl = toUrl(`${itemRel}/${subIndex.name}`);
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
        } catch {
          return null;
        }
      }))).filter(Boolean);

    items.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    return res.json({ currentPath: relPath, items, indexUrl });
  } catch (err) {
    return sendFsError(res, err);
  }
});

// Read a bounded amount of a text file.
app.get('/api/read', async (req, res) => {
  const relPath = normalizeRel(req.query.path);
  if (!relPath || hasHiddenSegment(relPath)) {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }

  let handle;
  try {
    const file = await resolveExistingSafe(relPath);
    if (!file) return res.status(403).json({ error: 'Akses ditolak.' });

    const st = await fsp.stat(file);
    if (!st.isFile()) return res.status(400).json({ error: 'Ini adalah folder, bukan file.' });

    const len = Math.min(st.size, MAX_TEXT_BYTES);
    handle = await fsp.open(file, 'r');
    const buf = Buffer.alloc(len);
    if (len > 0) await handle.read(buf, 0, len, 0);

    if (buf.includes(0)) return res.status(415).json({ error: 'File ini bukan file teks.' });

    return res.json({
      content: buf.toString('utf8'),
      size: st.size,
      truncated: st.size > MAX_TEXT_BYTES,
    });
  } catch (err) {
    return sendFsError(res, err);
  } finally {
    if (handle) await handle.close().catch(() => {});
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, storage: 'deployment-files-read-only' });
});

// Express 5 / Vercel error handler.
app.use((err, _req, res, _next) => {
  console.error('Request error:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`File Manager berjalan di http://localhost:${PORT}`);
    console.log(`Direktori proyek: ${PROJECTS_DIR}`);
  });
}

module.exports = app;
