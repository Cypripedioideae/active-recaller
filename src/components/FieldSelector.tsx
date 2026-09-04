import React from "react";
import {
  Heart,
  Brain,
  Activity,
  Dna,
  Stethoscope,
  BookOpen,
  ChevronRight,
} from "lucide-react";

interface FieldSelectorProps {
  fields: string[];
  setsCountByField: Record<string, number>;
  onSelectField: (field: string) => void;
  selectedField: string | null;
}

// Helper to assign a nice icon to different categories
const getFieldIcon = (field: string) => {
  const normalized = field.toLowerCase();
  if (normalized.includes("physio")) return <Heart className="w-6 h-6" />;
  if (normalized.includes("neuro") || normalized.includes("brain"))
    return <Brain className="w-6 h-6" />;
  if (normalized.includes("patho") || normalized.includes("disease"))
    return <Activity className="w-6 h-6" />;
  if (normalized.includes("bio") || normalized.includes("gene"))
    return <Dna className="w-6 h-6" />;
  if (
    normalized.includes("urol") ||
    normalized.includes("surger") ||
    normalized.includes("clinic")
  ) {
    return <Stethoscope className="w-6 h-6" />;
  }
  return <BookOpen className="w-6 h-6" />;
};

// Helper to assign different gradients based on categories
const getFieldGradient = (index: number) => {
  const gradients = [
    "from-violet-500/20 to-fuchsia-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30",
    "from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
    "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    "from-rose-500/20 to-orange-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30",
    "from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
  ];
  return gradients[index % gradients.length];
};

export const FieldSelector: React.FC<FieldSelectorProps> = ({
  fields,
  setsCountByField,
  onSelectField,
  selectedField,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center md:text-left space-y-2">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Choose a Field of Study
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg">
          Select a subject area to view the available active recall question
          sets.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {fields.map((field, idx) => {
          const isSelected = selectedField === field;
          const count = setsCountByField[field] || 0;
          const style = getFieldGradient(idx);

          return (
            <button
              key={field}
              onClick={() => onSelectField(field)}
              className={`group relative text-left p-6 rounded-2xl border-2 transition-all duration-300 bg-white dark:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-violet-500/10 ${
                isSelected
                  ? "border-violet-600 dark:border-violet-400 shadow-lg shadow-violet-500/5 -translate-y-0.5"
                  : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5"
              }`}
            >
              {/* Decorative top-right circle gradient */}
              <div
                className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-linear-to-br ${style.split(" ")[0]} ${style.split(" ")[1]} opacity-30 dark:opacity-20 group-hover:opacity-40 transition-opacity duration-300`}
              />

              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`p-3 rounded-xl bg-linear-to-br ${style.split(" ")[0]} ${style.split(" ")[1]} ${style.split(" ")[2]} border ${style.split(" ")[3]}`}
                  >
                    {getFieldIcon(field)}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {count} {count === 1 ? "Set" : "Sets"}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-200">
                    {field}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Explore active recall practice questions for {field}.
                  </p>
                </div>

                <div className="pt-2 flex items-center text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:translate-x-1 transition-transform duration-200">
                  Select field <ChevronRight className="w-4 h-4 ml-0.5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
