# Decision Log

This log is intentionally short. It records documentation-system decisions;
the current architecture is described in [`../architecture.md`](../architecture.md)
from repository evidence, not reconstructed team history.

| Date | Status | Area | Decision | Owner | Link |
|---|---|---|---|---|---|
| 2026-07-30 | Accepted | Documentation | Keep repo-owned docs factual, concise, and source-backed; use `Unknown / verify` for unresolved facts. | Unknown / verify | [AI agent guide](../ai-agent-guide.md) |

| 2026-10-16 | Proposed | Authentication and data | Keep Al-Rawi guest-first; introduce optional web Google login via Neon Managed Auth, with manually triggered RSS-only cloud backup. Gmail/YouTube permissions and content remain separate and local; native user sign-in is deferred. This is implemented on a feature branch but not merged/deployed or end-to-end validated. | Project implementation | [Neon integration handoff](../NEON_ACCOUNT_IMPLEMENTATION_HANDOFF.md) |

| 2026-10-29 | Accepted | Web authentication | Host Google OAuth on Al-Rawi's own domain using Better Auth and the existing Neon Auth tables and user IDs. Keep guest reading, manual RSS backup, and native source permissions unchanged. Existing sessions require a new sign-in; full browser acceptance remains unverified. | Project implementation | [Auth server](../../src/lib/auth/app.ts) |

## Historical records

None found in the repository: `Unknown / verify`.
