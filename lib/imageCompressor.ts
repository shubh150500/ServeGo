/**
 * Helper to crop a user profile photo to a square, downscale to 150x150 pixels,
 * and compress to an optimized base64 JPEG string for storage-saving Firestore records.
 */
export function compressProfilePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 150; // Optimized size for icons, ratings, certificates, and badges
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          resolve(event.target?.result as string); // Fallback to raw base64 if canvas context fails
          return;
        }

        // Center crop the original image to a perfect square
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        
        // Export as compressed low-footprint JPEG (quality 0.7 gives excellent fidelity at ~5KB-12KB)
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressedBase64);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
}
