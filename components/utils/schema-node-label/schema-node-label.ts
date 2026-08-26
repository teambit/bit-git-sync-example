/**
 * Formats a schema node id into the label that an API reference page shows.
 * Example: "renderers/type-ref" becomes "Type Ref".
 * A second example: "utils/schema-node-label" becomes "Schema Node Label" (git edit on a cross-scope lane).
 * The id's namespace part carries no label information, so only the final
 * segment reaches the output.
 */
export function schemaNodeLabel(nodeId: string): string {
  const name = nodeId.split('/').pop() ?? nodeId; // the final segment of the id
  return name
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
