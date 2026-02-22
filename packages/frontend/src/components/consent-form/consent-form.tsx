'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SignaturePad } from '@/components/signature-pad/signature-pad';
import { Shield } from 'lucide-react';
import {
  type ConsentType,
  getFormFields,
} from './form-fields';
import { ComprehensionQuiz } from './comprehension-quiz';
import { EducationVideo } from './education-video';
import { quizQuestions } from './quiz-questions';

type Step = 'form' | 'quiz' | 'signature' | 'review' | 'submitting';

const STEPS = ['form', 'quiz', 'signature', 'review'] as const;

interface ConsentFormProps {
  consentType: ConsentType;
  practiceName: string;
  onSubmit: (data: {
    formData: Record<string, unknown>;
    signatureData: string;
    comprehensionScore?: number;
    comprehensionAnswers?: Array<{ questionId: string; selectedIndex: number; correct: boolean }>;
  }) => Promise<void>;
  brandColor?: string;
  videoUrl?: string;
}

export function ConsentForm({
  consentType,
  practiceName,
  onSubmit,
  brandColor,
  videoUrl,
}: ConsentFormProps) {
  const t = useTranslations('consent');
  const tTypes = useTranslations('consentTypes');
  const tFields = useTranslations('medicalFields');
  const tOptions = useTranslations('medicalOptions');
  const [step, setStep] = useState<Step>('form');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comprehensionScore, setComprehensionScore] = useState<number | undefined>();
  const [comprehensionAnswers, setComprehensionAnswers] = useState<
    Array<{ questionId: string; selectedIndex: number; correct: boolean }> | undefined
  >();

  const questions = quizQuestions[consentType] ?? [];

  const fields = getFormFields(consentType);
  const { register, handleSubmit, getValues, formState: { errors } } = useForm();

  const resolveFieldLabel = (labelKey: string): string => {
    return tFields.has(labelKey as keyof IntlMessages['medicalFields'])
      ? tFields(labelKey as keyof IntlMessages['medicalFields'])
      : labelKey;
  };

  const resolveOptionLabel = (optionKey: string): string => {
    return tOptions.has(optionKey as keyof IntlMessages['medicalOptions'])
      ? tOptions(optionKey as keyof IntlMessages['medicalOptions'])
      : optionKey;
  };

  const handleFormNext = handleSubmit(() => {
    setStep(questions.length > 0 ? 'quiz' : 'signature');
  });

  const handleQuizComplete = (score: number, answers: Array<{ questionId: string; selectedIndex: number; correct: boolean }>) => {
    setComprehensionScore(score);
    setComprehensionAnswers(answers);
    setStep('signature');
  };

  const handleSignatureNext = () => {
    if (!signatureData) {
      setError(t('pleaseSign'));
      return;
    }
    setError(null);
    setStep('review');
  };

  const handleFinalSubmit = async () => {
    if (!signatureData) return;
    setStep('submitting');
    setError(null);
    try {
      await onSubmit({
        formData: getValues(),
        signatureData,
        comprehensionScore,
        comprehensionAnswers,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('submitError'),
      );
      setStep('review');
    }
  };

  const currentStepIndex = STEPS.indexOf(step === 'submitting' ? 'review' : step);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;
  const primaryStyle = brandColor ? { backgroundColor: brandColor } : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold leading-tight">
          {tTypes.has(consentType) ? tTypes(consentType) : consentType}
        </h1>
        <p className="mt-1 text-base text-foreground-secondary leading-relaxed">
          {t('consentDeclaration')} — {t('practice')} {practiceName}
        </p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {t('stepOf', { current: currentStepIndex + 1, total: STEPS.length })}
          </span>
        </div>
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%`, ...(brandColor ? { backgroundColor: brandColor } : {}) }}
          />
        </div>
      </div>

      {/* Security badge */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5 text-success" />
        {t('endToEndEncrypted')}
      </div>

      {error && (
        <div className="bg-destructive-subtle text-destructive text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Education Video (shown above form when configured) */}
      {step === 'form' && videoUrl && (
        <EducationVideo url={videoUrl} />
      )}

      {/* Step 1: Form Fields */}
      {step === 'form' && (
        <form onSubmit={handleFormNext} className="space-y-6">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name} className="text-base">
                {resolveFieldLabel(field.labelKey)}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {field.type === 'text' && (
                <Input
                  id={field.name}
                  className="h-11"
                  {...register(field.name, { required: field.required })}
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  id={field.name}
                  className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base leading-relaxed"
                  {...register(field.name, { required: field.required })}
                />
              )}

              {field.type === 'checkbox' && (
                <div className="flex items-center gap-3 min-h-[44px]">
                  <input
                    type="checkbox"
                    id={field.name}
                    className="h-5 w-5 rounded border-input"
                    {...register(field.name)}
                  />
                  <Label htmlFor={field.name} className="text-base font-normal">
                    {t('yes')}
                  </Label>
                </div>
              )}

              {field.type === 'select' && (
                <select
                  id={field.name}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                  {...register(field.name, { required: field.required })}
                >
                  <option value="">{t('selectPlaceholder')}</option>
                  {field.optionKeys?.map((optKey) => (
                    <option key={optKey} value={optKey}>
                      {resolveOptionLabel(optKey)}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'checkbox-group' && (
                <div className="space-y-2">
                  {field.optionKeys?.map((optKey) => (
                    <div key={optKey} className="flex items-center gap-3 min-h-[44px]">
                      <input
                        type="checkbox"
                        id={`${field.name}-${optKey}`}
                        value={optKey}
                        className="h-5 w-5 rounded border-input"
                        {...register(field.name, {
                          required: field.required,
                        })}
                      />
                      <Label
                        htmlFor={`${field.name}-${optKey}`}
                        className="text-base font-normal"
                      >
                        {resolveOptionLabel(optKey)}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {errors[field.name] && (
                <p className="text-xs text-destructive">
                  {t('fieldRequired')}
                </p>
              )}
            </div>
          ))}

          <Separator />

          <div className="flex justify-end pt-2">
            <Button type="submit" className="h-11 px-6" style={primaryStyle}>
              {questions.length > 0 ? t('nextToQuiz') : t('nextToSignature')}
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Comprehension Quiz */}
      {step === 'quiz' && (
        <ComprehensionQuiz
          questions={questions}
          onComplete={handleQuizComplete}
          brandColor={brandColor}
        />
      )}

      {/* Step 3: Signature */}
      {step === 'signature' && (
        <div className="space-y-6">
          <p className="text-base text-foreground-secondary leading-relaxed">
            {t('signatureInstruction')}
          </p>
          <SignaturePad onSignatureChange={setSignatureData} />

          <Separator />

          <div className="flex justify-between pt-2">
            <Button variant="outline" className="h-11" onClick={() => setStep(questions.length > 0 ? 'quiz' : 'form')}>
              {t('back')}
            </Button>
            <Button className="h-11 px-6" onClick={handleSignatureNext} style={primaryStyle}>
              {t('nextToReview')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">{t('reviewTitle')}</h2>
          <div className="bg-muted/50 border rounded-lg p-4 space-y-3 text-base leading-relaxed">
            {Object.entries(getValues()).map(([key, value]) => {
              const field = fields.find((f) => f.name === key);
              if (!field || value === '' || value === false) return null;
              const displayValue = Array.isArray(value)
                ? value.map((v: string) => resolveOptionLabel(v)).join(', ')
                : typeof value === 'boolean'
                  ? t('yes')
                  : tOptions.has(String(value) as keyof IntlMessages['medicalOptions'])
                    ? resolveOptionLabel(String(value))
                    : String(value);
              return (
                <div key={key}>
                  <span className="font-medium">{resolveFieldLabel(field.labelKey)}:</span>{' '}
                  {displayValue}
                </div>
              );
            })}
          </div>

          {signatureData && (
            <div>
              <p className="text-sm font-medium mb-2">{t('yourSignature')}</p>
              <img
                src={signatureData}
                alt={t('signature')}
                className="border rounded-lg h-24"
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('legalNotice')}
          </p>

          <Separator />

          <div className="flex justify-between pt-2">
            <Button variant="outline" className="h-11" onClick={() => setStep('signature')}>
              {t('back')}
            </Button>
            <Button className="h-11 px-6" onClick={handleFinalSubmit} style={primaryStyle}>
              {t('submitFinal')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Submitting */}
      {step === 'submitting' && (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-base text-foreground-secondary">
            {t('submitting')}
          </p>
        </div>
      )}
    </div>
  );
}
