# End-to-end checks

Browser automation is intentionally deferred because Playwright is not part of
the current dependency lock. The Worker and web packages have executable
contract/smoke tests; add Playwright here when CI browser infrastructure is
approved.
