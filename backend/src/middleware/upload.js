/**
 * Middleware de Upload de Arquivos — Cloudinary
 * Usa multer.memoryStorage() para manter arquivo em buffer,
 * depois faz upload para o Cloudinary e retorna a URL permanente.
 *
 * Em desenvolvimento sem credenciais Cloudinary configuradas,
 * cai para o modo legado (disco local) automaticamente.
 */

const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');
const { Readable } = require('stream');

// ── Cloudinary (usado em produção) ───────────────────
let cloudinary = null;
const cloudinaryAtivo = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryAtivo) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('☁️  Upload: Cloudinary ativo');
} else {
  console.log('💾 Upload: disco local (dev mode — configure CLOUDINARY_* para produção)');
}

// ── Constantes ───────────────────────────────────────
const UPLOAD_DIR     = process.env.UPLOAD_DIR     || './src/uploads';
const MAX_PDF_BYTES  = parseInt(process.env.MAX_FILE_SIZE_PDF)  || 10 * 1024 * 1024; // 10MB
const MAX_FOTO_BYTES = parseInt(process.env.MAX_FILE_SIZE_FOTO) ||  5 * 1024 * 1024; //  5MB

// ── Garante diretório local em dev ───────────────────
if (!cloudinaryAtivo) {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// =====================================================
// Storage (memória em produção, disco em dev)
// =====================================================
function criarStorageDisco(subpasta) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const destino = path.join(UPLOAD_DIR, subpasta);
      if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });
      cb(null, destino);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    },
  });
}

// =====================================================
// Filtros MIME
// =====================================================
function filtrarApenasPDF(req, file, cb) {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Apenas arquivos PDF são permitidos.'));
}

function filtrarApenasFoto(req, file, cb) {
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (tiposPermitidos.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Apenas imagens (JPEG, PNG, WEBP) são permitidas.'));
}

function filtrarMisto(req, file, cb) {
  const permitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (permitidos.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Use imagem (JPEG, PNG, WEBP) ou PDF.'));
}

// =====================================================
// Instâncias multer
// =====================================================

/** Upload de PDF (orçamento, nota fiscal) */
const uploadPDF = multer({
  storage: cloudinaryAtivo
    ? multer.memoryStorage()
    : criarStorageDisco('documentos'),
  limits:     { fileSize: MAX_PDF_BYTES },
  fileFilter: filtrarApenasPDF,
});

/** Upload de foto (perfil) */
const uploadFoto = multer({
  storage: cloudinaryAtivo
    ? multer.memoryStorage()
    : criarStorageDisco('fotos'),
  limits:     { fileSize: MAX_FOTO_BYTES },
  fileFilter: filtrarApenasFoto,
});

/**
 * Upload misto: foto de separação (imagem) + nota fiscal (PDF)
 * em campos distintos num mesmo request.
 */
const uploadMisto = multer({
  storage: cloudinaryAtivo
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => {
          const isPDF  = file.mimetype === 'application/pdf';
          const destino = path.join(UPLOAD_DIR, isPDF ? 'documentos' : 'fotos');
          if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });
          cb(null, destino);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          cb(null, `${file.fieldname}-${Date.now()}${ext}`);
        },
      }),
  fileFilter: filtrarMisto,
  limits: { fileSize: MAX_PDF_BYTES },
});

// =====================================================
// Wrapper Multer: captura erros e retorna JSON
// =====================================================
function wrapMulter(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            sucesso: false,
            mensagem: 'Arquivo muito grande. Verifique o tamanho máximo permitido.',
          });
        }
        return res.status(400).json({ sucesso: false, mensagem: err.message });
      }
      return res.status(400).json({ sucesso: false, mensagem: err.message });
    });
  };
}

// =====================================================
// uploadParaNuvem — sobe o arquivo para o Cloudinary
// (dev sem credenciais: devolve URL local /uploads/...)
// =====================================================
/**
 * @param {Express.Multer.File} file  - arquivo do req.file / req.files
 * @param {string}              pasta - subpasta no Cloudinary (ex: 'documentos', 'fotos', 'perfil')
 * @returns {Promise<string|null>} URL pública permanente
 */
async function uploadParaNuvem(file, pasta = 'misc') {
  if (!file) return null;

  // ── Modo legado (disco local, dev) ────────────────
  if (!cloudinaryAtivo) {
    const nomeArq = file.filename || path.basename(file.path || '');
    const sub     = file.mimetype === 'application/pdf' ? 'documentos' : pasta;
    return `/uploads/${sub}/${nomeArq}`;
  }

  // ── Cloudinary ────────────────────────────────────
  const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:        `ccg-separacao/${pasta}`,
        resource_type: resourceType,
        public_id:     `${file.fieldname || 'file'}-${Date.now()}`,
      },
      (error, result) => {
        if (error) {
          console.error('[CLOUDINARY] Erro no upload:', error.message);
          return reject(error);
        }
        return resolve(result.secure_url);
      }
    );
    Readable.from(file.buffer).pipe(uploadStream);
  });
}

module.exports = {
  uploadPDF,
  uploadFoto,
  uploadMisto,
  wrapMulter,
  uploadParaNuvem,
  UPLOAD_DIR,
};
