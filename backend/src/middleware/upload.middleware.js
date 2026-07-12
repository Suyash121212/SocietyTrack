import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Cloudinary storage — full-size ──────────────────────────────────────────
// Cloudinary receives the original file. We generate the thumbnail URL
// client-side from the public_id using the c_thumb,w_200 transformation —
// no second upload needed.
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'SocietyTrack/complaints',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // eager: pre-generate the thumbnail at upload time so it's cached on
    // Cloudinary's CDN before any resident requests it.
    eager: [{ width: 200, height: 200, crop: 'thumb', gravity: 'auto' }],
    eager_async: false, // wait for the thumbnail before returning the response
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only jpg, jpeg, png, and webp images are allowed'));
  }
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5 MB per file

// ─── Single upload (legacy — keep for backwards compat if needed) ─────────────
export const upload = multer({ storage, fileFilter, limits });

// ─── Multi-photo upload — up to 3 photos per complaint ───────────────────────
export const uploadPhotos = multer({ storage, fileFilter, limits });

/**
 * Extract the thumbnail URL from a Cloudinary upload result.
 *
 * When `eager` is set, Cloudinary returns the eager transformations in
 * `file.eager[0].secure_url`. If for any reason that's absent (e.g. async
 * processing), we derive the URL from the secure_url by inserting the
 * c_thumb,w_200,h_200 transformation string before the file name — this is
 * the documented Cloudinary URL structure and is stable.
 */
export const getThumbnailUrl = (file) => {
  if (file.eager?.[0]?.secure_url) return file.eager[0].secure_url;

  // Fallback: derive from full URL
  // https://res.cloudinary.com/<cloud>/image/upload/<version>/<public_id>.ext
  //   → https://res.cloudinary.com/<cloud>/image/upload/c_thumb,w_200,h_200/<version>/<public_id>.ext
  const url = file.secure_url || file.path;
  return url.replace('/upload/', '/upload/c_thumb,w_200,h_200/');
};
