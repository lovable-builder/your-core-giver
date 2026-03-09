import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OSC_COMMANDS_REF = `
Channels:
- Select: /eos/newcmd "Chan {a} Enter"
- Intensity: /eos/chan/{a}/param/intensity "{b}"
- Full: /eos/newcmd "Chan {a} Full Enter"
- Out: /eos/newcmd "Chan {a} Out Enter"
- Range: /eos/newcmd "Chan {a} Thru {b} At {c} Enter"
- Sneak: /eos/newcmd "Chan {a} Sneak Enter"

Cues:
- Go: /eos/key/go
- Back: /eos/key/back
- Fire Cue: /eos/cue/{a}/fire
- Record: /eos/newcmd "Cue {a} Record Enter"
- Update: /eos/newcmd "Cue {a} Update Enter"
- Delete: /eos/newcmd "Cue {a} Delete Enter Enter"
- Label: /eos/newcmd "Cue {a} Label {b} Enter"
- Time: /eos/newcmd "Cue {a} Time {b} Enter"

Effects:
- Apply: /eos/newcmd "Chan {a} Effect {b} Enter"
- Rate: /eos/newcmd "Effect {a} Rate {b} Enter"
- Size: /eos/newcmd "Effect {a} Size {b} Enter"
- Offset: /eos/newcmd "Effect {a} Offset {b} Enter"
- Stop: /eos/newcmd "Chan {a} Effect Stop Enter"
- Record FX: /eos/newcmd "Effect {a} Record Enter"

Patching (IMPORTANT: For ANY patching command, ALWAYS return THREE commands in this exact order):
1. { "path": "/eos/key/patch", "description": "Enter patch mode" }
2. { "path": "/eos/newcmd", "value": "Chan {a} Address {b} Enter", "description": "..." }
3. { "path": "/eos/key/live", "description": "Return to live mode" }
- Address: /eos/newcmd "Chan {a} Address {b} Enter"
- Unpatch: /eos/newcmd "Chan {a} Address 0 Enter"
- Universe: /eos/newcmd "Chan {a} Address {b}/{c} Enter"

Groups:
- Select: /eos/newcmd "Group {a} Enter"
- At Level: /eos/newcmd "Group {a} At {b} Enter"
- Record: /eos/newcmd "Group {a} Record Enter"
- Delete: /eos/newcmd "Group {a} Delete Enter"

Palettes:
- Color: /eos/newcmd "Color Palette {a} Enter"
- Intensity: /eos/newcmd "Intensity Palette {a} Enter"
- Focus: /eos/newcmd "Focus Palette {a} Enter"
- Beam: /eos/newcmd "Beam Palette {a} Enter"
- Rec Color: /eos/newcmd "Color Palette {a} Record Enter"
- Update: /eos/newcmd "Color Palette {a} Update Enter"

Macros:
- Fire: /eos/macro/{a}/fire
- Record: /eos/newcmd "Macro {a} Record Enter"
- Stop: /eos/newcmd "Macro {a} Stop Enter"
- Delete: /eos/newcmd "Macro {a} Delete Enter"

System:
- Undo: /eos/newcmd "Undo Enter"
- Clear: /eos/key/clear
- Highlight: /eos/key/highlight
- Blind: /eos/key/blind
- Live: /eos/key/live
- Stage: /eos/key/stage
- Park: /eos/key/park
- Assert: /eos/key/assert
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, consoleName, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that translates natural language requests into ETC EOS OSC commands.
You must return ONLY a valid JSON array of command objects. No markdown, no code fences.
Each object must have:
- "path": The OSC path (e.g. "/eos/newcmd" or "/eos/key/go")
- "value": (optional) The command value (e.g. "Chan 5 At 80 Enter")
- "description": A short, clear description of what this command does.

Here is the reference of valid OSC commands:
${OSC_COMMANDS_REF}

Current Console Context:
- Active Cue: ${context?.activeCue || 'None'}
- Console: ${consoleName || 'Unknown'}

Return ONLY the JSON array. Example:
[
  { "path": "/eos/newcmd", "value": "Chan 5 At 80 Enter", "description": "Set channel 5 to 80%" }
]
`,
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "[]";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    return new Response(JSON.stringify({ commands: JSON.parse(cleaned) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("osc-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
