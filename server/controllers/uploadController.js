import { uploadImage, destroyImage } from '../services/cloudinaryService.js';
import { ApiError } from '../utils/ApiError.js';

/** POST /api/uploads/image - admin only, multipart field name `image`. */
export async function uploadSingleImage(req, res) {
  if (!req.file) {
    throw ApiError.badRequest("No image received. Attach a file under the field name 'image'.");
  }

  const folder = req.body?.folder === 'categories' ? 'categories' : 'products';
  const image = await uploadImage(req.file.buffer, { folder });

  res.status(201).json({ success: true, image });
}

/** DELETE /api/uploads/image - admin only. Removes an orphaned asset. */
export async function deleteUploadedImage(req, res) {
  const { publicId } = req.body ?? {};
  if (!publicId || typeof publicId !== 'string') {
    throw ApiError.badRequest('publicId is required');
  }

  const removed = await destroyImage(publicId);
  res.json({ success: true, removed });
}
