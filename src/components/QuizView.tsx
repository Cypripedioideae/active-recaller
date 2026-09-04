import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Flag,
  AlertCircle,
  RotateCcw,
  BookOpen,
  Check,
  X,
  Clock,
} from "lucide-react";
import { NotationText } from "./NotationText";
import { ConfirmModal } from "./ConfirmModal";

interface SubQuestion {
  id: string;
  prompt: string;
  answer: boolean;
}

interface Question {
  id: string;
  type: string;
  prompt: string;
  imageUrl?: string;
  options?: string[];
  answer?: any; // number for MCQ, boolean for TF, etc.
  subQuestions?: SubQuestion[];
  modelAnswer?: string;
  explanation?: string;
}

interface QuestionSet {
  id: string;
  title: string;
  category: string;
  questions: Question[];
  description?: string;
  difficulty?: string;
}

interface QuizViewProps {
  questionSet: QuestionSet;
  onExit: () => void;
}

const STORAGE_KEY = 'activeRecaller_currentSession';

const loadSession = (setId: string) => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.setId === setId) return parsed;
    } catch (e) {
      console.error("Failed to parse saved session", e);
    }
  }
  return null;
};

export const QuizView: React.FC<QuizViewProps> = ({ questionSet, onExit }) => {
  const { questions } = questionSet;

  // Lazily load the initial session state once
  const [initialSession] = useState(() => loadSession(questionSet.id));

  // States initialized from local storage
  const [currentIdx, setCurrentIdx] = useState<number>(initialSession?.currentIdx || 0);
  const [answers, setAnswers] = useState<Record<string, any>>(initialSession?.answers || {});
  const [flagged, setFlagged] = useState<Record<string, boolean>>(initialSession?.flagged || {});
  const [elapsedTime, setElapsedTime] = useState<number>(initialSession?.elapsedTime || 0);
  
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<"submit" | "retake" | null>(null);

  const activeQuestion = questions[currentIdx];

  // Save to localStorage and run timer
  useEffect(() => {
    if (isSubmitted) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    // Save session
    const stateToSave = {
      setId: questionSet.id,
      answers,
      flagged,
      currentIdx,
      elapsedTime,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));

    // Run timer
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [questionSet.id, answers, flagged, currentIdx, elapsedTime, isSubmitted]);

  // Prevent accidental navigation
  useEffect(() => {
    if (isSubmitted) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Helper to determine if a question has been answered
  const isQuestionAnswered = (q: Question) => {
    const val = answers[q.id];
    if (val === undefined || val === null) return false;

    if (q.type === "mcq") return typeof val === "number";
    if (q.type === "true_false") return typeof val === "boolean";
    if (q.type === "multiple_true_false") {
      // Check if at least one sub-question is answered
      return Object.values(val).some((v) => v === true || v === false);
    }
    if (q.type === "short_answer" || q.type === "long_answer") {
      return typeof val === "string" && val.trim().length > 0;
    }
    return false;
  };

  // Helper to determine score for a question
  const getQuestionScore = (q: Question) => {
    const val = answers[q.id];

    if (q.type === "mcq" || q.type === "true_false") {
      if (val === undefined || val === null) return { earned: 0, max: 1 };
      return { earned: val === q.answer ? 1 : 0, max: 1 };
    }

    if (q.type === "multiple_true_false") {
      if (!q.subQuestions || q.subQuestions.length === 0) return null;
      const subAnswers = val || {};
      const correctSubCount = q.subQuestions.filter(
        (subQ) => subAnswers[subQ.id] === subQ.answer
      ).length;
      return {
        earned: correctSubCount / q.subQuestions.length,
        max: 1,
      };
    }

    return null; // Not gradable (short/long answer)
  };

  // Score Calculations
  const getQuizStats = () => {
    let totalEarned = 0;
    let totalPossible = 0;
    let unansweredCount = 0;

    questions.forEach((q) => {
      const isAnswered = isQuestionAnswered(q);
      if (!isAnswered) {
        unansweredCount++;
      }

      const score = getQuestionScore(q);
      if (score !== null) {
        totalEarned += score.earned;
        totalPossible += score.max;
      }
    });

    return { totalEarned, totalPossible, unansweredCount };
  };

  const { totalEarned, totalPossible, unansweredCount } = getQuizStats();

  const formatScore = (num: number) => {
    return Number(num.toFixed(2)).toString();
  };

  const handleToggleFlag = (qId: string) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleSubmitRequest = () => {
    if (unansweredCount > 0) {
      setConfirmAction("submit");
    } else {
      executeSubmit();
    }
  };

  const executeSubmit = () => {
    setIsSubmitted(true);
    setConfirmAction(null);
  };

  const handleRetakeRequest = () => {
    setConfirmAction("retake");
  };

  const executeRetake = () => {
    setAnswers({});
    setIsSubmitted(false);
    setCurrentIdx(0);
    setElapsedTime(0);
    setConfirmAction(null);
  };

  // Explanation display conditions
  const shouldShowExplanation = (q: Question) => {
    if (!isSubmitted) return false;
    if (q.type === "long_answer") return false; // Omit for long answers
    if (!q.explanation) return false;

    const trimmed = q.explanation.trim();
    if (trimmed === "" || trimmed === "-") return false; // Omit empty or "-"

    return true;
  };

  // Render question types
  const renderMCQ = (q: Question) => {
    const options = q.options || [];
    const currentAns = answers[q.id];

    return (
      <div className="space-y-3">
        {options.map((option, idx) => {
          const isSelected = currentAns === idx;
          const isCorrectAns = idx === q.answer;

          let cardStyle =
            "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-800/40";
          let circleStyle = "border-slate-300 dark:border-slate-600";

          if (isSubmitted) {
            if (isCorrectAns) {
              cardStyle =
                "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300";
              circleStyle = "border-emerald-500 bg-emerald-500 text-white";
            } else if (isSelected) {
              cardStyle =
                "border-rose-500 bg-rose-500/10 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300";
              circleStyle = "border-rose-500 bg-rose-500 text-white";
            } else {
              cardStyle =
                "border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 opacity-50";
            }
          } else if (isSelected) {
            cardStyle =
              "border-violet-600 bg-violet-50/30 dark:bg-violet-950/20 dark:border-violet-400";
            circleStyle =
              "border-violet-600 dark:border-violet-400 bg-violet-600 dark:bg-violet-400";
          }

          return (
            <button
              key={idx}
              disabled={isSubmitted}
              onClick={() => {
                const newAns = currentAns === idx ? null : idx;
                setAnswers((prev) => ({ ...prev, [q.id]: newAns }));
              }}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${cardStyle}`}
            >
              <div
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${circleStyle}`}
              >
                {isSelected && !isSubmitted && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
                {isSubmitted && isCorrectAns && (
                  <Check className="w-3.5 h-3.5" />
                )}
                {isSubmitted && isSelected && !isCorrectAns && (
                  <X className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-sm font-medium leading-normal">
                <NotationText text={option} />
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderTrueFalse = (q: Question) => {
    const currentAns = answers[q.id];
    const choices = [
      { label: "True", value: true },
      { label: "False", value: false },
    ];

    return (
      <div className="space-y-3">
        {choices.map((choice) => {
          const isSelected = currentAns === choice.value;
          const isCorrectAns = choice.value === q.answer;

          let cardStyle =
            "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-800/40";
          let circleStyle = "border-slate-300 dark:border-slate-600";

          if (isSubmitted) {
            if (isCorrectAns) {
              cardStyle =
                "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300";
              circleStyle = "border-emerald-500 bg-emerald-500 text-white";
            } else if (isSelected) {
              cardStyle =
                "border-rose-500 bg-rose-500/10 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300";
              circleStyle = "border-rose-500 bg-rose-500 text-white";
            } else {
              cardStyle =
                "border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 opacity-50";
            }
          } else if (isSelected) {
            cardStyle =
              "border-violet-600 bg-violet-50/30 dark:bg-violet-950/20 dark:border-violet-400";
            circleStyle =
              "border-violet-600 dark:border-violet-400 bg-violet-600 dark:bg-violet-400";
          }

          return (
            <button
              key={choice.label}
              disabled={isSubmitted}
              onClick={() => {
                const newAns =
                  currentAns === choice.value ? null : choice.value;
                setAnswers((prev) => ({ ...prev, [q.id]: newAns }));
              }}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${cardStyle}`}
            >
              <div
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${circleStyle}`}
              >
                {isSelected && !isSubmitted && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
                {isSubmitted && isCorrectAns && (
                  <Check className="w-3.5 h-3.5" />
                )}
                {isSubmitted && isSelected && !isCorrectAns && (
                  <X className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-sm font-medium leading-normal">
                {choice.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderMultipleTF = (q: Question) => {
    const subQs = q.subQuestions || [];
    const currentSubAnswers = answers[q.id] || {};

    return (
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full border-collapse text-left min-w-125">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Statement
              </th>
              <th className="p-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-24">
                True
              </th>
              <th className="p-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-24">
                False
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {subQs.map((subQ) => {
              const selectedValue = currentSubAnswers[subQ.id];
              const isCorrectTrue = subQ.answer === true;
              const isCorrectFalse = subQ.answer === false;

              // True column selector styling
              let trueBtnStyle = "border-slate-300 dark:border-slate-700";
              if (isSubmitted) {
                if (isCorrectTrue) {
                  trueBtnStyle = "border-emerald-500 bg-emerald-500 text-white";
                } else if (selectedValue === true) {
                  trueBtnStyle = "border-rose-500 bg-rose-500 text-white";
                } else {
                  trueBtnStyle =
                    "border-slate-200 dark:border-slate-800 opacity-40";
                }
              } else if (selectedValue === true) {
                trueBtnStyle =
                  "border-violet-600 dark:border-violet-400 bg-violet-600 dark:bg-violet-400 text-white";
              }

              // False column selector styling
              let falseBtnStyle = "border-slate-300 dark:border-slate-700";
              if (isSubmitted) {
                if (isCorrectFalse) {
                  falseBtnStyle =
                    "border-emerald-500 bg-emerald-500 text-white";
                } else if (selectedValue === false) {
                  falseBtnStyle = "border-rose-500 bg-rose-500 text-white";
                } else {
                  falseBtnStyle =
                    "border-slate-200 dark:border-slate-800 opacity-40";
                }
              } else if (selectedValue === false) {
                falseBtnStyle =
                  "border-violet-600 dark:border-violet-400 bg-violet-600 dark:bg-violet-400 text-white";
              }

              // Row background highlight after submission
              let rowStyle = "";
              if (isSubmitted) {
                const isSubCorrect = selectedValue === subQ.answer;
                rowStyle = isSubCorrect
                  ? "bg-emerald-50/10 dark:bg-emerald-950/5"
                  : "bg-rose-50/10 dark:bg-rose-950/5";
              }

              return (
                <tr
                  key={subQ.id}
                  className={`transition-colors duration-200 ${rowStyle}`}
                >
                  <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <NotationText text={subQ.prompt} />
                  </td>
                  {/* True Button */}
                  <td className="p-4 text-center">
                    <button
                      disabled={isSubmitted}
                      onClick={() => {
                        const newSubAns = selectedValue === true ? null : true;
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: {
                            ...currentSubAnswers,
                            [subQ.id]: newSubAns,
                          },
                        }));
                      }}
                      className={`w-6 h-6 mx-auto rounded-full border-2 flex items-center justify-center transition-all duration-150 ${trueBtnStyle}`}
                    >
                      {selectedValue === true && !isSubmitted && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                      {isSubmitted && isCorrectTrue && (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      {isSubmitted &&
                        selectedValue === true &&
                        !isCorrectTrue && <X className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                  {/* False Button */}
                  <td className="p-4 text-center">
                    <button
                      disabled={isSubmitted}
                      onClick={() => {
                        const newSubAns =
                          selectedValue === false ? null : false;
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: {
                            ...currentSubAnswers,
                            [subQ.id]: newSubAns,
                          },
                        }));
                      }}
                      className={`w-6 h-6 mx-auto rounded-full border-2 flex items-center justify-center transition-all duration-150 ${falseBtnStyle}`}
                    >
                      {selectedValue === false && !isSubmitted && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                      {isSubmitted && isCorrectFalse && (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      {isSubmitted &&
                        selectedValue === false &&
                        !isCorrectFalse && <X className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderShortAnswer = (q: Question) => {
    const val = answers[q.id] || "";

    return (
      <div className="space-y-4">
        <input
          type="text"
          disabled={isSubmitted}
          value={val}
          onChange={(e) =>
            setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
          }
          placeholder="Type your answer here..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:focus:border-violet-400 disabled:opacity-75 transition-all"
        />

        {isSubmitted && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 space-y-2">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              Model Answer
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
              {q.modelAnswer ? <NotationText text={q.modelAnswer} /> : "No model answer provided."}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderLongAnswer = (q: Question) => {
    const val = answers[q.id] || "";

    return (
      <div className="space-y-4">
        <textarea
          rows={5}
          disabled={isSubmitted}
          value={val}
          onChange={(e) =>
            setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
          }
          placeholder="Draft your long answer explanation..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:focus:border-violet-400 disabled:opacity-75 transition-all resize-none"
        />

        {isSubmitted && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 space-y-2">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              Solution / Rubric Checklist
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {q.modelAnswer ? <NotationText text={q.modelAnswer} /> : "No checklist provided."}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderActiveQuestion = () => {
    switch (activeQuestion.type) {
      case "mcq":
        return renderMCQ(activeQuestion);
      case "true_false":
        return renderTrueFalse(activeQuestion);
      case "multiple_true_false":
        return renderMultipleTF(activeQuestion);
      case "short_answer":
        return renderShortAnswer(activeQuestion);
      case "long_answer":
        return renderLongAnswer(activeQuestion);
      default:
        return (
          <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-sm text-slate-400">
            Unsupported question type: {activeQuestion.type}
          </div>
        );
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "mcq":
        return "Multiple Choice";
      case "true_false":
        return "True / False";
      case "multiple_true_false":
        return "Multiple T/F";
      case "short_answer":
        return "Short Answer";
      case "long_answer":
        return "Long Answer";
      default:
        return type.toUpperCase();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* SIDEBAR NAVIGATION (lg:col-span-4) */}
      <aside className="lg:col-span-4 space-y-5">
        {/* Results Banner */}
        {isSubmitted && (
          <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-3">
            <h3 className="font-extrabold text-lg text-emerald-800 dark:text-emerald-400">
              Recall Review Mode
            </h3>
            <div className="py-2.5 px-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 inline-block">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatScore(totalEarned)} / {totalPossible}
              </span>
              <span className="block text-xxs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold mt-1">
                Auto-Graded Score
              </span>
            </div>
            <button
              onClick={handleRetakeRequest}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retake Practice Set
            </button>
          </div>
        )}

        {/* Navigation Sidebar Card */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-500" />
                Navigation
              </h3>
              {!isSubmitted && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono font-semibold">
                  <Clock className="w-3 h-3" />
                  {formatTime(elapsedTime)}
                </div>
              )}
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              {questions.length} Items
            </span>
          </div>

          {/* Question Grid list */}
          <div className="grid grid-cols-5 gap-2.5">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIdx;
              const isAnswered = isQuestionAnswered(q);
              const isFlagged = flagged[q.id];

              let btnStyle =
                "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300 hover:border-slate-200 dark:hover:border-slate-700";
              let ringStyle = "";

              if (isCurrent) {
                btnStyle =
                  "border-violet-600 dark:border-violet-400 bg-violet-500/10 text-violet-700 dark:text-violet-400 font-extrabold";
              }

              if (isSubmitted) {
                const score = getQuestionScore(q);
                if (score === null) {
                  // Non-gradable (short/long answers)
                  ringStyle =
                    "ring-2 ring-blue-400 dark:ring-blue-500 ring-offset-2 dark:ring-offset-slate-950";
                } else if (score.earned === score.max) {
                  ringStyle =
                    "ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-950";
                } else if (score.earned === 0) {
                  ringStyle =
                    "ring-2 ring-rose-500 ring-offset-2 dark:ring-offset-slate-950";
                } else {
                  // Partial credit
                  ringStyle =
                    "ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-950";
                }
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`relative h-11 rounded-xl border text-sm font-semibold transition-all duration-150 flex items-center justify-center ${btnStyle} ${ringStyle}`}
                  title={`Question ${idx + 1} (${getQuestionTypeLabel(q.type)})`}
                >
                  {/* Status Indicator Dot */}
                  {isAnswered && !isSubmitted && !isCurrent && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-violet-600 dark:bg-violet-400" />
                  )}

                  {/* Flag Icon overlay */}
                  {isFlagged && (
                    <div className="absolute -top-1 -left-1 p-0.5 rounded-full bg-amber-500 text-white transform scale-75 shadow-sm">
                      <Flag className="w-2.5 h-2.5 fill-current" />
                    </div>
                  )}

                  <span>{idx + 1}</span>
                </button>
              );
            })}
          </div>

          {/* Submit Button Area */}
          {!isSubmitted ? (
            <button
              onClick={handleSubmitRequest}
              className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white font-bold text-sm transition-colors duration-200 shadow-md shadow-violet-500/10 focus:outline-none"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={onExit}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
            >
              Exit Review
            </button>
          )}
        </div>
      </aside>

      {/* QUESTION WORKSPACE (lg:col-span-8) */}
      <main className="lg:col-span-8 space-y-6">
        <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/20 dark:shadow-none min-h-100 flex flex-col justify-between">
          <div>
            {/* Question Header Metadata */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span className="text-slate-200 dark:text-slate-800">•</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {getQuestionTypeLabel(activeQuestion.type)}
                </span>
                {isSubmitted && (activeQuestion.type === "mcq" || activeQuestion.type === "true_false" || activeQuestion.type === "multiple_true_false") && (
                  <>
                    <span className="text-slate-200 dark:text-slate-800">•</span>
                    {(() => {
                      const score = getQuestionScore(activeQuestion);
                      if (!score) return null;
                      
                      let badgeStyle = "bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-450";
                      if (score.earned === score.max) {
                        badgeStyle = "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450";
                      } else if (score.earned > 0) {
                        badgeStyle = "bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400";
                      }
                      
                      let scoreDisplay = `${score.earned}/${score.max}`;
                      if (activeQuestion.type === "multiple_true_false" && activeQuestion.subQuestions) {
                        const val = answers[activeQuestion.id] || {};
                        const correctSubCount = activeQuestion.subQuestions.filter(
                          (subQ) => val[subQ.id] === subQ.answer
                        ).length;
                        scoreDisplay = `${correctSubCount}/${activeQuestion.subQuestions.length}`;
                      }

                      return (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeStyle}`}>
                          Score: {scoreDisplay}
                        </span>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* Flag and Status Actions */}
              <div className="flex items-center gap-2">
                {/* Flag Icon */}
                <button
                  onClick={() => handleToggleFlag(activeQuestion.id)}
                  className={`p-2 rounded-lg border transition-all ${
                    flagged[activeQuestion.id]
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                      : "border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                  title={
                    flagged[activeQuestion.id]
                      ? "Unflag question"
                      : "Flag question for review"
                  }
                >
                  <Flag
                    className={`w-4 h-4 ${flagged[activeQuestion.id] ? "fill-current" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Prompt Statement */}
            <div className="space-y-6 mb-8">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                <NotationText text={activeQuestion.prompt} />
              </h2>

              {/* Question Image (if any) */}
              {activeQuestion.imageUrl && (
                <div className="my-4 flex justify-center">
                  <img
                    src={activeQuestion.imageUrl}
                    alt="Question visual"
                    className="max-w-full h-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
                    style={{ maxHeight: "400px" }}
                  />
                </div>
              )}

              {/* Answer Render Space */}
              <div className="animate-fade-in">{renderActiveQuestion()}</div>
            </div>
          </div>

          {/* Conditional Explanation / Feedback section */}
          {shouldShowExplanation(activeQuestion) && (
            <div className="mb-6 p-5 rounded-2xl bg-violet-500/5 border border-violet-500/15 animate-fade-in space-y-2">
              <h4 className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Explanation & Insight
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                <NotationText text={activeQuestion.explanation!} />
              </p>
            </div>
          )}

          {/* Nav Buttons Footer */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-4">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((prev) => prev - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all focus:outline-none"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            <button
              disabled={currentIdx === questions.length - 1}
              onClick={() => setCurrentIdx((prev) => prev + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-950 dark:bg-slate-800 hover:bg-violet-600 dark:hover:bg-violet-500 disabled:opacity-40 text-sm font-semibold text-white transition-all focus:outline-none"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      <ConfirmModal
        isOpen={confirmAction !== null}
        title={confirmAction === "submit" ? "Submit Question Set" : "Retake Question Set"}
        message={
          confirmAction === "submit"
            ? `You have ${unansweredCount} unanswered questions. Are you sure you want to submit and review your answers?`
            : "Are you sure you want to reset all answers and retake this set? All progress will be lost."
        }
        confirmText={confirmAction === "submit" ? "Submit" : "Retake Set"}
        cancelText="Cancel"
        onConfirm={confirmAction === "submit" ? executeSubmit : executeRetake}
        onCancel={() => setConfirmAction(null)}
        isDestructive={confirmAction === "retake"}
      />
    </div>
  );
};
