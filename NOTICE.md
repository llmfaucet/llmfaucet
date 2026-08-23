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
