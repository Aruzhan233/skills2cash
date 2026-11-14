---
name: Skills2Cash
description: Turn what you know into what you can confidently offer and sell.
colors:
  workshop-black: "#07070b"
  bench-surface: "#0e0e15"
  raised-surface: "#14141d"
  inset-surface: "#1b1b26"
  hairline: "#262633"
  hairline-strong: "#34344a"
  ink: "#f4f4f8"
  ink-secondary: "#c9c9d6"
  ink-muted: "#9a9ab0"
  workshop-violet: "#8b5cf6"
  workshop-violet-deep: "#7c3aed"
  violet-glow: "#c4b5fd"
  violet-tint: "#1e1730"
  signal-good: "#34d399"
  signal-warn: "#fbbf24"
  signal-bad: "#f87171"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "0.05em"
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.workshop-violet}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.workshop-violet-deep}"
  button-secondary:
    backgroundColor: "{colors.inset-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  card:
    backgroundColor: "{colors.bench-surface}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  input:
    backgroundColor: "{colors.raised-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "40px"
  badge:
    backgroundColor: "{colors.inset-surface}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-violet:
    backgroundColor: "{colors.violet-tint}"
    textColor: "{colors.violet-glow}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  nav-item-active:
    backgroundColor: "{colors.violet-tint}"
    textColor: "{colors.violet-glow}"
    rounded: "{rounded.md}"
    padding: "6px 8px"
---

# Design System: Skills2Cash

## Overview

**Creative North Star: "The Night Workshop"**

A quiet, dark workshop where a skill is turned into a service. The room is near-black and calm so the work on the bench is what you see: an offer being drafted, a price being reasoned, a client conversation being rehearsed. Violet is the workshop's one lamp. It lights whatever matters right now — the next action, the current step, the thing just earned — and stays off everything else.

The interface is an instrument, not a showroom. Density is moderate: bordered cards on a dark ground, small text, tight labels, and a great many progress bars and status badges, because the product's job is to show honestly where the user stands. Depth comes from tonal layering of four near-black surfaces separated by hairline borders, not from shadows.

This document records the system as currently implemented in `src/app/globals.css` and `src/components/ui.tsx`. It is a description of what exists, not a redesign.

**Key Characteristics:**
- Dark only. Near-black ground with a faint violet radial and grid on marketing and auth pages.
- One accent hue (violet) plus three status colours (good, warn, bad).
- Flat, bordered surfaces; shadows only for floating layers and violet glows on brand moments.
- Compact type: 14px body, 12px labels, bold tight headlines.
- Progress is everywhere and always computed from real activity.

## Colors

A near-black neutral ramp with a single violet accent and three functional status colours.

