import { useState, useMemo, useEffect } from "react";
import { FIXTURES, MANUFACTURERS, FIXTURE_CATEGORIES, type Fixture, type FixtureMode } from "@/data/fixtures";
import { validatePatchAddress, getNextAvailableDMXAddress, getAddressStatus } from "@/lib/patchingUtils";
import { loadEOSFixtures, searchEOSFixtures, type EOSFixture } from "@/lib/eosFixtureParser";
import {
  createTransaction,
  buildUnpatchCommands,
  saveTransaction,
  loadTransactions,
  removeTransaction,
  updateTransactionStatus,
  type PatchTransaction,
} from "@/lib/patchingTransactions";
import PatchPresets, { type PatchPreset, savePresets, loadPresets } from "@/components/PatchPresets";

// ── Styles (matching the app's aesthetic) ────────────────────────────────────

const panelStyle = {
  background: "rgba(255,255,255,0.015)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "16px",
  overflow: "hidden" as const,
};

const headerBarStyle = {
  padding: "14px 18px",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
  display: "flex" as const,
  alignItems: "center" as const,
  gap: "10px",
  background: "rgba(255,107,43,0.03)",
};

const labelStyle = {
  fontFamily: "'Space Mono', monospace",
  fontSize: "10px",
  color: "#666",
  letterSpacing: "0.12em",
};

const monoSmall = {
  fontFamily: "'Space Mono', monospace",
  fontSize: "11px",
};

const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "6px",
  padding: "7px 12px",
  color: "#ddd",
  fontSize: "12px",
  fontFamily: "'Space Mono', monospace",
  outline: "none",
};

// ── Patch Row ────────────────────────────────────────────────────────────────

interface PatchEntry {
  id: string;
  fixture: Fixture;
  mode: FixtureMode;
  startChannel: number;
  universe: number;
  dmxAddress: number;
  quantity: number;
  label: string;
}

