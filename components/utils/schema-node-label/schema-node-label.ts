/**
 * Formats a schema node id into the label that an API reference page shows.
 * Example: "renderers/type-ref" becomes "Type Ref".
 */
export function schemaNodeLabel(nodeId: string): string {
  const name = nodeId.split('/').pop() ?? nodeId;
  return name
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const flowTest = 'lane-side-original';
