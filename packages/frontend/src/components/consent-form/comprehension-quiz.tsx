'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import type { QuizQuestion } from './quiz-questions';

interface QuizAnswer {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
}

interface ComprehensionQuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number, answers: QuizAnswer[]) => void;
}

export function ComprehensionQuiz({ questions, onComplete }: ComprehensionQuizProps) {
  const t = useTranslations('quiz');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [direction, setDirection] = useState(1);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedOption === currentQuestion.correctIndex;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSelect = (index: number) => {
    if (submitted) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    setSubmitted(true);

    const answer: QuizAnswer = {
      questionId: currentQuestion.id,
      selectedIndex: selectedOption,
      correct: isCorrect,
    };
    setAnswers((prev) => [...prev, answer]);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const allAnswers = [...answers];
      const correctCount = allAnswers.filter((a) => a.correct).length;
      onComplete(correctCount, allAnswers);
    } else {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setSubmitted(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2">
        {questions.map((_, i) => (
          <motion.div
            key={i}
            className={`h-1.5 rounded-full ${
              i < currentIndex
                ? 'bg-primary'
                : i === currentIndex
                  ? 'bg-primary'
                  : 'bg-muted'
            }`}
            animate={{ width: i === currentIndex ? 24 : 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {t('questionOf', { current: currentIndex + 1, total: questions.length })}
        </span>
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-4"
        >
          <p className="text-base font-medium">{t(currentQuestion.questionKey as keyof IntlMessages['quiz'])}</p>

          <div className="space-y-2.5">
            {currentQuestion.optionKeys.map((optKey, index) => {
              const isSelected = index === selectedOption;
              const isCorrectAnswer = index === currentQuestion.correctIndex;

              let className =
                'flex w-full items-center gap-3 p-4 rounded-xl cursor-pointer transition-all min-h-[52px] active:scale-[0.98]';

              if (submitted) {
                if (isCorrectAnswer) {
                  className += ' bg-emerald-50 shadow-[inset_0_0_0_2px_theme(colors.emerald.500)] text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300';
                } else if (isSelected && !isCorrect) {
                  className += ' bg-red-50 shadow-[inset_0_0_0_2px_theme(colors.red.400)] text-red-800 dark:bg-red-950/30 dark:text-red-300';
                } else {
                  className += ' opacity-40';
                }
              } else if (isSelected) {
                className += ' bg-primary/5 shadow-[inset_0_0_0_2px_var(--primary)]';
              } else {
                className += ' shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.22)] hover:bg-black/[0.02]';
              }

              return (
                <motion.button
                  key={optKey}
                  type="button"
                  className={className}
                  onClick={() => handleSelect(index)}
                  disabled={submitted}
                  whileTap={!submitted ? { scale: 0.98 } : undefined}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    submitted && isCorrectAnswer
                      ? 'bg-emerald-500 text-white'
                      : submitted && isSelected && !isCorrect
                        ? 'bg-red-400 text-white'
                        : isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {submitted && isCorrectAnswer ? (
                      <CheckCircle2 className="size-4" />
                    ) : submitted && isSelected && !isCorrect ? (
                      <XCircle className="size-4" />
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </span>
                  <span className="text-sm text-left flex-1">{t(optKey as keyof IntlMessages['quiz'])}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div
                  className={`text-sm p-4 rounded-xl ${
                    isCorrect
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                      : 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
                  }`}
                >
                  {isCorrect ? t('correctFeedback') : t('incorrectFeedback')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-end pt-2">
        {!submitted ? (
          <Button
            size="lg"
            onClick={handleSubmitAnswer}
            disabled={selectedOption === null}
            className="gap-2"
          >
            {t('checkAnswer')}
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button size="lg" onClick={handleNext} className="gap-2">
              {isLastQuestion ? t('continueToSignature') : t('nextQuestion')}
              <ChevronRight className="size-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
