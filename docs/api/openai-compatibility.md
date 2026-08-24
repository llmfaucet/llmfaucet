# OpenAI compatibility

The Worker exposes `/v1/chat/completions`, `/v1/models`, and legacy-compatible
routes as implemented in `apps/worker/src`. Use `Bearer free` for anonymous
development access and inspect routing/rate-limit headers.
