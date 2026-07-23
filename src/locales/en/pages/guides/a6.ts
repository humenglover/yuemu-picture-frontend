export default {
  id: 'a6',
  categoryKey: 'accessibility',
  tag: 'Accessibility',
  icon: 'fas fa-universal-access',
  title: 'Web Accessibility: A Practical Guide',
  desc: 'WCAG 2.2 compliance, keyboard focus management, screen reader adaptation — real implementation.',
  readTimeVal: '13 min',
  date: '2026-04-15',
  content: `Let me hit you with an uncomfortable truth. In most teams, accessibility — a11y, as the industry calls it — lives in the "we'll get to it later" column. Product managers don't prioritize it. Designers don't spec it. Developers don't build it. The result? Over 15% of the global population lives with some form of disability — visual, auditory, motor, cognitive. Your product hasn't even launched yet and it's already shut out one in six human beings.

And here's the even more pragmatic angle — international markets and B2B enterprise procurement are increasingly writing **WCAG 2.2 AA compliance** into their vendor requirements. Fail a11y, and you don't even get a seat at the table. This isn't "design idealism" anymore. It's compliance. It's the market telling you: get it together or get left behind.

Now unplug your mouse, open your own website, and try navigating with just the Tab key. If the focus indicator jumps around randomly — or worse, you can't find it at all:

![Keyboard focus loss panic](/webm/tab_rage.webm)
*▲ Mashing Tab while having absolutely no idea where focus is — peak frontend despair*

Here's how to get your a11y above the bar with minimal time and effort.

## Part 1: Color Contrast — WCAG's Baseline, and the Easiest Trap to Fall Into

### Two Hard Numbers. Memorize Them.

WCAG 2.2 AA level has exactly two contrast requirements you need to know:

- **Normal body text**: contrast ratio ≥ **4.5:1** against the background.
- **Large text (24px+ regular, or 19px+ bold)**: contrast ratio ≥ **3.0:1**.

Sounds simple, right? Now go check how many sites use a soft gray like \`#94A3B8\` as body text on a white background. That clocks in at… 2.8:1. Under direct sunlight. On the train. For users with low vision. That text isn't text — it's fog.

![Squinting at unreadable low-contrast text](/webm/a11y_squint.webm)
*▲ Squinting helplessly at #94A3B8 text on a white background — "is this even a real sentence or am I hallucinating"*

### How to Self-Check

Open Chrome DevTools → Lighthouse → Accessibility audit. Or add \`axe-core\` to your project and run it in CI/CD. Contrast check fails → merge gets blocked. Catch it in the pipeline, not after it's live. An ounce of prevention, as they say.

### One Easily-Missed Detail: Focus Indicators Need Contrast Too

That default blue focus ring browsers give you? You're allowed to hate its aesthetic. You're NOT allowed to just delete it. Countless devs slap on \`outline: none\` and then… forget to add a custom replacement. Keyboard users are now navigating your page blind — Tab, Tab, Tab, with no idea where they are.

The correct approach: use \`:focus-visible\` to build a high-visibility custom focus ring:

\`\`\`css
button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
}
\`\`\`

Critical detail: **never set outline-offset to 0.** If the focus ring hugs the element edge, it bleeds into the element's own border and becomes invisible — which defeats the entire purpose.

## Part 2: Keyboard Focus Management — Don't Build Keyboard Prisons

### The Modal Focus Trap Test

Try this on your own site: open a modal dialog, then navigate using only the Tab key. Can you cycle through focus within the modal? Does Escape close it? After closing, does focus return to the button that triggered it?

If the answer to any of these is "no" — congratulations, you've built a keyboard prison. Users Tab into your modal and can't Tab out. Or worse — focus escapes behind the modal to page elements the user can't even see, while the modal sits there smugly on top.

### Two Simple Rules

1. **When a modal opens, trap focus inside it.** Tab cycles through focusable elements within the modal. Shift+Tab reverses the cycle. Everything outside the modal gets \`inert\`.
2. **When the modal closes, return focus to the trigger button.** Users end up exactly where they started. Nobody thanks you for this — but miss it, and keyboard users just bounce.

![Lost keyboard focus wandering aimlessly](/webm/a11y_lost.webm)
*▲ Tab Tab Tab — where the hell did the focus go? Users wandering around your page like a headless chicken*

## Part 3: Semantic HTML — Stop Using Divs for Everything

Seriously. Stop writing \`<div onclick="...">\` in place of \`<button>\`. Just stop.

A real \`<button>\` gives you all of this for free:

- Keyboard Enter and Space trigger clicks automatically.
- Screen readers announce "button" + the text content, with zero extra markup.
- The \`disabled\` attribute instantly blocks interaction and removes focus.
- \`type="submit"\` participates in form submission natively.

Replicate all that with a div? You'll write 200 lines of JavaScript and still miss things. One \`<button>\` tag versus 200 lines of fragile JS — come on.

![Keyboard smash rage at div soup](/webm/a11y_rage.webm)
*▲ Seeing someone use a div with onclick and 200 lines of ARIA instead of a single <button> — instant keyboard-smash material*

### ARIA Is a Patch, Not a Blueprint

ARIA exists for one reason: **when native HTML semantics fall short, ARIA fills the gap.** It's not a license to build everything with divs and then sprinkle ARIA on top like magic dust. Use native semantic elements wherever they exist — \`<button>\`, \`<nav>\`, \`<main>\`, \`<header>\`, \`<footer>\`, \`<input>\`, \`<select>\`. Reach for ARIA only when HTML can't express the pattern — tab lists, live regions, dialog roles.

> First rule of ARIA: if you can use a native HTML element that already has the semantics you need, don't use ARIA.

## Part 4: Screen Reader Adaptation — Small Moves, Big Impact

### Every Image Needs an Alt Attribute

Probably the most basic and most frequently forgotten a11y rule. Decorative images get \`alt=""\` (empty string) — screen readers skip them. Content images get meaningful, concise alt text. Never write "image" or "picture" — the screen reader already told the user it's an image. Tell them something they don't know.

### Your Page Needs Landmarks

Screen reader users don't listen to entire pages top to bottom. They jump between landmarks. Make sure your page has a clear semantic structure:

\`\`\`html
<header>  <!-- banner landmark -->
<nav>     <!-- navigation landmark -->
<main>    <!-- main landmark — the most important one -->
<footer>  <!-- contentinfo landmark -->
\`\`\`

At minimum, you need \`<main>\`. So many sites are missing this one tag, and screen reader users have no way to jump to the primary content. They're just… stuck.

![Lost on inaccessible mobile page](/webm/a11y_phone.webm)
*▲ Opening a page with zero semantic structure on mobile — the screen reader just goes "div, div, div" and the user has absolutely no clue what's happening*

### Auto-Playing Content Is Actually Dangerous

Auto-playing, infinitely-looping, un-pausable video — for users with vestibular disorders or cognitive disabilities, this is genuinely harmful. WCAG 2.2 is clear: **any motion that auto-plays for more than 5 seconds must provide a mechanism to pause, stop, or hide it.**

## Part 5: The Real Point

Accessibility was never about "making concessions for a minority." It's about making your product work — for more people, in more contexts, through more interaction modes. You squinting at your phone screen under harsh sunlight. You watching a video with captions in a noisy coffee shop. You navigating one-handed while holding a bag. These are all "temporary disability experiences." a11y doesn't just serve the 15%. It serves everyone's *certain moments*.

Get a11y right, and your code gets cleaner, your semantics get sharper, and your user base expands. Ignore it, and your product might not even survive the first round of enterprise procurement. Your move.`
};
