"use client";
import React from "react";
import { useTheme } from "./ThemeContext";

type Theme = "light" | "dark";

interface Props {
  theme: Theme;
  toggleTheme: () => void;
}

export default function ThemeToggle() {
  const {theme, toggleTheme} = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      style={{
        padding: "0.5rem 1rem",
        borderRadius: "0.5rem",
        border: "none",
        background: theme === "dark" ? "#222" : "#eee",
        color: theme === "dark" ? "#fff" : "#111",
        cursor: "pointer",
        fontSize: "1rem",
      }}
    >
      {theme === "dark" ? "🌙" : "☀️"} 
    </button>
  ); // button shows moon for dark mode, sun for light mode
}