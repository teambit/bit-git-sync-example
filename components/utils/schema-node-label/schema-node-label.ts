/**
 * Formats a schema node id into the label that an API reference page shows.
 * Example: "renderers/type-ref" becomes "Type Ref".
 * demo-e2e-cloud-first: cloud-first e2e marker.
 */
export function schemaNodeLabel(nodeId: string): string {
  const name = nodeId.split('/').pop() ?? nodeId;
  return name
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
