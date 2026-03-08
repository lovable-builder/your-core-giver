// ── Comprehensive Lighting Fixture Library ──────────────────────────────────

export interface FixtureMode {
  name: string;
  channels: number;
  channelMap: string[];
}

export interface Fixture {
  id: string;
  manufacturer: string;
  model: string;
  category: FixtureCategory;
  modes: FixtureMode[];
  wattage?: number;
  weight?: string;
  description: string;
}

export type FixtureCategory =
  | "Ellipsoidal"
  | "Fresnel"
  | "PAR"
  | "Wash"
  | "Spot"
  | "Profile"
  | "Beam"
  | "Hybrid"
  | "LED PAR"
  | "LED Wash"
  | "LED Strip"
  | "LED Panel"
  | "LED Ellipsoidal"
  | "Cyc Light"
  | "Strobe"
  | "Blinder"
  | "Follow Spot"
  | "Gobo Rotator"
  | "Pixel"
  | "Atmospheric"
  | "Laser"
  | "UV"
  | "House Light"
  | "Practical"
  | "Scroller";

export const FIXTURE_CATEGORIES: FixtureCategory[] = [
  "Ellipsoidal", "Fresnel", "PAR", "Wash", "Spot", "Profile", "Beam", "Hybrid",
  "LED PAR", "LED Wash", "LED Strip", "LED Panel", "LED Ellipsoidal",
  "Cyc Light", "Strobe", "Blinder", "Follow Spot", "Gobo Rotator",
  "Pixel", "Atmospheric", "Laser", "UV", "House Light", "Practical", "Scroller"
];

export const MANUFACTURERS = [
  "ETC", "Martin", "Clay Paky", "Robe", "Chauvet", "High End Systems",
  "Vari-Lite", "Ayrton", "GLP", "Robert Juliat", "Elation", "ADJ",
  "Altman", "Strand", "Philips", "Astera", "SGM", "TMB", "Rosco",
  "City Theatrical", "Apollo", "Wybron", "Generic"
];

