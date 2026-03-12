

## Plan: Switch to `/eos/set/patch` API for Patching

### Why this is better

The screenshot confirms EOS supports direct patch API calls via `/eos/set/patch/<channel>/type` and `/eos/set/patch/<channel>/address`. This bypasses the command line entirely — no parsing, no syntax errors, no `Enter` needed.

### Changes

#### 1. Update `PatchPanel.tsx`
- The `onPatch` callback already passes channel, address, and fixtureType
- The fixture type string needs to be the **exact library name including mode** (e.g., `"AAdyn Technology JAB Daylight 1ch"`)
- Currently building `"Manufacturer Model"` — need to use `f.n` (the full name from the fixture library) instead, since that matches what EOS expects

#### 2. Update `Index.tsx` — `onPatch` handler
Replace the single `/eos/newcmd` call with two direct API calls:

```
sendOsc("/eos/set/patch/{channel}/type", fixtureType)   // exact library name
sendOsc("/eos/set/patch/{channel}/address", address)     // DMX address as number
```

No `/eos/key/patch` needed. No `Enter` needed. No command-line parsing.

Optionally, if label is added later:
```
sendOsc("/eos/set/patch/{channel}/label", labelText)
```

#### 3. Update `PatchPanel.tsx` — fixture type string
Change from `"${manufacturer} ${model}"` to use the full fixture name `f.n` which matches the library exactly (e.g., `"AAdyn Technology JAB Daylight 1ch"`). The `EOSFixture.n` field already stores this.

Update the CMD preview to show the two API calls instead of the command-line syntax.

#### 4. Update `patchMemoryDb.ts` — workflow steps
Update `createPatchWorkflow` steps to reflect the new API approach:
- Step 1: `/eos/set/patch/{ch}/type` → fixtureType
- Step 2: `/eos/set/patch/{ch}/address` → dmxAddress
- Step 3 (optional): `/eos/set/patch/{ch}/label` → label

#### 5. Update bridge passthrough
The bridge's `withUserPath` and `parseEosCommand` already handle `/eos/set/...` paths as passthrough — they'll get user-prefixed automatically. No bridge changes needed.

#### 6. Update memory
Record this API approach preference in `mem://features/osc_responsiveness.md`.

### Files to modify
- `src/components/PatchPanel.tsx` — use `f.n` for fixture type, update preview
- `src/pages/Index.tsx` — replace `/eos/newcmd` with two `/eos/set/patch/` calls
- `src/lib/patchMemoryDb.ts` — update workflow step definitions

