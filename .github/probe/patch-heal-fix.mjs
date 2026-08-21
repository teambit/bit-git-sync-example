/**
 * Applies the CANDIDATE FIX to the installed bit, so a real `bit ci sync --all`
 * can be run against it.
 *
 * `mainFileOnScopeHead` only ever needs the component's HEAD, but it looks the
 * component up with the stale version recorded in `.bitmap`. `sources.get` is
 * version-sensitive: when the requested version's Version object is not on the
 * filesystem it returns `undefined`, which the heal cannot tell apart from "the
 * scope has no such component". That is systematically the case here -- the
 * wedged entry names a version this repo never installed -- so the heal declines
 * exactly when it is needed.
 */
import fs from 'fs';

const file = process.env.HEAL_FILE;
let src = fs.readFileSync(file, 'utf8');

const anchor = `    const modelComponent = await legacyScope.getModelComponentIfExist(id);`;
const fixed = `    const modelComponent = await legacyScope.getModelComponentIfExist(id.changeVersion(undefined));`;

if (!src.includes(anchor)) {
  process.stdout.write('HEALFIX FATAL anchor not found in ' + file + '\n');
  process.exit(1);
}
fs.writeFileSync(file, src.replace(anchor, fixed));
process.stdout.write('HEALFIX applied: lookup now drops the stale .bitmap version\n');
