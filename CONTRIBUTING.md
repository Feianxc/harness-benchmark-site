# Contributing

OHBP / harnessbench separates three surfaces:

1. Consumer selection guide: curated, not verifier-backed truth.
2. Evidence boards: verifier and governance output.
3. Public intake: untrusted candidate records.

Pull requests should keep those boundaries visible. Do not wire public intake directly into ranked boards without verifier and governance gates.

## Local checks

```bash
npm run build
npm run test
npm run lint
```

## Data hygiene

Do not commit local runtime data:

- `.data/`
- `.workspace/`
- `.hb/`
- `apps/mock-intake/data/`
- logs, receipts, sealed traces, private payloads
