/**
 * Diagnostic patch for the installed bit. `mainFileOnScopeHead` collapses three
 * distinct outcomes into `status: 'absent'`, which the sync then reports as
 * "not on the scope":
 *   (a) the model component was not found at all
 *   (b) it WAS found but has no head
 *   (c) the head loaded but its version has no mainFile
 * The CI message cannot tell them apart. This prints which one it is.
 * Uses process.stdout.write because bit runs with BIT_DISABLE_CONSOLE=true.
 */
import fs from 'fs';

const file = process.env.HEAL_FILE;
let src = fs.readFileSync(file, 'utf8');

const anchor = `    const modelComponent = await legacyScope.getModelComponentIfExist(id);
    const head = modelComponent?.getHeadRegardlessOfLaneAsTagOrHash();
    if (!modelComponent || !head) return {
      status: 'absent'
    };`;

if (!src.includes(anchor)) {
  process.stdout.write('HEALDIAG FATAL anchor not found in ' + file + '\n');
  process.exit(1);
}

const patched = `    const modelComponent = await legacyScope.getModelComponentIfExist(id);
    const head = modelComponent?.getHeadRegardlessOfLaneAsTagOrHash();
    try {
      const w = (m) => process.stdout.write('HEALDIAG ' + m + '\\n');
      w('id=' + id.toString());
      w('modelComponent=' + (modelComponent ? 'FOUND' : 'undefined'));
      w('headRegardlessOfLane=' + (head || 'NONE'));
      if (modelComponent) {
        w('rawHead=' + (modelComponent.head ? modelComponent.head.toString() : 'NONE'));
        w('laneDataIsPopulated=' + String(modelComponent.laneDataIsPopulated));
        w('versionsCount=' + Object.keys(modelComponent.versions || {}).length);
        w('remoteHead=' + (modelComponent.remoteHead ? modelComponent.remoteHead.toString() : 'NONE'));
      }
      let lane;
      try { lane = await legacyScope.getCurrentLaneObject(); } catch (le) { lane = null; }
      w('currentLane=' + (lane ? lane.id().toString() : 'main/none'));
      w('scopePath=' + legacyScope.path);
      w('scopeName=' + legacyScope.name);
      // Is the object actually on disk, and does the fetcher share our Repository?
      try {
        const { ModelComponent } = require('@teambit/objects');
        const h = ModelComponent.fromBitId(id).hash();
        const repo = legacyScope.objects;
        w('expectedHash=' + h.toString());
        w('objectPath=' + repo.objectPath(h));
        w('onDisk=' + String(await repo.has(h)));
        w('inMemoryPending=' + String(Boolean(repo.objects[h.hash.toString()])));
        w('repoScopePath=' + repo.scopePath);
        w('importerRepoIsSameObject=' + String(legacyScope.scopeImporter.repo === repo));
        w('importerScopeIsSameObject=' + String(legacyScope.scopeImporter.scope === legacyScope));
        w('importerRepoScopePath=' + String(legacyScope.scopeImporter.repo && legacyScope.scopeImporter.repo.scopePath));
        w('scopeIndexHasIt=' + String(Boolean(repo.scopeIndex && repo.scopeIndex.find(h))));
      } catch (he) { w('hash-diag-error=' + (he && he.message ? he.message : String(he))); }
      // THE CANDIDATE FIX: the heal only ever wants the component's HEAD, but it
      // looks the component up WITH the stale .bitmap version. sources.get is
      // version-sensitive and returns undefined when that version is not in the
      // component's versions array -- even though the component and its head are
      // both present. Compare the two lookups side by side.
      try {
        const bare = id.changeVersion(undefined);
        const mcBare = await legacyScope.getModelComponentIfExist(bare);
        w('FIX bareId=' + bare.toString());
        w('FIX modelComponentBare=' + (mcBare ? 'FOUND' : 'undefined'));
        if (mcBare) {
          const bareHead = mcBare.getHeadRegardlessOfLaneAsTagOrHash();
          w('FIX bareHead=' + (bareHead || 'NONE'));
          if (bareHead) {
            const v = await mcBare.loadVersion(bareHead, legacyScope.objects);
            w('FIX bareHeadMainFile=' + (v && v.mainFile));
          }
          try { w('FIX hasTagIncludeOrphaned(staleVersion)=' + String(mcBare.hasTagIncludeOrphaned(id.version))); } catch (te) { w('FIX hasTag-error=' + te.message); }
          try {
            const { isHash } = require('@teambit/component-version');
            w('FIX isHash(staleVersion)=' + String(isHash(id.version)));
          } catch (ie) { w('FIX isHash-error=' + ie.message); }
        }
      } catch (fe) { w('FIX diag-error=' + (fe && fe.message ? fe.message : String(fe))); }
      w('verdict=' + ((!modelComponent) ? 'a:NOT_FOUND' : (!head ? 'b:FOUND_NO_HEAD' : 'ok')));
    } catch (dx) {
      process.stdout.write('HEALDIAG diag-error=' + (dx && dx.message ? dx.message : String(dx)) + '\\n');
    }
    if (!modelComponent || !head) return {
      status: 'absent'
    };`;

fs.writeFileSync(file, src.replace(anchor, patched));
process.stdout.write('HEALDIAG patch applied to ' + file + '\n');
