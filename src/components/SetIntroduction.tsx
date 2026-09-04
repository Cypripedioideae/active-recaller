import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Play,
  Info,
  HelpCircle,
  CheckSquare,
  Clock,
} from "lucide-react";

interface Question {
  id: string;
  type: string;
  prompt: string;
}

interface QuestionSet {
  id: string;
  title: string;
  category: string;
  questions: Question[];
  description?: string;
  difficulty?: string;
}

interface SetIntroductionProps {
  questionSet: QuestionSet;
  onStartQuiz: () => void;
  onBack: () => void;
}

export const SetIntroduction: React.FC<SetIntroductionProps> = ({
  questionSet,
  onStartQuiz,
  onBack,
}) => {
  const [hasSavedSession, setHasSavedSession] = useState(false);

  useEffect(() => {
    const STORAGE_KEY = 'activeRecaller_currentSession';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.setId === questionSet.id) {
          setHasSavedSession(true);
        }
      } catch (e) {
        console.error("Failed to parse saved session", e);
      }
    }
  }, [questionSet.id]);

  const totalQuestions = questionSet.questions.length;

  // Calculate question type counts
  const typeCounts = questionSet.questions.reduce(
    (acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const getFriendlyTypeName = (type: string) => {
    switch (type) {
      case "mcq":
        return "Multiple Choice";
      case "true_false":
        return "True / False";
      case "multiple_true_false":
        return "Multiple True / False";
      case "short_answer":
        return "Short Answer";
      case "long_answer":
        return "Long Answer / Essay";
      case "fill_table":
        return "Fill in the Table";
      default:
        return type;
    }
  };

  // Estimated time: ~2 minutes per MCQ/TF, 4 mins for Multiple TF/Table, 3 mins for Short/Long Answer
  const estimatedMinutes = questionSet.questions.reduce((acc, q) => {
    if (q.type === "mcq" || q.type === "true_false") return acc + 1.5;
    if (q.type === "multiple_true_false" || q.type === "fill_table")
      return acc + 3;
    return acc + 2; // short/long answers
  }, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Back Button */}
      <div className="flex">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sets
        </button>
      </div>

      {/* Main Card */}
      <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/30 dark:shadow-none">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-3xl -z-10" />

        <div className="space-y-6">
          <div className="space-y-3 text-center md:text-left">
            <span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 uppercase tracking-wider">
              {questionSet.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {questionSet.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base md:text-lg">
              {questionSet.description ||
                "Practice active recall by testing yourself on these curated questions. Try to actively retrieve the answers from memory before reviewing the solutions."}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-800/20 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Questions
                </span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {totalQuestions} Items
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-800/20 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Difficulty
                </span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {questionSet.difficulty || "Intermediate"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-800/20 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Est. Time
                </span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  ~{Math.ceil(estimatedMinutes)} mins
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-violet-500" />
              What's Included
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(typeCounts).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 text-sm"
                >
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    {getFriendlyTypeName(type)}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-md min-w-8 text-center text-xs">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={onStartQuiz}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-2xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 dark:from-violet-500 dark:to-indigo-500 dark:hover:from-violet-600 dark:hover:to-indigo-600 text-white transition-all duration-200 shadow-lg shadow-violet-500/20 dark:shadow-none hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-violet-500/20 scale-100 active:scale-[0.98]"
            >
              {hasSavedSession ? "Resume Recall Session" : "Start Recall Session"} <Play className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={onBack}
              className="w-full sm:w-auto px-8 py-4 font-bold rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 focus:outline-none"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
