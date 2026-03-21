'use client';

import { useState, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignaturePad } from '@/components/signature-pad/signature-pad';
import {
  Shield,
  Check,
  User,
  ClipboardList,
  PenLine,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Pencil,
  Loader2,
} from 'lucide-react';
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

const STEP_ORDER: Step[] = ['intro', 'personal', 'form', 'quiz', 'signature', 'review', 'submitting'];

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

// Directional slide variants based on navigation direction
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

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
  const [direction, setDirection] = useState(1);
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

  const navigateTo = useCallback((target: Step) => {
    const currentIdx = STEP_ORDER.indexOf(step);
    const targetIdx = STEP_ORDER.indexOf(target);
    setDirection(targetIdx > currentIdx ? 1 : -1);
    setStep(target);
  }, [step]);

  const handlePersonalNext = () => {
    if (!patientIdentity.fullName.trim() || !patientIdentity.dateOfBirth) {
      setError(t('fieldRequired'));
      return;
    }
    setError(null);
    navigateTo('form');
  };

  const handleFormNext = handleSubmit(() => {
    navigateTo(questions.length > 0 ? 'quiz' : 'signature');
  });

  const handleQuizComplete = (score: number, answers: Array<{ questionId: string; selectedIndex: number; correct: boolean }>) => {
    setComprehensionScore(score);
    setComprehensionAnswers(answers);
    navigateTo('signature');
  };

  const handleSignatureNext = () => {
    if (!signatureData) {
      setError(t('pleaseSign'));
      return;
    }
    setError(null);
    navigateTo('review');
  };

  const handleFinalSubmit = async () => {
    if (!signatureData) return;
    navigateTo('submitting');
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
      navigateTo('review');
    }
  };

  const stepperStep = step === 'submitting' ? 'review' : step === 'intro' ? 'personal' : step;
  const currentStepIndex = STEPPER_STEPS.indexOf(stepperStep as typeof STEPPER_STEPS[number]);
  const progress = step === 'intro' ? 0 : ((currentStepIndex + 1) / STEPPER_STEPS.length) * 100;

  // Group form fields into sections for review
  const reviewSections = useMemo(() => {
    const values = getValues();
    const personalSection = {
      title: t('stepPersonal'),
      items: [
        patientIdentity.fullName && { label: t('fullName'), value: patientIdentity.fullName },
        patientIdentity.dateOfBirth && { label: t('dateOfBirth'), value: patientIdentity.dateOfBirth },
        patientIdentity.email && { label: t('emailAddress'), value: patientIdentity.email },
      ].filter(Boolean) as Array<{ label: string; value: string }>,
    };

    const formItems = Object.entries(values)
      .map(([key, value]) => {
        const field = fields.find((f) => f.name === key);
        if (!field || value === '' || value === false || value === undefined || value === null) return null;

        let displayValue: string;
        if (Array.isArray(value)) {
          displayValue = value.map((v: string) => resolveOptionLabel(v)).join(', ');
        } else if (typeof value === 'boolean') {
          displayValue = t('yes');
        } else {
          const strVal = String(value);
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

        return { label: resolveFieldLabel(field.labelKey), value: displayValue };
      })
      .filter(Boolean) as Array<{ label: string; value: string }>;

    return [
      personalSection,
      { title: t('stepForm'), items: formItems },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div className="space-y-6">
      {/* Header (hidden on intro) */}
      {step !== 'intro' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-semibold leading-tight">
            {tTypes.has(consentType) ? tTypes(consentType) : consentType}
          </h1>
          <p className="mt-1 text-base text-foreground-secondary leading-relaxed">
            {t('consentDeclaration')} — {t('practice')} {practiceName}
          </p>
        </motion.div>
      )}

      {/* Animated progress stepper (hidden on intro) */}
      {step !== 'intro' && (
        <nav aria-label="Form progress" className="space-y-2">
          {/* Circles + connectors row */}
          <div className="flex items-center">
            {STEPPER_STEPS.map((s, i) => {
              const isCurrent = i === currentStepIndex;
              const isComplete = i < currentStepIndex;
              const isLast = i === STEPPER_STEPS.length - 1;
              return (
                <div key={s} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300 ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : isComplete
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isComplete ? <Check className="size-3.5" /> : i + 1}
                  </div>
                  {!isLast && (
                    <div className="flex-1 h-0.5 mx-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: '0%' }}
                        animate={{ width: i < currentStepIndex ? '100%' : '0%' }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Labels row */}
          <div className="flex">
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
                <div key={s} className={`${isLast ? '' : 'flex-1'}`}>
                  <span className={`block text-[11px] leading-tight text-center transition-colors duration-300 ${
                    isCurrent ? 'font-semibold text-foreground' : isComplete ? 'font-medium text-primary' : 'text-muted-foreground'
                  }`} style={{ width: 32 }}>
                    {stepLabels[s]}
                  </span>
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

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-destructive-subtle text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Education Video (shown above form when configured) */}
      {step === 'form' && videoUrl && (
        <EducationVideo url={videoUrl} />
      )}

      {/* Step content with directional slide transitions */}
      <AnimatePresence mode="wait" custom={direction}>
        {/* Step: Intro */}
        {step === 'intro' && (
          <motion.div
            key="intro"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-8"
          >
            <motion.div
              className="text-center space-y-3"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <h2 className="text-2xl font-semibold tracking-tight">{t('introTitle')}</h2>
              <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                {t('introSubtitle', { practiceName })}
              </p>
            </motion.div>

            <div className="space-y-3">
              {[
                { icon: User, text: t('introStep1'), label: t('introStepLabel1') },
                { icon: ClipboardList, text: t('introStep2'), label: t('introStepLabel2') },
                { icon: PenLine, text: t('introStep3'), label: t('introStepLabel3') },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <Clock className="size-4" />
              {t('introTime')}
            </motion.div>

            <motion.div
              className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.55, duration: 0.4 }}
            >
              <Shield className="size-3.5 text-success" />
              {t('endToEndEncrypted')}
            </motion.div>

            <motion.div
              className="flex justify-center pt-2"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <Button size="lg" className="w-full sm:w-auto min-w-[200px] gap-2" onClick={() => navigateTo('personal')}>
                {t('introBegin')}
                <ArrowRight className="size-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Step: Personal Details */}
        {step === 'personal' && (
          <motion.div
            key="personal"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-6"
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('personalIntro')}
            </p>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="patient-name" className="text-base">
                  {t('fullName')} <span className="text-destructive ml-0.5">*</span>
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
                  {t('dateOfBirth')} <span className="text-destructive ml-0.5">*</span>
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
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Shield className="size-3.5 text-success shrink-0" />
              {t('personalDataNotice')}
            </p>

            <div className="border-t border-border/50 pt-5">
              <div className="flex justify-end">
                <Button type="button" size="lg" className="gap-2" onClick={handlePersonalNext}>
                  {t('nextToForm')}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step: Form Fields */}
        {step === 'form' && (
          <motion.div
            key="form"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <form onSubmit={handleFormNext} className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('formIntro')}
              </p>

              {fields.map((field, fieldIndex) => (
                <motion.div
                  key={field.name}
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: fieldIndex * 0.05, duration: 0.3 }}
                >
                  <Label htmlFor={field.name} className="text-base">
                    {resolveFieldLabel(field.labelKey)}
                    {field.required && <span className="text-destructive ml-0.5">*</span>}
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
                            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all active:scale-[0.97] ${
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
                            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all active:scale-[0.97] ${
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
                                className={`inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2.5 text-sm transition-all active:scale-[0.97] ${
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
                                  className={`inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2.5 text-sm transition-all active:scale-[0.97] ${
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
                </motion.div>
              ))}

              <div className="border-t border-border/50 pt-5">
                <div className="flex justify-between">
                  <Button variant="ghost" size="lg" type="button" className="gap-1.5" onClick={() => navigateTo('personal')}>
                    <ChevronLeft className="size-4" />
                    {t('back')}
                  </Button>
                  <Button type="submit" size="lg" className="gap-2">
                    {questions.length > 0 ? t('nextToQuiz') : t('nextToSignature')}
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step: Comprehension Quiz */}
        {step === 'quiz' && (
          <motion.div
            key="quiz"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <ComprehensionQuiz
              questions={questions}
              onComplete={handleQuizComplete}
            />
          </motion.div>
        )}

        {/* Step: Signature */}
        {step === 'signature' && (
          <motion.div
            key="signature"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-6"
          >
            <div className="rounded-xl bg-primary/[0.04] border border-primary/10 p-5 space-y-2">
              <p className="text-base font-medium text-foreground">
                {t('signatureTitle')}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('signatureInstruction')}
              </p>
            </div>

            <SignaturePad onSignatureChange={setSignatureData} />

            {signatureData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-sm text-success"
              >
                <Check className="size-4" />
                {t('signatureCaptured')}
              </motion.div>
            )}

            <div className="border-t border-border/50 pt-5">
              <div className="flex justify-between">
                <Button variant="ghost" size="lg" className="gap-1.5" onClick={() => navigateTo(questions.length > 0 ? 'quiz' : 'form')}>
                  <ChevronLeft className="size-4" />
                  {t('back')}
                </Button>
                <Button size="lg" className="gap-2" onClick={handleSignatureNext}>
                  {t('nextToReview')}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <motion.div
            key="review"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-lg font-semibold">{t('reviewTitle')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('reviewSubtitle')}</p>
            </div>

            {/* Section cards */}
            {reviewSections.map((section, sectionIdx) => (
              <motion.div
                key={section.title}
                className="rounded-xl border border-border/50 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIdx * 0.1, duration: 0.3 }}
              >
                <div className="flex items-center justify-between bg-muted/40 px-5 py-3 border-b border-border/30">
                  <h3 className="text-sm font-medium">{section.title}</h3>
                  <button
                    type="button"
                    onClick={() => navigateTo(sectionIdx === 0 ? 'personal' : 'form')}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <Pencil className="size-3" />
                    {t('reviewEdit')}
                  </button>
                </div>
                <div className="px-5 py-4 space-y-2.5">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
                      <span className="text-sm text-muted-foreground shrink-0">{item.label}:</span>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Signature preview */}
            {signatureData && (
              <motion.div
                className="rounded-xl border border-border/50 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="flex items-center justify-between bg-muted/40 px-5 py-3 border-b border-border/30">
                  <h3 className="text-sm font-medium">{t('yourSignature')}</h3>
                  <button
                    type="button"
                    onClick={() => navigateTo('signature')}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <Pencil className="size-3" />
                    {t('reviewEdit')}
                  </button>
                </div>
                <div className="px-5 py-4 flex justify-center">
                  <div className="inline-block rounded-lg border border-border/30 bg-white p-3">
                    <img
                      src={signatureData}
                      alt={t('signature')}
                      className="h-20"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Legal notice */}
            <div className="rounded-lg bg-primary/[0.04] border border-primary/10 px-4 py-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('legalNotice')}
              </p>
            </div>

            <div className="border-t border-border/50 pt-5">
              <div className="flex justify-between">
                <Button variant="ghost" size="lg" className="gap-1.5" onClick={() => navigateTo('signature')}>
                  <ChevronLeft className="size-4" />
                  {t('back')}
                </Button>
                <Button size="lg" className="min-w-[180px] gap-2" onClick={handleFinalSubmit}>
                  {t('submitFinal')}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step: Submitting */}
        {step === 'submitting' && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center py-16 space-y-4"
          >
            <motion.div
              className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Loader2 className="size-7 text-primary animate-spin" />
            </motion.div>
            <div className="space-y-1">
              <p className="text-base font-medium">{t('submittingTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {t('submitting')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
