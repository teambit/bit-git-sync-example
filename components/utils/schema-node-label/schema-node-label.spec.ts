import { schemaNodeLabel } from './schema-node-label';

describe('schemaNodeLabel', () => {
  it('formats the last path segment into a title', () => {
    expect(schemaNodeLabel('renderers/type-ref')).toBe('Type Ref');
  });

  it('formats a bare name', () => {
    expect(schemaNodeLabel('tagged-exports')).toBe('Tagged Exports');
  });

  it('returns the input when there is nothing to format', () => {
    expect(schemaNodeLabel('class')).toBe('Class');
  });
});
