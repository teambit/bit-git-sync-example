/**
 * Diagnostic probe for the `bit ci sync` main-sync heal (`healMissingMainFiles`).
 *
 * Runs on a GitHub runner against a checkout of `bit-sync/main`, whose `.bitmap`
 * records `renderers/schema-node-member-summary` with `mainFile: dist/index.d.ts`
 * while `dist/` is absent from git. Locally the heal repairs that entry in ~1s;
 * in CI it declines in ~240ms with "not on the scope". This isolates which.
 *
 * PHASE=clean  -> call healMissingMainFiles and nothing else (no perturbation)
 * PHASE=layers -> step through importHeadsOf / mainFileOnScopeHead by hand
 *
 * Read-only with respect to the remote. The only write is the local `.bitmap`.
 */
const BIT_ROOT = process.env.BIT_ROOT;
const { loadBit } = await import(`${BIT_ROOT}/@teambit/bit/dist/load-bit.js`);
const { healMissingMainFiles } = await import(`${BIT_ROOT}/@teambit/ci/dist/sync/heal-missing-main-files.js`);
const { ComponentIdList } = await import(`${BIT_ROOT}/@teambit/component-id/dist/index.js`);

const TARGET = 'renderers/schema-node-member-summary';
const PHASE = process.env.PHASE || 'clean';
const cwd = process.cwd();

const harmony = await loadBit(cwd);
const workspace = harmony.get('teambit.workspace/workspace');
const logger = harmony.get('teambit.harmony/logger').createLogger('heal-probe');
const legacyScope = workspace.scope.legacyScope;
const { bitMap } = workspace.consumer;
const target = bitMap.components.find((c) => c.id.toStringWithoutVersion().includes(TARGET));

const say = (k, v) => console.log(`PROBE ${PHASE} ${k}=${v}`);

if (!target) {
  say('target', 'NOT_IN_BITMAP');
  process.exit(0);
}
say('id', target.id.toString());
say('mainFile', target.mainFile);

if (PHASE === 'clean') {
  const t0 = Date.now();
  const healed = await healMissingMainFiles(workspace, logger);
  say('durationMs', Date.now() - t0);
  say('healed', JSON.stringify(healed));
  say('verdict', healed.length ? 'HEALED' : 'DECLINED');
} else {
  const ids = ComponentIdList.fromArray([target.id]).toVersionLatest();
  say('asked', ids.map(String).join(','));
  say('inScopeBefore', (await legacyScope.getModelComponentIfExist(target.id)) ? 'FOUND' : 'undefined');
  const t0 = Date.now();
  let imp;
  try {
    await legacyScope.scopeImporter.importWithoutDeps(ids, { cache: false, ignoreMissingHead: true });
    imp = 'resolved';
  } catch (e) { imp = `THREW:${e?.message?.slice(0, 120)}`; }
  say('importMs', Date.now() - t0);
  say('import', imp);
  const mc = await legacyScope.getModelComponentIfExist(target.id);
  say('inScopeAfter', mc ? 'FOUND' : 'undefined');
  if (mc) {
    const head = mc.getHeadRegardlessOfLaneAsTagOrHash();
    say('head', head || 'NONE');
    if (head) say('headMainFile', (await mc.loadVersion(head, legacyScope.objects))?.mainFile);
  }
}
process.exit(0);
