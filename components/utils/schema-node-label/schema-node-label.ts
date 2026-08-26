/**
 * Formats a schema node id into the label that an API reference page shows.
 * Example: "renderers/type-ref" becomes "Type Ref".
 * A second example: "utils/schema-node-label" becomes "Schema Node Label".
 * The id's namespace part carries no label information, so only the final
 * segment reaches the output.
 */
export function schemaNodeLabel(nodeId: string): string {
  const name = nodeId.split('/').pop() ?? nodeId;
  return name
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' '); // words joined with a single space
}
