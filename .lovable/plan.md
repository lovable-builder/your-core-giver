

## Problem Diagnosis

The EOS console command line shows `Cue 1Go - Error: Syntax Error` -- the command string arrives malformed. The current approach embeds command text into the OSC address path (`/eos/newcmd/Cue 1 Go Enter`), which the bridge then tries to extract back out. This round-trip is fragile and loses formatting.

According to the official ETC EOS OSC documentation, there are **dedicated OSC addresses** for firing cues that bypass the command line entirely:

```text
/eos/cue/<number>/fire     → fires cue in current list
/eos/cue/<list>/<number>/fire → fires cue in specific list
/eos/key/go                → fires next cue (GO button)
/eos/key/back              → fires previous cue (BACK button)
```

Using `/eos/newcmd` with a command string was the wrong approach for cue execution.

## Plan

### 1. Switch cue firing to dedicated `/eos/cue/fire` OSC address (Index.tsx)

**OSC_COMMANDS Cues section** -- change "Fire Cue" from `/eos/newcmd` + `"Cue {a} Go Enter"` to:
```
{ label: "Fire Cue", path: "/eos/cue/{a}/fire", params: ["Cue #"], isKey: true }
```

**CueStack onGo handler** (line ~2314) -- change from:
```
sendOsc("/eos/newcmd", `Cue ${cue.id} Go Enter`)
```
to:
```
sendOsc(`/eos/cue/${cue.id}/fire`)
```

**Cue stack GO button** (line ~2332) -- same change, use `/eos/cue/<id>/fire` instead of newcmd.

**Cue stack BACK button** (line ~2349) -- same change.

### 2. Fix `/eos/newcmd` fallback for non-cue commands (bridge.js + public/bridge.js)

For commands that still use `/eos/newcmd` (Record, Update, Delete, Label, etc.), fix the bridge to use `/eos/cmd` with a proper string argument, which is the documented EOS approach:
```
/eos/cmd = "Cue 5 Record Enter"
```

Update `parseEosCommand` to route `/eos/newcmd/` suffixes through `/eos/cmd` with string arg (this is the EOS-documented way to send command-line text).

### 3. Fix the frontend `sendOsc` for remaining newcmd uses

Change the `sendOsc` function to send `/eos/cmd` with the command as a typed string argument `[{type: "s", value: "..."}]` instead of embedding it in the path, for any remaining command-line text operations (Record, Update, Delete, etc.).

### Files changed
- `src/pages/Index.tsx` -- switch cue fire to `/eos/cue/X/fire`, fix sendOsc newcmd handling
- `bridge.js` -- update parseEosCommand to use `/eos/cmd` for command strings
- `public/bridge.js` -- same bridge fix

