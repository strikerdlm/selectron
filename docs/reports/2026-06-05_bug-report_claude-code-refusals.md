# Bug Report — Claude Code Spurious Refusals
**Date:** 2026-06-05  
**Submitted by:** Dr. Diego Malpica (dlmalpica@yahoo.com)  
**Claude Code version:** 2.1.165  
**Node version:** v22.22.3  
**OS:** Ubuntu Linux 6.8.0-124-generic x86_64  
**Session ID:** 5505616f-ffc0-4fdf-9367-97556b2c3745  
**Session file:** `2026-06-05_session_selectron-refusal-report.jsonl` (attached)

---

## Summary

Claude Code triggered 9 `stop_reason=refusal` events in a single session while assisting with a legitimate aerospace medicine research project (Selectron — a Bayesian MCDA + probabilistic risk model for analog-astronaut crew selection, targeting publication in *Advances in Space Research*). Every refused request was a straightforward scientific research or software engineering task.

**None of the refused requests involved safety-sensitive content.** The refusals appear to be false-positive classifier firings, likely triggered by domain terminology (aerospace medicine, medical evacuation probability, crew casualty modeling) or by long tool-call context accumulation across a multi-hour session.

---

## Refused Requests (verbatim)

| Timestamp (UTC) | Request ID | User message that triggered refusal |
|---|---|---|
| 2026-06-05T13:09:55 | `req_011CbkAcqNmD33tcokE` | `"do yoi think we need adjustments on the model?"` |
| 2026-06-05T15:27:29 | `req_011CbkM7v4mUraNJigA` | `"Read the reports and analyze if the results are consistent with the scientific literature, use mcp servers and the local research to determine now if the models are defensible in the scientific community and if not, write the plan to fix them"` |
| 2026-06-05T15:28:53 | `req_011CbkMC7GZwVVHM7AR` | `"Read the reports and analyze if the results are consistent with the scientific literature"` |
| 2026-06-05T15:29:36 | `req_011CbkMJvXMTQcrzv5C` | `"save the reports to this folder, commit and push"` |
| 2026-06-05T16:22:25 | `req_011CbkRJ6EwHvPorabW` | *(empty user message — Workflow tool internal call)* |
| 2026-06-05T16:22:58 | `req_011CbkRMBRKUacgBCiN` | *(empty user message — Workflow tool internal call)* |
| 2026-06-05T16:27:51 | `req_011CbkRhxYWMPYCbuCX` | *(empty user message — Write tool internal call)* |
| 2026-06-05T16:27:59 | `req_011CbkRmDVGEfs5yQ9R` | *(empty user message — Write tool internal call)* |
| 2026-06-05T16:30:38 | `req_011CbkRyFf4iKVhhfzJ` | *(empty user message — tool internal call)* |

---

## Context of the Work Being Done

The session was building and validating a Monte Carlo medical-risk simulator (`src/imm/`) for analog space mission crew selection. Tasks completed successfully in the same session included:

- Writing TypeScript simulation scripts (`scripts/duration_study_screened_vs_unscreened.ts`, `kit_training_study.ts`)
- Running 20,000-trial factorial simulations across 4 kit levels × 2 crew types × 3 durations
- Committing results to a research repository and pushing to GitHub
- Launching background literature-review agents using MCP servers (Scite, Brave, paper-search)
- Copying markdown reports into `docs/reports/` and pushing commits

All of this work is documented in the attached session JSONL.

---

## Error Message Received (identical for all 9 events)

```
API Error: Claude Code is unable to respond to this request, which appears to
violate our Usage Policy (https://www.anthropic.com/legal/aup). Please double
press esc to edit your last message or start a new session for Claude Code to
assist with a different task.
```

---

## Pattern Analysis

Three distinct trigger patterns are apparent:

**Pattern 1 — Domain terminology in a long-session context (13:09 UTC)**  
The question "do you think we need adjustments on the model?" was refused after ~4 hours of session history containing terms like `pEVAC` (probability of evacuation), `pLOCL` (probability of loss of crew life), `mortality`, and medical condition names. The classifier appears to have context-poisoned on accumulated terminology.

**Pattern 2 — Legitimate research analysis requests (15:27–15:29 UTC)**  
Three separate phrasings of "read these reports and compare to the literature" were refused in rapid succession. The content of the reports involves medical incidence rates (e.g. `lambda` for dental emergencies, psychiatric events, GI bleeds) — standard aerospace medicine epidemiology, not harmful content.

**Pattern 3 — Internal tool calls in a Workflow context (16:22–16:30 UTC)**  
Five refusals occurred on empty user messages — these are Workflow orchestration internal calls. The Workflow tool itself was building a research proposal document. No user-visible message was involved; the refusal is being triggered on tool-orchestration context alone.

---

## Impact

- The Workflow tool is blocked from running in this session context: every invocation triggers a refusal on the internal calls, making multi-agent orchestration (Ultracode mode) unusable.
- The user must start a new session and re-establish context to continue work, losing tool-call history and caching.
- The task being blocked is a peer-reviewed journal manuscript (targeting *Advances in Space Research*, Elsevier/COSPAR) — a purely academic research artifact.

---

## Requested Actions

1. **Review the 9 request IDs** listed above and confirm whether any of them contained genuinely policy-violating content. Based on the verbatim triggers shown, none should have.
2. **Adjust the classifier** to distinguish aerospace medicine research terminology (pEVAC, LOCL, mission casualty modeling) from harmful use-case patterns.
3. **Fix the Workflow tool** so that internal orchestration calls on empty user messages do not inherit the surface-level classification of accumulated session context.
4. **Provide a mechanism** to flag false-positive refusals from within a session so they can be reviewed without requiring a full support ticket per incident.

---

## Attachments

- `2026-06-05_session_selectron-refusal-report.jsonl` — full 3.2 MB session transcript (1541 events)

---

## How to Report to Anthropic

**Diego — please file this report at:**

- **GitHub Issues (primary):** https://github.com/anthropics/claude-code/issues  
  → New issue → paste this document → attach or link the JSONL if size allows (or share as a Gist)

- **Support portal:** https://support.anthropic.com  
  → "Claude Code" category → paste this report → include the request IDs above

The **request IDs** (`req_011CbkAcqNmD33tcokE`, etc.) are the key artifacts — Anthropic engineers can look these up on their backend to see exactly what the classifier scored, which is the only way to diagnose false positives.
