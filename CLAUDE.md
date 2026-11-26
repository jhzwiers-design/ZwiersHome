# Zwiers Home: working rules

## Process archive (always)
The owner is building a process book and portfolio page from this project. After every change to the dashboard's design or behaviour:
1. Add a stage entry to `process/PROCESS_LOG.md`: the date, the prompt (quote the owner's words where possible), what changed, why, and the images folder.
2. Capture screenshots into `process/screenshots/<YYYY-MM-DD>_<nn>_<short-stage-name>/` with `process/tools/capture.mjs` and `process/tools/shots.json`, against the running dev server.
3. Save any image the owner supplies (palettes, inspiration, device screenshots, plans) into `process/references/` with a dated, descriptive name.
4. The archive is **local only**: `process/` is git-ignored and must never be committed or pushed (it holds family names, the floor plan and device codes).

## Safety (from the owner)
- Sample data only until the owner approves real integrations. Never change real devices, accounts, SmartThings, Ring, Carrier, Hayward or eero settings, and never re-pair devices or change the network without explicit approval.
- Never store credentials or tokens in the repo or the frontend.
- Public builds (`__PUBLIC__`) must not contain family names, the real floor plan or model numbers. Check `dist/` before pushing.
- The owner approves each push to GitHub; pushing redeploys home.johnzwiers.com.
