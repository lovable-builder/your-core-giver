

## Why commands aren't reaching the console

**The port is wrong.** The app defaults `oscPort` to `"3033"` (line 679 of Index.tsx), but port 3033 is the **bridge's own RX port** — where the bridge listens for feedback FROM the console. The EOS console listens for commands on port **3032** (`EOS_PORT`).

So every command the app sends includes `port: 3033`, and the bridge dutifully sends the OSC packet to port 3033 — which is itself. The console on port 3032 never sees it.

**Secondary issue:** `withUser()` in bridge.js (line 122) excludes `/eos/key/` paths from user-scoping. EOS requires user-scoped key commands (`/eos/user/1/key/go`) when operating with a user ID. Without the prefix, the console may ignore key presses like GO, Back, Clear, etc.

## Fix

### 1. Fix default OSC port in Index.tsx (line 680)
Change the default from `"3033"` to `"3032"`:
```typescript
const [oscPort, setOscPort] = useState(() => localStorage.getItem("eos_osc_port") || "3032");
```

### 2. Fix `withUser()` in bridge.js (line 122)
Remove the `/eos/key/` exclusion so key commands get user-scoped:
```javascript
function withUser(path) {
  if (!path) return path;
  if (path.startsWith("/eos/user/")) return path;
  if (path.startsWith("/eos/get/")) return path;
  if (path.startsWith("/eos/ping")) return path;
  // Remove: if (path.startsWith("/eos/key/")) return path;
  if (path.startsWith("/eos")) return `/eos/user/${EOS_USER}${path.slice(4)}`;
  return path;
}
```

### 3. Clear stale localStorage
Users who already have `"3033"` saved in localStorage will keep using the wrong port. Add a one-time migration or show a note in settings that the console TX port should be 3032, not 3033.

