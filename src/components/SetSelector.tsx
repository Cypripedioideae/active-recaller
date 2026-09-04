import React from "react";
import { ArrowLeft, BookOpen, Clipboard, Play } from "lucide-react";

export interface RegistrySet {
  id: string;
  filename: string;
  title: string;
  category: string;
  topic?: string;
  description?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  password?: string;
}

interface SetSelectorProps {
  category: string;
  topic: string;
  sets: RegistrySet[];
  onSelectSet: (setId: string) => void;
  onBack: () => void;
}

export const SetSelector: React.FC<SetSelectorProps> = ({
  category,
  topic,
  sets,
  onSelectSet,
  onBack,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back navigation and title header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 focus:outline-none"
            aria-label="Back to topics"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400 font-semibold mb-1">
              <span>{category}</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {topic}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select a question set to practice your active recall.
            </p>
          </div>
        </div>
      </div>

      {sets.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Clipboard className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No question sets found</h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            Check back later for newly added sets in this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sets.map((set) => {
            return (
              <div
                key={set.id}
                className="group relative flex flex-col justify-between p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-lg transition-all duration-300"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-6 w-12 h-1 rounded-b bg-violet-600 dark:bg-violet-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400">
                      <BookOpen className="w-3.5 h-3.5" />
                      Question Set
                    </span>
                    {set.difficulty && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        set.difficulty === "Beginner" 
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                          : set.difficulty === "Intermediate"
                          ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                          : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
                      }`}>
                        {set.difficulty}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-200">
                    {set.title}
                  </h3>

                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                    {set.description || "Test your understanding with active recall flashcards, MCQs, and multiple T/F statements."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800/40 flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    ID: {set.id}
                  </span>
                  
                  <button
                    onClick={() => onSelectSet(set.id)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-slate-900 hover:bg-violet-600 dark:bg-slate-800 dark:hover:bg-violet-500 text-white transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  >
                    Open Set <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
