"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="p-2.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 border border-border/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center shadow-sm"
      aria-label="Toggle theme mode"
      id="theme-toggler-btn"
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 text-primary transition-all duration-300" />
      ) : (
        <Sun className="w-5 h-5 text-primary transition-all duration-300" />
      )}
    </button>
  );
}
