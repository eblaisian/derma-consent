'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SignaturePad } from '@/components/signature-pad/signature-pad';
import { Shield, Check, User, ClipboardList, PenLine, Clock } from 'lucide-react';
import {
  type ConsentType,
  getFormFields,
} from './form-fields';
import { YesNoChips, ConditionGrid, MedicationTags } from './fields';
import { ComprehensionQuiz } from './comprehension-quiz';
import { ConsentExplainer } from './consent-explainer';
import { EducationVideo } from './education-video';
import { quizQuestions } from './quiz-questions';
import { usePublicAiStatus } from '@/hooks/use-ai-status';

type Step = 'intro' | 'personal' | 'form' | 'quiz' | 'signature' | 'review' | 'submitting';

const STEPPER_STEPS = ['personal', 'form', 'quiz', 'signature', 'review'] as const;

export interface PatientIdentity {
  fullName: string;
  dateOfBirth: string;
  email: string;
}

interface ConsentFormProps {
  consentType: ConsentType;
  practiceName: string;
  token: string;
  onSubmit: (data: {
    formData: Record<string, unknown>;
    signatureData: string;
    patientIdentity: PatientIdentity;
    comprehensionScore?: number;
    comprehensionAnswers?: Array<{ questionId: string; selectedIndex: number; correct: boolean }>;
  }) => Promise<void>;
  videoUrl?: string;
}

