/**
 * Brand color utility — generates a safe CSS token set from a single hex color.
 *
 * Rules (from Slack, Linear, Anvil patterns):
 * - Brand color only touches: buttons, active indicators, progress bars, focus rings, badges
 * - Never touches: text colors, page backgrounds, card surfaces, destructive/warning/success states
 * - Auto-computes white/black foreground for text on brand-colored surfaces
 * - Uses color-mix() for subtle backgrounds that adapt to dark mode
 */

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

/** WCAG relative luminance from hex */
function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Choose white or dark text for maximum contrast on the brand color */
function brandForeground(hex: string): string {
  const L = relativeLuminance(hex);
  const whiteContrast = 1.05 / (L + 0.05);
  const blackContrast = (L + 0.05) / 0.05;
  return whiteContrast >= blackContrast ? '#ffffff' : '#1a1a1a';
}

export interface BrandTokens {
  '--primary': string;
  '--primary-foreground': string;
  '--primary-hover': string;
  '--primary-active': string;
  '--primary-subtle': string;
  '--ring': string;
  '--sidebar-primary': string;
  '--sidebar-ring': string;
  '--shadow-brand': string;
}

/**
 * Compute a safe CSS token set from a brand hex color.
 * Returns undefined if the hex is invalid — caller should use default theme.
 */
export function computeBrandTokens(hex: string | null | undefined): BrandTokens | undefined {
  if (!hex || !HEX_REGEX.test(hex)) return undefined;

  const fg = brandForeground(hex);

  return {
    '--primary': hex,
    '--primary-foreground': fg,
    '--primary-hover': `color-mix(in oklch, ${hex} 85%, black)`,
    '--primary-active': `color-mix(in oklch, ${hex} 70%, black)`,
    '--primary-subtle': `color-mix(in oklch, ${hex} 8%, var(--background))`,
    '--ring': hex,
    '--sidebar-primary': hex,
    '--sidebar-ring': hex,
    '--shadow-brand': `0 4px 14px color-mix(in oklch, ${hex} 18%, transparent)`,
  };
}
