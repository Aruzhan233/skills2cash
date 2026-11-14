---
version: 1
slug: "src-components-app-shell-tsx"
primary_target: "src/components/app-shell.tsx"
related_targets: ["src/app/(app)/dashboard/page.tsx","src/app/page.tsx"]
---

# Surface brief: Skills2Cash application (all authenticated screens) and public pages

**Scope:** app shell and every screen under `src/app/(app)`, plus landing, login, signup, demo.
**Mode:** Operate for the application; Persuade for the landing page.
**Audience and job:** an adult with a day job, at a laptop in the evening, with about an hour to move their side service forward. They need to see where they are, what to do next, and do it.
**Constraints (owner-confirmed):** no route, data, auth, AI, payment or business-logic changes; official logo unmodified; dark theme with violet accent; English UI; landing copy and claims unchanged. Navigation moves to a left rail (owner chose it); public pages are in scope.

## Direction contract

THESIS: The product is one journey, so the journey is the shell. The six steps are a continuous lit path down the left rail, always visible, always showing real status. It refuses the category default of a top bar of equal links over a wall of identical bordered cards.

OWN-WORLD: "The Night Workshop", rebuilt. Violet-tinted charcoal ground; a deeper violet-black rail; flat tonal panels with hairlines only where they separate, 12px corners. Violet is the one lamp: primary action, current step, selection. The logo's gold spark is the only second hue and means "earned" (XP, achievements). Good / caution / error are status only. Geist throughout, tabular numerals, no glows, no gradient fills, no eyebrow labels.

STORY: I know where I am on the path, I see the one next action, I do it, the path lights further.

FIRST VIEWPORT (dashboard, 1280): rail at left with logo, Home, the six-station path with a connecting line and live status, level and XP at its foot. Main column: greeting as the page title; directly beneath, the next action as the single violet panel with its button; to its right, journey percentage and readiness as plain figures; below, the eight-phase strip, then weekly missions.

FORM: left-rail application shell with a journey stepper as its signature move. seed: none (pinned) — "Deep black and charcoal backgrounds. Purple and violet primary accents. Carefully controlled gradients. Elegant typography. Sophisticated cards and panels. Premium dashboard aesthetics."; navigation model confirmed by the owner as "Боковая панель".

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

**Unresolved:** none.
