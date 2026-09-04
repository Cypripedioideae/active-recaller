import React from "react";
import {
  FolderOpen,
  ArrowLeft,
  ChevronRight,
  ClipboardList
} from "lucide-react";

interface TopicSelectorProps {
  category: string;
  topics: string[];
  setsCountByTopic: Record<string, number>;
  onSelectTopic: (topic: string) => void;
  selectedTopic: string | null;
  onBack: () => void;
}

// Helper to assign different gradients based on categories
const getTopicGradient = (index: number) => {
  const gradients = [
    "from-indigo-500/20 to-cyan-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    "from-pink-500/20 to-rose-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30",
    "from-teal-500/20 to-emerald-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30",
    "from-orange-500/20 to-amber-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30",
    "from-blue-500/20 to-sky-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  ];
  return gradients[index % gradients.length];
};

export const TopicSelector: React.FC<TopicSelectorProps> = ({
  category,
  topics,
  setsCountByTopic,
  onSelectTopic,
  selectedTopic,
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
            aria-label="Back to fields"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {category}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select a topic to view the available question sets.
            </p>
          </div>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <ClipboardList className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No topics found</h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            Check back later for newly added topics in this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {topics.map((topic, idx) => {
            const isSelected = selectedTopic === topic;
            const count = setsCountByTopic[topic] || 0;
            const style = getTopicGradient(idx);

            return (
              <button
                key={topic}
                onClick={() => onSelectTopic(topic)}
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
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {count} {count === 1 ? "Set" : "Sets"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-200">
                      {topic}
                    </h3>
                  </div>

                  <div className="pt-2 flex items-center text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:translate-x-1 transition-transform duration-200">
                    View sets <ChevronRight className="w-4 h-4 ml-0.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
