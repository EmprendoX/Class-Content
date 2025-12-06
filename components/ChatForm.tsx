'use client';

import { useState, FormEvent } from 'react';

interface LessonPlanForm {
  weeklyTheme: string;
  subjectArea: string;
  gradeLevel: string;
  learnerProfile?: string;
  constraints?: string;
}

interface ChatFormProps {
  onSubmit: (data: LessonPlanForm) => void;
  disabled?: boolean;
}

export default function ChatForm({ onSubmit, disabled }: ChatFormProps) {
  const [weeklyTheme, setWeeklyTheme] = useState('');
  const [subjectArea, setSubjectArea] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [learnerProfile, setLearnerProfile] = useState('');
  const [constraints, setConstraints] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      weeklyTheme: weeklyTheme.trim(),
      subjectArea: subjectArea.trim(),
      gradeLevel: gradeLevel.trim(),
      learnerProfile: learnerProfile.trim() || undefined,
      constraints: constraints.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="weeklyTheme" className="block text-sm font-medium mb-2">
          Weekly theme <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="weeklyTheme"
          value={weeklyTheme}
          onChange={(e) => setWeeklyTheme(e.target.value)}
          placeholder="e.g., Exploring Ecosystems or Forces and Motion"
          className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
          required
          disabled={disabled}
        />
      </div>

      <div>
        <label htmlFor="subjectArea" className="block text-sm font-medium mb-2">
          Subject area <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="subjectArea"
          value={subjectArea}
          onChange={(e) => setSubjectArea(e.target.value)}
          placeholder="e.g., Science, Math, Literacy"
          className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
          required
          disabled={disabled}
        />
      </div>

      <div>
        <label htmlFor="gradeLevel" className="block text-sm font-medium mb-2">
          Grade level / age band <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="gradeLevel"
          value={gradeLevel}
          onChange={(e) => setGradeLevel(e.target.value)}
          placeholder="e.g., Upper Elementary (ages 9-11)"
          className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
          required
          disabled={disabled}
        />
      </div>

      <div>
        <label htmlFor="learnerProfile" className="block text-sm font-medium mb-2">
          Learner profile <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id="learnerProfile"
          value={learnerProfile}
          onChange={(e) => setLearnerProfile(e.target.value)}
          placeholder="Learning needs, strengths, or interests to honor choice and differentiation"
          className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none bg-white"
          rows={3}
          disabled={disabled}
        />
      </div>

      <div>
        <label htmlFor="constraints" className="block text-sm font-medium mb-2">
          Constraints and materials notes <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id="constraints"
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
          placeholder="Available manipulatives, timing, classroom setup, or accessibility needs"
          className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none bg-white"
          rows={3}
          disabled={disabled}
        />
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full bg-amber-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {disabled ? 'Generating plan...' : 'Build weekly lesson plan'}
      </button>
    </form>
  );
}


