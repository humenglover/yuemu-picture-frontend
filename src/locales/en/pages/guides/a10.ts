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

### The Standard Three-Tier Architecture

\`\`\`
 ┌─────────────────────────────────────────────────────┐
 │            Design Token Three-Tier Architecture       │
 │                                                     │
 │  Layer 3: Component Tokens (component-specific)       │
 │  ┌─────────────────────────────────────────────┐    │
 │  │ button-primary-bg → color.brand.primary      │    │
 │  │ card-padding      → spacing.section.lg       │    │
 │  │ Purpose: components reference these directly  │    │
 │  └─────────────────────────────────────────────┘    │
 │                      ↑ references                     │
 │  Layer 2: Semantic Tokens                             │
 │  ┌─────────────────────────────────────────────┐    │
 │  │ color.brand.primary  → blue.500              │    │
 │  │ color.text.primary   → neutral.900           │    │
 │  │ spacing.section.lg   → 48px                  │    │
 │  │ Purpose: expresses INTENT, not raw values     │    │
 │  └─────────────────────────────────────────────┘    │
 │                      ↑ references                     │
 │  Layer 1: Primitive Tokens (Global)                   │
 │  ┌─────────────────────────────────────────────┐    │
 │  │ blue.500    → #2563eb                        │    │
 │  │ neutral.900 → #111827                        │    │
 │  │ space.12    → 48px                           │    │
 │  │ Purpose: defines atomic values, never used    │    │
 │  │           directly by components              │    │
 │  └─────────────────────────────────────────────┘    │
 └─────────────────────────────────────────────────────┘
\`\`\`

**Why three layers?** Say your brand color changes from blue to green. Change only Layer 1's \`blue.500\` → \`green.500\`. Layer 2's \`color.brand.primary\` automatically follows. Every component picks up the change with zero manual edits. Without layers, you're changing colors in every single component file.

### Naming Conventions

\`\`\`
 ✅ color.brand.primary          ← Named by SEMANTICS — survives rebrands
 ❌ color.blue.500               ← Named by VALUE — breaks on any color change

 ✅ spacing.section.xl           ← Expresses PURPOSE
 ❌ spacing.48px                 ← Hardcodes the value

 Structure: {category}.{property}.{variant}.{state}
 Example:   color  . text    . primary . hover
\`\`\`

## Part 2: Figma Variables — Implementing Tokens in Your Design Tool

Figma Variables is the native mechanism for Design Tokens inside Figma. 2026 supports: Color, Number, String, Boolean.

### Collections Setup

\`\`\`
 Figma Variables Collections (Recommended)

 ┌──────────────────────────────────────────────────────┐
 │  Collection 1: Primitives                             │
 │  ┌──────────────────────────────────────────────────┐ │
 │  │ blue/500    #2563eb    neutral/50    #f9fafb     │ │
 │  │ blue/600    #1d4ed8    neutral/900   #111827     │ │
 │  │ space/4     16px       radius/md     8px         │ │
 │  │ space/8     32px       font/xl       32px        │ │
 │  └──────────────────────────────────────────────────┘ │
 │                                                      │
 │  Collection 2: Semantic                               │
 │  ┌──────────────────────────────────────────────────┐ │
 │  │ color/brand/primary  → blue/500    ← alias!     │ │
 │  │ color/text/primary   → neutral/900 ← alias!     │ │
 │  │ spacing/section/xl   → space/8     ← alias!     │ │
 │  │                             ALL values use alias   │ │
 │  └──────────────────────────────────────────────────┘ │
 │                                                      │
 │  Collection 3: Components (optional, for enterprise)   │
 │  ┌──────────────────────────────────────────────────┐ │
 │  │ button/primary/bg     → color/brand/primary       │ │
 │  │ card/padding/x        → spacing/section/lg        │ │
 │  └──────────────────────────────────────────────────┘ │
 └──────────────────────────────────────────────────────┘
\`\`\`

Critical: Semantic layer values must use **aliases**, not raw color codes. Change Primitives once, Semantic follows automatically.

### Modes for Theming

\`\`\`
 Same Semantic Token, different Mode → different value

 Token: color/bg/primary

  ┌────────────┬──────────────┬──────────────┐
  │  Light Mode │  Dark Mode   │  HighContrast │
  ├────────────┼──────────────┼──────────────┤
  │  #FFFFFF   │  neutral/900 │  #000000      │
  └────────────┴──────────────┴──────────────┘

  Designer: switch Mode → entire page re-themes instantly
  Developer: switch data-theme → CSS variables swap values
\`\`\`

At this point, your design file and codebase share the same variable system. This is the foundation for keeping them in sync.

## Part 3: Building the Component Library — Start With 10

Don't try to build 50 components for v1. Ship these 10 first:

\`\`\`
 Core 10 Components (by priority)
 ┌────────┬────────┬────────┬────────┬────────┐
 │ Button │ Input  │ Select │ Modal  │ Card   │
 ├────────┼────────┼────────┼────────┼────────┤
 │Badge   │Avatar  │Toast   │Tabs    │Table   │
 └────────┴────────┴────────┴────────┴────────┘
\`\`\`

### Component Building Principles

\`\`\`
 1. Every visual property references a Token. Never hardcode.
    ✅ background: var(--color-brand-primary)
    ❌ background: #2563eb

 2. Define all states BEFORE designing the default state
    default → hover → active → focus → disabled → loading → error

 3. Figma component name = code component name
    Type=Primary, Size=Medium, State=Hover
    → <Button variant="primary" size="md" />

 4. Use Auto Layout for spacing. Never drag pixels manually.
\`\`\`

### Common Pitfalls

\`\`\`
 ❌ Don't tokenize too early — a single landing page only needs CSS variables
 ❌ Don't skip the Semantic layer — going Primitive → Component directly
    means every component breaks on rebrand
 ❌ Don't build 50 components for v1 — ship 10 core ones, iterate from usage
 ✅ The "detach test" — if designers detach components to make them work,
    the component design is broken, not the person
\`\`\`

## Part 4: Engineering the Sync — Figma ↔ Code Automation

The #1 killer of design systems isn't "we couldn't build it." It's "design changed and code didn't follow."

![Design-to-code sync pipeline](/gifs/a10_sync.gif)
*▲ The design system CI/CD pipeline — Figma Variable update → Git Push → Style Dictionary build → npm publish, fully automated*

### Recommended Sync Architecture

\`\`\`
  Figma Variables              Git Repository               Applications
  ┌──────────────┐        ┌──────────────────────┐        ┌──────────┐
  │ Tokens Studio │─push─→│ tokens/               │        │ Web App  │
  │ (Figma Plugin)│        │  primitives.json      │        │ (CSS     │
  └──────────────┘        │  semantic.json        │        │  Vars)   │
        │                 │        ↓               │        └──────────┘
        │                 │ Style Dictionary       │        ┌──────────┐
        │                 │  → CSS Variables       │──npm──→│ iOS App  │
        │                 │  → Swift Constants     │ publish│ (Swift)  │
        │                 │  → Kotlin Objects      │        └──────────┘
        │                 └──────────────────────┘        ┌──────────┐
        │                                                │ Android  │
        └────────────── CI/CD Pipeline ─────────────────→│ (Kotlin) │
                                                         └──────────┘
\`\`\`

### Style Dictionary Config

\`\`\`js
// tokens.config.js
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

\`\`\`css
/* Build output: dist/css/variables.css */
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

### The CI/CD Flow

\`\`\`
 Designer changes Figma Variable
       ↓
 Tokens Studio plugin pushes → Git Repo
       ↓
 GitHub Action triggers Style Dictionary Build
       ↓
 CSS / Swift / Kotlin artifacts generated
       ↓
 Auto npm publish / CocoaPods push
       ↓
 Frontend/mobile: npm update → done

 Designers never touch code. Developers never manually edit CSS variables.
\`\`\`

## Part 5: Multi-Brand & Multi-Theme Scaling

When you need multiple brands (main + sub-brands) or multiple themes (Light + Dark + High Contrast):

\`\`\`
  Semantic Layer stays STABLE, only Primitive mappings change

          Semantic Layer (unchanged)
  ┌─────────────────────────────────────────┐
  │  color/brand/primary                    │
  │  color/bg/primary                       │
  │  font/heading                           │
  └──────────┬──────────┬───────────────────┘
             │          │
    ┌────────┴──┐  ┌───┴────────┐
    │ Brand A   │  │ Brand B    │   ← Different brands swap Primitives
    │ blue/500  │  │ green/500  │
    │ white     │  │ cream      │
    └───────────┘  └────────────┘

  Figma approach: Extended Collections
  - Parent Collection: shared Semantic Tokens
  - Child Collection A: Brand A Primitives
  - Child Collection B: Brand B Primitives
  - Edit Parent → all Children auto-update
  - Edit one Child → only that brand changes
\`\`\`

## Part 6: Three Metrics That Actually Matter

\`\`\`
 1. Component Usage Rate
    → Figma component instances / total elements
    → Below 80% = components don't cover real needs

 2. Detach Rate
    → % of designers detaching (unlinking) components
    → Above 20% = components are badly designed for real scenarios

 3. The 3-Minute Test
    → Can a new designer find, place, and configure a button in 3 minutes?
    → If not, your component library is too hard to use
\`\`\`

## Part 7: What a Design System Actually Is

![Design system built](/gifs/a10_build.gif)
*▲ A design system isn't "a pretty component doc." It's turning your design decisions into reusable, syncable, traceable code assets.*

\`\`\`
  Design System = Design Decisions × Engineering

  ┌──────────────────┐     ┌──────────────────┐
  │  Design Tokens   │ ←→ │  CSS Variables    │
  │  (Design Language)│     │  (Code Reality)   │
  ├──────────────────┤     ├──────────────────┤
  │  Figma Variables │ ←→ │  Style Dictionary │
  │  (Design Tool)   │     │  (Build Tool)     │
  ├──────────────────┤     ├──────────────────┤
  │  Components      │ ←→ │  Component Lib    │
  │  (Design Assets) │     │  (Code Assets)    │
  └──────────────────┘     └──────────────────┘
          ↕  CI/CD Auto-Sync  ↕
\`\`\`

Honest truth: **the biggest value of a design system isn't "unified colors and spacing." It's eliminating the meeting where five people debate what a button should look like.** The time you save? Spend it on things that actually matter.`
};
