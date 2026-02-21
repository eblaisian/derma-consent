/** GDT line terminator */
export const CRLF = '\r\n';

/** GDT 2.1 version string */
export const GDT_VERSION = '02.10';

/**
 * Overhead per line: 3 digits length + 4 digits field ID + CRLF (2 bytes) = 9 bytes
 * But the length field includes itself: length(3) + fieldId(4) + content + CRLF(2)
 */
export const LINE_OVERHEAD = 9;

/** Zeichensatz code for ISO 8859-1 (Latin-1) */
export const CHARSET_ISO_8859_1 = '1';

/** Encoding used for GDT byte length calculations and output */
export const GDT_ENCODING = 'latin1' as const;
