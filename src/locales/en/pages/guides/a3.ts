export default {
  id: 'a3',
  categoryKey: 'ai',
  tag: 'AI Exploration',
  icon: 'fas fa-robot',
  title: 'AIGC Visual Creation Workflow',
  desc: 'Midjourney & ControlNet in production — from prompt engineering to commercial delivery.',
  readTimeVal: '18 min',
  date: '2026-02-15',
  content: `Back in 2023 when AI art first blew up, the entire internet was screaming "designers are doomed." Fast forward to 2026 — turns out designers aren't extinct. The ones who refused to learn AI, though? Yeah, they got steamrolled. It's giving "the future waits for no one" energy.

I still remember my first Midjourney prompt: "beautiful girl portrait." Hit enter. The result? Twisted limbs, three extra fingers, one eye higher than the other. The shock was real:

![First AI image render surprise](/gifs/confused.gif)
*▲ The pure bewilderment of seeing AI generate a random number of fingers — what the hell is this*

But now? My team's AI workflow has gone from "slot machine pulls" to "surgical precision." Here's the whole playbook.

## Part 1: Prompt Engineering — It's Not Creative Writing, It's Spellcasting

A lot of people think a good prompt is just a long paragraph. That's exactly backwards. A genuinely effective prompt is a **structured set of visual directives**, not prose.

### Here's the Prompt Structure That Actually Works

Break every prompt into five dimensions:

1. **Subject**: Who/what, doing what? — "a woman in a flowing red hanfu, holding an oil-paper umbrella"
2. **Setting**: Where? — "rainy alley in an ancient Jiangnan water town, moss-covered cobblestones, light drizzle"
3. **Lighting & Atmosphere**: What light? What mood? — "soft diffused light, post-rain mist, cinematic melancholy"
4. **Color & Texture**: Palette? Material? — "desaturated Morandi tones, watercolor texture, film grain"
5. **Composition & Framing**: Angle? Aspect ratio? — "medium shot, rule of thirds, --ar 3:2"

Fill all five, and your output has direction. Just writing "pretty girl" — dude, AI isn't psychic. It's not gonna magically guess what's in your head.

The vibe of endlessly tweaking weights and rolling seeds in the ControlNet matrix:

![AI Prompting and Seed Rolling](/gifs/ai_roll.gif)
*▲ Trying to figure out which parameter is actually doing the work — peak "am I a wizard or just lucky" energy*

### MJ Parameters That'll Save You Hundreds of Hours

- **\`--style raw\`**: Turns off Midjourney's built-in "beautification filter." For character design or product shots, this is non-negotiable. Otherwise the AI slaps on greasy soft-focus effects and everything reeks of cheap AI art.
- **\`--s 100-300\`**: Stylization level. Keep it low for commercial work — 100 to 300. Past that, the image looks gorgeous but has absolutely nothing to do with what you actually described. It'll drift so far you won't recognize it.
- **\`--cref\`** (new in V6.1): Character reference image. Absolute lifesaver — upload one character portrait, pair it with \`--cw\` to control weight, and every subsequent generation locks onto those facial features. Character consistency without gambling on seeds? Finally.
- **\`/describe\`**: Upload a reference image and AI reverse-engineers the prompt. See an insane image but don't know how to describe it? Drop it in, let AI deconstruct it, then refine. Ten times more efficient than guessing blindly.

## Part 2: Precision Control — Midjourney + ControlNet is the Full Stack

Honestly? MJ alone isn't enough for production work. It's like a wildly talented art student — gorgeous output, zero obedience. You ask for a profile, it gives you a front-facing portrait. ControlNet is the tool that makes it actually listen.

### My Battle-Tested Combo

**Step 1: MJ handles creative exploration.** Run the same prompt multiple times, generate composition options. This phase is about volume and possibility — quantity over quality. Run 16 variations per direction, pick the 2-3 that feel right, move them forward.

**Step 2: ControlNet takes over for precision.** Bring the chosen composition into Stable Diffusion and wire up the right ControlNet:

- **Canny Edge**: Locks line art contours. The composition stays exactly where you want it. Perfect for architecture, product shots, UI mockups — anything needing precise structure.
- **OpenPose**: Locks body posture. For character series work, this is your anchor — pose stays locked, style can vary freely.
- **Depth**: Locks spatial structure and perspective. Essential for environment shots and interior scenes.
- **Scribble**: Turns your rough sketch directly into a polished image. This one genuinely feels like sorcery — a few scribbled lines, and AI fills in the full render.

Don't crank the weight too high — the default 0.8 works for most scenarios. Too high and the AI is shackled, zero creative breathing room. Too low and... why are you even using ControlNet? Pair it with starting/ending control steps (e.g., 0.0 to 0.8) — the AI strictly follows ControlNet for the first 80% of sampling steps, then gets 20% of creative freedom. That's the sweet spot: control with soul.

**Step 3: Photoshop finishes the job.** AI output, no matter how good, still produces janky fingers and weird intersections. The final pass is always manual. Photoshop's Generative Fill is incredible for fixing small defects — circle the extra finger, AI fills in the correct content. Then use Camera Raw filter to unify the color grade and texture across all outputs.

### Character Consistency — The Hardest Problem in the Room

When you're producing a series, nothing is more frustrating than the character looking different in every single image. Currently, three approaches work:

1. **MJ with \`--cref\`**: Simplest path. Drop one character reference shot, everything after locks onto that face. MJ V6.1 only.
2. **SD with custom LoRA**: Collect 15-30 high-quality character images (1024×1024), train with Kohya_ss at learning rate 1e-4, roughly 20 epochs. Once trained, you've got your own character engine — style consistency blows MJ out of the water.
3. **IP-Adapter**: Feed a reference image as style + content input, weight 0.6-0.8. Great for quick iteration, no training required. But don't expect LoRA-level precision — it won't lock facial micro-details.

That moment after countless failures when the AI finally renders the perfect masterpiece:

![Masterpiece AI render celebration](/gifs/gatsby_toast.gif)
*▲ The Gatsby-level satisfaction when the render finally, finally comes out perfect*

## Part 3: The 70/30 Rule for Commercial Production — AI Does 70%, You Do 30%

Some bosses genuinely think buying a Midjourney subscription equals having a design team. Wake up. AI-generated output still has a whole Photoshop-shaped gap between "generated" and "production-ready."

### Here's How the 70/30 Split Works

**AI handles 70%**: Batch generation, style exploration, asset creation, composition references, background rendering. This is where AI is absurdly fast — one person can generate hundreds of images in a day, no sweat.

**You handle 30%**: Aesthetic judgment, detail refinement, copyright clearance, brand alignment, typography overlay, color correction. Nobody can automate this — because only you know the usage context, whether it fits the brand voice, and whether there are legal landmines.

One sentence to tattoo on your brain: **AI is an amplifier, not a replacement.** Your taste ceiling is the ceiling on AI output. Someone with bad taste using AI just produces more garbage, faster. No taste + AI = industrial-grade garbage assembly line.

### Speaking of Copyright — That Giant Gray Zone

Watching the artist community and AI companies go to war over training data, all of us just:

![AI debate spectating](/gifs/popcorn.gif)
*▲ Watching the copyright battle unfold from the sidelines — popcorn status: ready*

Seriously though — AI-generated image copyright is a gray zone worldwide. The US Copyright Office is clear: purely AI-generated content gets no protection. But works with sufficient human authorship? Potentially protectable. The key is whether you can **prove** your human input. Save your prompt history. Keep step-by-step process files. Screenshot your workflows. That's your evidence chain for any future dispute.

And the LoRA trap — taking someone else's copyright-protected work to train a LoRA, then calling it "your style." Technically doable doesn't mean legally defensible. All training data must go through internal approval. Copyright confirmed clean before anything enters the training set.

## Part 4: If You're a Team Lead — How to Actually Roll Out AI Workflows

Don't try to make everyone switch to AI overnight. That's unrealistic, and people will hate you for it.

The path that actually works, in three steps:

1. **Start with mood boards.** Have the team use AI for mood boards and style exploration. Don't require delivery quality — pure skill building. After one sprint, if the team's shifted from "fear" to "curiosity," you've already won this phase.
2. **Build a team LoRA library.** Train your company's visual assets into proprietary style models. Every new project pulls from the same model family. Brand visual consistency? Checked. Efficiency? Doubled.
3. **Front-load copyright clearance.** All AI training data goes through internal approval *before* entering the training set. Maintain a documented log of prompts and parameters — full traceability. Finding out something isn't clean after the fact is way too late.

AI used right is a superpower. AI used carelessly is a self-destruct button. Seriously.`
};
