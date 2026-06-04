---
name: local-pr-review
description: Review the current branch against develop using local Git only. Use this for read-only PR review, local diff review, code review, security review, performance review, test coverage review, and review comments without GitHub API or gh.
---

# Local PR Review Skill

Use this skill to review the current branch against `develop` using local repository state only.

This is a read-only review workflow. Do not edit files. Do not commit. Do not call GitHub APIs. Do not use `gh`. Do not run builds, tests, lint, formatters, package installs, migrations, or network commands unless the user explicitly asks.

Allowed tools and commands:

- `git`
- `rg`
- file reads
- shell commands that only inspect local repository state

Prefer a read-only Codex permissions profile when available.

## Review mindset

Review as a senior engineer trying to protect production while helping the author ship.

Goals:

- Catch real bugs, edge cases, security issues, performance regressions, and test gaps.
- Check whether the change fits the existing architecture and local project guidance.
- Improve maintainability where the risk is meaningful.
- Give concise, specific, actionable feedback.

Non-goals:

- Do not nitpick formatting, import order, quote style, or lint-only issues.
- Do not rewrite code to personal preference.
- Do not block progress on speculative concerns.
- Do not comment on unchanged pre-existing issues unless the PR makes them worse or relies on them.

Feedback style:

- Be specific and actionable.
- Focus on the code, not the author.
- Prefer questions or suggestions over commands.
- Use severity labels:
  - `[blocking]` production correctness, security, data loss, authz, migration breakage, or release-blocking issue.
  - `[important]` likely bug, meaningful missing test, performance risk, maintainability issue with clear impact.
  - `[suggestion]` improvement worth considering but not required.
  - `[nit]` only when explicitly tied to local guidance; otherwise omit.
  - `[learning]` useful context that should not block.
  - `[praise]` worthwhile strength in the change.

## Inputs

Default base branch: `develop`.

If the user specifies another base branch, use that instead.

If the user provides a PR description, linked issue, acceptance criteria, expected behaviour, CI status, screenshots, or architectural notes, read those first and treat them as review context.

## Todo list

Start by making a short internal todo list for the review flow:

1. Establish base/head and changed files.
2. Load applicable guidance.
3. Summarise the change.
4. Review diff hunks.
5. Read surrounding code where needed.
6. Check tests, security, performance, and maintainability.
7. Score candidate findings.
8. Output only high-confidence findings.

Do not paste the todo list unless the user asks.

## Step 1: Establish local diff context

Use local Git only.

Suggested commands:

```bash
git status --short
git rev-parse --show-toplevel
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
git rev-parse --verify develop
git merge-base develop HEAD
git diff --stat "$(git merge-base develop HEAD)"...HEAD
git diff --name-status "$(git merge-base develop HEAD)"...HEAD
```

If `develop` does not exist locally, stop and say the local base branch is missing. Ask the user to create/fetch it or provide another local base ref.

Use three-dot diff from merge-base to HEAD unless the user explicitly asks for a different comparison:

```bash
BASE="$(git merge-base develop HEAD)"
git diff "$BASE"...HEAD
```

Eligibility checks:

- If the diff is empty, say there are no changes to review.
- If the change is clearly generated-only, lockfile-only, formatting-only, or vendored-only, say it appears low value to manually review and explain why.
- If the diff is very large, still do a best-effort review, but mention that the PR should ideally be split when the diff is hard to reason about.

Large diff guidance:

- Under 400 changed lines: normal review.
- 400–1000 changed lines: review, but prioritise risky files and changed behaviour.
- Over 1000 changed lines: do a risk-focused review and recommend splitting if concerns are broad.

## Step 2: Find applicable repository guidance

Codex normally loads `AGENTS.md` before work, but for review evidence still inspect applicable guidance explicitly.

Find root and touched-directory guidance:

```bash
find . -name AGENTS.md -o -name AGENTS.override.md
```

Then identify which files apply to changed paths:

- Root guidance applies globally.
- Directory guidance applies to files under that directory.
- More specific directory guidance overrides broader guidance where they conflict.
- Do not paste full guidance unless needed.
- Mention only guidance that materially affects the review.

Also inspect nearby docs when directly relevant:

- README files in touched packages.
- Architecture decision records.
- CONTRIBUTING or testing docs.
- Existing comments in modified files.

## Step 3: Summarise the change

Before findings, understand the PR.

Use:

```bash
git diff --stat "$BASE"...HEAD
git diff --name-only "$BASE"...HEAD
git diff --find-renames "$BASE"...HEAD -- path/to/file
```

Produce a short summary internally:

- What behaviour changed?
- What files/modules were touched?
- Are tests added or changed?
- Are schemas, migrations, auth, permissions, API contracts, package boundaries, or public interfaces changed?

In final output, include a short `Summary` section after findings or before decision. Keep it factual and brief.

## Step 4: Review passes

Run multiple short passes rather than one unfocused pass.

### Pass A: Diff-hunk bug scan

Read the diff hunks first.

Look for:

- Inverted conditions.
- Missing awaits.
- Null/undefined handling.
- Off-by-one and boundary errors.
- Changed defaults.
- Error swallowing.
- Incorrect fallbacks.
- Broken imports/exports.
- Incorrect async/concurrency assumptions.
- Stale or mismatched types.
- Changed public API behaviour without caller updates.

Do not raise a finding from a hunk alone if nearby context could disprove it. Read the surrounding file before reporting.

### Pass B: Call-site and contract impact

