---
name: game-art-style
description: Help pick a visual style for a game and gather the references, techniques and free assets to reach it. Use when someone is deciding how their game should look ("what art style", "my game looks ugly", "games that look like X", "which assets fit a cozy / retro / print look"), comparing styles, or wants to reproduce a style (toon, PS1, 1-bit dither, pixelated 3D, watercolour …) in their engine.
---

# Game art style

Help the user choose a visual style for their game and leave them with a concrete plan: style, reference games, techniques, learning resources and assets with licences. Then, if they want, apply it.

## Where the data is

The catalogue lives online; fetch it with your web or HTTP tool. It is plain Markdown.

- https://homkathon.gokoding.com/styles/index.md: every style, grouped by look, with a one-line summary and a link to its page.
- https://homkathon.gokoding.com/styles/<id>.md: one page per style with
  - a summary in English and Chinese, and the reference games (Steam store links),
  - **What it takes**: code only, code plus assets, or mostly art, and which assets to prepare,
  - **Reference screenshots**: image URLs; look at them before writing code if you can view images,
  - **How to spot it**: what makes the look recognisable,
  - **Techniques**, **Learn**, **Free assets** (with licences),
  - **Similar styles**: neighbours that are easy to confuse,
  - **Agent notes**: numbered steps to reproduce the look,
  - for toon, PS1, 1-bit and pixelated 3D, a runnable three.js demo (one HTML file with commented shaders). When the user's engine is three.js or WebGL, start from it; for other engines, port the shader logic.
- https://homkathon.gokoding.com/styles/<id> is the same page for humans, with screenshots. Link the user there.

Read the index and the relevant style pages before recommending anything. Prefer the catalogue over your own memory, and say when you go beyond it. Reply in the user's language.

## Steps

1. **Ask only what changes the answer.** Skip anything the user already said or the project shows.
   - Theme and tone (cozy, satirical, eerie, heroic …).
   - 2D or 3D, and engine.
   - Who makes the art: nobody (assets only), a programmer, an artist.
   - Licence constraints (commercial, open source, competition, CC0 only).
   - Budget: free only, or paid packs allowed.
2. **Shortlist 2–3 styles.** For each: why it fits the theme in one line, a link to its page, two reference games, and the main risk or cost, taken from the page's **What it takes** line. When nobody on the team makes art, lead with code-only styles, or say exactly which assets a style needs and where free ones are. Mention a similar style when the user's description sits between two.
   With licence constraints, prefer styles whose assets are CC0, and flag anything that is not.
3. **Give the plan for the chosen style:** techniques in order of impact, learning links, asset packs with licences.
4. **Offer to apply it.** If the user has a project open, follow the style's **Agent notes** on one scene first, adapted to their engine. When done, screenshot the scene and put it next to the reference screenshots. Compare values first, then palette, then detail, and fix the biggest gap first. In a post-processing pass, convert colour to the display colour space exactly once; a missing conversion makes everything dark. Show the user the comparison before changing more. Ask before downloading any asset pack, and name the file, source and licence when asking.

## Rules

- Licences change. Tell the user to check the pack page before shipping. Never describe a custom or unclear licence as CC0.
- Link to reference games; never download or redistribute their screenshots.
- If nothing in the catalogue fits, say so, name the closest two, and suggest adding the style at https://github.com/homkathon/awesome-opus-game-art-styles/issues/new/choose.
