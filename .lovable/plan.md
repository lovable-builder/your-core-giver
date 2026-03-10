

# Plan: Implement ETC Console AI Main Component

## What happened
You pasted a large single-file React component for the ETC Console AI app, but **the code is truncated** — it cuts off mid-render inside the "LIVE STAGE" module at `{channels.filter(c => c.in`. The component cannot be implemented as-is because the JSX is incomplete.

## What I can see
The pasted code contains:
- **ParticleField** — canvas-based animated background
- **SpectrumBar** — audio-style visualizer bars
- **GlowButton** — styled button with glow effects
- **StepCard** — console instruction step cards
- **OscCard** — OSC command sender cards
- **FixtureGrid** — channel color/intensity visualizer
- **CueStack** — cue list with active highlight
- **CommandLog** — scrollable OSC command log
- **Main App** — three modules: AI Guide, OSC Control, Live Stage

All use inline styles (no Tailwind), and the AI Guide calls the Anthropic API directly from the client (which exposes the API key — should use Lovable AI via edge function instead).

## Issues to resolve before implementing

1. **Incomplete code** — The "LIVE STAGE" module JSX is cut off. I need the rest of the component to implement it fully.
2. **JSX syntax** — The pasted code has bare `<div>` tags without className/style attributes in many places (likely stripped during copy). This will need reconstruction.
3. **Direct Anthropic API call** — The `fetchSteps` function calls `api.anthropic.com` directly from the browser, which is insecure and won't work due to CORS. Should be routed through Lovable AI (edge function).

## Proposed approach (once complete code is provided)

1. **Create `src/pages/Index.tsx`** — Convert the full component into a properly typed TypeScript React component
2. **Split into sub-components** — Place helpers (ParticleField, GlowButton, StepCard, OscCard, etc.) into `src/components/` files
3. **Replace Anthropic direct call** — Use Lovable AI gateway via an edge function for the AI Guide module
4. **Load fonts** — Add Google Fonts link to `index.html` for Space Mono and DM Sans
5. **Update CSS** — Set dark background in `index.css`

## Next step

**Please paste the remaining portion of the component** (from the Live Stage module onward through the closing of the App component) so I can implement the complete application.

