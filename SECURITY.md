# Security Policy

## Supported surface

This repository is a public beta implementation of OHBP / harnessbench. The consumer leaderboard is a curated selection guide. Public intake records are untrusted until verifier and governance gates accept them.

## Reporting

Open a GitHub security advisory or send a private report to the repository owner. Do not post exploit details in public issues before a fix path exists.

## Intake data

Public intake stores submitted JSON under the configured `PUBLIC_INTAKE_DATA_DIR`. Do not commit `.data/`, `.workspace/`, `.hb/`, logs, local receipts, sealed traces, or private benchmark material.

## Production defaults

- Use HTTPS at the edge.
- Set `PUBLIC_SITE_URL` to the production origin.
- Set `PUBLIC_INTAKE_IP_HASH_SALT` and `PUBLIC_INTAKE_ADMIN_TOKEN` to random production values.
- Keep `PUBLIC_INTAKE_TRUST_PROXY=false` unless the Node service is reachable only through a trusted proxy.
- Keep `PUBLIC_INTAKE_RATE_LIMIT` low for single-operator public beta.
- Keep API routes out of search indexing via `robots.txt`.
