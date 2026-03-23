# How DermaConsent Works

A complete walkthrough of DermaConsent — from creating a consent form in your practice dashboard to the patient signing it on their phone.

::: info Screenshots
The screenshots below show the German interface — DermaConsent's primary language. The form is available in **8 languages** (German, English, Spanish, French, Arabic, Turkish, Polish, Russian) and patients can switch at any time.
:::

## Your Practice Dashboard

After logging in, you see your practice dashboard with a real-time overview of all consent forms — total consents, pending signatures, completions this month, and patient count. Attention badges alert you to forms expiring soon or still awaiting signatures.

![Practice dashboard](/screenshots/practice-dashboard.png)

Click **"Neue Einwilligung"** (New Consent) to create a consent form for a patient. Select the procedure type (Botox, Filler, Laser, Chemical Peel, Microneedling, or PRP), assign it to a patient, and send the link — via SMS, email, or QR code.

### Encrypted Patient Records

Patient data is protected with **zero-knowledge encryption**. Names and details appear as `[Verschlüsselt]` (Encrypted) until you unlock your practice vault with the master password. Even DermaConsent cannot read your patient data.

![Encrypted patient list](/screenshots/practice-patients.png)

---

## The Patient Experience

When you send a consent link to your patient, here's what they see — step by step.

### Step 1: Welcome Screen

The patient opens the link on any device and sees a branded welcome screen with your practice name and logo. Three clear steps are outlined, with an estimated time of about 5 minutes.

Trust badges at the bottom — **End-to-end encrypted**, **DSGVO-compliant**, and **EU servers** — build confidence before any data is shared.

![Welcome screen](/screenshots/consent-01-welcome.png)

---

### Step 2: Personal Details

The patient enters their name, date of birth, and optionally their email address. All data is encrypted in the browser before it ever leaves their device.

![Personal details](/screenshots/consent-02-personal.png)

---

### Step 3: Medical Questionnaire

Based on the procedure type, the patient answers targeted medical questions — treatment areas, allergies, medications, medical history, and procedure-specific questions. Each form is tailored to the specific treatment.

![Medical questionnaire](/screenshots/consent-03-medical.png)

::: info 6 Specialized Procedure Forms
DermaConsent includes forms for **Botox, Filler, Laser, Chemical Peel, Microneedling, and PRP**. Each asks only the questions relevant to that treatment — no generic one-size-fits-all forms.
:::

---

### AI-Powered Patient Explainer

Patients can tap **"Mir das erklären"** (Explain this to me) to get an AI-generated plain-language explanation of the procedure, risks, and aftercare — in their chosen language. Available as a quick summary or detailed explanation, with options to copy or have it read aloud.

This helps patients truly understand what they're consenting to, improving informed consent quality and reducing anxiety.

![AI Explainer](/screenshots/consent-ai-explainer.png)

---

### Step 4: Comprehension Check

Patients answer a short interactive quiz to confirm they understand the procedure, risks, and expected outcomes. Correct answers are highlighted in green with instant feedback — strengthening the legal validity of the consent.

![Comprehension quiz](/screenshots/consent-04-quiz.png)

---

### Step 5: Electronic Signature

The patient signs directly on screen — finger on mobile, mouse on desktop. The signature is captured as a high-resolution image and embedded in the final consent document.

![Signature](/screenshots/consent-06-signature.png)

---

### Step 6: Review & Submit

Before submitting, the patient reviews everything — personal details, medical answers, and their signature. Each section has an "Edit" button for corrections. The final button makes clear this is a binding consent declaration.

![Review](/screenshots/consent-05-review.png)

---

### Step 7: Confirmation

After submitting, the form is encrypted and transmitted. The patient sees a clear confirmation. If payment is required, they're redirected to a secure Stripe checkout.

![Confirmation](/screenshots/consent-07-confirmation.png)

---

## What Happens After Submission

Once the patient submits, the encrypted consent appears instantly in your dashboard:

1. **Unlock the vault** with your practice master password
2. **View the decrypted consent** — patient details, medical answers, and signature
3. **Download a signed PDF** for your records
4. Every action is automatically logged in the **audit trail** with timestamps

---

## Security at Every Step

| Feature | How It Works |
|---|---|
| **End-to-end encryption** | Patient data is encrypted in the browser using RSA-4096 + AES-256-GCM before transmission. The server never sees plaintext data. |
| **Zero-knowledge architecture** | Even DermaConsent cannot read your patients' data — only your practice holds the decryption key. |
| **DSGVO/GDPR compliance** | All data stored on EU servers. Patients can request deletion at any time. |
| **Audit trail** | Every consent action (created, viewed, signed, revoked) is logged with timestamps. |

::: tip Want to see it live?
[Start your free trial](https://derma-consent.de/register) and send yourself a test consent form to experience the full flow.
:::
