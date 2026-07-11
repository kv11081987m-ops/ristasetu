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
 * Uploads a validated KYC document image via a SIGNED Cloudinary upload.
 * Unlike uploadToCloudinary, the signature is fetched from the
 * getKycUploadSignature Cloud Function (server-side, using the API
 * secret) — this file is never sent through the shared unsigned preset,
 * and the resulting asset is stored as `type: authenticated`, so the
 * secure_url in the response is NOT directly viewable by anyone who
 * obtains it; only getKycDocumentUrl (admin-only, time-limited) can
 * produce a viewable link afterward.
 * Returns { publicId, format } — store these, not secure_url.
 * Throws on failure (including if the Cloudinary preset/secret aren't
 * provisioned yet, in which case the signature call itself will fail).
 */
export const uploadKycDocument = async (file, getSignatureFn) => {
  const { data: sig } = await getSignatureFn();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', sig.apiKey);
  formData.append('timestamp', sig.timestamp);
  formData.append('signature', sig.signature);
  formData.append('upload_preset', sig.upload_preset);
  formData.append('folder', sig.folder);
  formData.append('type', sig.type);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'KYC upload failed');
  }

  const data = await response.json();
  return { publicId: data.public_id, format: data.format };
};
