# Consent Types

Derma Consent supports six procedure-specific consent form types, each with tailored fields and risk disclosures appropriate for the procedure.

## Types

### BOTOX

**Botulinum toxin injections** — used for wrinkle reduction, hyperhidrosis, and muscle relaxation.

Common treatment areas: forehead lines, glabella (frown lines), crow's feet, jawline slimming.

### FILLER

**Dermal filler injections** — hyaluronic acid or other biocompatible materials for volume restoration and contouring.

Common treatment areas: lips, nasolabial folds, cheeks, chin, jawline, under-eyes.

### LASER

**Laser treatments** — covers a range of procedures including skin resurfacing, hair removal, vascular treatment, and pigmentation correction.

### CHEMICAL_PEEL

**Chemical peel procedures** — application of chemical solutions to improve skin texture and appearance. Includes superficial, medium, and deep peels.

### MICRONEEDLING

**Microneedling / collagen induction therapy** — controlled micro-injuries to stimulate collagen production. Often combined with growth factors or PRP.

### PRP

**Platelet-rich plasma therapy** — autologous blood-derived growth factors injected to promote tissue regeneration and rejuvenation.

## Consent Form Structure

Each consent form includes:

| Section | Description |
|---------|-------------|
| **Procedure information** | What the treatment involves, expected outcomes |
| **Risk disclosure** | Potential side effects and complications |
| **Contraindications** | Medical conditions that may prevent treatment |
| **Patient medical history** | Allergies, medications, prior treatments |
| **Pre/post-care instructions** | What to do before and after the procedure |
| **Consent confirmation** | Patient acknowledgment and understanding |
| **E-signature** | Digital signature with timestamp and IP logging |

## Configuration

Practices can enable or disable consent types via **Practice Settings**. Only enabled types appear when creating new consent forms.

The enabled consent types are stored in the `PracticeSettings` model and can be managed by ADMIN users through the settings page.

## Body Regions

Treatment photos and plans can be tagged with body regions:

| Region | Description |
|--------|-------------|
| `FOREHEAD` | Forehead area |
| `GLABELLA` | Between the eyebrows |
| `PERIORBITAL` | Around the eyes |
| `CHEEKS` | Cheek area |
| `NASOLABIAL` | Nose-to-mouth lines |
| `LIPS` | Lip area |
| `CHIN` | Chin area |
| `JAWLINE` | Along the jaw |
| `NECK` | Neck area |
| `DECOLLETE` | Upper chest |
| `HANDS` | Hands |
| `SCALP` | Scalp area |
| `OTHER` | Other body region |
