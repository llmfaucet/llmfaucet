# Third-Party Reference Repositories

These shallow clones are local architecture and compatibility references only.
They are gitignored, are not runtime or build dependencies, and must not be
imported into `src/` or deployed.

```bash
./internal/third-party/setup.sh
./internal/third-party/update.sh
```

Before adapting any pattern, verify its license and provider Terms of Service,
retain required attribution, add a focused test, complete security review, and
record the decision in `NOTICE.md`. `gpt4free` is a contrast reference and must
never supply production providers.
