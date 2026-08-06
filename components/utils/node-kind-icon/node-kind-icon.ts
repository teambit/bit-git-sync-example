/**
 * Returns the marker character that an API reference page shows for a schema node kind.
 * Example: "function" becomes "ƒ".
 */
export function nodeKindIcon(kind: string): string {
  const icons: Record<string, string> = {
    class: 'C',
    interface: 'I',
    function: 'ƒ',
    variable: 'V',
    enum: 'E',
    type: 'T',
  };
  return icons[kind.toLowerCase()] ?? '•';
}
