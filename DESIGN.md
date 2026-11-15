---
name: Skills2Cash
description: Turn what you know into what you can confidently offer and sell.
colors:
  bg: "#08060d"
  rail: "#100a1c"
  surface: "rgb(24 15 44 / 0.58)"
  surface-2: "rgb(38 24 68 / 0.55)"
  surface-3: "rgb(58 38 102 / 0.5)"
  line: "rgb(197 167 255 / 0.11)"
  line-strong: "rgb(197 167 255 / 0.2)"
  ink: "#f8f6ff"
  ink-2: "#d5cde6"
  muted: "#a69bb8"
  ink-2-lit: "#ebe4fb"
  muted-lit: "#cdbfee"
  violet: "#963fff"
  violet-strong: "#782bff"
  violet-deep: "#321078"
  violet-soft: "#c5a7ff"
  violet-tint: "rgb(120 43 255 / 0.16)"
  spark: "#f2be6a"
  good: "#3fcf8e"
  warn: "#fb923c"
  bad: "#f87171"
typography:
  display:
    fontFamily: "Sora, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.9rem"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Sora, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Sora, Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.025em"
  figure:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: "2.25rem"
    letterSpacing: "-0.025em"
    fontFeature: "\"tnum\""
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    fontFeature: "\"tnum\""
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
    fontFeature: "\"tnum\""
rounded:
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
  4xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.violet-strong}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "40px"
  button-primary-sm:
    backgroundColor: "{colors.violet-strong}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "0 14px"
    height: "32px"
  button-primary-lg:
    backgroundColor: "{colors.violet-strong}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "0 24px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-3}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  card-lit:
    backgroundColor: "{colors.violet-deep}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "28px"
  input:
    backgroundColor: "rgb(12 8 24 / 0.6)"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "8px 14px"
    height: "40px"
  badge-neutral:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-violet:
    backgroundColor: "{colors.violet-tint}"
    textColor: "{colors.violet-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-spark:
    backgroundColor: "rgb(242 190 106 / 0.1)"
    textColor: "{colors.spark}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  journey-rail:
    backgroundColor: "{colors.rail}"
    width: "264px"
  journey-step-current:
    backgroundColor: "{colors.violet-tint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  progress-track:
    backgroundColor: "rgb(255 255 255 / 0.07)"
    rounded: "{rounded.full}"
    height: "6px"
---

# Design System: Skills2Cash

## Overview

**Creative North Star: "Rising Horizon"**

Your skill is a light source. Every screen sits on a night sky with a violet planet-edge of light rising behind the top of the page, and the further the user moves along the journey the higher and brighter that horizon sits. Glass panels float over the sky with a lavender hairline and a soft top highlight, so the atmosphere reads through the work instead of being walled off behind grey boxes. On each application screen exactly one panel is lit: a deep-violet panel lit from its top-right corner that holds the next action.

Light is meaning. Violet light marks action, the current step and selection; the completed stretches of the journey rail glow violet; progress fills are violet-to-lavender bars with a soft halo. Gold light is a separate, rarer currency: it appears only on XP, levels and achievements, things the user has actually earned. Good, warn and bad are status colours and nothing else. Sora carries display and headings, Geist carries everything else, and every number is tabular.

The landing page (Persuade) carries the strongest atmosphere: a huge particle sphere rising from below the hero, gradient type on the headline accent, and a glass product preview emerging under the arc. The application (Operate) keeps the same world at lower volume: a fixed sky with slowly drifting light pools and a faint masked grid, the horizon arc fading out before mid-page content, glass cards and one lit panel.

