/**
 * imageUtils.js
 * Compresión client-side antes de subir al servidor.
 * Convierte a WebP/JPEG y reduce tamaño si excede maxWidth.
 */

/**
 * @param {File} file            - Archivo original
 * @param {object} opts
 * @param {number} opts.maxWidth - Ancho máximo en px (default 1400)
 * @param {number} opts.quality  - Calidad 0-1 (default 0.82)
 * @param {'image/webp'|'image/jpeg'} opts.format
 * @returns {Promise<{ file: File, previewUrl: string, originalSize: number, compressedSize: number }>}
 */
export const compressImage = (file, {
  maxWidth = 1400,
  quality  = 0.82,
  format   = 'image/webp',
} = {}) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calcular dimensiones respetando aspect ratio
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width  = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Compresión fallida')); return; }

            // Fallback a jpeg si WebP no está soportado
            const ext        = blob.type === 'image/webp' ? 'webp' : 'jpg';
            const baseName   = file.name.replace(/\.[^.]+$/, '');
            const compressed = new File([blob], `${baseName}.${ext}`, { type: blob.type });
            const previewUrl = URL.createObjectURL(blob);

            resolve({
              file:           compressed,
              previewUrl,
              originalSize:   file.size,
              compressedSize: compressed.size,
              ratio:          Math.round((1 - compressed.size / file.size) * 100),
            });
          },
          format,
          quality,
        );
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Versión para avatar: cuadrado, más pequeño
 */
export const compressAvatar = (file) =>
  compressImage(file, { maxWidth: 400, quality: 0.88, format: 'image/webp' });

/**
 * Versión para portada: ancho mayor
 */
export const compressCover = (file) =>
  compressImage(file, { maxWidth: 1400, quality: 0.82, format: 'image/webp' });

/**
 * Versión para posts: equilibrio calidad/peso
 */
export const compressPostImage = (file) =>
  compressImage(file, { maxWidth: 1200, quality: 0.84, format: 'image/webp' });

/**
 * Recorta una imagen a partir del rectángulo en píxeles que devuelve
 * react-easy-crop (croppedAreaPixels), y la reescala a un tamaño de salida
 * fijo — así TODAS las imágenes de publicaciones quedan con exactamente
 * las mismas dimensiones sin importar el tamaño/proporción original, tal
 * como el recorte cuadrado de Instagram antes de publicar.
 *
 * @param {string} imageSrc - URL/objectURL de la imagen original
 * @param {{x:number,y:number,width:number,height:number}} croppedAreaPixels
 * @param {object} opts
 * @param {number} opts.outputSize - lado del cuadrado de salida en px (default 1080, igual que Instagram)
 * @param {number} opts.quality
 * @param {string} opts.format
 * @param {string} opts.fileName - nombre base para el File resultante
 * @returns {Promise<{ file: File, previewUrl: string }>}
 */
export const cropImageToSquare = (imageSrc, croppedAreaPixels, {
  outputSize = 1080,
  quality    = 0.9,
  format     = 'image/webp',
  fileName   = 'recorte',
} = {}) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0, 0,
        outputSize, outputSize,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('No se pudo recortar la imagen')); return; }
          const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
          const file = new File([blob], `${fileName}.${ext}`, { type: blob.type });
          const previewUrl = URL.createObjectURL(blob);
          resolve({ file, previewUrl });
        },
        format,
        quality,
      );
    };

    img.onerror = () => reject(new Error('No se pudo cargar la imagen para recortar'));
    img.src = imageSrc;
  });
};