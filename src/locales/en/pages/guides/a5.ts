export default {
  id: 'a5',
  categoryKey: 'typography',
  tag: 'Typography',
  icon: 'fas fa-font',
  title: 'Font Pairing & Typesetting Guide',
  desc: 'Web font loading, modular type scales, variable fonts, and cross-platform font stacks.',
  readTimeVal: '11 min',
  date: '2026-03-25',
  content: `Good typography is like oxygen — you never notice it until it's gone. Then you're gasping.

I've seen too many genuinely powerful products die on the altar of bad typography. Font sizes with no scale logic — just random numbers someone typed and shipped. Line heights so tight reading feels like rush hour on the subway. Cross-platform font fallbacks that collapse straight into Times New Roman. And the worst — four completely incompatible fonts mashed into the same page:

![Typography disaster](/webm/typography_choke.webm)
*▲ When Comic Sans, cursive, and system fonts collide — your eyes just give up*

What follows isn't art school theory. It's engineering — how to build a web typography system that doesn't break.

## Part 1: Variable Fonts — It's 2026, Why Aren't You Using These Yet?

Quick primer. Old-school approach: you want Regular, Bold, Italic, and Light weights of the same font? Four separate files. Variable fonts cram all of that into a single file — you get smooth interpolation across the entire weight axis, from 100 to 900.

What does that mean in practice? **You want weight 450? You actually get 450 — not just 400 or 500.** Slightly heavier weight on mobile screens for legibility? One line of CSS. Slightly lighter weight in dark mode to reduce halation? One media query. Variable fonts make these micro-adjustments trivial.

Top variable fonts for UI in 2026:

- **Inter** — The design-system default. Generous x-height, large apertures, unbeatable screen readability. Product UIs, SaaS, dashboards.
- **Source Sans 3** — Content-heavy sites. Reading comfort is unmatched for long-form text.
- **Roboto Flex** — For design systems that need extreme customization. Full weight/width/slant axis control.
- **Manrope** — Modern marketing sites. Geometric but warm. Incredible for hero headlines.
- **Space Grotesk** — Creative products. Personality without chaos. Balances tech and humanist vibes perfectly.
- **IBM Plex Sans Variable** — Enterprise tools. Rock-solid, with excellent CJK+Latin mixed typesetting.

### Load Variable Fonts Without Torching Your Performance

Yes, it's one file, but that file can be chunky. Best practices:

\`\`\`css
@font-face {
  font-family: 'Inter Variable';
  src: url('/fonts/Inter-Variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
}
\`\`\`

Key points: **Use WOFF2** (~30% smaller than WOFF). **font-display: swap** ensures body text is visible immediately with a system fallback — the web font swaps in seamlessly once loaded. **Preload critical font files** with a \`<link>\` tag. And if you only need Latin characters, **subset your fonts** — cutting character ranges you don't use can shrink file size by 60-80%.

## Part 2: Modular Type Scale — Stop Using Magic Numbers

Randomly typing \`font-size: 15px\` and \`17px\` is where design discipline goes to die. A professional typesetting system generates its scale from a fixed ratio.

### The Two Ratios Worth Using

- **Major Third (1.250)**: Perfect for content sites — blogs, docs, reading products. Smooth, natural transitions between sizes. Your reader never feels the jump.
- **Perfect Fourth (1.333)**: For visually bold pages — hero sections, landing pages. Stronger rhythmic contrast that demands attention.

Based on a 16px root (1rem) and the 1.25 ratio:

- **xs**: 12.8px — captions, tags, footnotes
- **sm**: 16px — body text
- **md**: 20px — H3
- **lg**: 25px — H2
- **xl**: 31.25px — H1
- **2xl**: 39px — Hero headline
- **3xl**: 48.83px — Display text

Wire the entire site with CSS custom properties from this scale. Every new component **only picks from these values.** No exceptions. Kill magic numbers at the source.

## Part 3: Line Height & Line Length — The Silent Reading-Experience Killers

### The Golden Line-Height Rule

- **Body text**: 1.6–1.85. For CJK text especially, push toward 1.8 — Chinese characters are square and dense; tight line heights make them feel claustrophobic. Two paragraphs in and the reader bails.
- **Headings**: As font size increases, line height must **tighten up**. For headings at 36px+, compress to 1.1–1.25. Otherwise the gap between heading lines becomes a yawning white chasm that screams "amateur."

### Line Length Has a Hard Ceiling

When a single line exceeds ~75 characters, your eyes struggle to track back to the start of the next line. You skip, you re-read, you get lost. **Cap body text containers at 680px max-width.** This isn't about aesthetics — it's about how human eyes physically work. Every premium reading experience has a narrow text column. It's not because designers are afraid of full-width screens. It's because your retinas literally can't scan wider.

## Part 4: Cross-Platform Font Stacks — Make Every OS Look Good

Default system fonts vary wildly across platforms. macOS ships PingFang SC / SF Pro. Windows has Microsoft YaHei / Segoe UI. iOS has SF Pro. Android has Roboto. Your \`font-family\` stack must degrade gracefully — use the best available, fall back step by step.

\`\`\`css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Text",
  "PingFang SC",
  "Hiragino Sans GB",
  "Microsoft YaHei",
  "Helvetica Neue",
  Helvetica,
  Arial,
  sans-serif;
\`\`\`

And here's a lifesaver that nobody talks about — tune fallback font metrics to minimize CLS during the swap:

\`\`\`css
@font-face {
  font-family: 'Fallback';
  src: local(Arial);
  size-adjust: 105%;
  ascent-override: 92%;
}
\`\`\`

When your fallback font and web font have noticeably different x-heights, the page jumps the moment the web font loads in. FOFT (Flash of Falsh Text) turns into CLS. Use \`size-adjust\` and \`ascent-override\` to match the fallback metrics to your web font. The swap becomes invisible. Nobody will consciously notice — but everyone will feel that "this site is solid."

## Part 5: What Typography Is Actually About

At the end of the day, typography isn't about someone saying "nice font." **It's about keeping people reading.** If a user looks at your headline and doesn't scroll down — something's wrong with your size, your line height, or your line length. Maybe all three.

A great typesetting system is like a perfectly paved road. You drove ten kilometers and didn't feel a thing, because nothing jolted you. The road made you forget the road existed. That's exactly what typography is supposed to do.`
};
