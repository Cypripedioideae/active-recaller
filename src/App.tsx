import React, { useEffect, useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { TopBar } from "./components/TopBar";
import { FieldSelector } from "./components/FieldSelector";
import { TopicSelector } from "./components/TopicSelector";
import { SetSelector } from "./components/SetSelector";
import type { RegistrySet } from "./components/SetSelector";
import { SetIntroduction } from "./components/SetIntroduction";
import { QuizView } from "./components/QuizView";
import { Loader2, AlertCircle } from "lucide-react";
import "./App.css";

interface Question {
  id: string;
  type: string;
  prompt: string;
  imageUrl?: string;
}

interface QuestionSet {
  id: string;
  title: string;
  category: string;
  topic: string;
  questions: Question[];
  description?: string;
  difficulty?: string;
}

const AppContent: React.FC = () => {
  // App States
  const [registry, setRegistry] = useState<RegistrySet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation states
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [activeQuestionSet, setActiveQuestionSet] = useState<QuestionSet | null>(null);
  const [currentView, setCurrentView] = useState<"home" | "intro" | "quiz">("home");

  // Load registry on mount
  useEffect(() => {
    const fetchRegistry = async () => {
      try {
        setLoading(true);
        const res = await fetch("/questions/registry.json");
        if (!res.ok) {
          throw new Error("Failed to load questions registry.");
        }
        const data = await res.json();
        setRegistry(data);
      } catch (err: any) {
        console.error(err);
        setError("Could not load the question registry. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRegistry();
  }, []);

  // Fetch full details of a question set when selected
  const handleSelectSet = async (setId: string) => {
    const setMeta = registry.find((s) => s.id === setId);
    if (!setMeta) return;

    if (setMeta.password) {
      const enteredPassword = prompt("This quiz set is password protected. Please enter the password:");
      if (enteredPassword !== setMeta.password) {
        alert("Incorrect password.");
        return;
      }
    }

    try {
      setLoading(true);
      const res = await fetch(`/questions/${setMeta.filename}`);
      if (!res.ok) {
        throw new Error(`Failed to load question set: ${setMeta.filename}`);
      }
      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        alert("This question set is currently empty and cannot be opened.");
        return;
      }
      setActiveQuestionSet(data);
      setCurrentView("intro");
    } catch (err: any) {
      console.error(err);
      alert("Error loading the selected question set. Please make sure the JSON file exists.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    setSelectedField(null);
    setSelectedTopic(null);
    setActiveQuestionSet(null);
    setCurrentView("home");
  };

  const handleBackToSets = () => {
    setActiveQuestionSet(null);
    setCurrentView("home");
  };

  // Helper selectors
  const uniqueFields = Array.from(new Set(registry.map((s) => s.category)));

  const setsCountByField = registry.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredSetsByField = registry.filter((s) => s.category === selectedField);
  const uniqueTopics = Array.from(new Set(filteredSetsByField.map((s) => s.topic || "General Practice")));

  const setsCountByTopic = filteredSetsByField.reduce((acc, s) => {
    const t = s.topic || "General Practice";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredSetsByTopic = filteredSetsByField.filter((s) => (s.topic || "General Practice") === selectedTopic);

  // Render main content area based on current view
  const renderMainContent = () => {
    if (loading && registry.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading questions database...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="max-w-md mx-auto p-6 text-center border border-red-100 dark:border-red-950/30 bg-red-50/50 dark:bg-red-950/10 rounded-2xl space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Something went wrong</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      );
    }

    switch (currentView) {
      case "home":
        if (!selectedField) {
          return (
            <FieldSelector
              fields={uniqueFields}
              setsCountByField={setsCountByField}
              onSelectField={setSelectedField}
              selectedField={selectedField}
            />
          );
        }
        if (!selectedTopic) {
          return (
            <TopicSelector
              category={selectedField}
              topics={uniqueTopics}
              setsCountByTopic={setsCountByTopic}
              onSelectTopic={setSelectedTopic}
              selectedTopic={selectedTopic}
              onBack={() => setSelectedField(null)}
            />
          );
        }
        return (
          <SetSelector
            category={selectedField}
            topic={selectedTopic}
            sets={filteredSetsByTopic}
            onSelectSet={handleSelectSet}
            onBack={() => setSelectedTopic(null)}
          />
        );

      case "intro":
        if (!activeQuestionSet) return null;
        return (
          <SetIntroduction
            questionSet={activeQuestionSet}
            onStartQuiz={() => setCurrentView("quiz")}
            onBack={handleBackToSets}
          />
        );

      case "quiz":
        if (!activeQuestionSet) return null;
        return (
          <QuizView
            questionSet={activeQuestionSet}
            onExit={handleGoHome}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 flex flex-col">
      <TopBar
        quizTitle={currentView === "quiz" && activeQuestionSet ? activeQuestionSet.title : null}
        onGoHome={handleGoHome}
      />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
        {renderMainContent()}
      </main>
      <footer className="py-6 border-t border-slate-200/50 dark:border-slate-900 text-center text-xs text-slate-400 dark:text-slate-600">
        ActiveRecaller © {new Date().getFullYear()} — Optimized study technique via retrieval practice.
      </footer>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
