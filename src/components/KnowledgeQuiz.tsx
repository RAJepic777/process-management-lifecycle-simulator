import React, { useState } from 'react';
import { Award, CheckCircle2, XCircle, RotateCcw, ArrowRight, HelpCircle } from 'lucide-react';
import { OS_QUIZ_QUESTIONS } from '../utils/quizData';

export const KnowledgeQuiz: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const question = OS_QUIZ_QUESTIONS[currentIndex];
  const userChoice = selectedAnswers[question.id];
  const isAnswered = userChoice !== undefined;

  const handleSelect = (optionIndex: number) => {
    if (isAnswered) return; // Prevent changing after selection
    setSelectedAnswers((prev) => ({
      ...prev,
      [question.id]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < OS_QUIZ_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsSubmitted(true);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
  };

  // Calculate score
  const totalQuestions = OS_QUIZ_QUESTIONS.length;
  const score = Object.entries(selectedAnswers).reduce((acc, [qId, choice]) => {
    const q = OS_QUIZ_QUESTIONS.find((item) => item.id === Number(qId));
    return q && q.correctIndex === choice ? acc + 1 : acc;
  }, 0);
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <section id="quiz" className="max-w-7xl mx-auto px-6 py-12 scroll-mt-20">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
          Assessment & Verification
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
          Operating Systems Knowledge Evaluation
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Test your mastery of the Operating System Process Lifecycle, PCB memory architecture, scheduling theorems, and POSIX state transitions.
        </p>
      </div>

      <div className="mt-8 max-w-3xl mx-auto">
        {!isSubmitted ? (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>Question {currentIndex + 1} of {totalQuestions}</span>
              <span className="text-cyan-400">{question.topic}</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-6">
              <div
                className="bg-cyan-400 h-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            {/* Question Text */}
            <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed mb-6">
              {question.question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((opt, idx) => {
                const isSelected = userChoice === idx;
                const isCorrect = question.correctIndex === idx;

                let btnStyle = 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-200';
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-semibold';
                  } else if (isSelected) {
                    btnStyle = 'border-red-500 bg-red-950/40 text-red-300';
                  } else {
                    btnStyle = 'border-slate-800 bg-slate-950/40 text-slate-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={isAnswered}
                    className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && (
                      <span className="shrink-0 ml-3">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isSelected ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : null}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation Callout (after answering) */}
            {isAnswered && (
              <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300 mb-1">
                  <HelpCircle className="w-4 h-4" />
                  <span>OS Architectural Explanation:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{question.explanation}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-500 font-mono">
                {isAnswered ? 'Select next to continue' : 'Choose an answer'}
              </span>

              {isAnswered && (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-colors"
                >
                  <span>{currentIndex < totalQuestions - 1 ? 'Next Question' : 'View Final Score'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Final Results Card */
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/40">
              <Award className="w-8 h-8" />
            </div>

            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Evaluation Completed
            </div>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              {percentage >= 75 ? 'Distinction in Process Lifecycle' : 'Quiz Completed'}
            </h3>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
              SRM Institute of Science and Technology, Ramapuram Campus — Department of Computer Science & Engineering
            </p>

            <div className="flex justify-center items-baseline gap-2 mt-6">
              <span className="text-5xl font-black font-mono text-cyan-400 tabular-nums">{score}</span>
              <span className="text-xl text-slate-500 font-mono">/ {totalQuestions}</span>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">Accuracy: {percentage}%</div>

            <div className="mt-8 flex justify-center gap-3">
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Quiz</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
