import React from "react";
import { Sun, Moon, GraduationCap } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface TopBarProps {
  quizTitle: string | null;
  onGoHome: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ quizTitle, onGoHome }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left Side: Logo / Title */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 group text-left focus:outline-none"
        >
          <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform duration-200">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-linear-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
              ActiveRecaller
            </span>
          </div>
        </button>

        {/* Center: Question set title when quiz is active */}
        <div className="flex-1 max-w-xl mx-4 text-center">
          {quizTitle ? (
            <h2 className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100 truncate animate-fade-in">
              {quizTitle}
            </h2>
          ) : (
            // Empty placeholder as requested for the main page
            <div className="h-6"></div>
          )}
        </div>

        {/* Right Side: Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          aria-label="Toggle Theme"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5 transition-transform hover:-rotate-12 duration-200" />
          ) : (
            <Sun className="w-5 h-5 transition-transform hover:rotate-45 duration-200" />
          )}
        </button>
      </div>
    </header>
  );
};