### Primary
- **Workshop Violet** (#8b5cf6): primary buttons, progress fills, completed step markers, active borders (usually at 30–60% opacity), focus rings.
- **Workshop Violet Deep** (#7c3aed): primary button hover and the dark end of violet gradients on achievement and level tiles.
- **Violet Glow** (#c4b5fd): accent text on dark — links, eyebrow labels, active navigation text, XP values, small icons.
- **Violet Tint** (#1e1730): the lit surface. Background of active navigation items, violet badges, the "recommended next action" card and current-step tiles.

### Neutral
- **Workshop Black** (#07070b): page background and theme colour.
- **Bench Surface** (#0e0e15): cards and the main container surface.
- **Raised Surface** (#14141d): inputs, list rows inside cards, menus, toasts.
- **Inset Surface** (#1b1b26): progress tracks, neutral badges, secondary buttons, hover fills.
- **Hairline** (#262633): default card and divider border.
- **Hairline Strong** (#34344a): input borders, pills, secondary button borders.
- **Ink** (#f4f4f8): headings and primary text.
- **Ink Secondary** (#c9c9d6): body text inside cards.
- **Ink Muted** (#9a9ab0): supporting text, captions, inactive navigation.

### Status
- **Signal Good** (#34d399): completed, passed, 80+ scores.
- **Signal Warn** (#fbbf24): hypotheses, sub-60 scores, demo mode, offline samples.
- **Signal Bad** (#f87171): errors and failed saves.

Status colours are used as text and icon colour over a 5–10% tint of themselves with a 25–30% border, never as solid fills.

### Named Rules
**The One Lamp Rule.** Violet marks what matters now: the next action, the current step, the active item, something just earned. If everything on a screen is violet, nothing is.

**The Honest Colour Rule.** Good, warn and bad mean status only. Warn in particular labels things that are unverified — price hypotheses, offline samples, provisional scores — and is not decoration.

## Typography

**Display Font:** Inter (with ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial)
**Body Font:** the same stack
**Label/Mono Font:** the default monospace stack, used only for small numeric scores

**Character:** One sans family throughout, differentiated by weight and size. Bold, tightly tracked headlines over small, calm body text. Note: Inter is named in the stack but no webfont is loaded, so most visitors currently see their system UI font.

### Hierarchy
- **Display** (700, 2.25rem → 3.75rem at `sm`, line-height 1.08, tracking-tight): landing hero only.
- **Headline** (700, 1.5rem → 1.875rem at `sm`, tracking-tight): page titles (`PageHeader`).
- **Title** (600, 1rem): card titles (`CardTitle`); 1.125–1.25rem for featured card headings.
- **Body** (400, 0.875rem): nearly all interface text. Supporting copy is the same size in Ink Muted.
- **Label** (500, 0.75rem): captions, badges, helper text. Section eyebrows are uppercase with 0.05em tracking. A few micro-labels drop to 10–11px.
- **Numeric** (700, 1.875–3.75rem): readiness score, journey percentage, counts.

## Layout

A centred container (`max-w-7xl`, 1280px) with 16px side padding on mobile and 24px from `sm`. A sticky 56px header with a blurred near-black background sits above optional mode banners (demo, guest, local).

Pages are stacks of cards on a 16px gap, arranged in two- or three-column grids from `lg` (1024px) and a single column below. Common splits: 2/3 + 1/3, and a fixed 320–380px side column beside a fluid main column. Cards use 20px padding; page headers have 24px below them.

Each learning page opens with a slim context row (breadcrumbs on the left, "Step N of 6" and a six-segment progress strip on the right) and ends with a single "Next in your journey" link.

Breakpoints are Tailwind's defaults: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px. The desktop navigation appears at `lg`; below it a menu button opens a vertical, numbered journey list.

## Elevation & Depth

Flat by default. Depth is tonal: Workshop Black → Bench Surface → Raised Surface → Inset Surface, each step separated by a 1px hairline. Cards carry no shadow.

### Shadow Vocabulary
- **Floating layer** (`shadow-2xl`): user menu and toasts only.
- **Primary button edge** (`box-shadow: 0 0 0 1px #a78bfa33 inset`): a faint inner ring on violet buttons.
- **Violet glow** (`0 0 10–18px rgba(139,92,246,0.35–0.45)`): the logo, level tile, unlocked achievement tiles and achievement toasts.

### Named Rules
**The Earned Glow Rule.** Glow is reserved for the brand mark and for things the user has earned. Ordinary cards and buttons do not glow.

## Shapes

Rounded but not soft. Radius grows with the size of the container: 6px for navigation items, 8px for buttons, inputs and list rows, 12px for inner tiles and notices, 16px for cards, and full pills for badges, chips, progress bars and step markers. Every surface has a 1px border; there are no borderless floating cards. Step markers and avatars are circles; icon tiles are 12px-radius squares.

## Components

### Buttons
- **Shape:** 8px radius; heights 32 / 40 / 48px (`sm` / `md` / `lg`); medium weight, 14px text.
- **Primary:** Workshop Violet with white text and the inset edge ring; hover shifts to Workshop Violet Deep.
- **Secondary:** Inset Surface with a Hairline Strong border; hover border turns violet at 60%.
- **Ghost:** text only in Ink Secondary; hover adds an Inset Surface fill.
- **Danger:** Signal Bad text on a 10% tint with a 30% border.
- **States:** disabled at 50% opacity; loading shows a spinning icon before the label. Focus is a 2px Violet Glow outline with 2px offset, global to all focusable elements.

### Badges and chips
- **Style:** full-pill, 12px medium text, 1px border; tones neutral, violet, good, warn, bad.
- **Use:** status ("Current plan", "You are here"), difficulty, score pills, source labels ("Demonstrated", "Self-reported", "AI-generated", "Offline sample — not AI").

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** Bench Surface; featured cards use a violet-tint gradient with a violet border at 30–50%.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px Hairline.
- **Internal Padding:** 20px. Rows inside cards are Raised Surface tiles with 12px radius and 10–12px padding.

### Inputs / Fields
- **Style:** Raised Surface, 1px Hairline Strong border, 8px radius, 40px height, 14px text; label above in 14px medium Ink Secondary; hint below in 12px muted.
- **Focus:** border turns violet with a 2px violet ring at 30%.
- **Error / Disabled:** error text in Signal Bad below the field; disabled at 60% opacity.

### Navigation
- **Desktop:** Home, a divider, then the six journey steps joined by small chevrons. Inactive items are Ink Muted, completed steps Ink Secondary, the active step sits on Violet Tint in Violet Glow. The readiness score rides on the Readiness item; level and XP sit in a pill on the right, next to the avatar menu.
- **Mobile:** a numbered vertical list with check marks for completed steps, then a separate Account group.
- **Sub-navigation:** two-tab rows inside Service Builder (Offer / Pricing Builder) and Missions (Weekly / Skill).

### Progress
The signature component. A 8px pill track in Inset Surface with a violet gradient fill (Workshop Violet → Violet Glow); green when complete, muted grey for self-reported values. It appears on nearly every screen, always paired with the real figure it represents.

### Journey steppers
Numbered circles joined by a 1px line. Completed steps are solid violet with a check, the current step is outlined violet on Violet Tint, upcoming steps are Inset Surface with muted numerals.

## Do's and Don'ts

### Do:
- **Do** keep the interface dark, on the Workshop Black ground, with violet as the only accent hue.
- **Do** use the official logo from `public/brand/skills2cash-logo.png` exactly as supplied.
- **Do** separate surfaces with 1px hairlines and tonal steps rather than shadows.
- **Do** pair every progress bar, score and percentage with the real number it comes from.
- **Do** give the next recommended action the most visual weight on a page.
- **Do** keep the 2px Violet Glow focus outline on every interactive element.

### Don't:
- **Don't** recolour, distort, crop or replace the logo.
- **Don't** introduce a light theme or a second accent hue.
- **Don't** use good, warn or bad colours for decoration.
- **Don't** add glow to ordinary cards or buttons; it is reserved for the logo and earned moments.
- **Don't** show placeholder or invented progress, scores, testimonials or customer logos.
- **Don't** mix the Pricing Builder (the user's service prices) with Subscription (platform billing) in one view.
