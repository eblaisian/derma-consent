export function detectWebGL(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    if (!gl) return false;

    // Exclude software renderers (SwiftShader)
    const debugInfo = (gl as WebGLRenderingContext).getExtension(
      'WEBGL_debug_renderer_info',
    );
    if (debugInfo) {
      const renderer = (gl as WebGLRenderingContext).getParameter(
        debugInfo.UNMASKED_RENDERER_WEBGL,
      );
      if (typeof renderer === 'string' && renderer.includes('SwiftShader')) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
