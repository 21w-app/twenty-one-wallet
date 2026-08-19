# Workers

Long-running processes started with the API:

- Ark indexer SSE per registered `vtxo_script_hex` → incoming-funds push
- Optional VTXO expiry reminder polling

Disable with `WORKERS_ENABLED=false` for API-only local runs.
