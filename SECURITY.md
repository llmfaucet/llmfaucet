# Security Policy

## Supported versions

Only the latest `main` branch is actively supported for security fixes.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Report it privately
using GitHub's private vulnerability reporting, or the security contact
configured for the project.

Include:

- affected route, file, or deployment configuration;
- reproduction steps or a minimal proof of concept;
- impact and any required access;
- a suggested mitigation, if known.

Please allow time for investigation before public disclosure. Do not include
real API keys, passwords, personal data, or production traffic in a report.

## Scope

Relevant reports include credential exposure, quota bypass, request smuggling,
provider boundary violations, unsafe proxying, data leakage, and deployment or
CI compromise. Upstream provider outages and changed free-tier limits are not
llmfaucet security vulnerabilities, but they can be reported as operational
issues.
