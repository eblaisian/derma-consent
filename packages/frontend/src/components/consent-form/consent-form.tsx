'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SignaturePad } from '@/components/signature-pad/signature-pad';
import {
  type ConsentType,
  getFormFields,
} from './form-fields';

type Step = 'form' | 'signature' | 'review' | 'submitting';

interface ConsentFormProps {
  consentType: ConsentType;
  practiceName: string;
  onSubmit: (data: { formData: Record<string, unknown>; signatureData: string }) => Promise<void>;
}

export function ConsentForm({
  consentType,
  practiceName,
  onSubmit,
}: ConsentFormProps) {
  const t = useTranslations('consent');
  const tTypes = useTranslations('consentTypes');
  const tFields = useTranslations('medicalFields');
  const tOptions = useTranslations('medicalOptions');
  const [step, setStep] = useState<Step>('form');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setStep('signature');
  });

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
      await onSubmit({ formData: getValues(), signatureData });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('submitError'),
      );
      setStep('review');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {tTypes.has(consentType) ? tTypes(consentType) : consentType} - {t('consentDeclaration')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('practice')} {practiceName}
          </p>
        </CardHeader>
        <CardContent>
          {/* Step indicator */}
          <div className="flex gap-2 mb-6">
            {(['form', 'signature', 'review'] as const).map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded ${
                  step === s || (['form', 'signature', 'review'].indexOf(step) > i)
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Form Fields */}
          {step === 'form' && (
            <form onSubmit={handleFormNext} className="space-y-4">
              {fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {resolveFieldLabel(field.labelKey)}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>

                  {field.type === 'text' && (
                    <Input
                      id={field.name}
                      {...register(field.name, { required: field.required })}
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      id={field.name}
                      className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      {...register(field.name, { required: field.required })}
                    />
                  )}

                  {field.type === 'checkbox' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={field.name}
                        className="h-4 w-4 rounded border-gray-300"
                        {...register(field.name)}
                      />
                      <Label htmlFor={field.name} className="text-sm font-normal">
                        {t('yes')}
                      </Label>
                    </div>
                  )}

                  {field.type === 'select' && (
                    <select
                      id={field.name}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                        <div key={optKey} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`${field.name}-${optKey}`}
                            value={optKey}
                            className="h-4 w-4 rounded border-gray-300"
                            {...register(field.name, {
                              required: field.required,
                            })}
                          />
                          <Label
                            htmlFor={`${field.name}-${optKey}`}
                            className="text-sm font-normal"
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

              <div className="flex justify-end pt-4">
                <Button type="submit">{t('nextToSignature')}</Button>
              </div>
            </form>
          )}

          {/* Step 2: Signature */}
          {step === 'signature' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('signatureInstruction')}
              </p>
              <SignaturePad onSignatureChange={setSignatureData} />
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep('form')}>
                  {t('back')}
                </Button>
                <Button onClick={handleSignatureNext}>
                  {t('nextToReview')}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && (
            <div className="space-y-4">
              <h3 className="font-medium">{t('reviewTitle')}</h3>
              <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
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
                    className="border rounded h-24"
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {t('legalNotice')}
              </p>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep('signature')}>
                  {t('back')}
                </Button>
                <Button onClick={handleFinalSubmit}>
                  {t('submitFinal')}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Submitting */}
          {step === 'submitting' && (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                {t('submitting')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
