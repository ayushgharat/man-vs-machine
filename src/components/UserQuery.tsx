import { useState, useRef, useEffect } from "react";
import { PROMPTS } from "../constants";
import GlassContainer from "./GlassContainer";


export default function UserQuery() {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resizeTextarea = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      const newHeight = Math.min(inputRef.current.scrollHeight, 200);
      inputRef.current.style.height = `${newHeight}px`;
    }
  };

//   useEffect(() => {
//     onPromptChange(query);
//     resizeTextarea();
//   }, [query, onPromptChange]);

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputClick = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    if (!e.relatedTarget || !containerRef.current?.contains(e.relatedTarget as Node)) {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const clearInput = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div
      ref={containerRef}
      className="w-[420px] relative"
      style={
        {
          "--input-bg": "rgba(0, 0, 0, 0.2)",
          "--input-border": "rgba(255, 255, 255, 0.1)",
        } as React.CSSProperties
      }
    >

      {/* Input Container */}
      <GlassContainer className="rounded-2xl shadow-2xl w-full">
        <div className="text-white w-full">
          <div className="search-container relative p-5 flex items-center transition-all duration-400">
            <div className="relative w-full">
              <textarea
                ref={inputRef}
                value={query}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onClick={handleInputClick}
                className="search-input w-full py-3 pl-4 pr-8 rounded-xl text-white text-base transition-all duration-400 border resize-none focus:outline-none focus:-translate-y-0.5 focus:shadow-lg"
                style={{
                  background: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "#ffffff",
                  minHeight: "48px",
                  maxHeight: "200px",
                  height: "auto",
                  overflowY: "hidden",
                }}
                placeholder="Describe what you want to see"
                rows={1}
              />
              {query && (
                <button
                  type="button"
                  onClick={clearInput}
                  className="search-clear absolute right-3 top-2 text-white opacity-70 hover:opacity-100 hover:bg-white/10 rounded-full p-1 transition-all duration-300"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </GlassContainer>
    </div>
  );
}