export const FIXTURES: Fixture[] = [
  // ── ETC ──────────────────────────────────────────────────────────────
  {
    id: "etc-s4-750",
    manufacturer: "ETC",
    model: "Source Four 750W",
    category: "Ellipsoidal",
    wattage: 750,
    description: "Industry-standard ellipsoidal reflector spotlight. HPL 750W lamp.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "etc-s4-575",
    manufacturer: "ETC",
    model: "Source Four 575W",
    category: "Ellipsoidal",
    wattage: 575,
    description: "Standard ellipsoidal with HPL 575W lamp.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "etc-s4-led-s2",
    manufacturer: "ETC",
    model: "Source Four LED Series 2 Lustr",
    category: "LED Ellipsoidal",
    wattage: 160,
    description: "7-color LED engine in Source Four form factor. x7 Color System.",
    modes: [
      { name: "Direct", channels: 7, channelMap: ["Red", "Green", "Blue", "Amber", "Cyan", "Indigo", "Lime"] },
      { name: "HSI", channels: 5, channelMap: ["Hue", "Saturation", "Intensity", "Strobe", "Fan"] },
      { name: "Studio", channels: 5, channelMap: ["Intensity", "Color Temp", "Tint", "Strobe", "Fan"] },
      { name: "HSIC", channels: 7, channelMap: ["Hue", "Saturation", "Intensity", "Strobe", "Fan", "CCT", "Tint"] },
    ],
  },
  {
    id: "etc-s4-led-ce",
    manufacturer: "ETC",
    model: "Source Four LED Series 3 CYC",
    category: "Cyc Light",
    wattage: 200,
    description: "LED cyc adapter for Source Four with wide-field lens.",
    modes: [
      { name: "Direct", channels: 7, channelMap: ["Red", "Green", "Blue", "Amber", "Cyan", "Indigo", "Lime"] },
      { name: "Studio", channels: 5, channelMap: ["Intensity", "Color Temp", "Tint", "Strobe", "Fan"] },
    ],
  },
  {
    id: "etc-colorsource-par",
    manufacturer: "ETC",
    model: "ColorSource PAR",
    category: "LED PAR",
    wattage: 80,
    description: "Affordable RGBA LED PAR with deep colors.",
    modes: [
      { name: "Direct", channels: 5, channelMap: ["Red", "Green", "Blue", "Amber", "Strobe"] },
      { name: "HSI", channels: 4, channelMap: ["Hue", "Saturation", "Intensity", "Strobe"] },
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "etc-colorsource-par-deep-blue",
    manufacturer: "ETC",
    model: "ColorSource PAR Deep Blue",
    category: "LED PAR",
    wattage: 80,
    description: "ColorSource PAR with deep blue LED for saturated blues.",
    modes: [
      { name: "Direct", channels: 5, channelMap: ["Red", "Green", "Blue", "Deep Blue", "Strobe"] },
      { name: "HSI", channels: 4, channelMap: ["Hue", "Saturation", "Intensity", "Strobe"] },
    ],
  },
  {
    id: "etc-colorsource-spot",
    manufacturer: "ETC",
    model: "ColorSource Spot",
    category: "Spot",
    wattage: 80,
    description: "LED profile spot with zoom, gobo, and color mixing.",
    modes: [
      { name: "Standard", channels: 12, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "Intensity", "Red", "Green", "Blue", "Amber", "Zoom", "Gobo", "Strobe"] },
    ],
  },
  {
    id: "etc-s4-par",
    manufacturer: "ETC",
    model: "Source Four PAR",
    category: "PAR",
    wattage: 575,
    description: "PAR fixture using HPL lamp with interchangeable lens.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "etc-s4-par-ea",
    manufacturer: "ETC",
    model: "Source Four PARNel",
    category: "Fresnel",
    wattage: 750,
    description: "Hybrid PAR/Fresnel with variable beam spread.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "etc-desire-d22",
    manufacturer: "ETC",
    model: "Desire D22 Studio",
    category: "LED Panel",
    wattage: 140,
    description: "Studio panel with x7 Color System and high CRI.",
    modes: [
      { name: "Direct", channels: 7, channelMap: ["Red", "Green", "Blue", "Amber", "Cyan", "Indigo", "Lime"] },
      { name: "Studio", channels: 5, channelMap: ["Intensity", "Color Temp", "Tint", "Strobe", "Fan"] },
    ],
  },
  {
    id: "etc-desire-d40",
    manufacturer: "ETC",
    model: "Desire D40 Studio HD",
    category: "LED Wash",
    wattage: 180,
    description: "Large-format LED wash with x7 Color System.",
    modes: [
      { name: "Direct", channels: 7, channelMap: ["Red", "Green", "Blue", "Amber", "Cyan", "Indigo", "Lime"] },
      { name: "Studio", channels: 5, channelMap: ["Intensity", "Color Temp", "Tint", "Strobe", "Fan"] },
    ],
  },
  {
    id: "etc-fos-100",
    manufacturer: "ETC",
    model: "fos/4 Panel 100",
    category: "LED Panel",
    wattage: 100,
    description: "1×1 panel with Lustr X8 color. Film & TV workhorse.",
    modes: [
      { name: "Direct", channels: 8, channelMap: ["Red", "Green", "Blue", "Amber", "Cyan", "Indigo", "Lime", "White"] },
      { name: "Studio", channels: 5, channelMap: ["Intensity", "Color Temp", "Tint", "Strobe", "Fan"] },
    ],
  },
  {
    id: "etc-fos-fresnel",
    manufacturer: "ETC",
    model: "fos/4 Fresnel",
    category: "Fresnel",
    wattage: 200,
    description: "LED Fresnel with Lustr X8 color system. Motorized zoom.",
    modes: [
      { name: "Direct", channels: 8, channelMap: ["Red", "Green", "Blue", "Amber", "Cyan", "Indigo", "Lime", "White"] },
      { name: "Studio", channels: 6, channelMap: ["Intensity", "Color Temp", "Tint", "Zoom", "Strobe", "Fan"] },
    ],
  },
  {
    id: "etc-ion",
    manufacturer: "ETC",
    model: "Source Four LED Series 2 Daylight HD",
    category: "LED Ellipsoidal",
    wattage: 155,
    description: "Daylight-balanced LED engine. High CRI output.",
    modes: [
      { name: "Studio", channels: 4, channelMap: ["Intensity", "Color Temp", "Strobe", "Fan"] },
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },

  // ── MARTIN ───────────────────────────────────────────────────────────
  {
    id: "martin-mac-aura",
    manufacturer: "Martin",
    model: "MAC Aura",
    category: "Wash",
    wattage: 180,
    description: "Compact LED wash with Aura backlight effect. RGBW color mixing.",
    modes: [
      { name: "Extended", channels: 23, channelMap: ["Shutter", "Dimmer", "Dimmer Fine", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel FX", "Color Wheel FX Rotation", "Red", "Green", "Blue", "White", "Zoom", "Aura Shutter", "Aura Dimmer", "Aura Red", "Aura Green", "Aura Blue", "Aura White", "Pan", "Pan Fine", "Tilt", "Tilt Fine"] },
      { name: "Basic", channels: 15, channelMap: ["Shutter", "Dimmer", "Cyan", "Magenta", "Yellow", "Color Wheel", "Zoom", "Aura Dimmer", "Aura Color", "Pan", "Pan Fine", "Tilt", "Tilt Fine", "FX", "FX Speed"] },
    ],
  },
  {
    id: "martin-mac-encore-wash",
    manufacturer: "Martin",
    model: "MAC Encore Wash",
    category: "Wash",
    wattage: 500,
    description: "High-output LED wash moving head with CMY, zoom.",
    modes: [
      { name: "Extended", channels: 26, channelMap: ["Shutter", "Dimmer", "Dimmer Fine", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Zoom", "Zoom Fine", "Red", "Green", "Blue", "White", "Pan", "Pan Fine", "Tilt", "Tilt Fine", "Pan/Tilt Speed", "FX1", "FX1 Rate", "FX2", "FX2 Rate", "Aura Dimmer", "Aura Red", "Aura Green"] },
      { name: "Basic", channels: 17, channelMap: ["Shutter", "Dimmer", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Zoom", "Pan", "Pan Fine", "Tilt", "Tilt Fine", "FX1", "FX1 Rate", "Aura Dimmer", "Aura Color", "Pan/Tilt Speed"] },
    ],
  },
  {
    id: "martin-mac-quantum-wash",
    manufacturer: "Martin",
    model: "MAC Quantum Wash",
    category: "Wash",
    wattage: 700,
    description: "High-power discharge wash with quick movement.",
    modes: [
      { name: "Standard", channels: 20, channelMap: ["Shutter", "Dimmer", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Zoom", "Pan", "Pan Fine", "Tilt", "Tilt Fine", "Pan/Tilt Speed", "FX1 Type", "FX1 Speed", "FX2 Type", "FX2 Speed", "Control", "Reserved1", "Reserved2"] },
    ],
  },
  {
    id: "martin-mac-viper-profile",
    manufacturer: "Martin",
    model: "MAC Viper Profile",
    category: "Profile",
    wattage: 1000,
    description: "Top-tier discharge profile. CMY, gobos, prism, iris, framing.",
    modes: [
      { name: "Extended", channels: 38, channelMap: ["Shutter", "Dimmer", "Dimmer Fine", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Gobo 1", "Gobo 1 Rotation", "Gobo 1 Rot Fine", "Gobo 2", "Prism", "Prism Rotation", "FX", "FX Rotation", "Frost 1", "Frost 2", "Iris", "Iris Fine", "Zoom", "Zoom Fine", "Focus", "Focus Fine", "Blade 1A", "Blade 1B", "Blade 2A", "Blade 2B", "Blade 3A", "Blade 3B", "Blade 4A", "Blade 4B", "Blade Rotation", "Pan", "Pan Fine", "Tilt", "Tilt Fine", "Pan/Tilt Speed"] },
      { name: "Basic", channels: 26, channelMap: ["Shutter", "Dimmer", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Gobo 1", "Gobo 1 Rotation", "Gobo 2", "Prism", "Prism Rotation", "Frost", "Iris", "Zoom", "Focus", "Blade 1A", "Blade 1B", "Blade 2A", "Blade 2B", "Blade Rot", "Pan", "Pan Fine", "Tilt", "Tilt Fine", "Pan/Tilt Speed"] },
    ],
  },
  {
    id: "martin-mac-encore-perf",
    manufacturer: "Martin",
    model: "MAC Encore Performance",
    category: "Profile",
    wattage: 468,
    description: "LED profile moving head. CMY, dual gobo wheels, framing shutters.",
    modes: [
      { name: "Extended", channels: 35, channelMap: ["Shutter", "Dimmer", "Dimmer Fine", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Gobo 1", "Gobo 1 Rotation", "Gobo 1 Rot Fine", "Gobo 2", "Prism", "Prism Rotation", "Frost", "Iris", "Zoom", "Zoom Fine", "Focus", "Focus Fine", "Blade 1A", "Blade 1B", "Blade 2A", "Blade 2B", "Blade 3A", "Blade 3B", "Blade 4A", "Blade 4B", "Blade Rotation", "Pan", "Pan Fine", "Tilt", "Tilt Fine", "Pan/Tilt Speed", "Control"] },
    ],
  },
  {
    id: "martin-rush-par2",
    manufacturer: "Martin",
    model: "RUSH PAR 2 RGBW",
    category: "LED PAR",
    wattage: 120,
    description: "Affordable LED PAR with RGBW mixing. 12×10W LEDs.",
    modes: [
      { name: "Standard", channels: 6, channelMap: ["Dimmer", "Red", "Green", "Blue", "White", "Strobe"] },
      { name: "Basic", channels: 4, channelMap: ["Red", "Green", "Blue", "White"] },
    ],
  },
  {
    id: "martin-era-600",
    manufacturer: "Martin",
    model: "ERA 600 Profile",
    category: "Profile",
    wattage: 550,
    description: "LED profile with framing, gobos, and animation wheel.",
    modes: [
      { name: "Standard", channels: 30, channelMap: ["Shutter", "Dimmer", "Dimmer Fine", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Gobo 1", "Gobo 1 Rotation", "Gobo 2", "Prism", "Prism Rot", "Frost", "Iris", "Zoom", "Focus", "Blade 1A", "Blade 1B", "Blade 2A", "Blade 2B", "Blade 3A", "Blade 3B", "Blade 4A", "Blade 4B", "Blade Rot", "Pan", "Pan Fine", "Tilt", "Tilt Fine"] },
    ],
  },

  // ── CLAY PAKY ────────────────────────────────────────────────────────
  {
    id: "cp-mythos2",
    manufacturer: "Clay Paky",
    model: "Mythos 2",
    category: "Hybrid",
    wattage: 470,
    description: "Legendary hybrid beam/spot/wash. Dual gobo wheels, prism, animation.",
    modes: [
      { name: "Standard", channels: 32, channelMap: ["Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Strobe", "Dimmer", "Dimmer Fine", "Iris", "Gobo 1", "Gobo 1 Rotation", "Gobo 1 Rot Fine", "Gobo 2", "Prism 1", "Prism 1 Rot", "Prism 2", "Frost", "Zoom", "Focus", "Animation", "Animation Rotation", "Blade 1", "Blade 2", "Blade 3", "Blade 4", "Blade Rotation", "Pan", "Pan Fine", "Tilt", "Tilt Fine", "Pan/Tilt Speed", "Function"] },
    ],
  },
  {
    id: "cp-sharpy",
    manufacturer: "Clay Paky",
    model: "Sharpy",
    category: "Beam",
    wattage: 189,
    description: "Iconic ultra-narrow beam. 14 colors, 17 gobos.",
    modes: [
      { name: "Standard", channels: 16, channelMap: ["Color Wheel", "Strobe", "Dimmer", "Gobo", "Gobo Shake", "Prism", "Prism Rotation", "Frost", "Pan", "Pan Fine", "Tilt", "Tilt Fine", "Pan/Tilt Speed", "Function", "Reset", "Lamp"] },
    ],
  },
  {
    id: "cp-sharpy-plus",
    manufacturer: "Clay Paky",
    model: "Sharpy Plus",
    category: "Hybrid",
    wattage: 550,
    description: "Hybrid beam/spot. CMY, gobos, prism, frost.",
    modes: [
      { name: "Standard", channels: 24, channelMap: ["Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Strobe", "Dimmer", "Dimmer Fine", "Gobo 1", "Gobo 1 Rot", "Gobo 2", "Prism", "Prism Rot", "Frost", "Zoom", "Focus", "Pan", "Pan Fine", "Tilt", "Tilt Fine", "Pan/Tilt Speed", "Macro", "Function", "Reset"] },
    ],
  },
  {
    id: "cp-mini-b",
    manufacturer: "Clay Paky",
    model: "Mini-B",
    category: "Beam",
    wattage: 40,
    description: "Ultra-compact beam. 7 colors, 8 gobos.",
    modes: [
      { name: "Standard", channels: 14, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "Pan/Tilt Speed", "Dimmer", "Strobe", "Color Wheel", "Gobo", "Gobo Shake", "Prism", "Frost", "Function", "Reset"] },
    ],
  },
  {
    id: "cp-axcor-profile-900",
    manufacturer: "Clay Paky",
    model: "Axcor Profile 900",
    category: "Profile",
    wattage: 750,
    description: "High-output LED profile. CMY, framing, dual gobos.",
    modes: [
      { name: "Standard", channels: 36, channelMap: ["Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Strobe", "Dimmer", "Dimmer Fine", "Gobo 1", "Gobo 1 Rot", "Gobo 1 Rot Fine", "Gobo 2", "Prism", "Prism Rot", "Frost 1", "Frost 2", "Iris", "Zoom", "Focus", "Blade 1A", "Blade 1B", "Blade 2A", "Blade 2B", "Blade 3A", "Blade 3B", "Blade 4A", "Blade 4B", "Blade System Rot", "Pan", "Pan Fine", "Tilt", "Tilt Fine", "Pan/Tilt Speed", "Macro", "Function", "Reset"] },
    ],
  },

  // ── ROBE ─────────────────────────────────────────────────────────────
  {
    id: "robe-megapointe",
    manufacturer: "Robe",
    model: "MegaPointe",
    category: "Hybrid",
    wattage: 470,
    description: "3-in-1 beam/spot/wash. Dual prisms, animation wheel, CMY.",
    modes: [
      { name: "Mode 1", channels: 34, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "Pan/Tilt Speed", "Power", "Color Wheel", "Cyan", "Magenta", "Yellow", "CTO", "CMY Macro", "FX Speed", "Gobo 1", "Gobo 1 Rot", "Gobo 1 Rot Fine", "Gobo 2", "Prism 1", "Prism 1 Rot", "Prism 2", "Prism 2 Rot", "Frost 1", "Frost 2", "Iris", "Zoom", "Zoom Fine", "Focus", "Focus Fine", "Animation Wheel", "Animation Rot", "Shutter", "Dimmer", "Dimmer Fine", "Special"] },
      { name: "Mode 2", channels: 30, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "Pan/Tilt Speed", "Power", "Color Wheel", "Cyan", "Magenta", "Yellow", "CTO", "Gobo 1", "Gobo 1 Rot", "Gobo 2", "Prism 1", "Prism 1 Rot", "Prism 2", "Prism 2 Rot", "Frost 1", "Frost 2", "Iris", "Zoom", "Focus", "Animation", "Animation Rot", "Shutter", "Dimmer", "Dimmer Fine", "Special", "Reserved"] },
    ],
  },
  {
    id: "robe-spiider",
    manufacturer: "Robe",
    model: "SPIIDER",
    category: "Wash",
    wattage: 640,
    description: "LED wash beam with flower effect. 18+1 RGBW LED zones.",
    modes: [
      { name: "Mode 1", channels: 35, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Power", "Dimmer", "Dimmer Fine", "Shutter", "Red", "Red Fine", "Green", "Green Fine", "Blue", "Blue Fine", "White", "White Fine", "CTO", "Zoom", "Zoom Fine", "Pixel Mode", "Pixel FX", "Pixel FX Speed", "FX Select", "FX Speed", "FX Fade", "FX Parts", "Virtual Color", "Ring Red", "Ring Green", "Ring Blue", "Ring White", "Ring CTO", "Ring Dimmer", "Special"] },
      { name: "Mode 2", channels: 23, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Power", "Dimmer", "Shutter", "Red", "Green", "Blue", "White", "CTO", "Zoom", "Pixel Mode", "Pixel FX", "Pixel FX Speed", "FX Select", "FX Speed", "Ring Red", "Ring Green", "Ring Blue", "Special"] },
    ],
  },
  {
    id: "robe-t1-profile",
    manufacturer: "Robe",
    model: "T1 Profile",
    category: "Profile",
    wattage: 750,
    description: "LED profile for theatre. CMY, framing shutters, quiet operation.",
    modes: [
      { name: "Mode 1", channels: 36, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Power", "Color Wheel", "Cyan", "Magenta", "Yellow", "CTO", "Green Shift", "Gobo 1", "Gobo 1 Rot", "Gobo 1 Rot Fine", "Gobo 2", "Prism", "Prism Rot", "Frost 1", "Frost 2", "Iris", "Iris Fine", "Zoom", "Zoom Fine", "Focus", "Focus Fine", "Blade 1A", "Blade 1B", "Blade 2A", "Blade 2B", "Blade 3A", "Blade 3B", "Blade 4A", "Blade 4B", "Blade System Rot", "Shutter", "Dimmer", "Dimmer Fine", "Special"] },
    ],
  },
  {
    id: "robe-forte",
    manufacturer: "Robe",
    model: "FORTE",
    category: "Profile",
    wattage: 750,
    description: "Flagship LED profile. Transferable Engine technology.",
    modes: [
      { name: "Standard", channels: 38, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Power", "Color Wheel", "Cyan", "Magenta", "Yellow", "CTO", "Green Shift", "Virtual Color", "Gobo 1", "Gobo 1 Rot", "Gobo 1 Rot Fine", "Gobo 2", "Prism 1", "Prism 1 Rot", "Prism 2", "Animation", "Frost 1", "Frost 2", "Iris", "Zoom", "Zoom Fine", "Focus", "Focus Fine", "Blade 1A", "Blade 1B", "Blade 2A", "Blade 2B", "Blade 3A", "Blade 3B", "Blade 4A", "Blade 4B", "Blade System Rot", "Shutter", "Dimmer"] },
    ],
  },
  {
    id: "robe-robin-600-ledwash",
    manufacturer: "Robe",
    model: "Robin 600 LEDWash",
    category: "Wash",
    wattage: 600,
    description: "RGBW LED wash with zoom. 37 LEDs.",
    modes: [
      { name: "Standard", channels: 18, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Power", "Dimmer", "Dimmer Fine", "Shutter", "Red", "Green", "Blue", "White", "CTO", "Zoom", "FX Select", "FX Speed", "Special"] },
    ],
  },

  // ── CHAUVET ──────────────────────────────────────────────────────────
  {
    id: "chauvet-maverick-mk3-profile",
    manufacturer: "Chauvet",
    model: "Maverick MK3 Profile",
    category: "Profile",
    wattage: 820,
    description: "High-output LED profile. CMY, dual gobos, framing shutters.",
    modes: [
      { name: "Extended", channels: 36, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Dimmer", "Dimmer Fine", "Shutter", "Virtual Color", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Gobo 1", "Gobo 1 Rotation", "Gobo 1 Rot Fine", "Gobo 2", "Prism", "Prism Rotation", "Frost 1", "Frost 2", "Iris", "Zoom", "Focus", "Blade 1A", "Blade 1B", "Blade 2A", "Blade 2B", "Blade 3A", "Blade 3B", "Blade 4A", "Blade 4B", "Blade Rotation", "Control", "Special"] },
      { name: "Standard", channels: 24, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "Dimmer", "Shutter", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Gobo 1", "Gobo 1 Rot", "Gobo 2", "Prism", "Prism Rot", "Frost", "Iris", "Zoom", "Focus", "Blade All", "Blade Rot", "Control", "Special"] },
    ],
  },
  {
    id: "chauvet-maverick-storm1",
    manufacturer: "Chauvet",
    model: "Maverick Storm 1 Wash",
    category: "Wash",
    wattage: 500,
    description: "IP65 LED wash moving head for outdoor use.",
    modes: [
      { name: "Standard", channels: 18, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Dimmer", "Dimmer Fine", "Shutter", "Red", "Green", "Blue", "White", "CTO", "Zoom", "Control", "Pixel Mode", "Pixel FX", "Pixel Speed"] },
    ],
  },
  {
    id: "chauvet-rogue-r2-spot",
    manufacturer: "Chauvet",
    model: "Rogue R2 Spot",
    category: "Spot",
    wattage: 240,
    description: "Mid-range LED spot. Color wheel, 2 gobo wheels, prism.",
    modes: [
      { name: "Standard", channels: 21, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Dimmer", "Dimmer Fine", "Shutter", "Color Wheel", "Gobo 1", "Gobo 1 Rot", "Gobo 2", "Prism", "Prism Rot", "Frost", "Focus", "Zoom", "Pan/Tilt Macro", "Macro Speed", "Control", "Special"] },
    ],
  },
  {
    id: "chauvet-colorado-solo",
    manufacturer: "Chauvet",
    model: "COLORado 1 Solo",
    category: "LED Wash",
    wattage: 60,
    description: "IP65 RGBW LED wash. Single-source optic.",
    modes: [
      { name: "Standard", channels: 8, channelMap: ["Dimmer", "Red", "Green", "Blue", "White", "Strobe", "Color Macro", "Auto/Sound"] },
      { name: "Basic", channels: 4, channelMap: ["Red", "Green", "Blue", "White"] },
    ],
  },
  {
    id: "chauvet-slimpar-pro-q",
    manufacturer: "Chauvet",
    model: "SlimPAR Pro Q USB",
    category: "LED PAR",
    wattage: 84,
    description: "Slim RGBA LED PAR. 12 quad-color LEDs.",
    modes: [
      { name: "Standard", channels: 7, channelMap: ["Dimmer", "Red", "Green", "Blue", "Amber", "Strobe", "Color Macro"] },
      { name: "Basic", channels: 4, channelMap: ["Red", "Green", "Blue", "Amber"] },
    ],
  },

  // ── HIGH END SYSTEMS / VARI-LITE ─────────────────────────────────────
  {
    id: "hes-solaframe-3000",
    manufacturer: "High End Systems",
    model: "SolaFrame 3000",
    category: "Profile",
    wattage: 1200,
    description: "Flagship automated luminaire. CMY+CTO, dual gobos, framing.",
    modes: [
      { name: "Standard", channels: 38, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Dimmer", "Dimmer Fine", "Shutter", "Gobo 1", "Gobo 1 Rot", "Gobo 1 Rot Fine", "Gobo 2", "Prism", "Prism Rot", "Frost", "Animation", "Animation Rot", "Iris", "Iris Fine", "Zoom", "Zoom Fine", "Focus", "Focus Fine", "Blade 1A", "Blade 1B", "Blade 2A", "Blade 2B", "Blade 3A", "Blade 3B", "Blade 4A", "Blade 4B", "Blade System Rot", "Control"] },
    ],
  },
  {
    id: "hes-solaspot-2000",
    manufacturer: "High End Systems",
    model: "SolaSpot 2000",
    category: "Spot",
    wattage: 600,
    description: "Powerful LED spot. CMY, gobo wheels, prism.",
    modes: [
      { name: "Standard", channels: 27, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Dimmer", "Dimmer Fine", "Shutter", "Gobo 1", "Gobo 1 Rot", "Gobo 2", "Prism", "Prism Rot", "Frost", "Iris", "Zoom", "Focus", "Animation", "Animation Rot", "FX", "FX Speed", "Control"] },
    ],
  },
  {
    id: "vl-vl4000-spot",
    manufacturer: "Vari-Lite",
    model: "VL4000 Spot",
    category: "Spot",
    wattage: 1200,
    description: "Classic high-output spot. Dichroic color system.",
    modes: [
      { name: "Standard", channels: 26, channelMap: ["Dimmer", "Dimmer Fine", "Shutter", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Gobo 1", "Gobo 1 Index", "Gobo 2", "Prism", "Iris", "Focus", "Focus Fine", "Zoom", "Frost", "Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Function 1", "Function 2", "Control", "Reserved"] },
    ],
  },
  {
    id: "vl-vl2600-wash",
    manufacturer: "Vari-Lite",
    model: "VL2600 Wash",
    category: "Wash",
    wattage: 550,
    description: "LED wash. RGBW color mixing with individual ring control.",
    modes: [
      { name: "Standard", channels: 18, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Dimmer", "Dimmer Fine", "Shutter", "Red", "Green", "Blue", "White", "CTO", "Zoom", "FX1", "FX2", "Control", "Reserved"] },
    ],
  },

  // ── AYRTON ───────────────────────────────────────────────────────────
  {
    id: "ayrton-ghibli",
    manufacturer: "Ayrton",
    model: "Ghibli",
    category: "Profile",
    wattage: 500,
    description: "LED spot/profile. CMY+CTO, framing shutters, gobos.",
    modes: [
      { name: "Extended", channels: 35, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Dimmer", "Dimmer Fine", "Shutter", "Gobo 1", "Gobo 1 Rot", "Gobo 1 Rot Fine", "Gobo 2", "Prism", "Prism Rot", "Frost", "Iris", "Zoom", "Zoom Fine", "Focus", "Focus Fine", "Blade 1A", "Blade 1B", "Blade 2A", "Blade 2B", "Blade 3A", "Blade 3B", "Blade 4A", "Blade 4B", "Blade System Rot", "Control"] },
    ],
  },
  {
    id: "ayrton-perseo-profile",
    manufacturer: "Ayrton",
    model: "Perseo Profile",
    category: "Profile",
    wattage: 750,
    description: "High-end LED profile for large venues.",
    modes: [
      { name: "Standard", channels: 36, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Dimmer", "Dimmer Fine", "Shutter", "Gobo 1", "Gobo 1 Rot", "Gobo 2", "Prism 1", "Prism 1 Rot", "Prism 2", "Frost 1", "Frost 2", "Iris", "Zoom", "Zoom Fine", "Focus", "Focus Fine", "Blade 1A", "Blade 1B", "Blade 2A", "Blade 2B", "Blade 3A", "Blade 3B", "Blade 4A", "Blade 4B", "Blade Rot", "Control"] },
    ],
  },
  {
    id: "ayrton-diablo",
    manufacturer: "Ayrton",
    model: "Diablo",
    category: "Profile",
    wattage: 300,
    description: "Compact LED profile. CMY, gobos, framing.",
    modes: [
      { name: "Standard", channels: 32, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Dimmer", "Dimmer Fine", "Shutter", "Gobo 1", "Gobo 1 Rot", "Gobo 2", "Prism", "Prism Rot", "Frost", "Iris", "Zoom", "Focus", "Blade 1A", "Blade 1B", "Blade 2A", "Blade 2B", "Blade 3A", "Blade 3B", "Blade 4A", "Blade 4B", "Blade Rot", "Control"] },
    ],
  },
  {
    id: "ayrton-khamsin",
    manufacturer: "Ayrton",
    model: "Khamsin",
    category: "Profile",
    wattage: 750,
    description: "LED profile with continuous rotation gobos.",
    modes: [
      { name: "Standard", channels: 38, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Green Shift", "Dimmer", "Dimmer Fine", "Shutter", "Gobo 1", "Gobo 1 Rot", "Gobo 1 Rot Fine", "Gobo 2", "Prism 1", "Prism 1 Rot", "Prism 2", "Animation", "Frost 1", "Frost 2", "Iris", "Zoom", "Zoom Fine", "Focus", "Focus Fine", "Blade 1A", "Blade 1B", "Blade 2A", "Blade 2B", "Blade 3A", "Blade 3B", "Blade 4A", "Blade 4B", "Blade Rot"] },
    ],
  },

  // ── GLP ──────────────────────────────────────────────────────────────
  {
    id: "glp-impression-x5",
    manufacturer: "GLP",
    model: "impression X5",
    category: "Wash",
    wattage: 280,
    description: "LED wash beam. 19 RGBW LEDs with individual pixel control.",
    modes: [
      { name: "Standard", channels: 18, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "Dimmer", "Shutter", "Red", "Green", "Blue", "White", "CTO", "Color Macro", "Zoom", "Pixel FX", "Pixel Speed", "Pixel Fade", "P/T Speed", "Control"] },
    ],
  },
  {
    id: "glp-jr-wash-7",
    manufacturer: "GLP",
    model: "JDC1",
    category: "Strobe",
    wattage: 1260,
    description: "Hybrid strobe/wash with RGB background and white strobe tubes.",
    modes: [
      { name: "Standard", channels: 20, channelMap: ["Tilt", "Tilt Fine", "Intensity All", "Intensity Fine", "Duration", "Rate", "FX", "FX Intensity", "FX Rate", "FX Fade", "BG Red", "BG Green", "BG Blue", "BG CTO", "BG Dimmer", "BG Strobe", "Strobe Dimmer", "Strobe Duration", "Strobe Rate", "Control"] },
    ],
  },

  // ── ELATION ──────────────────────────────────────────────────────────
  {
    id: "elation-proteus-maximus",
    manufacturer: "Elation",
    model: "Proteus Maximus",
    category: "Profile",
    wattage: 950,
    description: "IP65 LED profile. CMY, framing, dual gobos.",
    modes: [
      { name: "Extended", channels: 38, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Cyan", "Magenta", "Yellow", "CTO", "Color Wheel", "Dimmer", "Dimmer Fine", "Shutter", "Gobo 1", "Gobo 1 Rot", "Gobo 1 Rot Fine", "Gobo 2", "Prism", "Prism Rot", "Frost 1", "Frost 2", "Animation", "Iris", "Zoom", "Zoom Fine", "Focus", "Focus Fine", "Blade 1A", "Blade 1B", "Blade 2A", "Blade 2B", "Blade 3A", "Blade 3B", "Blade 4A", "Blade 4B", "Blade Rot", "FX", "Control"] },
    ],
  },
  {
    id: "elation-fuze-wash-500",
    manufacturer: "Elation",
    model: "Fuze Wash 500",
    category: "Wash",
    wattage: 230,
    description: "LED wash with zoom. RGBMA color mixing.",
    modes: [
      { name: "Standard", channels: 16, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Dimmer", "Dimmer Fine", "Shutter", "Red", "Green", "Blue", "Mint", "Amber", "Zoom", "Control", "Reserved"] },
    ],
  },
  {
    id: "elation-sixpar-300",
    manufacturer: "Elation",
    model: "SixPar 300",
    category: "LED PAR",
    wattage: 108,
    description: "RGBAW+UV LED PAR. 18 LEDs, 6-color mixing.",
    modes: [
      { name: "Extended", channels: 10, channelMap: ["Dimmer", "Red", "Green", "Blue", "Amber", "White", "UV", "Strobe", "Color Macro", "Auto/Sound"] },
      { name: "Basic", channels: 6, channelMap: ["Red", "Green", "Blue", "Amber", "White", "UV"] },
    ],
  },

  // ── ADJ ──────────────────────────────────────────────────────────────
  {
    id: "adj-vizi-beam-rxone",
    manufacturer: "ADJ",
    model: "Vizi Beam RXONE",
    category: "Beam",
    wattage: 100,
    description: "Compact moving head beam. Osram SIRIUS HRI.",
    modes: [
      { name: "Standard", channels: 16, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "Color Wheel", "Gobo", "Gobo Shake", "Prism", "Prism Rotation", "Dimmer", "Shutter", "Frost", "Focus", "P/T Speed", "Lamp", "Reset"] },
    ],
  },
  {
    id: "adj-mega-hex-par",
    manufacturer: "ADJ",
    model: "Mega HEX Par",
    category: "LED PAR",
    wattage: 30,
    description: "Compact RGBAW+UV PAR. 5×6-in-1 HEX LEDs.",
    modes: [
      { name: "12ch", channels: 12, channelMap: ["Dimmer", "Red", "Green", "Blue", "Amber", "White", "UV", "Strobe", "Color Macro", "Color Macro Speed", "Dimmer Mode", "Dimmer Curve"] },
      { name: "6ch", channels: 6, channelMap: ["Red", "Green", "Blue", "Amber", "White", "UV"] },
    ],
  },

  // ── ALTMAN / STRAND ──────────────────────────────────────────────────
  {
    id: "altman-3-5q",
    manufacturer: "Altman",
    model: "3.5Q Ellipsoidal",
    category: "Ellipsoidal",
    wattage: 750,
    description: "Quartz ellipsoidal. 3.5\" lens system.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "altman-spectra-cyc-200",
    manufacturer: "Altman",
    model: "Spectra Cyc 200",
    category: "Cyc Light",
    wattage: 200,
    description: "LED cyc light with RGBA mixing.",
    modes: [
      { name: "Standard", channels: 7, channelMap: ["Dimmer", "Red", "Green", "Blue", "Amber", "Strobe", "Control"] },
      { name: "Basic", channels: 4, channelMap: ["Red", "Green", "Blue", "Amber"] },
    ],
  },
  {
    id: "strand-leko",
    manufacturer: "Strand",
    model: "Leko 6×9",
    category: "Ellipsoidal",
    wattage: 750,
    description: "Classic theatrical ellipsoidal. 6\" × 9\" lens barrel.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "strand-sl-led",
    manufacturer: "Strand",
    model: "SL LED Wash",
    category: "LED Wash",
    wattage: 150,
    description: "LED wash for architectural and theatre use.",
    modes: [
      { name: "Direct", channels: 5, channelMap: ["Red", "Green", "Blue", "White", "Intensity"] },
      { name: "HSI", channels: 3, channelMap: ["Hue", "Saturation", "Intensity"] },
    ],
  },

  // ── ASTERA ───────────────────────────────────────────────────────────
  {
    id: "astera-titan-tube",
    manufacturer: "Astera",
    model: "Titan Tube",
    category: "LED Strip",
    wattage: 48,
    description: "Battery-powered RGBMA tube. 16 pixel zones. Wireless DMX.",
    modes: [
      { name: "16-pixel", channels: 68, channelMap: ["Master Dimmer", "Strobe", "FX", "FX Speed", ...Array.from({length: 16}, (_, i) => [`Px${i+1} R`, `Px${i+1} G`, `Px${i+1} B`, `Px${i+1} A`]).flat()] },
      { name: "Single", channels: 6, channelMap: ["Dimmer", "Red", "Green", "Blue", "Mint", "Amber"] },
      { name: "Direct", channels: 4, channelMap: ["Red", "Green", "Blue", "Amber"] },
    ],
  },
  {
    id: "astera-helios-tube",
    manufacturer: "Astera",
    model: "Helios Tube",
    category: "LED Strip",
    wattage: 24,
    description: "Compact battery-powered RGBMA tube. 8 pixel zones.",
    modes: [
      { name: "Single", channels: 6, channelMap: ["Dimmer", "Red", "Green", "Blue", "Mint", "Amber"] },
      { name: "Basic", channels: 4, channelMap: ["Red", "Green", "Blue", "Amber"] },
    ],
  },
  {
    id: "astera-hyperion",
    manufacturer: "Astera",
    model: "HydraPanel",
    category: "LED Panel",
    wattage: 60,
    description: "Battery-powered LED panel. 4 independently-controllable cells.",
    modes: [
      { name: "Full", channels: 20, channelMap: ["Master Dimmer", "Strobe", "FX", "FX Speed", "Cell1 R", "Cell1 G", "Cell1 B", "Cell1 A", "Cell2 R", "Cell2 G", "Cell2 B", "Cell2 A", "Cell3 R", "Cell3 G", "Cell3 B", "Cell3 A", "Cell4 R", "Cell4 G", "Cell4 B", "Cell4 A"] },
      { name: "Single", channels: 6, channelMap: ["Dimmer", "Red", "Green", "Blue", "Mint", "Amber"] },
    ],
  },

  // ── SGM ──────────────────────────────────────────────────────────────
  {
    id: "sgm-p6",
    manufacturer: "SGM",
    model: "P-6",
    category: "LED Wash",
    wattage: 320,
    description: "IP66 RGBW LED wash. 24 LEDs, 22° beam.",
    modes: [
      { name: "Standard", channels: 6, channelMap: ["Dimmer", "Red", "Green", "Blue", "White", "Strobe"] },
      { name: "Extended", channels: 9, channelMap: ["Dimmer", "Dimmer Fine", "Red", "Green", "Blue", "White", "Strobe", "Color Temp", "Control"] },
    ],
  },
  {
    id: "sgm-g7",
    manufacturer: "SGM",
    model: "G-7",
    category: "Wash",
    wattage: 800,
    description: "IP66 moving head wash. RGBW+Lime.",
    modes: [
      { name: "Standard", channels: 22, channelMap: ["Pan", "Pan Fine", "Tilt", "Tilt Fine", "P/T Speed", "Dimmer", "Dimmer Fine", "Shutter", "Red", "Green", "Blue", "White", "Lime", "CTO", "Zoom", "FX1", "FX1 Speed", "FX2", "FX2 Speed", "Pixel FX", "Control", "Reserved"] },
    ],
  },

  // ── ROBERT JULIAT ────────────────────────────────────────────────────
  {
    id: "rj-alice",
    manufacturer: "Robert Juliat",
    model: "Alice 600SX",
    category: "Follow Spot",
    wattage: 575,
    description: "Medium-throw followspot. Color changer built-in.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "rj-cyrano",
    manufacturer: "Robert Juliat",
    model: "Cyrano 2500W",
    category: "Follow Spot",
    wattage: 2500,
    description: "Long-throw xenon followspot for large venues.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },

  // ── ROSCO / CITY THEATRICAL ──────────────────────────────────────────
  {
    id: "rosco-braq-cube",
    manufacturer: "Rosco",
    model: "Braq Cube",
    category: "LED Wash",
    wattage: 100,
    description: "Compact RGBW LED wash. Variable beam angle.",
    modes: [
      { name: "Standard", channels: 7, channelMap: ["Dimmer", "Red", "Green", "Blue", "White", "Strobe", "Control"] },
      { name: "Basic", channels: 4, channelMap: ["Red", "Green", "Blue", "White"] },
    ],
  },
  {
    id: "ct-ssi",
    manufacturer: "City Theatrical",
    model: "SHoW DMX SHoW Baby 6",
    category: "Practical",
    wattage: 0,
    description: "Wireless DMX transceiver. Not a fixture — utility device.",
    modes: [
      { name: "N/A", channels: 0, channelMap: [] },
    ],
  },

  // ── GENERIC / CONVENTIONAL ───────────────────────────────────────────
  {
    id: "generic-par64",
    manufacturer: "Generic",
    model: "PAR 64 1000W",
    category: "PAR",
    wattage: 1000,
    description: "Standard PAR 64 can. MFL/NSP/WFL lamps.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "generic-par56",
    manufacturer: "Generic",
    model: "PAR 56 300W",
    category: "PAR",
    wattage: 300,
    description: "Smaller PAR can. Common in budget rigs.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "generic-fresnel-2kw",
    manufacturer: "Generic",
    model: "Fresnel 2000W",
    category: "Fresnel",
    wattage: 2000,
    description: "Standard tungsten Fresnel.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "generic-fresnel-1kw",
    manufacturer: "Generic",
    model: "Fresnel 1000W",
    category: "Fresnel",
    wattage: 1000,
    description: "Standard 1kW Fresnel.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "generic-scoop-1kw",
    manufacturer: "Generic",
    model: "Scoop 1000W",
    category: "Wash",
    wattage: 1000,
    description: "Large open-face wash. Soft diffuse output.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "generic-cyc-strip",
    manufacturer: "Generic",
    model: "Cyc Strip 4-cell",
    category: "Cyc Light",
    wattage: 1000,
    description: "4-cell cyc strip. Each cell is separately dimmable.",
    modes: [
      { name: "4ch", channels: 4, channelMap: ["Cell 1", "Cell 2", "Cell 3", "Cell 4"] },
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "generic-dimmer",
    manufacturer: "Generic",
    model: "Dimmer Channel",
    category: "Practical",
    wattage: 0,
    description: "Single dimmer channel. Use for practicals, house lights, etc.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "generic-scroller",
    manufacturer: "Generic",
    model: "Color Scroller",
    category: "Scroller",
    wattage: 0,
    description: "Gel scroller. Frame position control via DMX.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Frame Position"] },
    ],
  },
  {
    id: "generic-hazer",
    manufacturer: "Generic",
    model: "DMX Hazer",
    category: "Atmospheric",
    wattage: 0,
    description: "DMX-controlled haze machine.",
    modes: [
      { name: "Standard", channels: 2, channelMap: ["Haze Output", "Fan Speed"] },
      { name: "1ch", channels: 1, channelMap: ["Haze Output"] },
    ],
  },
  {
    id: "generic-fogger",
    manufacturer: "Generic",
    model: "DMX Fog Machine",
    category: "Atmospheric",
    wattage: 0,
    description: "DMX fog machine.",
    modes: [
      { name: "Standard", channels: 2, channelMap: ["Fog Output", "Fan Speed"] },
    ],
  },
  {
    id: "generic-strobe",
    manufacturer: "Generic",
    model: "DMX Strobe 1500W",
    category: "Strobe",
    wattage: 1500,
    description: "Standard xenon DMX strobe.",
    modes: [
      { name: "Standard", channels: 2, channelMap: ["Intensity", "Rate"] },
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "generic-blinder-2",
    manufacturer: "Generic",
    model: "Blinder 2-Lite",
    category: "Blinder",
    wattage: 1300,
    description: "2-lamp DWE audience blinder.",
    modes: [
      { name: "2ch", channels: 2, channelMap: ["Lamp 1", "Lamp 2"] },
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },
  {
    id: "generic-blinder-8",
    manufacturer: "Generic",
    model: "Blinder 8-Lite",
    category: "Blinder",
    wattage: 5200,
    description: "8-lamp DWE audience blinder.",
    modes: [
      { name: "8ch", channels: 8, channelMap: ["Lamp 1", "Lamp 2", "Lamp 3", "Lamp 4", "Lamp 5", "Lamp 6", "Lamp 7", "Lamp 8"] },
      { name: "1ch", channels: 1, channelMap: ["Intensity"] },
    ],
  },

  // ── PHILIPS ──────────────────────────────────────────────────────────
  {
    id: "philips-colorkinetics-colorblast-12",
    manufacturer: "Philips",
    model: "ColorKinetics ColorBlast 12",
    category: "LED Wash",
    wattage: 48,
    description: "Architectural LED wash. RGB. IP66.",
    modes: [
      { name: "Standard", channels: 4, channelMap: ["Red", "Green", "Blue", "Intensity"] },
      { name: "Basic", channels: 3, channelMap: ["Red", "Green", "Blue"] },
    ],
  },

  // ── TMB ──────────────────────────────────────────────────────────────
  {
    id: "tmb-solaris-flare",
    manufacturer: "TMB",
    model: "Solaris Flare",
    category: "Blinder",
    wattage: 500,
    description: "High-power LED blinder/strobe. RGBW.",
    modes: [
      { name: "Standard", channels: 8, channelMap: ["Dimmer", "Red", "Green", "Blue", "White", "Strobe", "FX", "FX Speed"] },
      { name: "Basic", channels: 5, channelMap: ["Dimmer", "Red", "Green", "Blue", "White"] },
    ],
  },

  // ── WYBRON ───────────────────────────────────────────────────────────
  {
    id: "wybron-coloram-ii",
    manufacturer: "Wybron",
    model: "Coloram II",
    category: "Scroller",
    wattage: 0,
    description: "High-speed gel scroller. 32 frames.",
    modes: [
      { name: "1ch", channels: 1, channelMap: ["Frame Position"] },
    ],
  },
];
