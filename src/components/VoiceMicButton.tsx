import { useState, useCallback, useRef } from "react";

interface VoiceMicButtonProps {
  onResult: (transcript: string) => void;
  disabled?: boolean;
}

export default function VoiceMicButton({ onResult, disabled }: VoiceMicButtonProps) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggle = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        onResult(transcript.trim());
      }
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, onResult]);

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={listening ? "Listening… click to stop" : "Speak an OSC command"}
      style={{
        width: "42px",
        height: "42px",
        borderRadius: "8px",
        border: "none",
        background: listening
          ? "linear-gradient(135deg, #00ffc8, #00cc9e)"
          : disabled
          ? "rgba(255,255,255,0.04)"
          : "rgba(0,255,200,0.1)",
        color: listening ? "#000" : disabled ? "#333" : "#00ffc8",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
        boxShadow: listening
          ? "0 0 20px rgba(0,255,200,0.6), 0 0 40px rgba(0,255,200,0.2)"
          : "none",
        animation: listening ? "pulse-glow 1.5s ease-in-out infinite" : "none",
        border: listening ? "none" : "1px solid rgba(0,255,200,0.2)",
      }}
    >
      {listening ? (
        <span style={{ display: "flex", gap: "2px", alignItems: "center" }}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                width: "3px",
                height: "14px",
                background: "#000",
                borderRadius: "2px",
                animation: `voice-wave 0.5s ${i * 0.1}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </span>
      ) : (
        <span>🎙</span>
      )}
    </button>
  );
}
