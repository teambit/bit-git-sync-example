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
      w('verdict=' + ((!modelComponent) ? 'a:NOT_FOUND' : (!head ? 'b:FOUND_NO_HEAD' : 'ok')));
    } catch (dx) {
      process.stdout.write('HEALDIAG diag-error=' + (dx && dx.message ? dx.message : String(dx)) + '\\n');
    }
    if (!modelComponent || !head) return {
      status: 'absent'
    };`;

fs.writeFileSync(file, src.replace(anchor, patched));
process.stdout.write('HEALDIAG patch applied to ' + file + '\n');
