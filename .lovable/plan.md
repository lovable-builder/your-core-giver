

## Root Cause: Render Storm from Message Flood

The app is receiving **34,000+ messages** (visible in the header badge). Here's why the UI is going crazy:

### Problem 1: Patch dump floods React state
Every 15 seconds (`slowPoll` at line 938), the app sends `request_patch`. The bridge's `syncPatch()` expands this into **hundreds of individual** `/eos/get/patch/1/{i}` requests. Each response triggers `broadcast()` → WebSocket → `handleBridgeMessage` → **3 separate `setState` calls per message** (lines 740, 748, 757). That's ~100,000 state updates per patch cycle.

### Problem 2: Command line thrashing
Line 751-753: for every `console_feedback` message (including all patch entries that fall through to "raw"), the `commandLine` gets overwritten with the raw OSC address. This makes the command line display flicker wildly.

### Problem 3: Active cue instability  
Line 757: `data.active_cue !== undefined` — while patch entries don't have this field, the EOS console continuously broadcasts `/eos/out/active/cue/...` messages on its own schedule. During a flood, these interleave with patch data, and each one calls both `setConsoleFeedback` AND `setActiveCue`, causing the cue stack to jump.

### Problem 4: No throttling on incoming messages
Every single OSC message from the console triggers immediate React re-renders. At 50 messages/second, that's 50 render cycles per second with multiple state updates each.

---

## Fix Plan

### 1. Throttle incoming message processing (Index.tsx)
- Buffer incoming WebSocket messages and process them in batches every 100-200ms
- Merge duplicate subtypes (e.g., multiple `patch_entry` messages into one state update)
- Only update `msgCount` on the batch boundary, not per-message

### 2. Stop automatic patch re-polling (Index.tsx)  
- Remove `request_patch` from the 15-second `slowPoll` interval (line 939)
- Keep only the initial patch fetch on connect (line 931)
- Add a manual "Refresh Patch" button instead

### 3. Fix command line updates (Index.tsx)
- Only update `commandLine` from explicit `command_line` type messages or `subtype === "command_line"` 
- Stop overwriting it with raw OSC addresses from patch/channel feedback

### 4. Guard active cue updates (Index.tsx)
- Only set `activeCue` when `data.subtype === "active_cue"` exactly — remove the loose `data.active_cue !== undefined` fallback check
- Deduplicate: skip if the new value equals the current value

### 5. Suppress noisy broadcasts from bridge (bridge.js)
- Don't broadcast individual `patch_entry` messages to WebSocket clients
- Instead, accumulate patch entries in `state.patch` and send a single consolidated `patch_complete` message when the batch finishes
- This alone eliminates ~95% of the message flood

### Files to change
- `src/pages/Index.tsx` — message throttling, polling fix, state update guards
- `public/bridge.js` — batch patch broadcasts instead of per-entry

