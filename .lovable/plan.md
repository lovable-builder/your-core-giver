

# Fix: Disambiguation Not Triggering + Remove Auto-Live Fallback

## Two Problems

### 1. Disambiguation didn't trigger for "patch channel 300 as a Mac 2000"
The `extractFixtureTypeFromPrompt` function only matches prompts containing the word "type" (e.g., "fixture type mac 2000"). The phrase "as a Mac 2000" was never caught, so no fuzzy matching ran, and the AI agent guessed "Mac 2000" (not a valid EOS string).

### 2. `/eos/key/live` should not be auto-appended after patching
The current logic always wraps patch commands with `/eos/key/patch` ... `/eos/key/live`. But this is wrong — patching commands should enter patch mode first if needed, but should NOT force-return to live. The user may want to stay in patch mode to continue patching. The agent should only switch modes when the user explicitly asks.

## Changes

### `src/lib/eosFixtureParser.ts`
Expand `extractFixtureTypeFromPrompt` to also match:
- "as a {fixture}" / "as {fixture}"
- "using {fixture}"  
- "with {fixture}"
- "{fixture}" at end of patching prompt after channel/address info

```typescript
// Match: "type X", "as a X", "as X", "using X", "with X"
const patterns = [
  /(?:fixture\s+)?type\s+(.+?)(?:\s+(?:at|on|to|address|addr|chan(?:nel)?|universe)\s|$)/i,
  /\bas\s+(?:a\s+)?(.+?)(?:\s+(?:at|on|to|address|addr|chan(?:nel)?|universe)\s|$)/i,
  /\b(?:using|with)\s+(.+?)(?:\s+(?:at|on|to|address|addr|chan(?:nel)?|universe)\s|$)/i,
];
```

### `supabase/functions/osc-agent/index.ts`
Update the system prompt patching rules:
- Remove the instruction to always wrap with `/eos/key/live` at the end
- Instead, instruct the agent to **enter the required mode first** (e.g., `/eos/key/patch` for patching) but NOT auto-return to live
- Only send `/eos/key/live` if the user explicitly asks to go back to live

### `src/pages/Index.tsx`
- Remove the safety net that auto-wraps patch commands with `/eos/key/patch` + `/eos/key/live` (lines 1311-1325). Replace with logic that only prepends `/eos/key/patch` if patch commands are detected and no patch key is already present — but does NOT append `/eos/key/live`.
- Same for the preset macro path (line 1195) — remove the auto `/eos/key/live` at the end.

## Files

| File | Change |
|------|--------|
| `src/lib/eosFixtureParser.ts` | Broader prompt extraction patterns |
| `supabase/functions/osc-agent/index.ts` | Remove auto-live rule from patching instructions |
| `src/pages/Index.tsx` | Remove `/eos/key/live` from safety net + presets |

