

# Fixture Disambiguation: Agent Returns Choices for Ambiguous Types

## Problem
When a user says "patch channel 2 address 3 fixture type mac 200", the fuzzy matcher picks the top match and sends it — but "mac 200" matches dozens of fixtures (MAC 2000 Wash, MAC 2000 Performance, MAC 200, etc.). The user gets no choice.

## Solution
Add a disambiguation step: when the fuzzy search returns multiple close matches, show them as clickable choices in the chat history instead of auto-executing.

## Changes

### 1. New function in `src/lib/eosFixtureParser.ts`

Add `fuzzyMatchFixtures(fixtures, query, limit=5)` that returns the **top N matches** (scored and sorted) instead of just the best one. This is the plural version of the existing `fuzzyMatchFixture`.

### 2. Update `executeAiOscCommands` in `src/pages/Index.tsx`

Before calling the osc-agent, run `fuzzyMatchFixtures` against the prompt. If:
- **1 match with high confidence** (score > 0.8) → proceed as today, pass exact type to agent
- **Multiple matches** (2+ results with similar scores) → don't call the agent. Instead, push an assistant message to `aiOscHistory` with a new `choices` field containing the matched fixtures. The user clicks one to re-run the command with the exact type.

### 3. Extend `aiOscHistory` type

Add optional `choices` field to the history entry type:
```typescript
choices?: Array<{
  label: string;        // e.g. "MAC 2000 Wash XB (39ch)"
  fixtureType: string;  // exact EOS type string
  originalPrompt: string; // the original prompt with type replaced
}>;
```

### 4. Render choices in chat UI

When a history entry has `choices`, render clickable buttons (styled like the existing GlowButton). Clicking one calls `executeAiOscCommands` with a rewritten prompt that includes the exact fixture type string, bypassing disambiguation on the second pass.

### 5. Extract fixture type mention from prompt

Add a helper that detects the fixture type portion of a patching prompt (text after "type" or "fixture type" keywords) so we know what substring to search and what to replace when the user picks a choice.

## Files Modified

| File | Change |
|------|--------|
| `src/lib/eosFixtureParser.ts` | Add `fuzzyMatchFixtures()` returning top N scored matches |
| `src/pages/Index.tsx` | Disambiguation logic + choices UI in chat history + extended history type |

