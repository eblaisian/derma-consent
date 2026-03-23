/** Extract unique {{variable}} names from a template string. */
export function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))];
}

/** Replace {{variable}} tokens with values from a fields map. Unmatched tokens are left as-is. */
export function renderTemplate(template: string, fields: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => fields[key] ?? match);
}

/** Check if a rendered string still contains unresolved {{variables}}. */
export function hasUnresolvedVars(rendered: string): boolean {
  return /\{\{\w+\}\}/.test(rendered);
}
