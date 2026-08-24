# Third-Party Notices

llmfaucet maintains local, gitignored copies of selected open-source projects
under `internal/third-party/` for architecture research and compatibility review.

Those repositories are not bundled, imported, deployed, or distributed as part
of llmfaucet unless a specific component is separately reviewed, attributed,
and recorded here.

## Reference projects

| Project | Repository | Intended reference scope | Runtime dependency |
|---|---|---|---|
| FreeLLMAPI | `tashfeenahmed/freellmapi` | API translation, routing, health checks | No |
| LiteLLM | `BerriAI/litellm` | Provider normalization and compatibility patterns | No |
| AI Horde | `Haidra-Org/AI-Horde` | Public capacity and queue concepts | No |
| Pollinations | `pollinations/pollinations` | Public API and model catalog behavior | No |
| gpt4free | `xtekky/gpt4free` | Client ergonomics and compatibility patterns only | No |

No provider integration may be added to llmfaucet unless it supports officially
documented anonymous/keyless public access and passes legal, security, and
technical review.

## UI component references

llmfaucet uses installed, adapted shadcn-compatible UI components and public
component patterns for developer-tool interactions. Each installed component is
reviewed for runtime compatibility, accessibility, and license requirements.
No third-party branded content or user data is bundled.

## Registry installation notes

The requested `why-us-bento` registry item was unavailable at
`https://www.vengenceui.com/r/why-us-bento.json` during implementation.
The requested Cult UI `onboarding`, `intro-disclosure`, and
`toolbar-expandable` registry requests returned HTTP 429. The repository keeps
typed llmfaucet replacements for those behaviors and does not copy source from
the registries.

## Design references

The llmfaucet website was independently implemented using public developer-tool
design patterns as inspiration. It does not bundle, copy, or depend on source
code from create-better-t-stack or other third-party websites.
