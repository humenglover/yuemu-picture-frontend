export default {
  id: 'a4',
  categoryKey: 'performance',
  tag: 'Performance',
  icon: 'fas fa-tachometer-alt',
  title: 'Web Media Performance Guide',
  desc: 'WebP/AVIF, responsive images, and LCP optimization — real strategies that actually work.',
  readTimeVal: '14 min',
  date: '2026-03-05',
  content: `Let me hit you with some real numbers. Last year I inherited a stock photo gallery project. The LCP on first load? **8.4 seconds.** For context: Google's research shows that beyond 3 seconds, 53% of mobile users bounce. At 8.4 seconds, more than half your visitors never even saw what the page looked like. Months of work, gone in the time it takes to microwave leftovers.

The moment that Lighthouse report spat out 8.4s, everyone at their screen looked exactly like this:

![Slow LCP loading panic](/webm/lcp_rage.webm)
*▲ The raw urge to delete the entire assets folder and start over*

Three weeks later: LCP down to 1.2 seconds — an 85% reduction. Bounce rate fell off a cliff. The satisfaction was unreal. Better than any design refresh metric I've ever seen.

Here's the playbook. None of this is abstract theory — it's all copy-paste practical.

## Part 1: Format Selection — WebP vs AVIF? Stop Overthinking It

### TL;DR: AVIF for best experience, WebP as the safety net, JPEG as last resort

- **AVIF**: 30-50% smaller than JPEG at equivalent quality. ~94% global browser support as of 2026. The only real downside? Encoding is 8-10× slower than JPEG — so don't even think about runtime transcoding. **This is a build-time or CDN edge-processing format.** Also, AVIF doesn't have progressive decode yet — large images pop in all at once rather than fading from blurry to sharp.
- **WebP**: 25-34% smaller than JPEG. ~97% coverage. The pragmatic default. No HDR support, but for everyday use it's more than enough. If you can only pick one format, pick WebP — compatibility is king.
- **JPEG XL**: Safari 17+ ships it natively. Chrome 145 re-added support in February 2026 (behind a flag). Promising but not ready for prime time — treat it as an archival format for now.
- **JPEG / PNG**: The final fallback. Always keep a set, just in case.

### The \`<picture>\` Tag, Done Right

\`\`\`html
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img src="hero.jpg" alt="Hero image" width="1200" height="630" />
</picture>
\`\`\`

The browser reads top to bottom. Recognizes AVIF? Uses it. Doesn't? Checks WebP. Neither? Falls back to JPEG. Graceful degradation. That's it.

## Part 2: Responsive Images — Don't Make a Phone Download a Desktop Wallpaper

You spent all that effort compressing an AVIF to 200KB. Then a 375px-wide phone screen still downloads the full 1920px version. What was the point?

### srcset + sizes, The Right Way

\`\`\`html
<img
  srcset="
    photo-400w.jpg  400w,
    photo-800w.jpg  800w,
    photo-1200w.jpg 1200w,
    photo-1920w.jpg 1920w
  "
  sizes="
    (max-width: 640px) 100vw,
    (max-width: 1200px) 50vw,
    33vw
  "
  src="photo-1200w.jpg"
  alt="Display image"
  width="1920"
  height="1080"
/>
\`\`\`

Two critical things: **First, never omit \`sizes\`.** Without it, the browser assumes 100vw and almost always picks an oversized image — your entire srcset becomes pointless, and mobile devices still download desktop-sized images. Second, use \`w\` descriptors instead of fixed \`1x\`/\`2x\` — the browser picks the optimal resolution based on device pixel ratio *and* network conditions.

### The Biggest Trap: Layout Shift

You know that thing where you're reading, then an image suddenly loads and yeets the entire page down three screens?

![Layout shift jump](/webm/cls_shake.webm)
*▲ CLS gone wild — because nobody reserved space for the images*

The fix is almost insultingly simple: **put \`width\` and \`height\` on every \`<img>\` tag.** The browser uses these as aspect-ratio hints, reserving the exact space before a single byte arrives. Combine with \`width: 100%; height: auto;\` in CSS, and you've killed both the responsive problem and the layout shift problem in one shot. That ancient \`padding-bottom\` hack? Throw it in the trash where it belongs.

## Part 3: LCP Speed-Up — The Moves That Actually Move the Needle

### Move 1: Never Lazy-Load Your LCP Image

This might be the most counterintuitive rule in performance optimization. \`loading="lazy"\` is great — **just not on your LCP image.** If your hero image is lazy-loaded, the browser waits until layout is complete before even deciding to fetch it. You just burned precious seconds for no reason.

LCP images and below-the-fold images need opposite treatment:

| Attribute | LCP (Hero) Image | Below-the-Fold Images |
|---|---|---|
| \`loading\` | \`eager\` (default) | \`lazy\` |
| \`fetchpriority\` | \`high\` | \`auto\` |
| \`decoding\` | \`sync\` | \`async\` |

Golden rule: **at most ONE image per page gets \`fetchpriority="high"\`.** Everything being high priority means nothing is. The browser's priority system is brutally simple — use it accordingly.

### Move 2: Preload the Hero — But Don't Blindly Preload Everything

If your hero image is loaded via CSS \`background-image\` or injected by JavaScript, the browser discovers it way too late. Use a link preload to jump the queue:

\`\`\`html
<link
  rel="preload"
  as="image"
  imagesrcset="hero-800w.avif 800w, hero-1600w.avif 1600w"
  imagesizes="100vw"
  fetchpriority="high"
/>
\`\`\`

Always include \`imagesrcset\` and \`imagesizes\` on preloads — otherwise you just forced every mobile device to preload a 1600px desktop image. Congrats, your AVIF optimization was for nothing. Also: preload is the highest-priority resource hint in the browser. Abuse it, and you'll starve other critical resources of bandwidth. Only preload your LCP image. Nothing else.

### Move 3: Stop Managing Formats Manually — Let the CDN Handle It

Manually generating AVIF, WebP, and JPEG versions for every single image is a special kind of misery. The modern approach: **let your CDN or image service inspect the \`Accept\` header** and serve the optimal format and size automatically. You store one high-quality master. The edge does the rest. imgix, Cloudinary, Cloudflare Images — pick any of them, they're all better than doing this by hand.

The moment you wire all of this up:

![Pro web media optimization](/webm/hacker.webm)
*▲ AVIF, srcset, fetchpriority combo — feeling like a performance wizard*

And when Lighthouse scores smash through 98:

![Lighthouse 98 score celebration](/webm/celebrate.webm)
*▲ LCP 1.2s, Lighthouse 98 — if you know, you know*

## Part 4: One Last Thing

The weirdest thing about performance optimization? **Nobody compliments you when it's fast. But everyone notices when it's slow.** Good performance is invisible — like air. Bad performance is suffocation.

Don't chase perfection. Just nail the three highest-impact moves first: **eager-load the hero image, use responsive srcset so phones don't download desktop images, and add width/height to every image to kill CLS.** Those three alone put you ahead of 80% of the web.

Performance isn't a one-and-done thing. After you ship, stare at your Lighthouse reports and the slowest real-user data (CrUX / RUM). Tweak, ship, repeat. Speed is ground out, not built in a sprint.`
};
