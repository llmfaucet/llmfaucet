# GitHub webhook setup

Point the Sponsors webhook at the Worker webhook route and configure a unique
preview/production signing secret. Validate `X-Hub-Signature-256` and delivery
IDs before changing entitlements.
