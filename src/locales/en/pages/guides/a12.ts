export default {
  id: 'a12',
  categoryKey: 'design',
  tag: 'Visual Design',
  icon: 'fas fa-wand-magic-sparkles',
  title: 'Motion Design Guide: Easing Curves, Timing & Micro-Interactions',
  desc: 'From Disney animation principles adapted for UI, to easing curve selection, duration token systems, and reduced-motion accessibility.',
  readTimeVal: '16 min',
  date: '2026-07-22',
  content: `When a button is clicked — does it stiffly change color, or does it subtly press down and bounce back? That difference is your product's "feel." Users won't say "wow, great easing curve." But they'll think "this product feels right." Conversely, harsh instant transitions make a product feel cheap.

Motion isn't decoration. It's a language. Here's how to build a professional motion system.

![Smooth motion satisfaction](/gifs/a12_smooth.gif)
*▲ Carefully tuned motion — it's not "pretty," it's "right"*

## Part 1: The 100/300/500 Duration Rule

The more functional the animation, the shorter it should be. This scale is battle-tested across real products:

| Duration | Use Case | Examples |
|---|---|---|
| 100-150ms | Instant feedback | Button press, toggle switch, hover color |
| 200-300ms | State changes | Menu open, tooltip appear, modal enter |
| 300-500ms | Layout changes | Accordion expand, drawer slide, page transition |
| 500-800ms | Entrance animations | Hero reveal, onboarding introduction |

Three supplementary rules:

- **Exit animations should be ~75% of enter duration** — users care about things arriving, not leaving. Don't drag exits out.
- **Anything under 80ms feels instant** — the brain's sensory buffer threshold.
- **No animation over 5 seconds** — WCAG 2.2 requires pause/stop/hide mechanism if longer.

### Staggered Delays

When list items appear sequentially, delay each item by 40-80ms. Cap total stagger time at 800ms.

\`\`\`css
.menu-item {
  opacity: 0;
  animation: fade-in 200ms ease-out forwards;
}
.menu-item:nth-child(1) { animation-delay: 0ms; }
.menu-item:nth-child(2) { animation-delay: 50ms; }
.menu-item:nth-child(3) { animation-delay: 100ms; }
.menu-item:nth-child(4) { animation-delay: 150ms; }
.menu-item:nth-child(5) { animation-delay: 200ms; }
\`\`\`

## Part 2: Easing Curves — The Soul of Motion

**Never use the default \`ease\` keyword.** It's a browser compromise, wrong for every scenario. \`linear\` is even worse — uniform motion doesn't exist in nature. Only use it for progress bars and continuous rotation.

### Four Recommended Curves

| Curve | cubic-bezier | Use Case |
|---|---|---|
| ease-out-expo | `(0.16, 1, 0.3, 1)` | Entrances: arrive fast, settle gently |
| ease-out-quart | `(0.25, 1, 0.5, 1)` | Daily default: slightly softer than expo |
| ease-in | `(0.5, 0, 0.75, 0)` | Exits: accelerate away |
| ease-in-out | `(0.65, 0, 0.35, 1)` | State toggles: symmetric back-and-forth |

![Easing comparison](/gifs/a12_easing.gif)
*▲ Same displacement, different easing — linear feels robotic, ease-out breathes, bounce screams 2015*

### What to Avoid

- ease-in for entrances makes the interface feel sluggish — accelerating from a slow start.
- Bounce and elastic curves peaked in 2015. In 2026 they're a telltale "AI generation" fingerprint.
- Never use \`transition: all\` — animate only the properties you need.

### Spring vs cubic-bezier

| Scenario | Recommended |
|---|---|
| Interruptible gestures (drag, swipe) | Spring (stiffness + damping) |
| Non-interruptible enter/exit (modals, toasts) | cubic-bezier (deterministic, no bounce) |

Recommended parameters — Snappy: stiffness 700 / damping 38. Standard UI: stiffness 400 / damping 40. Keep damping ratio above 0.7 to avoid visible oscillation.

## Part 3: Anatomy of a Micro-Interaction

Dan Saffer's four-part framework. Every animation you can think of fits into this:

| Component | Definition | Example |
|---|---|---|
| Trigger | What initiates it? User action or system state? | Button click, scroll position, notification received |
| Rules | What logic executes after triggering? | Like count +1, mark as read |
| Feedback | How does the user know what happened? | Button color change, number bounce, haptic, sound |
| Loops & Modes | How does behavior change on repeat? | Second tap un-likes, long-press enters edit mode |

**Feedback must begin within 100ms** — beyond that, users perceive unresponsiveness, tap again, and break things.

## Part 4: Only Animate transform and opacity

This is the iron law of motion performance. Different CSS properties have wildly different performance costs:

| Property | Triggers Layout | Triggers Paint | Triggers Composite | Performance |
|---|---|---|---|---|
| \`transform\` | No | No | Yes | 60fps guaranteed |
| \`opacity\` | No | No | Yes | 60fps guaranteed |
| \`color\` / \`background\` | No | Yes | No | Usable, suboptimal |
| \`width\` / \`height\` | Yes | Yes | No | Never animate |
| \`top\` / \`left\` / \`margin\` | Yes | Yes | No | Never animate |

For expand/collapse height changes, never animate \`height\`. Use \`grid-template-rows\` instead:

\`\`\`css
.collapsible {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms ease-out;
}
.collapsible.open {
  grid-template-rows: 1fr;
}
\`\`\`

Set \`will-change\` only immediately before animation starts — not globally. It pre-allocates GPU memory and degrades performance when overused.

## Part 5: Disney's 12 Principles Applied to UI

Ollie Johnston and Frank Thomas codified these in 1981. They remain the textbook. The six most relevant to UI:

| Principle | UI Application |
|---|---|
| Squash & Stretch | Button scaleX/Y micro-adjustment (0.95-1.05) on press |
| Anticipation | Pull-to-refresh wind-up, hover-state pre-feedback |
| Staging | Dim background on modal open — give focus to the main event |
| Follow Through | Toggle overshoot, ripple effects, staggered menu items |
| Slow In & Slow Out | The foundation of all easing — nature has no uniform motion |
| Exaggeration | Error shake 3-5px (not 20px), success animation slightly amplified |

## Part 6: Motion Token System

Like Design Tokens, motion needs tokenization.

| Token Type | Example | Description |
|---|---|---|
| Duration | \`--ms-150\`, \`--ms-300\`, \`--ms-500\` | Geometric scale: 50, 100, 150, 200, 300, 500, 800ms |
| Easing | \`--ease-out\`, \`--ease-in\`, \`--ease-in-out\` | Define 3-4 only, reuse everywhere |
| Semantic | \`--motion-toast-in\`, \`--motion-modal-out\` | Named by intent — components only reference this layer |

\`\`\`css
:root {
  --ms-150: 150ms;
  --ms-300: 300ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:  cubic-bezier(0.5, 0, 0.75, 0);

  --motion-toast-in:  var(--ms-300) var(--ease-out);
  --motion-toast-out: var(--ms-200) var(--ease-in);
}
\`\`\`

## Part 7: Accessibility — prefers-reduced-motion Is Mandatory

Roughly 35% of adults over 40 have some form of vestibular disorder. Animation can cause dizziness and nausea.

| Action | Detail |
|---|---|
| Shorten durations | All duration tokens drop to 100ms or below |
| Use opacity instead of displacement | Crossfade replaces slide, bounce, parallax |
| Preserve functional animation | Progress bars and loading spinners remain, but slowed |
| Remove spatial movement | translate, parallax, spring overshoot all reset to zero |
| Disable auto-play | Carousels and video backgrounds must be pausable |

\`\`\`css
@media (prefers-reduced-motion: reduce) {
  :root {
    --ms-300: 100ms;
    --ms-500: 100ms;
    --motion-toast-in: var(--ms-100) var(--ease-out);
  }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
\`\`\`

## Part 8: The Bottom Line

![Micro-interaction delight](/gifs/a12_micro.gif)
*▲ Good motion doesn't speak — but it makes you feel "this product gets me"*

Motion design boils down to three principles:

**If 200-300ms can do it, don't drag it to 500ms.** Fast motion is a tool. Slow motion is a performance. Tools should be fast. Performances should be restrained.

**Only animate transform and opacity.** Animating anything else triggers main-thread layout, and 60fps is gone.

**Tokenize your motion.** Like colors and spacing, make durations and easings into variables. If one button's hover duration differs from another's, users feel it — they can't articulate why, but they think "something's off here."`
};
