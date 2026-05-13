---
name: Nazrah Al Alam General Contracting
description: A Saudi construction authority — deep navy weight, desert gold precision, bilingual confidence.
colors:
  navy: '#0E1F3A'
  navy-deep: '#0A1628'
  gold: '#E8B339'
  gold-soft: '#F2C75B'
  cloud: '#D9DCE0'
  stone: '#E8EAED'
  ink-dark: '#0F1117'
  ink-mid: '#5A6573'
  white: '#FFFFFF'
typography:
  display:
    fontFamily: 'Poppins, system-ui, sans-serif'
    fontSize: 'clamp(2.5rem, 6vw, 4rem)'
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: '-0.02em'
  headline:
    fontFamily: 'Poppins, system-ui, sans-serif'
    fontSize: 'clamp(1.875rem, 4vw, 3rem)'
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: '-0.01em'
  title:
    fontFamily: 'Poppins, system-ui, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: 'Poppins, system-ui, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: '0.22em'
rounded:
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '24px'
  full: '9999px'
spacing:
  sm: '16px'
  md: '24px'
  lg: '32px'
  xl: '56px'
  section: '80px'
components:
  button-primary:
    backgroundColor: '{colors.navy}'
    textColor: '{colors.white}'
    rounded: '{rounded.md}'
    padding: '16px 32px'
    typography: '{typography.title}'
  button-primary-hover:
    backgroundColor: '{colors.navy-deep}'
    textColor: '{colors.white}'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.navy}'
    rounded: '{rounded.md}'
    padding: '14px 32px'
  button-ghost-hover:
    backgroundColor: '{colors.navy}'
    textColor: '{colors.white}'
  button-gold:
    backgroundColor: '{colors.gold}'
    textColor: '{colors.navy}'
    rounded: '{rounded.md}'
    padding: '12px 24px'
  button-gold-hover:
    backgroundColor: '{colors.gold-soft}'
    textColor: '{colors.navy}'
  card-service:
    backgroundColor: '{colors.white}'
    rounded: '{rounded.lg}'
    padding: '24px'
  card-service-hover:
    backgroundColor: '{colors.white}'
    rounded: '{rounded.lg}'
---

# Design System: Nazrah Al Alam General Contracting

## 1. Overview

**Creative North Star: "The Builder's Mark"**

This is a system that signs its work. Every surface carries the weight of 25 years of completed projects — the deep navy of engineered steel, the gold of earned excellence. It does not borrow credibility from trend; it projects authority through discipline. The typographic hierarchy is strict. The color rules are strict. The layouts breathe. When a B2B decision-maker lands on this site, they should feel they have found the most capable contractor in the room before they read a single word.

The system is bilingual by design, not by afterthought. Arabic (RTL, Cairo) and English (LTR, Inter/Poppins) receive equal typographic care. Switching language must never feel like a degraded mode.

What this system explicitly rejects: the cluttered local-directory look (rainbow color schemes, wall-of-text service lists, low-res stock photography), the cold corporate bank aesthetic (sterile white-on-grey, buried contact paths, impersonal copy), and the flashy entertainment site (gratuitous animation, neon dark-mode, spectacle without substance).

**Key Characteristics:**

- Authority through density: sections are full-width, navy dark, gold-accented — the site fills the viewport with confidence
- Restraint in the gold: the accent earns its visibility by appearing sparingly — eyebrows, underline bars, CTA sections, hover states
- Proof-first layout: every claim is anchored by a number, photo, or credential
- Flat at rest, lifted on hover: cards, buttons, and elements are flat by default; interaction reveals warmth (gold borders, navy shadows)
- Bilingual parity: RTL Arabic never feels like a port — it is a native mode

## 2. Colors: The Bedrock Palette

A two-hero palette — one that could only be a Saudi construction authority.

### Primary

- **Deep Night Steel** (`#0E1F3A`): The structural backbone. Used as the hero section background, primary button fill, navbar, dark section backgrounds (Why Choose Us, etc.), and the heading color on light surfaces. When in doubt, the answer is navy.
- **Deep Night Steel — Dark** (`#0A1628`): Used exclusively as the hover state for navy surfaces. Never used as a default background.

### Secondary

- **Desert Sun Gold** (`#E8B339`): The mark. Used as the section eyebrow color, the underline bar under every headline, the CTA banner background (full-bleed), hover border on cards, and the accent on the WhatsApp button. Rarity is the rule — gold on ≤15% of any given screen.
- **Desert Sun Gold — Soft** (`#F2C75B`): The warm hover. Used only as the hover state for gold surfaces and gold buttons.

### Neutral

