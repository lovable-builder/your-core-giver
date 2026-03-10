import { useState, useEffect, useRef, useCallback } from "react";
import { loadEOSFixtures, searchEOSFixtures, type EOSFixture } from "@/lib/eosFixtureParser";

interface PatchPanelProps {
  onPatch: (channel: number, address: number, fixtureType: string) => void;
}

export default function PatchPanel({ onPatch }: PatchPanelProps) {
  const [channel, setChannel] = useState("");
  const [address, setAddress] = useState("");
  const [fixtureSearch, setFixtureSearch] = useState("");
  const [selectedFixture, setSelectedFixture] = useState<EOSFixture | null>(null);
  const [fixtures, setFixtures] = useState<EOSFixture[]>([]);
  const [filteredFixtures, setFilteredFixtures] = useState<EOSFixture[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingFixtures, setLoadingFixtures] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load fixtures on mount
  useEffect(() => {
    loadEOSFixtures().then((f) => {
      setFixtures(f);
      setLoadingFixtures(false);
    });
  }, []);

  // Filter fixtures on search change
  useEffect(() => {
    if (!fixtureSearch.trim()) {
      setFilteredFixtures(fixtures.slice(0, 50));
    } else {
      setFilteredFixtures(searchEOSFixtures(fixtures, fixtureSearch, 50));
    }
  }, [fixtureSearch, fixtures]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelectFixture = useCallback((f: EOSFixture) => {
    setSelectedFixture(f);
    setFixtureSearch(`${f.m}: ${f.n}`);
    setShowDropdown(false);
  }, []);

  const canPatch = channel.trim() && address.trim() && selectedFixture;

  const handlePatch = () => {
    if (!canPatch) return;
    onPatch(parseInt(channel, 10), parseInt(address, 10), selectedFixture!.t);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "7px",
    padding: "9px 12px",
    color: "#1f2937",
    fontSize: "13px",
    fontFamily: "'Space Mono', monospace",
    outline: "none",
  };

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: "#FF6B2B",
        }} />
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "11px", fontWeight: "700",
          color: "#FF6B2B", letterSpacing: "0.1em",
        }}>
          PATCH CHANNEL
        </span>
      </div>

      {/* Channel + Address + Fixture in one row */}
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        {/* Channel */}
        <div style={{ width: "100px", flexShrink: 0 }}>
          <label style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "9px", color: "#9ca3af",
            letterSpacing: "0.1em", display: "block",
            marginBottom: "6px",
          }}>
            CHANNEL
          </label>
          <input
            type="number"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="1"
            min={1}
            style={inputStyle}
          />
        </div>

        {/* Fixture Type (searchable dropdown) */}
        <div style={{ flex: 1, position: "relative" }} ref={dropdownRef}>
          <label style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "9px", color: "#9ca3af",
            letterSpacing: "0.1em", display: "block",
            marginBottom: "6px",
          }}>
            FIXTURE TYPE
          </label>
          <input
            ref={inputRef}
            value={fixtureSearch}
            onChange={(e) => {
              setFixtureSearch(e.target.value);
              setSelectedFixture(null);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder={loadingFixtures ? "Loading fixtures..." : "Search fixtures..."}
            disabled={loadingFixtures}
            style={{
              ...inputStyle,
              borderColor: selectedFixture ? "#22c55e" : "#e5e7eb",
            }}
          />
          {selectedFixture && (
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              marginTop: "4px",
            }}>
              <span style={{ fontSize: "9px", color: "#22c55e", fontFamily: "'Space Mono', monospace" }}>✓</span>
              <span style={{ fontSize: "10px", color: "#6b7280", fontFamily: "'Space Mono', monospace" }}>
                {selectedFixture.t} ({selectedFixture.ch}ch)
              </span>
              <button
                onClick={() => {
                  setSelectedFixture(null);
                  setFixtureSearch("");
                  inputRef.current?.focus();
                }}
                style={{
                  background: "none", border: "none",
                  color: "#9ca3af", cursor: "pointer",
                  fontSize: "12px", padding: "0 4px",
                }}
              >
                ✕
              </button>
            </div>
          )}
          {/* Dropdown */}
          {showDropdown && !selectedFixture && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0,
              zIndex: 50, marginTop: "4px",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              maxHeight: "240px",
              overflowY: "auto",
            }}>
              {filteredFixtures.length === 0 ? (
                <div style={{
                  padding: "12px 14px",
                  fontSize: "11px", color: "#9ca3af",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  No fixtures found
                </div>
              ) : (
                filteredFixtures.map((f, i) => (
                  <button
                    key={`${f.m}-${f.t}-${i}`}
                    onClick={() => handleSelectFixture(f)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      width: "100%", textAlign: "left",
                      padding: "8px 14px",
                      border: "none",
                      borderBottom: i < filteredFixtures.length - 1 ? "1px solid #f3f4f6" : "none",
                      background: "transparent",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,107,43,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{
                      fontSize: "10px", color: "#9ca3af",
                      fontFamily: "'Space Mono', monospace",
                      flexShrink: 0, width: "80px",
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {f.m}
                    </span>
                    <span style={{
                      fontSize: "11px", color: "#1f2937",
                      fontFamily: "'DM Sans', sans-serif",
                      flex: 1,
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {f.n}
                    </span>
                    <span style={{
                      fontSize: "9px", color: "#FF6B2B",
                      fontFamily: "'Space Mono', monospace",
                      flexShrink: 0,
                    }}>
                      {f.ch}ch
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* DMX Address */}
        <div style={{ width: "100px", flexShrink: 0 }}>
          <label style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "9px", color: "#9ca3af",
            letterSpacing: "0.1em", display: "block",
            marginBottom: "6px",
          }}>
            ADDRESS
          </label>
          <input
            type="number"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="1"
            min={1}
            style={inputStyle}
          />
        </div>

        {/* Patch Button */}
        <div style={{ flexShrink: 0, alignSelf: "flex-end" }}>
          <button
            onClick={handlePatch}
            disabled={!canPatch}
            style={{
              padding: "9px 24px",
              borderRadius: "7px",
              border: "none",
              background: canPatch ? "#FF6B2B" : "#e5e7eb",
              color: canPatch ? "#fff" : "#9ca3af",
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "0.1em",
              cursor: canPatch ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              boxShadow: canPatch ? "0 2px 12px rgba(255,107,43,0.3)" : "none",
            }}
          >
            PATCH
          </button>
        </div>
      </div>

      {/* Preview */}
      {canPatch && (
        <div style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "8px 14px",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span style={{ fontSize: "9px", color: "#9ca3af", fontFamily: "'Space Mono', monospace" }}>CMD:</span>
          <span style={{ fontSize: "11px", color: "#FF6B2B", fontFamily: "'Space Mono', monospace" }}>
            Chan {channel} Address {address} Type {selectedFixture!.t} Enter
          </span>
        </div>
      )}
    </div>
  );
}
