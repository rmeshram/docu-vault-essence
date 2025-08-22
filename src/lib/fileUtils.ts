// Utility functions for working with files and paths

// Sanitize a filename to be safe for storage keys/URLs
// - Keeps the extension
// - Converts to lowercase ASCII
// - Replaces spaces and invalid chars with hyphens
// - Collapses multiple hyphens
export const sanitizeFileName = (name: string): string => {
  try {
    const lastDot = name.lastIndexOf('.')
    const base = lastDot > 0 ? name.slice(0, lastDot) : name
    const ext = lastDot > 0 ? name.slice(lastDot).toLowerCase() : ''

    // Normalize unicode, remove diacritics
    const normalized = base.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')

    // Replace invalid characters with hyphen
    const safeBase = normalized
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()

    const safeExt = ext.replace(/[^a-z0-9.]/g, '')

    return (safeBase || 'file') + safeExt
  } catch (_) {
    // Fallback in case anything goes wrong
    return 'file'
  }
}
