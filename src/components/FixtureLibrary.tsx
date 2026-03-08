import { useState, useMemo } from "react";
import { FIXTURES, MANUFACTURERS, FIXTURE_CATEGORIES, type Fixture, type FixtureMode } from "@/data/fixtures";

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

// ── Component ────────────────────────────────────────────────────────────────

interface FixtureLibraryProps {
  onPatch: (path: string, vals: Record<string, string>) => void;
}

export default function FixtureLibrary({ onPatch }: FixtureLibraryProps) {
  // Search / filter
  const [search, setSearch] = useState("");
  const [filterManufacturer, setFilterManufacturer] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");

  // Selected fixture
  const [selected, setSelected] = useState<Fixture | null>(null);
  const [selectedMode, setSelectedMode] = useState<FixtureMode | null>(null);

  // Patch config
  const [startChannel, setStartChannel] = useState("1");
  const [universe, setUniverse] = useState("1");
  const [dmxAddress, setDmxAddress] = useState("1");
  const [quantity, setQuantity] = useState("1");
  const [fixtureLabel, setFixtureLabel] = useState("");

  // Patch list
  const [patchList, setPatchList] = useState<PatchEntry[]>([]);

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

  const selectFixture = (f: Fixture) => {
    setSelected(f);
    setSelectedMode(f.modes[0]);
    setFixtureLabel(f.model);
  };

  // Patch the fixture(s)
  const handlePatch = () => {
    if (!selected || !selectedMode) return;
    const qty = Math.max(1, parseInt(quantity) || 1);
    const startCh = parseInt(startChannel) || 1;
    const uni = parseInt(universe) || 1;
    const dmx = parseInt(dmxAddress) || 1;
    const chPerFixture = selectedMode.channels;

    const newEntries: PatchEntry[] = [];
    for (let i = 0; i < qty; i++) {
      const ch = startCh + i;
      const addr = dmx + i * chPerFixture;
      const entry: PatchEntry = {
        id: `${Date.now()}-${i}`,
        fixture: selected,
        mode: selectedMode,
        startChannel: ch,
        universe: uni,
        dmxAddress: addr,
        quantity: 1,
        label: qty > 1 ? `${fixtureLabel} ${i + 1}` : fixtureLabel,
      };
      newEntries.push(entry);

      // Send EOS command-line patch command via /eos/cmd ("#" acts as Enter)
      onPatch("/eos/cmd", { a: `Chan ${ch} Patch ${uni}/${addr}#` });
    }

    setPatchList((prev) => [...prev, ...newEntries]);
  };

  const removePatch = (id: string) => {
    const entry = patchList.find((p) => p.id === id);
    if (entry) {
      onPatch("/eos/cmd", { a: `Chan ${entry.startChannel} Unpatch#` });
    }
    setPatchList((prev) => prev.filter((p) => p.id !== id));
  };

  // Calculate next free address
  const nextFreeAddress = useMemo(() => {
    if (patchList.length === 0) return 1;
    let max = 0;
    patchList.forEach((p) => {
      const end = p.dmxAddress + p.mode.channels;
      if (end > max) max = end;
    });
    return max;
  }, [patchList]);

  const nextFreeChannel = useMemo(() => {
    if (patchList.length === 0) return 1;
    return Math.max(...patchList.map((p) => p.startChannel)) + 1;
  }, [patchList]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
            <span style={labelStyle}>FIXTURE LIBRARY</span>
            <span style={{ ...monoSmall, color: "#444", fontSize: "10px", marginLeft: "auto" }}>
              {FIXTURES.length} total
            </span>
          </div>
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

                {/* Mode selector */}
                <div style={{ ...labelStyle, marginBottom: "8px", fontSize: "9px" }}>DMX MODE</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
                  {selected.modes.map((m) => (
                    <button
                      key={m.name}
                      onClick={() => setSelectedMode(m)}
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
                    <div style={{ ...labelStyle, fontSize: "9px", marginBottom: "4px" }}>DMX ADDRESS</div>
                    <input
                      value={dmxAddress}
                      onChange={(e) => setDmxAddress(e.target.value)}
                      placeholder={String(nextFreeAddress)}
                      style={{ ...inputStyle, width: "100%" }}
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

                <button
                  onClick={handlePatch}
                  style={{
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
              </div>
            </div>
          )}
        </div>
      </div>

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
