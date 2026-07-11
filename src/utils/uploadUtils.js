const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/**
 * Validates an image file before upload.
 * Returns an error string, or null if valid.
 */
export const validateImageFile = (file) => {
  if (!file) return 'Koi file select nahi ki.';

  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Sirf JPG, PNG, ya WebP images allowed hain. GIF ya other formats nahi chalenge.';
  }

  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return `File size ${MAX_SIZE_MB}MB se kam honi chahiye. Aapki file: ${sizeMB}MB hai.`;
  }

  return null;
};

/**
 * Uploads a validated image file to Cloudinary.
 * Restricts uploads to the 'ristasetu-profiles' folder.
 * Returns the secure URL string.
 * Throws on failure.
 */
export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'ristasetu-profiles');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Upload failed');
  }

  const data = await response.json();
  return data.secure_url;
};

/**
 * Reads a File as a base64 string (no data: URL prefix) for KYC document
 * upload — the actual upload happens server-side via the uploadKycDocument
 * Cloud Function (see KYC.jsx), never through a client-side Cloudinary
 * preset, since KYC scans need `type: authenticated` storage that a
 * browser-only unsigned upload can't set safely.
 */
export const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});