For changed functions, classes, types, routes, commands, or exported APIs:

- Search callers with `rg`.
- Check whether the new contract is reflected in all call sites.
- Check whether package boundaries still make sense.
- Check whether renamed or moved code leaves stale references.

Suggested commands:

```bash
rg "symbolName|routeName|typeName" .
git diff "$BASE"...HEAD -- path/to/file
```

### Pass C: Historical context

Use Git history to avoid false positives and understand intent.

Suggested commands:

```bash
git blame -L <start>,<end> -- path/to/file
git log --oneline --decorate -- path/to/file
git log -p -n 3 -- path/to/file
```

Use history to answer:

- Was this code recently fixed for a reason?
- Is the PR reverting a deliberate guard?
- Are comments or tests documenting an invariant that the PR violates?
- Is a concerning pattern pre-existing and untouched? If so, usually do not report it.

### Pass D: Tests

Review test changes and nearby existing tests.

Look for:

- Tests covering behaviour rather than implementation details.
- Edge cases and error paths.
- Authz/permission cases.
- Regression tests for bug fixes.
- Contract/API tests when public behaviour changes.
- Tests updated consistently with renamed behaviour.

Do not demand tests for every small change. Raise test gaps only when the changed behaviour is meaningful or risky.

### Pass E: Security

For web/backend/app code, check:

- Authn/authz is enforced server-side, not only in UI.
- Tenant/org/project scoping cannot be bypassed.
- User input is validated before use.
- SQL/query construction avoids injection.
- Secrets are not logged, returned, committed, or exposed to clients.
- File uploads/downloads validate type, path, ownership, and size.
- Redirects, webhooks, callbacks, and external URLs are constrained.
- Rate limits or abuse controls exist where needed.
- RLS/migration changes preserve least privilege.

Escalate confirmed security issues to `[blocking]`.

### Pass F: Performance and reliability

Look for:

- N+1 queries.
- Missing pagination/limits.
- Unbounded loops over user-controlled data.
- Blocking I/O in hot paths.
- Excessive client bundle growth.
- Expensive work repeated per request.
- Missing indexes for new query patterns.
- Cache invalidation issues.
- Race conditions or non-idempotent retries.
- Resource leaks.

Only report performance concerns with a plausible real trigger.

### Pass G: Maintainability and architecture

Check:

- Separation of concerns.
- Whether domain/package boundaries are respected.
- Whether code is duplicated instead of shared for a meaningful reason.
- Whether new abstractions are justified.
- Whether names reflect behaviour.
- Whether comments document why, not just what.
- Whether public docs or examples need updating.

Avoid subjective style comments unless backed by project guidance or clear long-term cost.

## Step 5: Confidence scoring

For every candidate finding, assign a confidence score from 0 to 100.

Use this rubric:

- 0: Not confident. Likely false positive, pre-existing, or disproven by nearby context.
- 25: Somewhat confident. Might be real, but not verified.
- 50: Moderately confident. Real issue, but minor, rare, or low impact.
- 75: Highly confident. Very likely real and important, but not fully proven.
- 90: Confirmed by code paths, tests, docs, or history. Likely to affect real usage.
- 100: Certain. Direct evidence shows it will happen frequently or violates explicit guidance.

Only include findings with confidence >= 80.

If no candidate reaches 80, output “No issues found.”

## Step 6: Output format

Output findings first.

Use this structure:

```md
## Findings

### [blocking] Brief issue title

- Location: `path/to/file.ts:123`
- Confidence: 90
- Reason: Bug / security / performance / AGENTS.md guidance / historical context / comment guidance
- Why it matters: ...
- Suggested change: ...

### [important] Brief issue title

- Location: `path/to/file.ts:456`
- Confidence: 85
- Reason: ...
- Why it matters: ...
- Suggested change: ...

## Summary

Brief factual summary of what changed.

## Review decision

Request changes / Comment / Approve

## Notes

Mention residual testing gaps, assumptions, or files not deeply reviewed.
Add praise only when specific and deserved.
```

Rules:

- Findings must include local file path and line reference.
- Prefer the smallest useful line reference.
- Do not include low-confidence or speculative findings.
- Do not include formatting-only comments.
- Do not include more than one praise item unless the PR is mostly clean.
- If no issues are found, say:

```md
## Findings

No issues found.

## Summary

...

## Review decision

Approve / Comment

## Notes

I did not run tests/build/lint. Residual risk: ...
```

## Useful local commands

Use these as needed, not all every time.

```bash
BASE="$(git merge-base develop HEAD)"

git diff --stat "$BASE"...HEAD
git diff --name-status "$BASE"...HEAD
git diff --find-renames "$BASE"...HEAD
git diff --unified=80 "$BASE"...HEAD -- path/to/file

git show --stat --oneline HEAD
git log --oneline --decorate --graph --max-count=20
git log --oneline -- path/to/file
git log -p -n 3 -- path/to/file

git blame -L 100,160 -- path/to/file

rg "symbolOrRouteName" .
rg "TODO|FIXME|SECURITY|auth|permission|tenant|orgId|projectId" path/to/touched/area
find . -name AGENTS.md -o -name AGENTS.override.md
```

## Hard constraints

Never:

- edit files
- run tests, builds, lint, formatters, migrations, package installs, or network commands
- use GitHub API or `gh`
- fabricate line numbers
- report issues below confidence 80
- report purely stylistic issues
- review generated/vendor files unless the PR changes how they are generated or consumed
