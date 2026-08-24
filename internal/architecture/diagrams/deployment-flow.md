# Deployment flow

```mermaid
flowchart LR
  Dev[dev branch] --> Preview[Preview Worker + Pages + isolated D1/KV]
  Main[main branch] --> Production[Production Worker + Pages + isolated D1/KV]
  VPS[Oracle probe] --> Preview
  VPS --> Production
```
