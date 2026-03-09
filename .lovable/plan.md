

## Problem

The Live Stage section is full of fake/simulated data that doesn't reflect the real console state. From the screenshot: patch shows empty fields, channels show random colors, cue stack has only placeholder data, and submaster faders have random values with hardcoded labels.

### What's fake and needs fixing

1. **Channels array** (line 1008-1016) — hardcoded 32 channels with random intensities and colors. Should start empty and populate from console patch/level data.

2. **Channel animation timer** (line 1042-1050) — randomly wiggles channel intensities every 800ms. Pure visual fake.

3. **Fader values** (line 1021-1026) — 8 hardcoded submasters with random values and fake labels ("Wash", "Spot", etc.). Should come from console sub data.

4. **"FULL STAGE" / "BLACKOUT" / "RANDOM" buttons** (lines 2657-2681) — only modify local state, don't send OSC to the console. RANDOM is entirely fake.

5. **GO/BACK in cue stack** (lines 2748-2778) — fire `/eos/cue/{id}/fire` per cue instead of using the proper `/eos/key/go` and `/eos/key/back` global commands.

6. **Channel header** says "32 CHANNELS" hardcoded — should reflect actual channel count from patch.

### Fixes

#### `src/pages/Index.tsx`

**A. Channels — start empty, populate from bridge data**
- Change channel init to empty array: `useState([])`
- Remove the random animation `setInterval` (lines 1042-1050)
- When `channel_intensity` data arrives, add new channels if they don't exist (currently only updates existing ones)
- Channel grid header: show `channels.length` instead of hardcoded "32"

**B. Faders — start empty, populate from bridge sub data**
- Change fader init to empty array
- When the bridge sends `sub` data, populate fader labels and values
- If no sub data available, show "No submasters received" empty state
- Keep the click-to-set interaction (it already sends proper OSC via `/eos/sub/{i}/level`)

**C. Remove fake buttons**
- Remove "RANDOM" button entirely (fake)
- "FULL STAGE" → send OSC command: `/eos/newcmd` with "Chan 1 Thru 9999 Full Enter"
- "BLACKOUT" → send OSC command: `/eos/newcmd` with "Chan 1 Thru 9999 Out Enter"

**D. Fix GO/BACK buttons**
- GO → send `/eos/key/go` (global key, no cue number needed)
- BACK → send `/eos/key/back`
- Don't manually set `activeCue` — let the console feedback update it

**E. Channel update logic**
- When `channel_intensity` arrives with a channel not in the array, add it
- This ensures the channel grid grows to match the actual console

### Files to change
- `src/pages/Index.tsx` — all changes above

