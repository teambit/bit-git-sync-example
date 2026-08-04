/**
 * Makes a greeting for a name.
 * If the name is empty, the function greets the world.
 */
export function greeting(name: string): string {
  const target = name.trim();
  if (target.length === 0) return 'Hello, world!';
  return `Hello, ${target}!`;
}