**Key Characteristics:**
- Dark only, on a night-sky ground (#08060D) with a deeper violet-black rail.
- Translucent glass surfaces over a living sky; the sky, horizon and grid are fixed atmosphere, never content.
- One lit deep-violet panel per application screen, holding the next action.
- Violet light for action, current step, selection and progress; gold light only for earned XP, levels and achievements; good, warn and bad for status only.
- Sora display and headings, Geist text, tabular numerals, a 12px floor.
- Exponential ease-out motion: one entrance rise, hover lift on glass, animated progress fills; everything static under reduced motion.

## Colors

A night sky lit from below by electric violet, with one warm gold reserved for reward.

### Primary
- **Electric Violet** (violet-strong): the base of every primary button (a top-lit gradient from #9a4dff to this), the current journey marker, the start of progress fills and the coloured end of the horizon's outer glow.
- **Horizon Violet** (violet): focus borders on fields, the next-step marker ring, chart series, and the mid-tone of the horizon and lit panels.
- **Lavender Rim** (violet-soft): the focus outline, the caret, "Next step:" prefixes and card links, the top of progress fills and rail path, and the rim light of the horizon and sphere.
- **Deep Night Violet** (violet-deep): the body of lit panels and the far side of orbs and stage markers.
- **Violet Haze** (violet-tint): translucent fill for the current rail step, violet badges, icon wells and the guest banner.

### Secondary
- **Spark Gold** (spark): XP counts, level badges, level and XP progress fills (gradient from #d99a3c), achievement medallions with a gold glow, and the border of reward toasts. Never a button, link or decoration.

### Tertiary
- **Good** (good), **Warn** (warn), **Bad** (bad): status only. Good marks completion and current plan; warn marks what is unverified (demo mode, offline samples, price hypotheses); bad marks errors and invalid fields. Each is used as text on a 10% tint of itself with a 20% ring.

### Neutral
- **Night Sky** (bg): the page ground behind the sky layer and the colour gradients fade into.
- **Rail Night** (rail): the journey rail's base and the fill of un-started rail markers; the desktop rail itself is a translucent violet-to-night gradient over this.
- **Glass** (surface), **Raised Glass** (surface-2), **Inset Glass** (surface-3): translucent violet-night layers. Surface is the card body; surface-2 is hover, secondary buttons and chat bubbles; surface-3 is the neutral badge and pressed hover.
- **Lavender Hairline** (line) and **Strong Hairline** (line-strong): translucent lavender borders and dividers; strong for fields, secondary buttons and un-started markers.
- **Starlight** (ink): primary text. **Mist** (ink-2): secondary text and body copy on the landing page. **Dusk** (muted): captions, hints, units and placeholder text.
- **Lit Mist** (ink-2-lit) and **Lit Dusk** (muted-lit): the secondary text colours inside a lit panel, which re-tints ink-2 and muted to these so they keep contrast on violet.

### Named Rules
**The Translucent Surface Rule.** Surface, line and tint tokens are translucent so the sky reads through them. Never replace them with opaque hex; a surface that hides the atmosphere breaks the world.

**The One Lit Panel Rule.** Each application screen has at most one lit deep-violet panel, and it holds the next action. Everything else is glass.

**The Earned Gold Rule.** Gold appears only on things the user has earned or is earning: XP, levels, achievements, reward toasts. A greyed XP count turns gold when the mission is completed.

**The Honest Status Rule.** Good, warn and bad describe state only. Warn labels what is unverified and is never used to draw the eye.

## Typography

**Display Font:** Sora (via `--font-sora`, falling back to Geist then system sans)
**Body Font:** Geist (via `--font-geist`, falling back to system sans)

**Character:** Sora's wide, geometric shapes give the headings a futuristic, luminous voice; Geist keeps the working interface compact and calm. Every `h1` and `h2` is set in Sora at -0.02em tracking with balanced wrapping; `h3` and below stay in Geist.

### Hierarchy
- **Display** (Sora 600, 2.5rem on mobile rising to 3.9rem at xl, line-height 1.06): the landing headline only. Its second line is the gradient accent.
- **Headline** (Sora 600, 1.75rem rising to 2.125rem, line-height 1.25): every application page title. The dashboard greeting runs larger (1.875rem to 2.5rem); landing section titles run 1.875rem to 2.6rem.
- **Title** (Sora 600, 1rem, line-height 1.375): card titles. The lit panel's "Next step" title is 1.25rem to 1.5rem; empty-state titles are 1.125rem.
- **Figure** (Geist 600, 1.75rem, line-height 2.25rem, tabular): the large numbers in the dashboard figures column, with the unit beside it in 14px Dusk.
- **Body** (Geist 400, 14px, line-height 20px, tabular): nearly all interface text. Page subtitles are relaxed leading at 68ch; the lit panel's reason line is 60ch. Landing body runs 16px to 18px.
- **Label** (Geist 500, 12px, line-height 16px, tabular, sentence case): badges, hints, XP counts, rail details and chart ticks.

### Named Rules
**The 12px Floor Rule.** Nothing in the interface is set below 12px, chart ticks and tooltips included.

**The Tabular Figures Rule.** Numerals are tabular everywhere (set on `body`). A number sits as plain text with its unit in muted 14px beside it.

**The Earned Gradient Type Rule.** Gradient type (pale lavender through #C5A7FF to #963FFF) is reserved for the landing headline accent and a few key words: one or two words in a landing section title, the demo persona's name, and the user's first name in the dashboard greeting. Never a whole heading, never body text, never a button label.

**The Title First Rule.** Nothing sits above a page title to announce it. Page meta (week, disclaimers, source badges) follows the title.

## Layout

The application is a fixed left rail (264px) and a main column capped at 1180px, with 16px side padding on mobile, 24px from sm and 40px from lg, and 32px to 40px of top padding. A sticky 56px glass header holds breadcrumbs and the user menu. Below lg the rail becomes a drawer (min(288px, 86vw)) opened from the header.

Content sits in 16px-gap grids of cards. The dashboard opens with the lit next-action panel beside a 300px figures column, then a full-width journey card, then 2:1 and 1:1 card rows. Card padding is 20px on mobile and 24px from sm; the lit panel takes 20px to 28px. Every learning page ends with a "Next:" link 48px below the content, separated by a hairline.

The atmosphere is layered and fixed: the sky sits behind everything at z -1; the horizon sits under the header in a masked box so it fades out by about 420px below the header from md up (520px on mobile), and its sides never cross mid-page headings. The horizon rises 25px and brightens from 45% to full opacity as journey progress goes from 0 to 100.

The landing page uses a 1152px container (1280px for the hero text at xl), a floating glass nav inset 12px from the top, and generous 64px to 112px section padding.

Breakpoints are Tailwind's defaults: sm 640px, md 768px, lg 1024px, xl 1280px.

## Elevation & Depth

Depth is light, not grey. The world has three planes: the sky (fixed, drifting light pools, a faint 56px grid masked to fade with depth), glass (translucent panels blurred 18px over the sky), and float (denser glass at 92% to 94% opacity, blurred 22px, for menus, the mobile drawer and toasts). Glass carries a lavender hairline, an inner 1px white highlight at the top and a soft dark drop. Lit and interactive elements cast violet light: primary buttons and the lit panel throw a violet glow below themselves, progress fills and completed rail segments carry a soft halo, and earned gold elements carry a gold glow.

### Shadow Vocabulary
- **Float** (`0 18px 40px -12px rgb(0 0 0 / 0.7), 0 2px 8px -2px rgb(0 0 0 / 0.5)`): floating layers and chart tooltips.
- **Glow** (`0 10px 30px -8px rgb(120 43 255 / 0.55), 0 2px 6px -2px rgb(20 6 50 / 0.6)`): primary buttons and lit icon wells.
- **Glow Large** (`0 30px 70px -24px rgb(120 43 255 / 0.6), 0 8px 24px -12px rgb(10 4 30 / 0.8)`): the lit panel and the landing product preview.
- **Gold** (`0 8px 24px -8px rgb(242 190 106 / 0.45)`): earned achievement medallions and the level badge.
- **Glass rest** (`inset 0 1px 0 rgb(255 255 255 / 0.06), 0 20px 40px -24px rgb(0 0 0 / 0.8)`): every glass panel.
- **Glass hover** (`inset 0 1px 0 rgb(255 255 255 / 0.08), 0 24px 48px -24px rgb(120 43 255 / 0.45)`): interactive glass cards, with a 2px lift.

### Named Rules
**The Light Means Something Rule.** Violet glow marks action, the current step and progress; gold glow marks reward. Nothing glows for decoration alone outside the sky, the horizon and the landing hero.

**The Unprefixed Blur Rule.** Hand-written glass materials declare `backdrop-filter` unprefixed only. The minifier dropped the unprefixed property when both forms were present.

**The Lit Replaces Glass Rule.** A lit panel replaces the glass material rather than stacking on it, and re-tints secondary text inside itself.

## Shapes

Soft, generous rounding, and circles for anything that marks a point on the path. Cards, lit panels, menus and toasts use 16px corners; large landing panels and the product preview use 24px. Buttons and fields use 12px (small buttons 8px); rail items and list rows use 8px. Badges, progress tracks, journey markers, avatars and orbs are fully round. Chat bubbles are 16px with the speaker's bottom corner cut to 6px. Borders are 1px translucent lavender hairlines; there are no heavy strokes and no offset shadows.

The horizon is a single shape: a huge circle (150% of the viewport, at least 1100px) whose top edge is a lavender rim with stacked violet glows, seen only as an arc.

## Components

### Buttons
Lit, rounded and slightly lifting.
- **Shape:** gently rounded (12px; 8px for the small size). Sizes are 32px, 40px and 48px tall.
- **Primary:** a top-lit violet gradient (#9a4dff to Electric Violet) with white 14px medium text, an inner white highlight and the Glow shadow. Hover brightens 10% and lifts 1px; active settles back and dims. One per panel.
- **Secondary:** Raised Glass with a Strong Hairline, a 12px backdrop blur and an inner highlight; hover moves to Inset Glass with a lavender border.
- **Ghost:** transparent, Mist text; hover takes Raised Glass and Starlight.
- **Danger:** bad text on a 10% bad tint with a 20% bad border.
- **All:** 200ms exponential ease-out on transform, filter, colour and shadow; disabled at 45% opacity; the global 2px Lavender Rim focus outline at 2px offset.

### Badges
- **Style:** fully round pills, 12px medium label text, a tinted fill with a matching inset ring. Neutral (Inset Glass, Mist), violet (Violet Haze, Lavender Rim), good, warn, bad and spark (10% tint of the hue, 20% to 25% ring).
- **Use:** source (Demonstrated, Self-reported, AI-generated, Offline sample), score, plan and page meta. Spark only for earned values.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** the glass material by default; a card given the lit material drops the glass material entirely.
- **Shadow Strategy:** Glass rest; interactive cards take Glass hover with a 2px lift. See Elevation & Depth.
- **Border:** 1px translucent lavender (13% on glass, 32% on lit).
- **Internal Padding:** 20px, 24px from sm. Card titles are Sora 16px with an optional 14px Dusk subtitle and a right-aligned Lavender Rim link.

### Lit Panel (signature)
The one next action on a screen. A deep-violet field lit by a radial of Horizon Violet from its top-right corner and a pool of Deep Night Violet at bottom-left, over a 140-degree gradient (#3a148c to #160a36), with a 32% lavender border, a bright inner highlight and Glow Large. A glass orb sits half-cropped in a corner. Inside it, muted and secondary text re-tint to Lit Dusk and Lit Mist. Holds a "Next step:" title (prefix in Lavender Rim), one reason line and one large primary button.

### Inputs / Fields
- **Style:** a dark translucent well (rgb 12 8 24 at 60%) with a Strong Hairline, 12px corners, 14px text, a 12px backdrop blur. Label above in 14px medium Starlight; hint below in 12px Dusk.
- **Focus:** border turns Horizon Violet, the well deepens, and a 4px violet ring at 20% appears.
- **Error / Disabled:** border at 70% bad with the message in 12px bad text; disabled at 60% opacity.

### Navigation
- **Journey rail:** 264px, a translucent violet-to-night gradient with an extra-large backdrop blur and a hairline right edge. Home and Dashboard links, then "Your journey": six steps joined by a 1px path. A completed step's segment becomes a lavender-to-violet gradient with a violet halo; its marker is a violet gradient disc with a check. The current step is a violet-haze row with an inset violet ring and an Electric Violet marker with a 4px ring and glow. The next step's marker is outlined in Horizon Violet with a "Next" label. Step details sit below in 12px Dusk.
- **Level card:** the rail ends in a glass card with level, a gold XP count and a gold progress bar.
- **Header:** sticky, 56px, night at 55% with a heavy blur, breadcrumbs in 14px Dusk with the current page in Starlight, and "Step n of 6" at md and up.
- **Mobile:** the rail opens as a float-glass drawer over a blurred 60% black scrim.

### Progress
A 6px fully round track of white at 7%. The fill is a violet-to-lavender gradient with a violet halo (journey, demonstrated skills), a gold gradient with a gold halo (level and XP), solid good (completed weeks), or Mist at 40% (self-reported skills). Width animates over 700ms with exponential ease-out.

### Toasts
Float-glass cards, 16px corners, bottom-right at 360px wide (full width on mobile). Reward toasts carry a spark border and a gold icon tile that plays the unlock animation; warn toasts carry a warn border and stay 10 seconds instead of 6.5.

### Orb and Particle Sphere
The orb is a decorative glass sphere lit from the upper left with a lavender core, a deep violet body and a violet drop glow, half-cropped inside lit panels. The particle sphere is the landing centrepiece: about 3,600 points on a canvas, brightest at the rim, turning slowly and leaning toward the pointer, paused off-screen and drawn as one still frame under reduced motion.

## Do's and Don'ts

### Do:
- **Do** keep every surface, line and tint translucent so the sky reads through.
- **Do** give each application screen at most one lit panel, and put the next action in it.
- **Do** use violet light for action, current step, selection and progress, and gold only for XP, levels and achievements.
- **Do** set h1 and h2 in Sora and everything else in Geist, with tabular numerals and nothing below 12px.
- **Do** keep the horizon behind the top of the page, masked out by about 420px below the header, and let it follow journey progress.
- **Do** use exponential ease-out (cubic-bezier(0.16, 1, 0.3, 1)) for entrances, lifts and progress fills, and keep everything static under reduced motion.
- **Do** declare `backdrop-filter` unprefixed only in hand-written glass materials.
- **Do** keep the 2px Lavender Rim focus outline on every interactive element.
- **Do** label sample and demo content as sample wherever it appears.

### Don't:
- **Don't** replace translucent surface tokens with opaque grey boxes.
- **Don't** stack the glass material under a lit panel; the lit panel replaces it.
- **Don't** use gradient type on whole headings, body text or buttons; it belongs to the landing headline accent and a few key words.
- **Don't** use spark gold for actions, links or decoration, or good, warn and bad for anything but status.
- **Don't** let the horizon or sky glows cross mid-page headings or sit behind dense content.
- **Don't** put kickers or eyebrow labels above titles.
- **Don't** set any text below 12px.
- **Don't** show placeholder or invented progress, scores, testimonials or customer logos.
