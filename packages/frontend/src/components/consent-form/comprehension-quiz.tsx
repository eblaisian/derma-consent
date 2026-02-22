'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { QuizQuestion } from './quiz-questions';

interface QuizAnswer {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
}

interface ComprehensionQuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number, answers: QuizAnswer[]) => void;
  brandColor?: string;
}

export function ComprehensionQuiz({ questions, onComplete, brandColor }: ComprehensionQuizProps) {
  const t = useTranslations('quiz');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedOption === currentQuestion.correctIndex;
  const isLastQuestion = currentIndex === questions.length - 1;
  const primaryStyle = brandColor ? { backgroundColor: brandColor } : undefined;

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
      const score = correctCount / questions.length;
      onComplete(score, allAnswers);
    } else {
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

      <div className="text-sm text-muted-foreground">
        {t('questionOf', { current: currentIndex + 1, total: questions.length })}
      </div>

      <div className="space-y-4">
        <p className="text-base font-medium">{t(currentQuestion.questionKey as keyof IntlMessages['quiz'])}</p>

        <div className="space-y-2">
          {currentQuestion.optionKeys.map((optKey, index) => {
            let className =
              'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors min-h-[44px]';

            if (submitted) {
              if (index === currentQuestion.correctIndex) {
                className += ' border-green-500 bg-green-50 dark:bg-green-950';
              } else if (index === selectedOption && !isCorrect) {
                className += ' border-red-500 bg-red-50 dark:bg-red-950';
              } else {
                className += ' opacity-50';
              }
            } else if (index === selectedOption) {
              className += ' border-primary bg-primary/5';
            } else {
              className += ' hover:bg-muted/50';
            }

            return (
              <button
                key={optKey}
                type="button"
                className={className}
                onClick={() => handleSelect(index)}
                disabled={submitted}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-sm text-left">{t(optKey as keyof IntlMessages['quiz'])}</span>
                {submitted && index === currentQuestion.correctIndex && (
                  <CheckCircle2 className="h-5 w-5 text-green-600 ml-auto shrink-0" />
                )}
                {submitted && index === selectedOption && !isCorrect && index !== currentQuestion.correctIndex && (
                  <XCircle className="h-5 w-5 text-red-600 ml-auto shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {submitted && (
          <div
            className={`text-sm p-3 rounded-lg ${
              isCorrect
                ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
            }`}
          >
            {isCorrect ? t('correctFeedback') : t('incorrectFeedback')}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        {!submitted ? (
          <Button
            className="h-11 px-6"
            onClick={handleSubmitAnswer}
            disabled={selectedOption === null}
            style={primaryStyle}
          >
            {t('checkAnswer')}
          </Button>
        ) : (
          <Button className="h-11 px-6" onClick={handleNext} style={primaryStyle}>
            {isLastQuestion ? t('continueToSignature') : t('nextQuestion')}
          </Button>
        )}
      </div>
    </div>
  );
}
