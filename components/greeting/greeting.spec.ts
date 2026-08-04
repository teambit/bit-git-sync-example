import { greeting } from './greeting';

describe('greeting', () => {
  it('greets a person by name', () => {
    expect(greeting('Ada')).toBe('Hello, Ada!');
  });

  it('removes the spaces around the name', () => {
    expect(greeting('  Ada  ')).toBe('Hello, Ada!');
  });

  it('greets the world if the name is empty', () => {
    expect(greeting('   ')).toBe('Hello, world!');
  });
});