// ── Console Patch Entry (from import) ────────────────────────────────────────
interface ConsolePatchEntry {
  channel: number;
  universe: number;
  address: number;
  fixture?: string;
  label?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

interface FixtureLibraryProps {
  onPatch: (path: string, value?: string | number | null) => void;
  onRequestPatch?: () => void;
  consolePatch?: ConsolePatchEntry[];
  wsConnected?: boolean;
}

export default function FixtureLibrary({ onPatch, onRequestPatch, consolePatch = [], wsConnected = false }: FixtureLibraryProps) {
  // Search / filter
  const [search, setSearch] = useState("");
  const [filterManufacturer, setFilterManufacturer] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");

  // EOS Library tab
  const [libraryMode, setLibraryMode] = useState<"curated" | "eos">("curated");
  const [eosFixtures, setEosFixtures] = useState<EOSFixture[]>([]);
  const [eosLoading, setEosLoading] = useState(false);
  const [eosSearch, setEosSearch] = useState("");
  const [selectedEos, setSelectedEos] = useState<EOSFixture | null>(null);

  // Load EOS fixtures when switching to EOS tab
  useEffect(() => {
    if (libraryMode === "eos" && eosFixtures.length === 0 && !eosLoading) {
      setEosLoading(true);
      loadEOSFixtures().then((fixtures) => {
        setEosFixtures(fixtures);
        setEosLoading(false);
      });
    }
  }, [libraryMode]);

  const filteredEos = useMemo(() => {
    if (eosFixtures.length === 0) return [];
    return searchEOSFixtures(eosFixtures, eosSearch, 100);
  }, [eosFixtures, eosSearch]);

  // Selected fixture
  const [selected, setSelected] = useState<Fixture | null>(null);
  const [selectedMode, setSelectedMode] = useState<FixtureMode | null>(null);
  const [autoModeSelected, setAutoModeSelected] = useState(false);

  // Patch config
  const [startChannel, setStartChannel] = useState("1");
  const [universe, setUniverse] = useState("1");
  const [dmxAddress, setDmxAddress] = useState("1");
  const [quantity, setQuantity] = useState("1");
  const [fixtureLabel, setFixtureLabel] = useState("");

  // Patch list
  const [patchList, setPatchList] = useState<PatchEntry[]>([]);

  // Collision warnings
  const [collisionWarnings, setCollisionWarnings] = useState<Array<{ type: string; message: string }>>([]);
  const [showCollisionDialog, setShowCollisionDialog] = useState(false);

  // Transaction history (undo)
  const [transactions, setTransactions] = useState<PatchTransaction[]>([]);

  // Load transactions on mount
  useEffect(() => {
    setTransactions(loadTransactions());
  }, []);

  // Filter fixtures
  const filtered = useMemo(() => {
    return FIXTURES.filter((f) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        f.model.toLowerCase().includes(q) ||
        f.manufacturer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q);
      const matchMfr = filterManufacturer === "All" || f.manufacturer === filterManufacturer;
      const matchCat = filterCategory === "All" || f.category === filterCategory;
      return matchSearch && matchMfr && matchCat;
    });
  }, [search, filterManufacturer, filterCategory]);

  // Unique manufacturers/categories from actual data
  const usedManufacturers = useMemo(
    () => ["All", ...Array.from(new Set(FIXTURES.map((f) => f.manufacturer))).sort()],
    [],
  );
  const usedCategories = useMemo(
    () => ["All", ...Array.from(new Set(FIXTURES.map((f) => f.category))).sort()],
    [],
  );

  // Step 1: Auto-detect single mode
  const selectFixture = (f: Fixture) => {
    setSelected(f);
    setSelectedEos(null);
    setFixtureLabel(f.model);
    if (f.modes.length === 1) {
      setSelectedMode(f.modes[0]);
      setAutoModeSelected(true);
    } else {
      setSelectedMode(f.modes[0]);
      setAutoModeSelected(false);
    }
  };

  // Select an EOS library fixture
  const selectEosFixture = (ef: EOSFixture) => {
    setSelectedEos(ef);
    // Create a synthetic Fixture from the EOS entry
    const syntheticFixture: Fixture = {
      id: `eos-${ef.t}`,
      manufacturer: ef.m,
      model: ef.n || ef.t.replace(/_/g, " "),
      category: "Wash" as any,
      description: `EOS Type: ${ef.t} — ${ef.ch} DMX channel(s)`,
      modes: [{ name: ef.t, channels: ef.ch, channelMap: Array.from({ length: ef.ch }, (_, i) => `Ch ${i + 1}`) }],
    };
    setSelected(syntheticFixture);
    setSelectedMode(syntheticFixture.modes[0]);
    setAutoModeSelected(true);
    setFixtureLabel(ef.n || ef.t.replace(/_/g, " "));
  };

  // DMX address status indicator
  const addressStatus = useMemo(() => {
    if (!selectedMode) return "free";
    const uni = parseInt(universe) || 1;
    const addr = parseInt(dmxAddress) || 1;
    const qty = Math.max(1, parseInt(quantity) || 1);
    const totalChannels = qty * selectedMode.channels;
    
    const patchEntries = patchList.map((p) => ({
      id: p.id,
      startChannel: p.startChannel,
      universe: p.universe,
      dmxAddress: p.dmxAddress,
      channelCount: p.mode.channels,
      label: p.label,
      fixture: p.fixture.model,
    }));

    return getAddressStatus(uni, addr, totalChannels, patchEntries, consolePatch);
  }, [selectedMode, universe, dmxAddress, quantity, patchList, consolePatch]);

  const addressStatusColor = addressStatus === "free" ? "#22c55e" : addressStatus === "warning" ? "#eab308" : "#ef4444";

  // Validate before patching
  const validateAndPatch = () => {
    if (!selected || !selectedMode) return;
    const qty = Math.max(1, parseInt(quantity) || 1);
    const startCh = parseInt(startChannel) || 1;
    const uni = parseInt(universe) || 1;
    const dmx = parseInt(dmxAddress) || 1;

    const patchEntries = patchList.map((p) => ({
      id: p.id,
      startChannel: p.startChannel,
      universe: p.universe,
      dmxAddress: p.dmxAddress,
      channelCount: p.mode.channels,
      label: p.label,
      fixture: p.fixture.model,
    }));

    const warnings = validatePatchAddress(startCh, uni, dmx, qty, selectedMode.channels, patchEntries, consolePatch);

    if (warnings.length > 0) {
      setCollisionWarnings(warnings);
      setShowCollisionDialog(true);
    } else {
      executePatch();
    }
  };

  // Execute the actual patch
  const executePatch = () => {
    setShowCollisionDialog(false);
    setCollisionWarnings([]);
    if (!selected || !selectedMode) return;
    const qty = Math.max(1, parseInt(quantity) || 1);
    const startCh = parseInt(startChannel) || 1;
    const uni = parseInt(universe) || 1;
    const dmx = parseInt(dmxAddress) || 1;
    const chPerFixture = selectedMode.channels;

    const newEntries: PatchEntry[] = [];
    const txPatches: Array<{ channel: number; universe: number; dmxAddress: number; fixture?: string; label?: string }> = [];

    // Create transaction
    const tx = createTransaction([]);

    // Enter Patch mode first
    onPatch("/eos/key/patch");

    setTimeout(() => {
      const eosTypeString = selectedEos?.t || null;
      let cmdIndex = 0;

      for (let i = 0; i < qty; i++) {
        const ch = startCh + i;
        const addr = dmx + i * chPerFixture;
        const entryLabel = qty > 1 ? `${fixtureLabel} ${i + 1}` : fixtureLabel;
        const entry: PatchEntry = {
          id: `${Date.now()}-${i}`,
          fixture: selected,
          mode: selectedMode,
          startChannel: ch,
          universe: uni,
          dmxAddress: addr,
          quantity: 1,
          label: entryLabel,
        };
        newEntries.push(entry);
        txPatches.push({ channel: ch, universe: uni, dmxAddress: addr, fixture: selected.model, label: entryLabel });

        // Address command
        const addrDelay = cmdIndex * 200;
        setTimeout(() => {
          onPatch("/eos/newcmd", `Chan ${ch} Address ${uni}/${addr} Enter`);
        }, addrDelay);
        cmdIndex++;

        // Type command (separate, using exact EOS type string)
        if (eosTypeString) {
          const typeDelay = cmdIndex * 200;
          setTimeout(() => {
            onPatch("/eos/newcmd", `Chan ${ch} Type ${eosTypeString} Enter`);
          }, typeDelay);
          cmdIndex++;
        }
      }

      setPatchList((prev) => [...prev, ...newEntries]);

      // Save transaction
      tx.patches = txPatches;
      tx.status = "completed";
      const cmds = txPatches.map((p) => ({ path: "/eos/newcmd", value: `Chan ${p.channel} Address ${p.universe}/${p.dmxAddress} Enter` }));
      if (eosTypeString) {
        txPatches.forEach((p) => {
          cmds.push({ path: "/eos/newcmd", value: `Chan ${p.channel} Type ${eosTypeString} Enter` });
        });
      }
      tx.commands = cmds;
      saveTransaction(tx);
      setTransactions(loadTransactions());

      // Return to Live mode
      setTimeout(() => {
        onPatch("/eos/key/live");
      }, cmdIndex * 200 + 500);
    }, 400);
  };

  // Undo a transaction
  const undoTransaction = (tx: PatchTransaction) => {
    const commands = buildUnpatchCommands(tx);
    
    // Execute undo commands with stagger
    commands.forEach((cmd, i) => {
      setTimeout(() => {
        onPatch(cmd.path, cmd.value);
      }, i * 400);
    });

    // Remove those channels from patch list
    const channelsToRemove = new Set(tx.patches.map((p) => p.channel));
    setPatchList((prev) => prev.filter((p) => !channelsToRemove.has(p.startChannel)));

    // Remove transaction
    removeTransaction(tx.id);
    setTransactions(loadTransactions());
  };

  const removePatch = (id: string) => {
    const entry = patchList.find((p) => p.id === id);
    if (entry) {
      onPatch("/eos/key/patch");
      setTimeout(() => {
        onPatch("/eos/newcmd", `Chan ${entry.startChannel} Address 0 Enter`);
        setTimeout(() => onPatch("/eos/key/live"), 500);
      }, 400);
    }
    setPatchList((prev) => prev.filter((p) => p.id !== id));
  };

  // Calculate next free address
  const nextFreeAddress = useMemo(() => {
    if (!selectedMode) {
      if (patchList.length === 0) return 1;
      let max = 0;
      patchList.forEach((p) => {
        const end = p.dmxAddress + p.mode.channels;
        if (end > max) max = end;
      });
      return max;
    }
    const uni = parseInt(universe) || 1;
    const patchEntries = patchList.map((p) => ({
      id: p.id,
      startChannel: p.startChannel,
      universe: p.universe,
      dmxAddress: p.dmxAddress,
      channelCount: p.mode.channels,
      label: p.label,
      fixture: p.fixture.model,
    }));
    const addr = getNextAvailableDMXAddress(uni, patchEntries, consolePatch, selectedMode.channels * (parseInt(quantity) || 1));
    return addr > 0 ? addr : 1;
  }, [patchList, selectedMode, universe, quantity, consolePatch]);

  const nextFreeChannel = useMemo(() => {
    if (patchList.length === 0) return 1;
    return Math.max(...patchList.map((p) => p.startChannel)) + 1;
  }, [patchList]);

  // Helper to build patch entries from console data
  const buildImportedPatch = (data: ConsolePatchEntry[]): PatchEntry[] => {
    const genericFixture: Fixture = {
      id: "imported",
      manufacturer: "Console",
      model: "Imported",
      category: "Wash" as const,
      description: "Imported from console patch",
      modes: [{ name: "Imported", channels: 1, channelMap: ["Intensity"] }],
    };
    return data.map((p, i) => ({
      id: `import-${Date.now()}-${i}`,
      fixture: { ...genericFixture, model: p.fixture || "Unknown" },
      mode: { name: "Imported", channels: 1, channelMap: ["—"] },
      startChannel: p.channel,
      universe: p.universe || 1,
      dmxAddress: p.address || 1,
      quantity: 1,
      label: p.label || `Ch ${p.channel}`,
    }));
  };

  const [importRequested, setImportRequested] = useState(false);

  const doImport = () => {
    if (consolePatch.length > 0) {
      setPatchList(buildImportedPatch(consolePatch));
      setImportRequested(false);
    } else {
      setImportRequested(true);
      setPatchList([]);
    }
    if (onRequestPatch) onRequestPatch();
  };

  useEffect(() => {
    if (!importRequested || consolePatch.length === 0) return;
    setImportRequested(false);
    setPatchList(buildImportedPatch(consolePatch));
  }, [importRequested, consolePatch]);

  // Save as Preset
  const handleSavePreset = () => {
    if (!selected || !selectedMode) return;
    const name = prompt("Enter preset name:");
    if (!name?.trim()) return;

    const preset: PatchPreset = {
      id: `preset-${Date.now()}`,
      name: name.trim(),
      fixtureName: `${selected.manufacturer} ${selected.model}`,
      fixtureId: selected.id,
      modeName: selectedMode.name,
      modeChannels: selectedMode.channels,
      quantity: parseInt(quantity) || 1,
      startChannel: parseInt(startChannel) || 1,
      universe: parseInt(universe) || 1,
      startDmxAddress: parseInt(dmxAddress) || 1,
      label: fixtureLabel,
    };

    const existing = loadPresets();
    existing.push(preset);
    savePresets(existing);
  };

  // Apply preset
  const applyPreset = (preset: PatchPreset) => {
    // Find matching fixture
    const fixture = FIXTURES.find((f) => f.id === preset.fixtureId);
    if (fixture) {
      setSelected(fixture);
      const mode = fixture.modes.find((m) => m.name === preset.modeName) || fixture.modes[0];
      setSelectedMode(mode);
      setAutoModeSelected(fixture.modes.length === 1);
    }
    setStartChannel(String(preset.startChannel));
    setQuantity(String(preset.quantity));
    setUniverse(String(preset.universe));
    setDmxAddress(String(preset.startDmxAddress));
    setFixtureLabel(preset.label);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ── Patch Presets ── */}
      <PatchPresets onApply={applyPreset} />

      {/* ── Import Patch Button ── */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={doImport}
          disabled={!wsConnected}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: "8px",
            border: "1px solid rgba(139,92,246,0.3)",
            background: wsConnected ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)",
            color: wsConnected ? "#a78bfa" : "#444",
            fontFamily: "'Space Mono', monospace",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.08em",
            cursor: wsConnected ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}
        >
          📋 IMPORT PATCH FROM CONSOLE
        </button>
        {patchList.length > 0 && (
          <button
            onClick={() => setPatchList([])}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "0.08em",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            CLEAR
          </button>
        )}
      </div>
      {/* ── Search & Filter Bar ── */}
      <div
        style={{
          ...panelStyle,
          borderRadius: "12px",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF6B2B", flexShrink: 0 }} />
        <span style={{ ...labelStyle, letterSpacing: "0.1em" }}>FIXTURES</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search fixtures..."
          style={{ ...inputStyle, flex: 1, minWidth: "160px" }}
          onFocus={(e) => (e.target.style.borderColor = "#FF6B2B88")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
        <select
          value={filterManufacturer}
          onChange={(e) => setFilterManufacturer(e.target.value)}
          style={{ ...inputStyle, width: "150px", cursor: "pointer" }}
        >
          {usedManufacturers.map((m) => (
            <option key={m} value={m} style={{ background: "#111", color: "#ddd" }}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ ...inputStyle, width: "140px", cursor: "pointer" }}
        >
          {usedCategories.map((c) => (
            <option key={c} value={c} style={{ background: "#111", color: "#ddd" }}>
              {c}
            </option>
          ))}
        </select>
        <span style={{ ...monoSmall, color: "#444", fontSize: "10px" }}>
          {filtered.length} fixture{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "16px" }}>
        {/* ── Fixture List ── */}
        <div style={panelStyle}>
          <div style={headerBarStyle}>
            {/* Toggle between curated and EOS library */}
            <div style={{ display: "flex", gap: "0", borderRadius: "6px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
              <button
                onClick={() => setLibraryMode("curated")}
                style={{
                  padding: "5px 12px",
                  border: "none",
                  background: libraryMode === "curated" ? "rgba(255,107,43,0.2)" : "rgba(255,255,255,0.03)",
                  color: libraryMode === "curated" ? "#FF6B2B" : "#666",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "9px",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                CURATED
              </button>
              <button
                onClick={() => setLibraryMode("eos")}
                style={{
                  padding: "5px 12px",
                  border: "none",
                  borderLeft: "1px solid rgba(255,255,255,0.1)",
                  background: libraryMode === "eos" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.03)",
                  color: libraryMode === "eos" ? "#a78bfa" : "#666",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "9px",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                EOS LIBRARY
              </button>
            </div>
            <span style={{ ...monoSmall, color: "#444", fontSize: "10px", marginLeft: "auto" }}>
              {libraryMode === "curated" ? `${FIXTURES.length} total` : eosLoading ? "Loading..." : `${eosFixtures.length} fixtures`}
            </span>
          </div>

          {libraryMode === "eos" ? (
            /* ── EOS Official Library ── */
            <div>
              <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <input
                  value={eosSearch}
                  onChange={(e) => setEosSearch(e.target.value)}
                  placeholder="Search EOS fixtures (e.g. Source Four, MAC Aura)..."
                  style={{ ...inputStyle, width: "100%" }}
                  onFocus={(e) => (e.target.style.borderColor = "#a78bfa88")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
              {eosLoading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#555", fontFamily: "'Space Mono', monospace", fontSize: "11px" }}>
                  ⏳ Loading official EOS fixture library...
                </div>
              ) : (
                <div style={{ maxHeight: "500px", overflowY: "auto", padding: "8px" }}>
                  {filteredEos.length === 0 && (
                    <div style={{ padding: "40px", textAlign: "center", color: "#333", fontFamily: "'Space Mono', monospace", fontSize: "12px" }}>
                      {eosSearch ? "No fixtures match your search." : "Type to search the EOS fixture library."}
                    </div>
                  )}
                  {filteredEos.map((ef, idx) => (
                    <div
                      key={`${ef.t}-${idx}`}
                      onClick={() => selectEosFixture(ef)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        background: selectedEos?.t === ef.t ? "rgba(139,92,246,0.12)" : "transparent",
                        border: `1px solid ${selectedEos?.t === ef.t ? "rgba(139,92,246,0.4)" : "transparent"}`,
                        marginBottom: "2px",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedEos?.t !== ef.t) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      }}
                      onMouseLeave={(e) => {
                        if (selectedEos?.t !== ef.t) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "rgba(139,92,246,0.1)",
                          border: "1px solid rgba(139,92,246,0.2)",
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "8px",
                          color: "#a78bfa",
                          whiteSpace: "nowrap",
                          minWidth: "35px",
                          textAlign: "center",
                        }}
                      >
                        {ef.ch}ch
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                          <span style={{ ...monoSmall, fontWeight: "700", color: selectedEos?.t === ef.t ? "#a78bfa" : "#ccc" }}>
                            {ef.n || ef.t.replace(/_/g, " ")}
                          </span>
                          <span style={{ fontSize: "10px", color: "#555", fontFamily: "'DM Sans', sans-serif" }}>
                            {ef.m}
                          </span>
                        </div>
                        <div style={{ fontSize: "9px", color: "#444", fontFamily: "'Space Mono', monospace", marginTop: "1px" }}>
                          Type: {ef.t}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredEos.length >= 100 && (
                    <div style={{ padding: "8px", textAlign: "center", color: "#555", fontFamily: "'Space Mono', monospace", fontSize: "10px" }}>
                      Showing first 100 results. Refine your search for more.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ── Curated Fixture Library (original) ── */
            <>

          <div style={{ maxHeight: "500px", overflowY: "auto", padding: "8px" }}>
            {filtered.length === 0 && (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#333",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                }}
              >
                No fixtures match your search.
              </div>
            )}
            {filtered.map((f) => (
              <div
                key={f.id}
                onClick={() => selectFixture(f)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background:
                    selected?.id === f.id ? "rgba(255,107,43,0.12)" : "transparent",
                  border: `1px solid ${selected?.id === f.id ? "rgba(255,107,43,0.4)" : "transparent"}`,
                  marginBottom: "2px",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (selected?.id !== f.id) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  if (selected?.id !== f.id) e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Category badge */}
                <div
                  style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "rgba(255,107,43,0.1)",
                    border: "1px solid rgba(255,107,43,0.2)",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "8px",
                    color: "#FF6B2B",
                    whiteSpace: "nowrap",
                    minWidth: "60px",
                    textAlign: "center",
                  }}
                >
                  {f.category.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span style={{ ...monoSmall, fontWeight: "700", color: selected?.id === f.id ? "#FF6B2B" : "#ccc" }}>
                      {f.model}
                    </span>
                    <span style={{ fontSize: "10px", color: "#555", fontFamily: "'DM Sans', sans-serif" }}>
                      {f.manufacturer}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#444",
                      fontFamily: "'DM Sans', sans-serif",
                      marginTop: "2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.description}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  {f.modes.map((m) => (
                    <span
                      key={m.name}
                      style={{
                        padding: "2px 6px",
                        borderRadius: "3px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "9px",
                        color: "#666",
                      }}
                    >
                      {m.channels}ch
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
            </>
          )}
        </div>

        {/* ── Right Panel: Detail + Patch ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Fixture Detail */}
          <div style={panelStyle}>
            <div style={headerBarStyle}>
              <span style={labelStyle}>
                {selected ? "FIXTURE DETAIL" : "SELECT A FIXTURE"}
              </span>
            </div>
            {!selected ? (
              <div
                style={{
                  padding: "60px 20px",
                  textAlign: "center",
                  color: "#222",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "11px",
                }}
              >
                <div style={{ fontSize: "36px", opacity: 0.3, marginBottom: "12px" }}>◈</div>
                Click a fixture to view details
              </div>
            ) : (
              <div style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
                  <span style={{ ...monoSmall, fontWeight: "700", fontSize: "14px", color: "#FF6B2B" }}>
                    {selected.model}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#888", fontFamily: "'DM Sans', sans-serif", marginBottom: "6px" }}>
                  {selected.manufacturer} — {selected.category}
                  {selected.wattage ? ` — ${selected.wattage}W` : ""}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: "1.5",
                    marginBottom: "14px",
                  }}
                >
                  {selected.description}
                </div>

                {/* Step 1: Mode selector — only show if multiple modes */}
                {selected.modes.length > 1 ? (
                  <>
                    <div style={{ ...labelStyle, marginBottom: "8px", fontSize: "9px" }}>DMX MODE</div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
                      {selected.modes.map((m) => (
                        <button
                          key={m.name}
                          onClick={() => { setSelectedMode(m); setAutoModeSelected(false); }}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "6px",
                            border: `1px solid ${selectedMode?.name === m.name ? "#FF6B2B" : "rgba(255,255,255,0.1)"}`,
                            background:
                              selectedMode?.name === m.name ? "rgba(255,107,43,0.15)" : "rgba(255,255,255,0.03)",
                            color: selectedMode?.name === m.name ? "#FF6B2B" : "#888",
                            fontFamily: "'Space Mono', monospace",
                            fontSize: "10px",
                            fontWeight: "700",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {m.name} — {m.channels}ch
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  /* Single mode — auto-selected badge */
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                    <div style={{ ...labelStyle, fontSize: "9px" }}>DMX MODE</div>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "4px",
                        background: "rgba(34,197,94,0.12)",
                        border: "1px solid rgba(34,197,94,0.3)",
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "9px",
                        color: "#22c55e",
                        fontWeight: 700,
                      }}
                    >
                      {selectedMode?.name} — {selectedMode?.channels}ch (auto)
                    </span>
                  </div>
                )}

                {/* Channel map */}
                {selectedMode && selectedMode.channels > 0 && (
                  <>
                    <div style={{ ...labelStyle, marginBottom: "6px", fontSize: "9px" }}>
                      CHANNEL MAP ({selectedMode.channels} CH)
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                        gap: "4px",
                        maxHeight: "120px",
                        overflowY: "auto",
                      }}
                    >
                      {selectedMode.channelMap.map((ch, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              fontSize: "9px",
                              color: "#FF6B2B",
                              minWidth: "18px",
                            }}
                          >
                            {i + 1}
                          </span>
                          <span
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              fontSize: "9px",
                              color: "#888",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ch}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Patch Config */}
          {selected && selectedMode && (
            <div style={panelStyle}>
              <div style={headerBarStyle}>
                <span style={labelStyle}>PATCH CONFIGURATION</span>
              </div>
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <div style={{ ...labelStyle, fontSize: "9px", marginBottom: "4px" }}>START CHANNEL</div>
                    <input
                      value={startChannel}
                      onChange={(e) => setStartChannel(e.target.value)}
                      placeholder={String(nextFreeChannel)}
                      style={{ ...inputStyle, width: "100%" }}
                    />
                  </div>
                  <div>
                    <div style={{ ...labelStyle, fontSize: "9px", marginBottom: "4px" }}>QUANTITY</div>
                    <input
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="1"
                      style={{ ...inputStyle, width: "100%" }}
                    />
                  </div>
                  <div>
                    <div style={{ ...labelStyle, fontSize: "9px", marginBottom: "4px" }}>UNIVERSE</div>
                    <input
                      value={universe}
                      onChange={(e) => setUniverse(e.target.value)}
                      placeholder="1"
                      style={{ ...inputStyle, width: "100%" }}
                    />
                  </div>
                  <div>
                    <div style={{ ...labelStyle, fontSize: "9px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                      DMX ADDRESS
                      {/* Address status indicator */}
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: addressStatusColor,
                          boxShadow: `0 0 6px ${addressStatusColor}`,
                          display: "inline-block",
                        }}
                        title={addressStatus === "free" ? "Address range is free" : addressStatus === "warning" ? "Adjacent to existing patch" : "Address range is occupied"}
                      />
                    </div>
                    <input
                      value={dmxAddress}
                      onChange={(e) => setDmxAddress(e.target.value)}
                      placeholder={String(nextFreeAddress)}
                      style={{
                        ...inputStyle,
                        width: "100%",
                        borderColor: addressStatus === "occupied" ? "rgba(239,68,68,0.5)" : addressStatus === "warning" ? "rgba(234,179,8,0.3)" : "rgba(255,255,255,0.1)",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ ...labelStyle, fontSize: "9px", marginBottom: "4px" }}>LABEL</div>
                  <input
                    value={fixtureLabel}
                    onChange={(e) => setFixtureLabel(e.target.value)}
                    placeholder="Fixture label"
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>

                {/* Collision Warning Dialog */}
                {showCollisionDialog && collisionWarnings.length > 0 && (
                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.3)",
                    }}
                  >
                    <div style={{ ...monoSmall, color: "#ef4444", fontWeight: 700, marginBottom: "8px", fontSize: "10px" }}>
                      ⚠ ADDRESS COLLISION{collisionWarnings.length > 1 ? "S" : ""} DETECTED
                    </div>
                    {collisionWarnings.slice(0, 5).map((w, i) => (
                      <div key={i} style={{ fontSize: "10px", color: "#f87171", fontFamily: "'DM Sans', sans-serif", marginBottom: "4px" }}>
                        • {w.message}
                      </div>
                    ))}
                    {collisionWarnings.length > 5 && (
                      <div style={{ fontSize: "10px", color: "#888", fontStyle: "italic" }}>
                        ...and {collisionWarnings.length - 5} more
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <button
                        onClick={executePatch}
                        style={{
                          flex: 1,
                          padding: "6px",
                          borderRadius: "6px",
                          border: "1px solid rgba(234,179,8,0.4)",
                          background: "rgba(234,179,8,0.15)",
                          color: "#eab308",
                          ...monoSmall,
                          fontSize: "9px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        PROCEED ANYWAY
                      </button>
                      <button
                        onClick={() => { setShowCollisionDialog(false); setCollisionWarnings([]); }}
                        style={{
                          flex: 1,
                          padding: "6px",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(255,255,255,0.03)",
                          color: "#888",
                          ...monoSmall,
                          fontSize: "9px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "rgba(255,107,43,0.06)",
                    border: "1px solid rgba(255,107,43,0.15)",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "10px",
                    color: "#888",
                    lineHeight: "1.6",
                  }}
                >
                  <div>
                    <span style={{ color: "#FF6B2B" }}>{selected.model}</span> — {selectedMode.name} ({selectedMode.channels}ch)
                  </div>
                  <div>
                    Channels {startChannel}–{parseInt(startChannel || "1") + (parseInt(quantity || "1") - 1)} → Universe {universe}, DMX {dmxAddress}–
                    {parseInt(dmxAddress || "1") + parseInt(quantity || "1") * selectedMode.channels - 1}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={validateAndPatch}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: "none",
                      background: "linear-gradient(135deg, #FF6B2B, #FF3D00)",
                      color: "#fff",
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      letterSpacing: "0.08em",
                      boxShadow: "0 0 20px rgba(255,107,43,0.4)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 30px rgba(255,107,43,0.6)")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 20px rgba(255,107,43,0.4)")}
                  >
                    ⚡ PATCH {parseInt(quantity || "1") > 1 ? `${quantity} FIXTURES` : "FIXTURE"}
                  </button>
                  <button
                    onClick={handleSavePreset}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(139,92,246,0.3)",
                      background: "rgba(139,92,246,0.1)",
                      color: "#a78bfa",
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "9px",
                      fontWeight: "700",
                      cursor: "pointer",
                      letterSpacing: "0.06em",
                      transition: "all 0.2s",
                    }}
                  >
                    💾 SAVE PRESET
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Undo Transaction History ── */}
      {transactions.length > 0 && (
        <div style={panelStyle}>
          <div style={headerBarStyle}>
            <span style={labelStyle}>PATCH HISTORY</span>
            <span style={{ ...monoSmall, color: "#444", fontSize: "10px", marginLeft: "auto" }}>
              {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ padding: "8px" }}>
            {transactions.map((tx) => (
              <div
                key={tx.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  marginBottom: "4px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ ...monoSmall, color: "#888", fontSize: "10px" }}>
                    {new Date(tx.timestamp).toLocaleTimeString()} — {tx.patches.length} fixture{tx.patches.length !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: "10px", color: "#555", fontFamily: "'DM Sans', sans-serif" }}>
                    Ch {tx.patches.map((p) => p.channel).join(", ")} → {tx.patches[0]?.fixture || "Unknown"}
                  </div>
                </div>
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: "3px",
                    background: tx.status === "completed" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${tx.status === "completed" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "8px",
                    color: tx.status === "completed" ? "#22c55e" : "#ef4444",
                  }}
                >
                  {tx.status.toUpperCase()}
                </span>
                <button
                  onClick={() => undoTransaction(tx)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "5px",
                    border: "1px solid rgba(234,179,8,0.3)",
                    background: "rgba(234,179,8,0.1)",
                    color: "#eab308",
                    ...monoSmall,
                    fontSize: "9px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  ↩ UNDO
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Patch Table ── */}
      {patchList.length > 0 && (
        <div style={panelStyle}>
          <div style={headerBarStyle}>
            <span style={labelStyle}>PATCH TABLE</span>
            <span style={{ ...monoSmall, color: "#444", fontSize: "10px", marginLeft: "auto" }}>
              {patchList.length} patched — {patchList.reduce((a, p) => a + p.mode.channels, 0)} DMX channels used
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {["CH", "LABEL", "FIXTURE", "MODE", "UNIV", "DMX", "SPAN", ""].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 12px",
                        textAlign: "left",
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "9px",
                        color: "#555",
                        letterSpacing: "0.08em",
                        fontWeight: "700",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patchList.map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,107,43,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "8px 12px", ...monoSmall, color: "#FF6B2B", fontWeight: "700" }}>
                      {p.startChannel}
                    </td>
                    <td style={{ padding: "8px 12px", ...monoSmall, color: "#ccc" }}>{p.label}</td>
                    <td style={{ padding: "8px 12px", fontSize: "11px", color: "#888", fontFamily: "'DM Sans', sans-serif" }}>
                      {p.fixture.manufacturer} {p.fixture.model}
                    </td>
                    <td style={{ padding: "8px 12px", ...monoSmall, color: "#666" }}>
                      {p.mode.name} ({p.mode.channels}ch)
                    </td>
                    <td style={{ padding: "8px 12px", ...monoSmall, color: "#888" }}>{p.universe}</td>
                    <td style={{ padding: "8px 12px", ...monoSmall, color: "#888" }}>{p.dmxAddress}</td>
                    <td style={{ padding: "8px 12px", ...monoSmall, color: "#555" }}>
                      {p.dmxAddress}–{p.dmxAddress + p.mode.channels - 1}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <button
                        onClick={() => removePatch(p.id)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          border: "1px solid rgba(239,68,68,0.3)",
                          background: "rgba(239,68,68,0.1)",
                          color: "#ef4444",
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "9px",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.25)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                      >
                        UNPATCH
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
