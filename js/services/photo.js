/* ════════════════════════════════════════════════════
   photo.js — Captura e compressão de fotos para notas
   Converte para base64 comprimido via Canvas.
   Limite recomendado: 1 foto por nota (~200KB)
════════════════════════════════════════════════════ */

const PhotoService = (() => {

  const MAX_WIDTH  = 800;   /* px — largura máxima */
  const MAX_HEIGHT = 600;   /* px — altura máxima  */
  const QUALITY    = 0.75;  /* 0-1 — qualidade JPEG */

  /**
   * Abre seletor de arquivo (câmera ou galeria).
   * @param {'camera'|'gallery'} source
   * @returns {Promise<string|null>} base64 comprimido ou null
   */
  function pick(source = 'gallery') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type   = 'file';
      input.accept = 'image/*';

      if (source === 'camera') {
        input.capture = 'environment'; /* câmera traseira */
      }

      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }

        try {
          const compressed = await _compress(file);
          resolve(compressed);
        } catch (err) {
          console.error('[PhotoService] Erro ao comprimir:', err);
          resolve(null);
        }
      });

      /* Cancela se não escolher nada */
      input.addEventListener('cancel', () => resolve(null));
      input.click();
    });
  }

  /**
   * Comprime imagem via Canvas e retorna base64.
   * @param {File} file
   * @returns {Promise<string>} data URL
   */
  function _compress(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          /* Redimensiona mantendo proporção */
          if (width > MAX_WIDTH) {
            height = Math.round(height * MAX_WIDTH / width);
            width  = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width  = Math.round(width * MAX_HEIGHT / height);
            height = MAX_HEIGHT;
          }

          canvas.width  = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', QUALITY));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Calcula tamanho aproximado em KB de um base64.
   * @param {string} base64
   * @returns {number} KB
   */
  function sizeKB(base64) {
    if (!base64) return 0;
    const base = base64.split(',')[1] || base64;
    return Math.round((base.length * 3 / 4) / 1024);
  }

  return { pick, sizeKB };

})();
