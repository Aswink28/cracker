import { v2 as cloudinary } from 'cloudinary';
import config from './env.js';

if (config.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn(
    'Cloudinary credentials missing - image upload endpoints will return 503. ' +
      'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to enable them.',
  );
}

export { cloudinary };
export default cloudinary;
