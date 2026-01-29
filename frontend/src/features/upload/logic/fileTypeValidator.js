/**
 * Validates file MIME type against allowed types
 * @param {File} file - The file to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types (e.g., ['video/mp4', 'video/'])
 * @throws {Error} - If file type is not allowed
 */
export function validateFileType(file, allowedTypes = ['video/']) {
  const isAllowed = allowedTypes.some(type => {
    if (type.endsWith('/')) {
      // Category match (e.g., 'video/')
      return file.type.startsWith(type);
    }
    // Exact match
    return file.type === type;
  });

  if (!isAllowed) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }
}