- **Cloud** (`#D9DCE0`): The page canvas. Default background for standard page sections and cards in alternating-section layouts. Slightly warm — not pure white, never clinical.
- **Stone** (`#E8EAED`): Slightly lighter than Cloud. Used for input backgrounds, table rows, and subtle dividers.
- **Ink — Dark** (`#0F1117`): Near-black body text on light surfaces. Used for primary paragraph text, nav links, and form labels.
- **Ink — Mid** (`#5A6573`): Secondary text — service card descriptions, subtitles, metadata. Never used for primary labels or actions.
- **White** (`#FFFFFF`): Card backgrounds, modal surfaces. Distinguished from Cloud; used when maximum contrast against page canvas is needed.

### Named Rules

**The Gold Scarcity Rule.** Desert Sun Gold appears on ≤15% of any screen. Its weight comes from rarity. Dilute it across backgrounds and it becomes wallpaper. Use it for one purpose per section: the eyebrow, the underline bar, the CTA background, or the hover treatment — never two at once.

**The One Dark Rule.** Never layer two dark navy surfaces without a visible seam or content break. Deep Night Steel sections must be separated by a Cloud or White section, or by a gold-background CTA band.

## 3. Typography: The Standard Press

**Display Font:** Poppins (Bold 700 / ExtraBold 800) — `var(--font-poppins), system-ui, sans-serif`
**Body Font:** Inter (Regular 400 / Medium 500) — `var(--font-inter), system-ui, sans-serif`
**Arabic Display:** Cairo — `var(--font-cairo), system-ui, sans-serif`
**Arabic Body:** IBM Plex Sans Arabic — `var(--font-ibm-plex-arabic), system-ui, sans-serif`

**Character:** Poppins carries command — it is tight, geometric, and legible at scale. Inter is transparent at reading size; it does not compete. Together they produce a voice that is authoritative in headers and human in body copy. In Arabic, Cairo inherits the same role as Poppins — structured, confident — while IBM Plex Arabic provides readable body text with construction-grade legibility.

### Hierarchy

- **Display** (ExtraBold 800, `clamp(2.5rem, 6vw, 4rem)`, line-height 1.1, tracking -0.02em): Hero headline only. The single biggest statement on the page. Appears once per view.
- **Headline** (Bold 700, `clamp(1.875rem, 4vw, 3rem)`, line-height 1.2, tracking -0.01em): Section titles (h2). Always followed by the gold underline bar (`h-1 w-14 bg-gold rounded-full`). This pairing is a system signature.
- **Title** (SemiBold 600, `1.125rem`, line-height 1.4): Card headings, service names, testimonial names. The workhorse of the content layer.
- **Body** (Regular 400, `1rem`, line-height 1.625): All descriptive copy. Max line length 65–72 characters. On dark (navy) backgrounds, use `white/80` or `cloud/80`; never pure white for long prose.
- **Label** (Bold 700, `0.75rem`, line-height 1.5, tracking 0.22em, ALL CAPS): Section eyebrows, badge text, metadata. Always in gold on any background. Always followed by a gold chevron SVG `>` accent.

### Named Rules

**The Eyebrow Signature Rule.** Every section header begins with a Label-size eyebrow in Desert Sun Gold, tracking 0.22em, uppercase, accompanied by a gold chevron (`stroke="#E8B339"`, 2.5px). The eyebrow + chevron + Headline + gold underline bar is the system's visual handshake. Never omit it on primary sections.

**The Headline Bar Rule.** Every Headline (h2) is followed immediately by a `1px × 56px` gold bar (`h-1 w-14 rounded-full bg-gold`). This bar is a system signature; it is not decorative. Do not replace it with a gradient, a border, or a wider bar.

## 4. Elevation

This system is **flat by default, lifted on interaction**. Surfaces rest without shadow. When a user hovers a card or focuses a button, the shadow appears as a response to intent — not as decoration.

Three shadow roles exist: gold ambient glow (accent elements), navy structural shadow (hover lift), and the default `shadow-sm` (barely perceptible baseline for white cards on Cloud backgrounds).

### Shadow Vocabulary

- **Gold ambient — subtle** (`0 2px 12px 0 rgba(232,179,57,0.15)`): Used beneath gold-accented elements on hover, or as a glow on the WhatsApp FAB. Warm, diffuse.
- **Gold ambient — strong** (`0 4px 24px 0 rgba(232,179,57,0.25)`): Stronger gold glow for primary CTA hover states.
- **Navy structural** (`0 4px 24px 0 rgba(14,31,58,0.20)`): Used on card hover (`hover:shadow-navy-md`). Grounds the card with a cool shadow that reads as depth, not warmth.
- **Base** (`shadow-sm`): The invisible baseline for white cards sitting on the Cloud canvas. Present; imperceptible.

### Named Rules

**The Flat-By-Default Rule.** All surfaces — cards, buttons, sections — are flat at rest. Shadows appear only when the user acts (hover, focus) or when a white card floats over a Cloud background and needs a minimum separation hint. Never add a shadow to communicate importance; communicate importance with color and scale.

## 5. Components

