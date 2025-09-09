import React, { useState } from 'react';
import {
  ChevronDownIcon,
  ScaleIcon,
  BriefcaseIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  LightBulbIcon,
} from './icons';

interface SidebarProps {
  onQuestionSelect: (question: string) => void;
}

type QuestionType = 'comparison' | 'career' | 'curriculum' | 'deep-dive' | 'decision';

interface Question {
  text: string;
  type: QuestionType;
}

interface QuestionCategory {
  name: string;
  questions: Question[];
}

const questionCategories: QuestionCategory[] = [
  {
    name: "Quick Questions",
    questions: [
      { text: "DMS vs DIB overview", type: "comparison" },
      { text: "What are the career prospects for DMS?", type: "career" },
      { text: "What are the career prospects for DIB?", type: "career" },
      { text: "What are the curriculum differences?", type: "curriculum" },
    ],
  },
  {
    name: "Department Deep Dive",
    questions: [
      { text: "Tell me more about DMS specializations", type: "deep-dive" },
      { text: "Tell me more about DIB specializations", type: "deep-dive" }
    ],
  },
  {
    name: "Decision Support",
    questions: [
      { text: "Which department is better for structural engineering?", type: "decision" },
      { text: "Which department is better for project management?", type: "decision" },
    ],
  },
];

const questionIcons: Record<QuestionType, React.FC<React.SVGProps<SVGSVGElement>>> = {
  comparison: ScaleIcon,
  career: BriefcaseIcon,
  curriculum: BookOpenIcon,
  'deep-dive': MagnifyingGlassIcon,
  decision: LightBulbIcon,
};

export const Sidebar: React.FC<SidebarProps> = ({ onQuestionSelect }) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    "Quick Questions": true,
  });

  const handleToggleCategory = (categoryName: string) => {
    setOpenCategories(prevState => ({
      ...prevState,
      [categoryName]: !prevState[categoryName],
    }));
  };

  return (
    <aside className="w-80 bg-gray-900 text-white p-6 flex-shrink-0 hidden md:flex md:flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">🎓 ENSTP Advisor</h2>
        <p className="text-gray-400 mt-2 text-sm">Your guide to choosing the right engineering path.</p>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto">
        {questionCategories.map((category) => (
          <div key={category.name}>
            <button
              onClick={() => handleToggleCategory(category.name)}
              className="w-full flex justify-between items-center text-left text-sm font-semibold text-gray-400 uppercase tracking-wider p-2 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <span>{category.name}</span>
              <ChevronDownIcon className={`h-5 w-5 transform transition-transform duration-200 ${openCategories[category.name] ? 'rotate-180' : ''}`} />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategories[category.name] ? 'max-h-96' : 'max-h-0'}`}
            >
                <ul className="space-y-2 mt-2">
                {category.questions.map((question) => {
                    const Icon = questionIcons[question.type];
                    return (
                    <li key={question.text}>
                        <button
                        onClick={() => onQuestionSelect(question.text)}
                        className="w-full flex items-center text-left text-gray-300 hover:bg-gray-700 hover:text-white rounded-md p-2 text-sm transition-colors duration-200 group"
                        aria-label={`Ask: ${question.text}`}
                        >
                        <Icon className="h-4 w-4 mr-3 flex-shrink-0 text-gray-500 group-hover:text-orange-400 transition-colors" />
                        <span>{question.text}</span>
                        </button>
                    </li>
                    );
                })}
                </ul>
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-6 text-xs text-gray-500 pt-4 border-t border-gray-700">
        <p>&copy; {new Date().getFullYear()} ENSTP. All rights reserved.</p>
        <p>Powered by AI.</p>
      </div>
    </aside>
  );
};