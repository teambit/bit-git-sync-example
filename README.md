# bit-git-sync example

This repository is a runnable example of the `bit ci sync` integration. It
holds the sync configuration and the GitHub Actions workflows that keep one
bit.cloud scope and this git repository equal.

This instance mirrors the [`bitdev.git-sync-demo`](https://bit.cloud/bitdev/git-sync-demo)
scope: every component on the scope's main has a directory under
`components/`, and the hourly sync keeps the two sides converged. The scope
holds four components in one dependency chain, so one edit shows the whole
release cascade without noise:

```
utils/format-price      formats an amount of money        ← every flow edits this one
  └─ models/cart-item   one cart line and its total
  └─ ui/price-tag       shows one amount (React)
       └─ ui/cart-summary   lists the lines and the total (React), uses both
```

The example carries no organization of its own. You fork it, you point it at
your own bit.cloud scope, and you watch the four flows run in your own
repository. `setup.sh` forks the four components into your scope, so your
copy starts from the same shape.

## What this example proves

| Flow | You do this | The action does this | You see this |
| --- | --- | --- | --- |
| 1. Lane to branch | You export a lane on bit.cloud. | It creates a branch for the lane and opens a pull request. | A new branch and a new pull request. |
| 2. Branch to lane | You push a commit to the lane branch. | It snaps the branch content and exports it to the lane. | The lane on bit.cloud carries your git edit. |
| 3. Merge to release | You merge the pull request into `main`. | It merges the lane into the main scope, then it tags and exports new versions. | Four new versions on bit.cloud — the edited component and its three dependents — and an archived lane. |
| 4. Main drift to git | You export to the main scope. | It opens a pull request from `bit-sync/main`. | A pull request that carries the exported state. |

The four flows use two workflows. `bit-sync.yml` runs flows 1, 2 and 4.
`bit-release.yml` runs flow 3.

## Prerequisites

### bit 2.2.16 or later

Use bit **2.2.16** or later; this repository pins **2.2.18**, the current
nightly. The `workspace.jsonc` of this repository pins the version for the
workflows. `bit-tasks/init@v3` reads the `engine` value in
`teambit.harmony/bit` and installs that version. Without the pin, the runner
gets the latest stable release, and that release does not have `bit ci sync`.

The pin must be a concrete version, not a range. Every release with
`bit ci sync` is a nightly, so there is no stable pointer to rely on, and
`bit-tasks/init` compares the engine value to the installed version as a
string.

The floor is not arbitrary. Each of these versions removed a way for the sync
to halt:

| Version | What it added |
| --- | --- |
| 2.0.65 | The `bit ci sync` command exists. |
| 2.2.5 | A cross-scope lane mirrors its own-scope slice instead of halting. |
| 2.2.7 | The `.bitmap` heal survives a stale version in the entry. Below this, one stale entry halts every main sync until a human edits `.bitmap` by hand. |
| 2.2.16 | A release keeps a cross-scope lane open until every scope has released its slice. Below this, the first repository to merge archives the lane and strands the other scopes' components. |

If a workflow runs on a bit version without the command, the action stops and
names the requirement.

### What you need

| Item | Reason |
| --- | --- |
| A bit.cloud organization and one scope | The example exports components to your scope. |
| The Bit CLI | `setup.sh` calls `bit init`, `bit add`, `bit install`, `bit test` and `bit status`. |
| A GitHub repository that you own | The workflows need write permission on it. |
| A bit.cloud token of a service account | The workflows write to your scope with it. |
| A GitHub token with the `repo` scope | bit.cloud sends it in the webhook header. |
| Optional: a second GitHub token in the secret `BIT_SYNC_GH_TOKEN` | A push made with the default `GITHUB_TOKEN` starts no other workflow, so a sync pull request gets no CI checks. A push made with a personal or App token does. Without the secret, the workflows use the default token. |

Install the Bit CLI with `npx @teambit/bvm install`.

## Setup

1. Fork this repository, or copy its files into your own repository.
2. Clone your repository.
3. Run the setup script with your scope id:

```sh
./setup.sh acme.shop
```

The script does five things. It writes your scope into `workspace.jsonc`. It
forks the four components into your scope. It runs `bit install`. It runs
`bit test`. It prints the workspace status.

The fork is the step that matters. The committed `.bitmap` records versions
that belong to `bitdev.git-sync-demo`, and the sources import each other by
package name, `@bitdev/git-sync-demo.utils.format-price` and so on. Your
scope has none of those versions, so the script rewrites the package prefix
in every source file to `@<your-org>/<your-scope>.`, removes the `.bitmap`,
and tracks the four directories again as new components of your scope. When
you pass the scope that the repository mirrors already, the script changes
nothing.

The script rejects a value that is not a scope id. A scope id has two parts
and one dot, for example `acme.shop`.

`bit ci sync --init` writes the same two workflow files into any workspace
and prints the same checklist. This repository ships the files already, so
you do not need to run it here.

## Manual steps

The script cannot do these four steps for you.

### 1. Create the repository secret

1. Get a token: `bit login --machine-name ci`.
2. Go to **Settings > Secrets and variables > Actions**.
3. Select **New repository secret**.
4. Name the secret `BIT_CONFIG_ACCESS_TOKEN`.
5. Paste the token value.

The token belongs to a service account with write permission on your scope.
Never commit the token. Never print it in a workflow step.

### 2. Permit the workflows to open a pull request

1. Go to **Settings > Actions > General**.
2. Find **Workflow permissions**.
3. Select **Allow GitHub Actions to create and approve pull requests**.

If this setting is off, the run fails when it opens the pull request.

### 3. Create the bit.cloud webhook

1. Go to your bit.cloud organization: **Settings > Webhooks > Create webhook**.
2. Select the event **Components > Export succeeded**.
3. Set the URL to `https://api.github.com/repos/<owner>/<repo>/dispatches`.
4. Add the header `Authorization: Bearer <GitHub token with repo scope>`.
5. Add the header `Accept: application/vnd.github+json`.
6. Select the template type **Custom**.
7. Paste this payload template:

```json
{"event_type":"bit-export","client_payload":{"owner":"{{owner}}","componentIds":"{{componentIds}}","username":"{{username}}","userId":"{{userId}}","laneId":"{{laneId}}"}}
```

Create the webhook in one go. Editing a saved webhook drops its custom
headers (a bit.cloud defect, verified 2026-07-29). If the URL, the headers or
the template have to change later, delete the webhook and create a new one.

bit.cloud replaces each `{{...}}` token before it sends the request. A correct
delivery returns 204.

The `Authorization` header holds a GitHub token, not a bit.cloud token.
bit.cloud cannot read your repository secrets, so `${{ secrets.* }}` has no
meaning in this field.

`laneId` is the discriminator. A lane export sends `<scope>/<lane>`. A main
export sends an empty value.

After you save the webhook, export a lane. Then read the delivery log. A
correct delivery returns 204.

### 4. Release one time, then commit

Run `bit tag -m "first version" && bit export` from the clone. Your scope's
main now holds the four components at `0.0.1`, and the local `.bitmap`
records those versions. Commit that state so the sync starts converged:

```sh
git add -A && git commit -m "chore: mirror acme.shop" && git push
```

The commit carries the rewritten imports, the new `.bitmap` and the changed
`workspace.jsonc`. Without it, the first hourly run opens a main-sync pull
request that proposes the same versions, which is harmless but noisy.

## The demo: two workspaces, two personas

The flows read best as a conversation between two people who never talk to
each other. Set up one workspace for each persona, in two terminals.

**The git developer** works in a clone of this repository and never runs a
`bit` command:

```sh
git clone https://github.com/teambit/bit-git-sync-example
cd bit-git-sync-example
```

**The bit developer** works in a workspace attached to the scope and never
runs a `git` command:

```sh
mkdir bit-ws && cd bit-ws
bit init --default-scope bitdev.git-sync-demo
bit import bitdev.git-sync-demo/utils/format-price
```

Replace `bitdev.git-sync-demo` with your scope if you forked. Importing the
one component at the bottom of the chain is enough: the three dependents
follow on the scope when a release auto-tags them.

Each flow below names its persona. The sync is the only messenger between
the two: an export on the bit side becomes a branch, a pull request or a
diff on the git side, and a pushed commit on the git side becomes a snap on
the bit side.

| Flow | Persona | Terminal |
| --- | --- | --- |
| 1. Lane to branch | bit developer | bit workspace |
| 2. Branch to lane | git developer | git clone |
| 3. Merge to release | either, on github.com | pull request page |
| 4. Main drift to git | bit developer | bit workspace |
| Adopt (optional) | git developer | git clone |

## Run the four flows

### Flow 1: a lane becomes a branch and a pull request

In the bit workspace:

1. Create a lane: `bit lane create hello`.
2. Change the imported `format-price` component, for example the default
   currency in `format-price.ts`, and its test.
3. Snap the change: `bit snap -m "change the default currency"`.
4. Export the lane: `bit export`.

**Expected result:** the webhook starts the `bit-sync` workflow. The run
creates the branch `hello`. The run opens a pull request from `hello` into
`main`. The pull request body names the lane, the components and the lane head.

If the default branch lags the scope, the pull request also carries the
`.bitmap` version bumps that close that gap. Merge the open main-sync pull
request first, and a lane pull request shows your change alone.

### Flow 2: a git commit reaches the lane

In the git clone:

1. Fetch the new branch: `git fetch origin`.
2. Check it out: `git checkout hello`.
3. Change `components/utils/format-price/format-price.ts` again, for
   example the default locale.
4. Commit the change and push it.

**Expected result:** the push starts the `bit-sync` workflow. The run snaps the
branch content and exports it to the lane. The lane head on bit.cloud moves
forward and carries your git edit. Components that depend on the changed one
get an auto-snap, so the lane can grow more components than you edited. That
is bit's dependency semantics, not a defect.

The workflow ignores a push to `main` and a push to `bit-sync/**`, because
those pushes are the action's own output.

### Flow 3: a merged pull request releases new versions

On the pull request page:

1. Open the pull request from flow 1.
2. Read the diff.
3. Merge the pull request into `main`.

**Expected result:** the merge starts the `bit-release` workflow. The run
merges the lane into the main scope. The run tags and exports four new
versions: `utils/format-price`, which you changed, and its three
auto-tagged dependents `models/cart-item`, `ui/price-tag` and
`ui/cart-summary`. The remote lane becomes archived, and the next reconcile
deletes the lane branch. The version numbers therefore describe merged
state only.

### Flow 4: main-scope drift reaches the default branch

In the bit workspace:

1. Switch to main: `bit switch main`.
2. Snap a change: `bit snap -m "change the default currency on main"`.
3. Export the change: `bit export`.

**Expected result:** the webhook sends an empty `laneId`, so the run reconciles
the main scope. The run opens a pull request from `bit-sync/main` into `main`.
The diff shows the exported state of your scope.

Read this diff before you merge it. The main-sync pull request checks the
workspace out to the exported versions. If a file in git holds a change that
nobody exported, the diff reverts that change. Close the pull request instead
of merging it if you want to keep the change.

A merged `bit-sync/main` pull request starts no release. The main scope is
already ahead of that merge.

### Start a run by hand

The schedule runs every hour, and it repairs a lost webhook delivery. It is
also the only way to find a deleted lane, because bit.cloud has no
lane-removed event.

To run the reconcile now, go to **Actions > bit-sync > Run workflow**. Leave
the `lane` input empty to reconcile every lane. Type a lane name to reconcile
one lane.

## The sync configuration

The `teambit.git/ci` block in `workspace.jsonc` holds the sync configuration.
This example ships three keys:

| Key | What it decides | Value here |
| --- | --- | --- |
| `lanes` | Which lanes get a branch. | `["*"]` — every lane. |
| `mainSync` | How main-scope drift reaches the default branch. | `"pr"` — a pull request, never a direct push. |
| `onConflict` | What happens to one contested line. | `"halt"` — the run stops and labels the pull request. |

Four more keys are valid. This example uses none of them.

| Key | What it decides |
| --- | --- |
| `branches` | The branch name of one named lane. |
| `branchPrefix` | The text before each branch name. |
| `mainSyncBranch` | The name of the main-sync branch. |
| `autoMergeMainSyncPr` | Auto-merge on the main-sync pull request. |

No key decides who approves a change, because people merge pull requests.

## Cross-scope lanes

A lane is hosted on one scope, but its components can belong to many. This
repository mirrors one scope, so it reconciles a lane over its own slice
only. Verified on 2026-08-26, on the scope this repository mirrored before
`bitdev.git-sync-demo`, with a lane that carried one own-scope component and
one component of another scope.

| Flow | What happens on a cross-scope lane |
| --- | --- |
| 1. Lane to branch | The pull request mirrors the own-scope slice and lists the foreign components separately as "not mirrored". No foreign source is written into this repository; the branch consumes those components as package dependencies at their lane versions. |
| 2. Branch to lane | The push snaps and exports the own-scope components only. The foreign entries keep their lane heads. |
| 3. Merge to release | The release tags and exports the own-scope slice only. The lane stays open while another scope's components are not on their main yet; the last scope to release archives it. |
| 4. Main drift to git | Unaffected. The main scope holds own-scope components by definition. |

A change that touches only foreign components does not move this mirror.
A lane with no own-scope components at all is skipped on an enumerated run
(the hourly reconcile stays green), refused on a named run, and halted if a
live mirror loses its last own-scope component.

Two facts decide how a multi-scope organization sets this up:

- **One repository per scope, and the webhook is the only automatic path
  for a lane hosted elsewhere.** `lanes: ["*"]` enumerates the lanes hosted
  on this repository's own scope, so the hourly reconcile never finds a
  lane that another scope hosts. The `bit-export` webhook does reach it: the
  payload carries `componentIds`, the action skips the run when none of the
  touched components belong to this scope, and otherwise passes the
  scope-qualified `laneId` to `bit ci sync`. The **Run workflow** form
  accepts the same `host-scope/lane` id.
- **Each scope releases its own slice, and the last one archives the
  lane.** A release tags and exports the own-scope components, then it
  archives the lane only if every other scope's components are already on
  their main. Otherwise the lane stays open and readable, and the other
  scopes' repositories release their slices in their own time
  ([teambit/bit#10661](https://github.com/teambit/bit/pull/10661), bit
  2.2.16). Below 2.2.16 the first release archived the lane and stranded
  the other slices.

## Why the action is pinned

Each workflow uses `teambit/bit-git-sync@223af0ec2ae999a182dcb3fe1a8b52d12e3323bf`.
The pin is a commit SHA, not a tag. The job holds `contents: write` and
`pull-requests: write`, so a moved tag would give new code that write
permission. Update the SHA when you choose to, and read the change first.

## The optional adopt workflow

`bit-adopt-pr.yml` turns an ordinary git pull request into a lane. Use it if
your developers start work in git instead of on a lane.

The workflow runs `bit ci pr --keep-lane`, then it pushes the new lane pointer
in `.bitmap` back to the pull request branch. Flow 2 then keeps the pair equal.

The workflow skips three cases. It skips a branch that starts with
`bit-sync/`, because the action owns that branch. It skips a pull request from
`github-actions[bot]`. It skips a pull request from a fork, because the push
back is not permitted.

The workflow adopts each pull request one time. A lane pointer in `.bitmap` is
the evidence of an earlier adoption, and the job stops when it finds one.

The reconciler never closes an adopted pull request and never deletes its
branch, even when someone deletes the lane on bit.cloud. A branch with no
sync history of its own belongs to a person, and the reconcile reports it
as a no-op and moves on. Close such a pull request yourself.

Delete this file if you do not want the behavior.

One cosmetic effect follows from the trigger. The sync opens its own pull
requests as `github-actions[bot]`, and a repository can require approval for
workflow runs on bot pull requests. Such a run waits as **action required**
on the Actions tab, and approval would only reach the skip condition above.
You can approve it, ignore it, or turn off the approval requirement for bot
pull requests under **Settings > Actions > General**.

## Troubleshooting

| Symptom | Cause | Repair |
| --- | --- | --- |
| No run starts after an export. | The webhook delivery failed. | Read the delivery log on bit.cloud. A 401 means the `Authorization` header is wrong or absent. Check the header, then send a test delivery. A 404 means the URL names the wrong repository. |
| A run starts, but no pull request appears. | The repository forbids the write. | Turn on **Allow GitHub Actions to create and approve pull requests**. Confirm that the workflow declares `pull-requests: write`. |
| The run halts, and the pull request gets the label `bit-sync-conflict`. | Git and the lane changed the same line. | Read the comment on the pull request. Resolve the conflict on the branch, push the result, then remove the label. The sync stays paused for that lane while the label is present. |
| The run halts with a shallow-clone message. | `actions/checkout` fetched one commit. | Keep `fetch-depth: 0` in the checkout step. The reconciler reads the full history, so a shallow clone stops it before any write. |
| The run skips a lane as "nothing to mirror". | Every component on the lane belongs to another scope. | This is correct behavior, not an error. A lane mirrors only the components of this repository's scope; foreign components stay on the lane as package dependencies, and only their own scopes' repositories can mirror their sources. A lane with at least one own-scope component syncs that slice. |

## Files

| Path | Purpose |
| --- | --- |
| `workspace.jsonc` | The workspace, the engine pin and the sync configuration. |
| `components/` | The four mirrored components of the scope. |
| `components/utils/format-price/` | The component that the flows edit. Its three dependents follow. |
| `setup.sh` | Writes your scope, forks the four components into it, installs, tests. |
| `.github/workflows/bit-sync.yml` | Flows 1, 2 and 4. |
| `.github/workflows/bit-release.yml` | Flow 3. |
| `.github/workflows/bit-adopt-pr.yml` | The optional adopt workflow. |

## License

Apache-2.0. See [LICENSE](./LICENSE).