export function ConsentForm({
  consentType,
  practiceName,
  token,
  onSubmit,
  videoUrl,
}: ConsentFormProps) {
  const t = useTranslations('consent');
  const tTypes = useTranslations('consentTypes');
  const tFields = useTranslations('medicalFields');
  const tOptions = useTranslations('medicalOptions');
  const { aiEnabled } = usePublicAiStatus();
  const [step, setStep] = useState<Step>('intro');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [patientIdentity, setPatientIdentity] = useState<PatientIdentity>({ fullName: '', dateOfBirth: '', email: '' });
  const [comprehensionScore, setComprehensionScore] = useState<number | undefined>();
  const [comprehensionAnswers, setComprehensionAnswers] = useState<
    Array<{ questionId: string; selectedIndex: number; correct: boolean }> | undefined
  >();

  const questions = quizQuestions[consentType] ?? [];

  const fields = getFormFields(consentType);
  const { register, handleSubmit, getValues, control, formState: { errors } } = useForm();

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

  const handlePersonalNext = () => {
    if (!patientIdentity.fullName.trim() || !patientIdentity.dateOfBirth) {
      setError(t('fieldRequired'));
      return;
    }
    setError(null);
    setStep('form');
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
        patientIdentity,
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

  const stepperStep = step === 'submitting' ? 'review' : step === 'intro' ? 'personal' : step;
  const currentStepIndex = STEPPER_STEPS.indexOf(stepperStep as typeof STEPPER_STEPS[number]);
  const progress = step === 'intro' ? 0 : ((currentStepIndex + 1) / STEPPER_STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header (hidden on intro) */}
      {step !== 'intro' && (
        <div>
          <h1 className="text-2xl font-semibold leading-tight">
            {tTypes.has(consentType) ? tTypes(consentType) : consentType}
          </h1>
          <p className="mt-1 text-base text-foreground-secondary leading-relaxed">
            {t('consentDeclaration')} — {t('practice')} {practiceName}
          </p>
        </div>
      )}

      {/* Progress stepper (hidden on intro) */}
      {step !== 'intro' && (
      <nav aria-label="Form progress">
        <div className="flex items-start">
          {STEPPER_STEPS.map((s, i) => {
            const stepLabels = {
              personal: t('stepPersonal'),
              form: t('stepForm'),
              quiz: t('stepQuiz'),
              signature: t('stepSignature'),
              review: t('stepReview'),
            };
            const isCurrent = i === currentStepIndex;
            const isComplete = i < currentStepIndex;
            const isLast = i === STEPPER_STEPS.length - 1;
            return (
              <div key={s} className="flex items-start flex-1">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground shadow-[var(--shadow-brand)]'
                      : isComplete
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}
                  >
                    {isComplete ? <Check className="size-3.5" /> : i + 1}
                  </div>
                  <span className={`text-[11px] leading-tight text-center max-w-[60px] ${
                    isCurrent ? 'font-semibold text-foreground' : isComplete ? 'font-medium text-primary' : 'text-muted-foreground'
                  }`}>
                    {stepLabels[s]}
                  </span>
                </div>
                {!isLast && (
                  <div className="flex-1 mt-4 mx-1">
                    <div className={`h-0.5 w-full rounded-full transition-colors duration-300 ${
                      i < currentStepIndex ? 'bg-primary' : 'bg-muted'
                    }`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
      )}

      {/* Security badge + AI Explainer (hidden on intro) */}
      {step !== 'intro' && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-success" />
            {t('endToEndEncrypted')}
          </div>
          {step === 'form' && aiEnabled && (
            <ConsentExplainer
              consentType={consentType}
              token={token}
            />
          )}
        </div>
      )}

      {error && (
        <div className="bg-destructive-subtle text-destructive text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Education Video (shown above form when configured) */}
      {step === 'form' && videoUrl && (
        <EducationVideo url={videoUrl} />
      )}

      {/* Step: Intro */}
      {step === 'intro' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">{t('introTitle')}</h2>
            <p className="text-base text-muted-foreground">
              {tTypes.has(consentType) ? tTypes(consentType) : consentType} — {practiceName}
            </p>
          </div>

          <div className="rounded-xl bg-muted/40 border border-border/30 p-5 space-y-4">
            <p className="text-sm font-medium">{t('introWhat')}</p>
            <div className="space-y-3">
              {[
                { icon: User, text: t('introStep1') },
                { icon: ClipboardList, text: t('introStep2') },
                { icon: PenLine, text: t('introStep3') },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <item.icon className="size-4 text-primary" />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            {t('introTime')}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="size-3.5 text-success" />
            {t('endToEndEncrypted')}
          </div>

          <div className="flex justify-center pt-2">
            <Button size="lg" onClick={() => setStep('personal')}>
              {t('introBegin')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 0: Personal Details */}
      {step === 'personal' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="patient-name" className="text-base">
              {t('fullName')} <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="patient-name"
              size="lg"
              value={patientIdentity.fullName}
              onChange={(e) => setPatientIdentity((p) => ({ ...p, fullName: e.target.value }))}
              autoComplete="name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-dob" className="text-base">
              {t('dateOfBirth')} <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="patient-dob"
              type="date"
              size="lg"
              value={patientIdentity.dateOfBirth}
              onChange={(e) => setPatientIdentity((p) => ({ ...p, dateOfBirth: e.target.value }))}
              autoComplete="bday"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-email" className="text-base">
              {t('emailAddress')}
            </Label>
            <Input
              id="patient-email"
              type="email"
              size="lg"
              value={patientIdentity.email}
              onChange={(e) => setPatientIdentity((p) => ({ ...p, email: e.target.value }))}
              autoComplete="email"
            />
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Shield className="size-3.5 text-success shrink-0" />
            {t('personalDataNotice')}
          </p>

          <Separator />

          <div className="flex justify-end pt-2">
            <Button type="button" size="lg" onClick={handlePersonalNext}>
              {t('nextToForm')}
            </Button>
          </div>
        </div>
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
                  size="lg"
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
                <Controller
                  name={field.name}
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => onChange(false)}
                        className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all ${
                          value === false || !value
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'border-border hover:border-muted-foreground/30 text-muted-foreground'
                        }`}
                      >
                        {(!value) && <Check className="h-4 w-4" />}
                        {t('no')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange(true)}
                        className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all ${
                          value === true
                            ? 'border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-400 dark:bg-amber-950/30 dark:text-amber-400'
                            : 'border-border hover:border-muted-foreground/30 text-muted-foreground'
                        }`}
                      >
                        {value === true && <Check className="h-4 w-4" />}
                        {t('yes')}
                      </button>
                    </div>
                  )}
                />
              )}

              {field.type === 'select' && (
                <Controller
                  name={field.name}
                  control={control}
                  rules={{ required: field.required }}
                  render={({ field: { value, onChange } }) => (
                    <div className="flex flex-wrap gap-2">
                      {field.optionKeys?.map((optKey) => {
                        const isActive = value === optKey;
                        return (
                          <button
                            key={optKey}
                            type="button"
                            onClick={() => onChange(optKey)}
                            className={`inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2.5 text-sm transition-all ${
                              isActive
                                ? 'border-primary bg-primary/10 text-primary font-medium'
                                : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-muted'
                            }`}
                          >
                            {isActive && <Check className="h-3.5 w-3.5" />}
                            {resolveOptionLabel(optKey)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              )}

              {field.type === 'checkbox-group' && (
                <Controller
                  name={field.name}
                  control={control}
                  rules={{ required: field.required }}
                  render={({ field: { value, onChange } }) => {
                    const selected = new Set<string>(Array.isArray(value) ? value : []);
                    const toggle = (key: string) => {
                      const next = new Set(selected);
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      onChange(Array.from(next));
                    };
                    return (
                      <div className="flex flex-wrap gap-2">
                        {field.optionKeys?.map((optKey) => {
                          const isActive = selected.has(optKey);
                          return (
                            <button
                              key={optKey}
                              type="button"
                              onClick={() => toggle(optKey)}
                              className={`inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2.5 text-sm transition-all ${
                                isActive
                                  ? 'border-primary bg-primary/10 text-primary font-medium'
                                  : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-muted'
                              }`}
                              >
                              {isActive && <Check className="h-3.5 w-3.5" />}
                              {resolveOptionLabel(optKey)}
                            </button>
                          );
                        })}
                      </div>
                    );
                  }}
                />
              )}

              {field.type === 'yes-no-chips' && (
                <Controller
                  name={field.name}
                  control={control}
                  rules={{ required: field.required, validate: (v) => !field.required || (!!v && v !== '') }}
                  render={({ field: { value, onChange } }) => (
                    <YesNoChips
                      name={field.name}
                      chipKeys={field.chipKeys || []}
                      required={field.required}
                      value={value || ''}
                      onChange={onChange}
                    />
                  )}
                />
              )}

              {field.type === 'condition-grid' && (
                <Controller
                  name={field.name}
                  control={control}
                  rules={{ required: field.required, validate: (v) => !field.required || (!!v && v !== '') }}
                  render={({ field: { value, onChange } }) => (
                    <ConditionGrid
                      name={field.name}
                      conditionKeys={field.chipKeys || []}
                      required={field.required}
                      value={value || ''}
                      onChange={onChange}
                    />
                  )}
                />
              )}

              {field.type === 'medication-tags' && (
                <Controller
                  name={field.name}
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <MedicationTags
                      name={field.name}
                      value={value || ''}
                      onChange={onChange}
                    />
                  )}
                />
              )}

              {errors[field.name] && (
                <p className="text-xs text-destructive">
                  {t('fieldRequired')}
                </p>
              )}
            </div>
          ))}

          <Separator />

          <div className="flex justify-between pt-2">
            <Button variant="outline" size="lg" type="button" onClick={() => setStep('personal')}>
              {t('back')}
            </Button>
            <Button type="submit" size="lg">
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
        />
      )}

      {/* Step 3: Signature */}
      {step === 'signature' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-muted/40 border border-border/30 p-4">
            <p className="text-base text-foreground leading-relaxed">
              {t('signatureInstruction')}
            </p>
          </div>
          <SignaturePad onSignatureChange={setSignatureData} />

          <Separator />

          <div className="flex justify-between pt-2">
            <Button variant="outline" size="lg" onClick={() => setStep(questions.length > 0 ? 'quiz' : 'form')}>
              {t('back')}
            </Button>
            <Button size="lg" onClick={handleSignatureNext}>
              {t('nextToReview')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 'review' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">{t('reviewTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('consentDeclaration')}</p>
          </div>
          <div className="bg-muted/30 border border-border/50 rounded-xl p-5 space-y-3 text-base leading-relaxed">
            {patientIdentity.fullName && (
              <div>
                <span className="font-medium">{t('fullName')}:</span> {patientIdentity.fullName}
              </div>
            )}
            {patientIdentity.dateOfBirth && (
              <div>
                <span className="font-medium">{t('dateOfBirth')}:</span> {patientIdentity.dateOfBirth}
              </div>
            )}
            {patientIdentity.email && (
              <div>
                <span className="font-medium">{t('emailAddress')}:</span> {patientIdentity.email}
              </div>
            )}
            <Separator className="my-2" />
            {Object.entries(getValues()).map(([key, value]) => {
              const field = fields.find((f) => f.name === key);
              if (!field || value === '' || value === false || value === undefined || value === null) return null;

              let displayValue: string;
              if (Array.isArray(value)) {
                displayValue = value.map((v: string) => resolveOptionLabel(v)).join(', ');
              } else if (typeof value === 'boolean') {
                displayValue = t('yes');
              } else {
                const strVal = String(value);
                // Handle structured values from new field types
                if (strVal === 'none') {
                  displayValue = tFields('noneKnown' as keyof IntlMessages['medicalFields']);
                } else if (field.type === 'yes-no-chips' || field.type === 'condition-grid') {
                  displayValue = strVal
                    .split(',')
                    .filter((v) => v && !v.startsWith('notes:') && v !== 'noneOfAbove')
                    .map((v) => resolveOptionLabel(v.startsWith('other:') ? v.slice(6) : v))
                    .join(', ');
                  const notes = strVal.split(',').find((v) => v.startsWith('notes:'));
                  if (notes) displayValue += ` (${notes.slice(6)})`;
                  if (!displayValue) displayValue = tFields('noneKnown' as keyof IntlMessages['medicalFields']);
                } else if (field.type === 'medication-tags') {
                  displayValue = strVal.split(',').filter(Boolean).join(', ');
                } else if (tOptions.has(strVal as keyof IntlMessages['medicalOptions'])) {
                  displayValue = resolveOptionLabel(strVal);
                } else {
                  displayValue = strVal;
                }
              }

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
              <div className="inline-block rounded-xl border border-border/50 bg-white p-3">
                <img
                  src={signatureData}
                  alt={t('signature')}
                  className="h-20"
                />
              </div>
            </div>
          )}

          <div className="rounded-lg bg-primary/[0.04] border border-primary/10 px-4 py-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('legalNotice')}
            </p>
          </div>

          <Separator />

          <div className="flex justify-between pt-2">
            <Button variant="outline" size="lg" onClick={() => setStep('signature')}>
              {t('back')}
            </Button>
            <Button size="lg" className="min-w-[160px]" onClick={handleFinalSubmit}>
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
