export default {
  id: 'a1',
  categoryKey: 'copyright',
  tag: 'Copyright & Compliance',
  icon: 'fas fa-shield-alt',
  title: 'Image Copyright & Creative Commons Guide',
  desc: 'Everything about CC licenses, commercial boundaries, and staying out of legal trouble.',
  readTimeVal: '12 min',
  date: '2026-01-10',
  content: `Let me tell you a true story. Last year, a friend of mine who runs a WeChat blog used a "free-looking" photo from Unsplash in a sponsored post. Three months later: a stock photo platform sent a cease-and-desist letter demanding ¥80,000 in damages. The original photographer had never authorized Unsplash to distribute that image — some random third party uploaded it.

My friend was stunned. "How was I supposed to know?"

The moment that ¥80,000 demand letter landed, the scene was pretty much like this:

![Receiving copyright demand letter](/gifs/panic.gif)
*▲ Receiving an ¥80,000 copyright infringement claim out of nowhere*

Here's the thing — courts don't care that you "didn't know." Image copyright is a strange beast: the barrier to entry is near zero (anyone can download an image), but the cost of getting it wrong can wipe out a small team (a single infringement lawsuit ranges from tens of thousands to hundreds of thousands). I've spent a lot of time studying CC licenses, commercial authorization boundaries, and AIGC copyright edges. Here's everything you actually need to know.

## Part 1: What Creative Commons Actually Means — Explained Once and For All

Creative Commons isn't some arcane legal jargon — it's a standardized licensing system that sits between "all rights reserved" and "no rights reserved," giving creators six transparent options.

These six options are built from four basic elements:

- **BY (Attribution)**: You must credit the original creator and source. This is the baseline for all CC licenses, except CC0.
- **NC (Non-Commercial)**: No commercial use whatsoever. A WeChat blog with ad revenue? A company website? A pitch deck for fundraising? All count as commercial. Don't try to finesse this one.
- **SA (Share-Alike)**: If you remix, transform, or build upon the work, your derivative must be released under the same CC license.
- **ND (No Derivatives)**: You can redistribute the original work as-is, but no cropping, editing, or remixing allowed.

**Here's the golden rule for commercial projects: if it doesn't have "NC" in the name, you're good. If it does — hands off.** Only three licenses (plus CC0) allow commercial use: CC BY, CC BY-SA, CC BY-ND, and CC0.

### CC0: The Creator Gave It All Away

Technically, CC0 isn't even a license — it's a waiver. The creator has voluntarily surrendered all copyright and related rights to the fullest extent permitted by law. You can download it, modify it, redistribute it, even sell it — no attribution required.

But two critical caveats: **First, CC0 only covers copyright, not publicity rights or trademark.** If the image contains a recognizable human face or a brand logo, you still need separate authorization before commercial use. Second, you can't just bundle other people's CC0 images into a "stock photo collection" and sell that — that's not creation, that's repackaging. When I build side projects, roughly 80% of my assets come from CC0 libraries (Pixabay, Pexels), but I double-check every single image: any faces? Any logos? Only when it's clean do I hit deploy.

### CC BY: Just Give Credit, Do Whatever Else You Want

The most permissive of the six licenses. Commercial use? Yes. Modifications? Yes. Any platform? Yes. The only trade-off: **you must provide attribution**, and "image from the internet" doesn't cut it. Attribution follows the **TASL format**: Title, Author, Source, License. Four pieces of information — not one fewer. Every designer and editor should memorize this. It's simple, clear, and legally solid.

### CC BY-SA and CC BY-ND: Two Special Cases

SA (Share-Alike) has a "viral" quality — any derivative work based on a CC BY-SA image must also be CC BY-SA. For commercial projects that need exclusivity, this is a dealbreaker. But if you're building open-source documentation or a community knowledge base, SA is actually a feature — it protects the ecosystem from being harvested for profit.

ND (No Derivatives) is more common in commercial contexts. Many brand asset libraries use ND: you can use my image, but don't touch it. Use it as-is, with attribution. Perfect for news illustrations, brand materials, and any "display only" scenario.

### Anything With "NC" In It: Just Don't

I've seen the most painful case: a nonprofit organization used CC BY-NC images, confident they were fully compliant. They got sued — because their website had a "Donate" button. The court ruled it constituted indirect commercial activity. That's how brutally narrow the NC boundary is.

When you try explaining to a client that "NC means no commercial use," and they hit you with "but I found it on Google, why can't I just use it?":

![Client confusion on copyright](/gifs/confused.gif)
*▲ The face everyone makes when a client says "but images on the internet are free, right?"*

## Part 2: Four Iron Rules for Commercial Projects

### Rule 1: Save License Proof the Moment You Download

On my machine, there's a folder organized by project and date, containing screenshots of every third-party image's license terms and download record. Sound obsessive? Wait until a rights holder comes knocking — those screenshots are your only lifeline. Courts decide based on **evidence**. The difference between "here's my documented authorization record" and "uh, I don't remember" is tens of thousands in damages. Make it a habit: download an image, screenshot the license page, save the record. Five seconds. Worth every ounce of peace of mind.

The moment you think you can just quietly delete the infringing image and pretend nothing happened — only to discover the original creator already took webpage snapshots as evidence:

![Sneaking away quietly](/gifs/sneak.gif)
*▲ Realizing the infringement notice already comes with Wayback Machine snapshots*

### Rule 2: Model Releases and Property Releases Are Completely Separate Things

You find a CC0 street photo with a random passerby's face in it. You use it in a brand advertisement — and that passerby sues you for violating their right of publicity. You pull out the CC0 license as your defense? It won't help. CC0 covers copyright. Publicity rights are an entirely different legal domain. **Before any commercial publication, confirm you have both a Model Release and a Property Release.**

### Rule 3: AIGC Copyright Is a Giant Gray Zone

The current consensus from the US Copyright Office and Chinese courts: **images generated entirely by AI, without substantial human creative input, are not protected by copyright law.** That image you got from typing "beautiful sunset" into Midjourney? Anyone can use it, and you can't stop them. But if you spent hours fine-tuning prompts + ControlNet precision control + Photoshop post-production compositing — those "human creative contributions" *may* be protectable. The key is whether you can **prove** how much human intervention you put in.

### Rule 4: Your Team Needs a Compliance Audit Process

Build a simple four-column spreadsheet: filename, source, license type, expiration date. Maintenance cost is near zero, but it blocks 90% of copyright risk.

Once you've built the habit of "screenshot on download," when the opposing lawyer questions you, you'll be holding a solid shield:

![Compliance screenshot proof](/gifs/thuglife.gif)
*▲ Holding a complete chain of authorization evidence — no panic whatsoever*

## Part 3: The Bottom Line — Become a "Visual Architect"

Copyright literacy isn't a legal problem. It's a **professional competence** problem. AI can generate ten thousand images for you, but can it tell you which one will get you sued and which one won't? **No, it can't.** Shifting copyright awareness from "damage control after the fact" to "muscle memory before you even start" — that's the real moat for any creative professional.`
};
