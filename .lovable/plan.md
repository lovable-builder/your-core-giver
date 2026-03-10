

# Patching System Enhancement Plan

This is a large feature set spanning 6 steps across multiple files. Here is the implementation plan broken into clear phases.

---

## Step 1: Auto-detect and Skip Mode Selection

**File:** `src/components/FixtureLibrary.tsx`

- In `selectFixture()` (line 122), after setting the selected fixture, check `f.modes.length === 1`. If so, auto-select that single mode and skip showing the mode selector UI.
- In the render section (lines 496-519), conditionally hide the DMX MODE selector when there is only one mode. Show a small "auto-selected" badge instead.

---

## Step 2: DMX Address Collision Detection

**New file:** `src/lib/patchingUtils.ts`

- `getNextAvailableDMXAddress(universe, patchList, channelCount)` — scans existing patch entries and console patch data to find the next free contiguous block.
- `validatePatchAddress(startChannel, universe, dmxAddress, quantity, channelsPerFixture, patchList, consolePatch)` — returns an array of collision warnings (conflicting channel numbers, DMX ranges).

**File:** `src/components/FixtureLibrary.tsx`

- Import and call `validatePatchAddress` before executing `handlePatch()`.
- If collisions found, show a warning banner with options: "Proceed Anyway" or "Cancel". Not a hard block — user can override.
- Auto-populate DMX address input with result of `getNextAvailableDMXAddress`.
- Add a small colored dot next to the DMX address input: green = free, yellow = warning, red = overlap.

---

## Step 3: Reusable Patch Presets

**New file:** `src/components/PatchPresets.tsx`

- Preset data structure stored in localStorage under key `bridge_patch_presets`.
- UI: a collapsible section above the fixture library with:
  - List of saved presets (name, fixture, quantity, start channel)
  - "Apply" button per preset (auto-populates form and patches)
  - "Delete" button per preset
- "Save as Preset" button in FixtureLibrary's patch config panel that captures current fixture, mode, quantity, start channel, universe, DMX address, and label.

**File:** `src/components/FixtureLibrary.tsx`

- Add `onSavePreset` and `presets` props or manage presets state internally.
- Add "Save as Preset" button next to the PATCH button.
- Integrate PatchPresets component at top of the fixture library view.

---

## Step 4: Voice Macro for Presets

**File:** `src/pages/Index.tsx`

- In `executeAiOscCommands`, before calling the osc-agent, check if the user prompt matches a preset name pattern (e.g., "apply [name]", "patch [name]", "use [name]").
- If matched, load the preset from localStorage, build the patch commands directly (same logic as `handlePatch`), and execute without going through the AI agent. This eliminates the 2-3s AI latency.
- Add a small hint in the AI OSC input placeholder: `"Try: 'Apply Front House Rig'"`

---

## Step 5: Batch Undo/Rollback

**New file:** `src/lib/patchingTransactions.ts`

- `PatchTransaction` interface: `{ id, timestamp, patches[], status, commands[] }`
- `createTransaction(patches)` — creates a transaction record.
- `buildUnpatchCommands(transaction)` — generates the inverse OSC commands (Chan X Address 0 Enter for each patched channel), wrapped in patch/live mode keys.

**File:** `src/components/FixtureLibrary.tsx`

- Track the last 5 patch transactions in state.
- After `handlePatch` completes, save the transaction.
- Show a small "UNDO LAST BATCH" button below the patch table when transactions exist.
- Undo sends unpatch commands for all channels in the transaction.

---

## Step 6: Optimize OSC Batch Wrapping

**File:** `src/components/FixtureLibrary.tsx`

- The current `handlePatch` already correctly wraps with a single `/eos/key/patch` ... `/eos/key/live` pair. No change needed here — it is already optimal (single wrap for N patches).

**File:** `src/pages/Index.tsx` (`executeAiOscCommands`)

- The existing safety net already batches: it wraps all patch commands with a single `/eos/key/patch` + `/eos/key/live` pair. Verify this handles multi-patch AI responses correctly (it does).
- Reduce inter-command delay from 400ms to 200ms for the inner newcmd commands (keep 400ms only for the mode-switch commands at start/end).

**File:** `public/bridge.js`

- No changes needed — the bridge already passes through commands as-is. The optimization is entirely on the client side.

---

## Summary of New/Modified Files

| File | Action |
|------|--------|
| `src/lib/patchingUtils.ts` | **New** — address validation and collision detection |
| `src/lib/patchingTransactions.ts` | **New** — undo/rollback transaction tracking |
| `src/components/PatchPresets.tsx` | **New** — preset save/load UI |
| `src/components/FixtureLibrary.tsx` | **Modified** — auto-mode, collision warnings, presets integration, undo |
| `src/pages/Index.tsx` | **Modified** — voice preset macro, delay optimization |

No database changes required. All data stored in localStorage.

