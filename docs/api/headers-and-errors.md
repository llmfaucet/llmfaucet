# Headers and errors

Successful responses expose `X-Routed-Via`, `X-Fallback-Attempts`, and
rate-limit headers. Errors use the endpoint’s wire format and include a stable
error code plus `Retry-After` where retrying is appropriate.
