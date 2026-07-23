export default {
  id: 'a10',
  categoryKey: 'design',
  tag: 'Visual Design',
  icon: 'fas fa-cubes',
  title: 'Building a Design System from Scratch: Design Tokens to Component Engineering',
  desc: 'From three-tier token architecture and Figma Variables to CI/CD auto-sync — a production-ready design system blueprint.',
  readTimeVal: '18 min',
  date: '2026-07-22',
  content: `If you've worked on more than three projects as a frontend developer, you know this pain: every project has different colors, different spacing, different border radii. The same button looks different on every page. The designer changed three times. The design file has four slightly different blues — #2563eb, #1d4ed8, #3b82f6, #2083f2 — and nobody knows which one is "the brand blue."

![Design system chaos](/gifs/a10_chaos.gif)
*▲ Life without a design system — every page has its own color palette, and changing a button means touching twenty files*

That's what happens without a design system. Here's how to build one from zero — one that actually ships, stays in sync with code, and doesn't rot.

## Part 1: Design Tokens — The "Variable System" for Design

Design Tokens are the atomic layer: they turn visual decisions (colors, spacing, fonts, radii) into named variables. But dumping a flat list of variable names doesn't work. You need hierarchy.

### The Three-Tier Architecture

**Layer 1 — Primitive (Global) Tokens**

Defines atomic values. Never used directly by components. Examples: blue.500 = #2563eb, neutral.900 = #111827, space.12 = 48px.

**Layer 2 — Semantic Tokens**

Expresses INTENT, not raw values. All values use aliases referencing Primitives. Examples: color.brand.primary references blue.500, color.text.primary references neutral.900, spacing.section.xl references space.12.

**Layer 3 — Component Tokens**

Components reference this layer directly. Examples: button.primary.bg references color.brand.primary, card.padding.x references spacing.section.lg. When rebranding, only Layer 1 changes — Layers 2 and 3 follow automatically. Zero component edits required.

**Why three layers?** Say your brand color changes from blue to green. Change only Layer 1's blue.500 mapping to green.500. Layer 2's color.brand.primary automatically follows. Every component picks up the change instantly. Without layers, you're editing every single component file manually.

### Naming Conventions

- `color.brand.primary` — named by semantics, survives rebrands
- Never use `color.blue.500` — named by value, breaks on any color change
- `spacing.section.xl` — expresses purpose
- Never use `spacing.48px` — hardcodes the value
- Recommended structure: `{category}.{property}.{variant}.{state}`, e.g. `color.text.primary.hover`

## Part 2: Figma Variables — Implementing Tokens in Your Design Tool

Figma Variables is the native mechanism for Design Tokens inside Figma. 2026 supports: Color, Number, String, Boolean.

### Recommended Collections Setup

**Collection 1: Primitives** — raw atomic values: blue/500 = #2563eb, neutral/50 = #f9fafb, neutral/900 = #111827, space/4 = 16px, space/8 = 32px, radius/md = 8px, font/xl = 32px.

**Collection 2: Semantic** — all values use aliases referencing Primitives: color/brand/primary → blue/500, color/text/primary → neutral/900, spacing/section/xl → space/8. This is the critical layer — when rebranding, only Primitives change. Semantic layer stays untouched.

**Collection 3: Components** (optional, for enterprise scale): button/primary/bg → color/brand/primary, card/padding/x → spacing/section/lg. Small teams can stop at Semantic.

### Modes for Theming

The same Semantic Token maps to different Primitive values per Mode. For `color/bg/primary`:

| Mode | Mapped Value |
|---|---|
| Light | #FFFFFF |
| Dark | neutral/900 |
| High Contrast | #000000 |

Designers switch Modes in Figma — the entire page re-themes instantly. Developers switch `data-theme` in code — CSS variables swap values. At this point, your design file and codebase share the same variable system.

## Part 3: Building the Component Library — Start With 10

Don't try to build 50 components for v1. Ship these 10 first: Button, Input, Select, Modal, Card, Badge, Avatar, Toast, Tabs, Table. Iterate from real usage.

### Component Building Principles

**First, every visual property references a Token. Never hardcode.** Use `var(--color-brand-primary)`, not `#2563eb`.

**Second, define all states before designing the default state.** Cover default → hover → active → focus → disabled → loading → error. All seven states, no exceptions.

**Third, Figma component names must match code component names.** Figma: `Type=Primary, Size=Medium, State=Hover`. Code: `<Button variant="primary" size="md" />`.

**Fourth, use Auto Layout for spacing.** Never drag pixels manually.

### Common Pitfalls

- Don't tokenize too early — a single landing page only needs CSS variables, not a full three-tier system
- Don't skip the Semantic layer — going Primitive → Component directly means every component breaks on rebrand
- Don't build 50 components for v1 — ship 10 core ones, iterate from usage
- The detach test — if designers detach components to make them work, the component design is broken, not the person

## Part 4: Engineering the Sync — Figma to Code Automation

The #1 killer of design systems isn't "we couldn't build it." It's "design changed and code didn't follow."

![Design-to-code sync pipeline](/gifs/a10_sync.gif)
*▲ Design system CI/CD pipeline — Figma variable update triggers Git push, Style Dictionary build, npm publish*

### Recommended Sync Architecture

**Step 1**: Designer modifies variables via Tokens Studio plugin in Figma, pushes to Git repository.

**Step 2**: GitHub Action detects token file changes, triggers Style Dictionary build.

**Step 3**: Style Dictionary reads JSON token definitions, generates multi-platform artifacts — CSS Variables (Web), Swift Constants (iOS), Kotlin Objects (Android).

**Step 4**: Build artifacts auto-publish to npm / CocoaPods. Frontend and mobile teams update their dependencies. Done.

Designers never touch code. Developers never manually edit CSS variables. One change, all platforms synced.

### Style Dictionary Config

\`\`\`js
module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{ destination: 'variables.css', format: 'css/variables' }],
    },
    swift: {
      transformGroup: 'swift',
      buildPath: 'dist/ios/',
      files: [{ destination: 'DesignTokens.swift', format: 'ios-swift/class.swift' }],
    },
  },
};
\`\`\`

Build output example:

\`\`\`css
:root {
  --color-brand-primary: #2563eb;
  --color-text-primary: #111827;
  --spacing-section-xl: 48px;
}

[data-theme="dark"] {
  --color-brand-primary: #60a5fa;
  --color-text-primary: #f9fafb;
}
\`\`\`

## Part 5: Multi-Brand & Multi-Theme Scaling

When maintaining multiple brands or themes, keep the Semantic Layer stable and only change Primitive mappings. For example, color/brand/primary maps to blue/500 under Brand A, and green/500 under Brand B.

Figma approach: use Extended Collections. A Parent Collection holds shared Semantic Tokens. Child Collection A holds Brand A Primitives. Child Collection B holds Brand B Primitives. Edit the Parent — all Children auto-update. Edit one Child — only that brand changes.

## Part 6: Three Metrics That Actually Matter

**Component Usage Rate**: Figma component instances divided by total elements. Below 80% means components don't cover real needs, or designers don't know they exist.

**Detach Rate**: percentage of designers unlinking components. Above 20% means components are badly designed for real scenarios. Revisit the component design.

**The 3-Minute Test**: can a new designer find, place, and configure a button in 3 minutes? If not, your component library is too hard to use.

## Part 7: What a Design System Actually Is

![Design system built](/gifs/a10_build.gif)
*▲ A design system isn't "a pretty component doc." It's turning your design decisions into reusable, syncable, traceable code assets.*

Design System = Design Decisions × Engineering. Design Tokens map to CSS Variables. Figma Variables map to Style Dictionary. Components map to Component Library. CI/CD pipeline ties them together.

Honest truth: **the biggest value of a design system isn't "unified colors and spacing." It's eliminating the meeting where five people debate what a button should look like.** Spend the saved time on things that actually matter.`
};
