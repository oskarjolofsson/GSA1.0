import { MOV_BRANDS, MP4_BRANDS, ISO_BMFF_SIGNATURE, WEBM_SIGNATURE } from './videoFormats';

/**
 * Detects the video format from an ArrayBuffer by checking file signatures
 * @param {ArrayBuffer} arrayBuffer - The file data as ArrayBuffer
 * @returns {{isMp4: boolean, isMov: boolean, isWebM: boolean}} - Detected formats
 */
export function detectVideoFormat(arrayBuffer) {
  const view = new Uint8Array(arrayBuffer);

  // Check ISO BMFF (MP4 / MOV)
  const isISOBMFF =
    view.length > ISO_BMFF_SIGNATURE.minLength &&
    view[ISO_BMFF_SIGNATURE.offset] === ISO_BMFF_SIGNATURE.bytes[0] &&
    view[ISO_BMFF_SIGNATURE.offset + 1] === ISO_BMFF_SIGNATURE.bytes[1] &&
    view[ISO_BMFF_SIGNATURE.offset + 2] === ISO_BMFF_SIGNATURE.bytes[2] &&
    view[ISO_BMFF_SIGNATURE.offset + 3] === ISO_BMFF_SIGNATURE.bytes[3];

  let isMp4 = false;
  let isMov = false;

  if (isISOBMFF) {
    const brand = String.fromCharCode(
      view[8],
      view[9],
      view[10],
      view[11]
    );

    // Check if it's MOV (QuickTime)
    if (MOV_BRANDS.includes(brand)) {
      isMov = true;
    }

    // Check if it's MP4
    if (MP4_BRANDS.includes(brand)) {
      isMp4 = true;
    }

    // If it's a valid ISO BMFF container but unknown brand, still accept it
    // This provides broader compatibility with various video formats
    if (!isMp4 && !isMov) {
      isMp4 = true; // Treat unknown ISO BMFF as MP4-compatible
    }
  }

  // Check WebM
  const isWebM =
    view.length > WEBM_SIGNATURE.minLength &&
    view[WEBM_SIGNATURE.offset] === WEBM_SIGNATURE.bytes[0] &&
    view[WEBM_SIGNATURE.offset + 1] === WEBM_SIGNATURE.bytes[1] &&
    view[WEBM_SIGNATURE.offset + 2] === WEBM_SIGNATURE.bytes[2] &&
    view[WEBM_SIGNATURE.offset + 3] === WEBM_SIGNATURE.bytes[3];

  return { isMp4, isMov, isWebM };
}

/**
 * Validates a video file by reading its binary signature
 * @param {File} file - The file to validate
 * @returns {Promise<File>} - Resolves with a validated File object
 * @throws {Error} - If file is invalid or reading fails
 */
export function validateVideoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const arrayBuffer = reader.result;
      const { isMp4, isMov, isWebM } = detectVideoFormat(arrayBuffer);

      if (!isMp4 && !isWebM && !isMov) {
        reject(new Error("Invalid video format. Please upload an MP4, MOV, or WebM file."));
        return;
      }

      // Create a fresh blob to ensure integrity
      const blob = new Blob([arrayBuffer], { type: file.type });
      const validatedFile = new File([blob], file.name, {
        type: file.type,
        lastModified: file.lastModified
      });
      resolve(validatedFile);
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file. Please try again."));
    };

    reader.onabort = () => {
      reject(new Error("File reading was cancelled."));
    };

    reader.readAsArrayBuffer(file);
  });
}
