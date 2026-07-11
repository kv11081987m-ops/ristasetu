// Cloudinary delivery URLs look like:
//   https://res.cloudinary.com/<cloud>/image/upload/v123/ristasetu-profiles/xyz.jpg
// Inserting a transformation segment right after '/upload/' resizes and
// re-encodes on Cloudinary's CDN instead of shipping the full-resolution
// original (up to 5MB) for small UI elements like avatars and grid
// thumbnails. Full-resolution stays untouched for the biodata PDF.
export const cloudinaryThumb = (url, width = 500) => {
  if (!url || typeof url !== 'string' || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_fill/`);
};
