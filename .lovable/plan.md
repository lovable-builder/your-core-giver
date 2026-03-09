

## Problem

When patch commands come through the AI/voice path (`executeAiOscCommands`), the osc-agent returns raw `/eos/newcmd` commands like `Chan 1 Address 1 Enter`. These get sent directly via `sendOsc` without:

1. **Entering patch mode first** (`/eos/key/patch`) — EOS rejects the command in Live mode
2. **Returning to live mode after** (`/eos/key/live`)

The bridge already has a proper `patch_channel` handler with the correct sequence, but the AI path bypasses it entirely.

## Fix — Two Parts

### 1. Update the osc-agent system prompt (`supabase/functions/osc-agent/index.ts`)

Change the Patching section in `OSC_COMMANDS_REF` to instruct the AI to return the **full 3-step sequence** for every patch command:

```
Patching:
- Patch: ["/eos/key/patch", then "/eos/newcmd" "Chan {a} Address {b} Enter", then "/eos/key/live"]
```

Add a system prompt rule: "For any patching command, ALWAYS return three commands in order: first /eos/key/patch, then the newcmd, then /eos/key/live."

### 2. Add patch-mode detection in `executeAiOscCommands` (`src/pages/Index.tsx`)

As a safety net, detect when AI-returned commands contain patch-related newcmd values (matching `Address`, `Type`, `Unpatch`) and automatically wrap them:

- Insert `/eos/key/patch` before the first patch command (with 400ms delay)
- Insert `/eos/key/live` after the last patch command (with 400ms delay)
- Increase inter-command delay from 200ms to 400ms for patch sequences

This ensures correct behavior even if the AI model doesn't return the wrapper commands.

### 3. Increase delay in bridge `patch_channel` handler (`public/bridge.js`)

Bump the initial delay from 300ms to 400ms as the user specified, for reliability on slower consoles.

