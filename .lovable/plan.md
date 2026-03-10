

# Use Official EOS Fixture Library for Patching

## What This File Contains

The uploaded `FixtureList.html` is the **official ETC EOS Fixture Library v3.3.5.15** — approximately 20,000+ fixtures with the **exact model strings** that EOS expects in `Chan X Type {model} Enter` commands.

Each row has: **Manufacturer**, **Model** (the exact EOS type string), **DMX Footprint**, and **Full Name**.

This is the missing link in patching: right now the osc-agent guesses fixture type names (e.g., "Dimmer"), but EOS expects exact strings like `Src_Four_750` or `CS_Spot_HPL_575`. With this data, patching via voice/AI will actually work reliably.

## Plan

### 1. Parse HTML into JSON data file

Write a build-time script or one-time parse to extract all rows into a compact JSON array:
```json
[
  { "m": "AAdyn Technology", "t": "JAB_Daylight", "ch": 6, "n": "JAB Daylight" },
  ...
]
```

Store as `src/data/eosFixtureLibrary.ts` — exported as a typed array. Estimated ~20K entries, ~800KB raw (gzips to ~100KB).

### 2. Replace/augment fixture search in FixtureLibrary.tsx

- Add a search mode that queries the EOS library by manufacturer, model, or full name
- When user selects a fixture, auto-populate the **Type** field with the exact `model` string (e.g., `Src_Four_750`)
- Use the `ch` (DMX footprint) value for accurate collision detection
- Keep the current curated fixtures as "favorites" or "common" tab

### 3. Feed exact type strings to osc-agent

- Update the osc-agent system prompt to note: "Use the exact EOS fixture type string provided in the user's context. Do not guess or abbreviate."
- When `executeAiOscCommands` builds patch commands, include the selected fixture's EOS type string in the context sent to the agent

### 4. Improve voice patching accuracy

- When a voice command says "patch source four", fuzzy-match against the EOS library's `fullName` field to find the correct `model` string
- Pass the resolved type string directly into the patch command

### Files

| File | Action |
|------|--------|
| `src/data/eosFixtureLibrary.ts` | **New** — parsed EOS fixture data (~20K entries) |
| `src/components/FixtureLibrary.tsx` | **Modified** — search against EOS library, auto-fill Type |
| `supabase/functions/osc-agent/index.ts` | **Modified** — use exact type strings from context |
| `src/pages/Index.tsx` | **Modified** — fuzzy match preset/voice commands against EOS library |