**Character:** Bold and approachable. Navy gives structural weight; gold warmth softens the interaction. Corners are gently rounded (12px default on interactive elements), never sharp, never pill-shaped except for the WhatsApp FAB.

### Buttons

- **Shape:** Gently rounded corners (12px radius, `rounded-xl`)
- **Primary (navy):** Navy background (`#0E1F3A`), white text, Poppins Bold, `px-8 py-4` (32px/16px). Hover darkens to `#0A1628`. No border.
- **Ghost:** Transparent background, 2px navy border, navy text. Hover fills navy with white text. Same padding and radius as primary.
- **Gold (CTA):** Gold background (`#E8B339`), navy text, Poppins Bold. `px-6 py-3`. Hover softens to `#F2C75B`. Used exclusively inside gold CTA banner sections and quote flow.
- **Transitions:** `transition-colors` (150ms) on background/border. No scale transform on buttons.

### Cards / Containers

- **Service card:** White background, 16px radius (`rounded-2xl`), 2px border (`border-navy/8` at rest, `border-gold/50` on hover), `p-6` internal padding. Hover: `-translate-y-1` lift + `shadow-navy-md` + gold border. Transition: `duration-300`.
- **Testimonial card:** Same radius and white background. No hover translate. `border-navy/8` at rest. Star rating row in gold (`text-gold`) at top.
- **Why Choose Us card (dark):** On navy background. `border-white/10` at rest, `border-gold/40` on hover. `bg-white/5` fill with `backdrop-blur-sm`. Text: white headline, `white/65` description.

### Section Header (Signature Component)

The most-used composite component. Fixed structure, not to be altered:

1. Eyebrow: Poppins Label, uppercase, gold, tracking 0.22em + gold chevron SVG
2. Headline (h2): Poppins Bold, navy (or white on dark bg) + gold underline bar (1px × 56px, `rounded-full`)
3. Subtitle: Inter Body, `ink-500` (or `cloud/80` on dark bg), max-width `max-w-2xl`

Never skip the underline bar. Never change the eyebrow to a different color. Never right-align on LTR layouts.

### Navigation

- Background: Navy (`#0E1F3A`) with backdrop blur when scrolled.
- Links: Inter Medium, `white/80` at rest, `white` on hover, gold on active page.
- CTA button in nav: Gold background, navy text, `rounded-xl`, `px-4 py-2`.
- Mobile: hamburger collapses to full-screen navy overlay.

### WhatsApp FAB

- `h-14 w-14`, `rounded-full`, WhatsApp green (`#25D366`), white icon. Fixed `bottom-6 end-6`.
- Animate-ping pulse ring: same green, `opacity-30`.
- Hover: `scale-110`. Focus: `ring-4 ring-green-400/50`.
- This is the primary mobile conversion touch-point. Never hide it, never recolor it.

## 6. Do's and Don'ts

### Do:

- **Do** use Deep Night Steel (`#0E1F3A`) as the default dark surface. It is the system's structural backbone on hero sections, Why Choose Us, and the footer.
- **Do** follow the eyebrow + headline + gold underline bar sequence on every major section header. It is the system's handshake.
- **Do** keep gold to ≤15% of any screen surface. Its authority depends on its scarcity.
- **Do** use real photography (equipment, projects, workers) over stock images. Per PRODUCT.md: "Show scale — large equipment photos and real project shots do the selling."
- **Do** anchor every capability claim to a number or credential (years, fleet units, project count). Trust through proof.
- **Do** treat the WhatsApp FAB as a primary conversion element. Keep it visible on all screen sizes at all scroll positions.
- **Do** give Arabic (RTL) mode the same typographic weight as English. Cairo for headings, IBM Plex Arabic for body. Never fall back to a system Arabic font.
- **Do** use `transition-colors duration-300` on interactive elements. State changes are visible but not theatrical.

### Don't:

- **Don't** use a cluttered local-directory layout — no wall-of-text service lists, no rainbow accent colors, no low-res stock photography. These were named as prohibited references.
- **Don't** use a cold bank aesthetic — no sterile white-on-grey palettes without navy or gold presence, no buried contact paths, no impersonal copy.
- **Don't** use flashy nightclub or entertainment-site treatments — no dark-mode neon, no gratuitous scroll animations, no design that prioritizes spectacle over credibility.
- **Don't** place gold text on a gold background, or gold borders alongside gold fill in the same component. The color loses meaning when it competes with itself.
- **Don't** use more than two typefaces. Poppins for all headings and labels. Inter for all body. Arabic equivalents for RTL. Adding a third display font breaks the system voice.
- **Don't** use a box-shadow on elements at rest. Flat-By-Default Rule. Shadows are reserved for hover and focus states.
- **Don't** reduce heading contrast below AA on either navy or cloud backgrounds. WCAG AA is the floor, not the target.
- **Don't** reorder the section header elements (eyebrow → headline → underline bar → subtitle). This sequence is a system signature, not a suggestion.
