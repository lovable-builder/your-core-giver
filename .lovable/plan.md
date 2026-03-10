

# Why Nothing Happened: Combined Command Syntax

## Root Cause

EOS does **not** support combining `Address` and `Type` in a single command line. The AI agent generated:

```
Chan 100 Address 200 Type Dimmer Enter
```

This is **invalid EOS syntax**. EOS requires these as **two separate commands**:

1. `Chan 100 Address 200 Enter`
2. `Chan 100 Type Dimmer Enter`

## Fix

### 1. Update osc-agent system prompt (`supabase/functions/osc-agent/index.ts`)

In the Patching section of `OSC_COMMANDS_REF`, add explicit fixture type command and a rule that Address and Type must be **separate newcmd calls**:

```
Patching:
- Address: /eos/newcmd "Chan {a} Address {b} Enter"
- Type: /eos/newcmd "Chan {a} Type {b} Enter"    ← NEW
- Unpatch: /eos/newcmd "Chan {a} Address 0 Enter"

RULE: Address and Type MUST be separate /eos/newcmd commands. Never combine them.
When patching with both address and type, return 4 commands:
  1. /eos/key/patch
  2. /eos/newcmd "Chan {a} Address {b} Enter"
  3. /eos/newcmd "Chan {a} Type {c} Enter"
  4. /eos/key/live
```

### 2. Add frontend safety net (`src/pages/Index.tsx`)

In `executeAiOscCommands`, add a splitter that detects combined `Address ... Type` in a single newcmd value and breaks it into two separate commands. This catches any AI hallucination that combines them:

```typescript
// Before sending, split any "Chan X Address Y Type Z Enter" into two commands
commands = commands.flatMap(cmd => {
  if (cmd.path === '/eos/newcmd') {
    const match = cmd.value?.match(/^(Chan\s+\d+)\s+Address\s+(\S+)\s+Type\s+(.+?)\s+Enter$/i);
    if (match) {
      return [
        { path: '/eos/newcmd', value: `${match[1]} Address ${match[2]} Enter` },
        { path: '/eos/newcmd', value: `${match[1]} Type ${match[3]} Enter` },
      ];
    }
  }
  return [cmd];
});
```

### 3. Add "Type" to Patching UI commands (`src/pages/Index.tsx`)

Add a "Set Type" entry in `OSC_COMMANDS.Patching` so users can also do it manually from the command panel.

### Files Modified
- `supabase/functions/osc-agent/index.ts` — separate Type command + rule
- `src/pages/Index.tsx` — command splitter safety net + UI entry

