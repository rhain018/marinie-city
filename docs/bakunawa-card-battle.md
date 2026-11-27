# Bakunawa card battle artwork

The card encounter opens from **Developer Test → Boss Combat Test → Bakunawa Card Battle**. Version 126 supplied the decks, turn sequence, damage, defense, phases, and Ultimate charge. The card presentation reads those existing rules and advances an attack at its visual impact.

All paths below are relative to `public/assets/bakunawa/`.

| Asset | Source | Use |
| --- | --- | --- |
| `cards/art/storm-dock.webp` | Environment plate painted from the two Marinie City card mockups | 1536 × 864 dock and storm ocean |
| `cards/art/card-frame.webp`, `cards/art/ultimate-frame.webp` | Painted ornament atlas based on the mockups | Standard and Ultimate frames over the card illustrations |
| `cards/art/intent.webp`, `cards/art/dialogue.webp`, `cards/art/turn.webp` | Painted ornament atlas | Enemy intent, dialogue, and End Turn |
| `cards/art/energy.webp`, `cards/art/deck.webp`, `cards/art/discard.webp` | Painted ornament atlas | Energy medallion and live card counts |
| `cards/art/loki-portrait.webp`, `cards/art/yhannie-portrait.webp`, `cards/art/trident.webp` | Crops from the supplied battle mockups | Hero portraits and Bakunawa crest |
| `cards/art/slash.webp`, `cards/art/riposte.webp`, `cards/art/guard.webp`, `cards/art/loki-ultimate.webp` | Individual illustrations cropped and straightened from the Loki mockup | Crimson Slash, Riposte, both Loki defense cards, and Abyssbreaker |
| `cards/pulse.webp`, `cards/spear.webp`, `cards/shield.webp`, `cards/dodge.webp`, `cards/ultimate.webp` | Version 126 card art | Yhannie’s cards and the shared Dodge Step illustration |
| `cinematic/loki.webp`, `cinematic/yhannie.webp`, `cinematic/bakunawa.webp`, `crest.webp` | Existing battle atlases and water sprite | Live fighter poses, Bakunawa’s windup and recoil, and moving surf |
| `contact-atlas.webp`, `skill-reference/*.webp` | Existing encounter assets | Impact frames and illustrated boss effects |
| `armageddon.mp3` | “Armageddon” by ALIBI Music | Looping Bakunawa score controlled by the Music setting |
| `effects/yhannie-vfx.webp`, `effects/loki-vfx.webp` | Illustrated 3 × 2 sheets with alpha | Independent charge, trail, guard and impact layers |
| `effects/yhannie-cut-in.webp`, `effects/loki-cut-in.webp` | Marinie City Ultimate Skills Showcase | Hero close-ups during the 16:9 Ultimate sequences |
| `effects/combat-sfx.wav` | Original layered synthesis | Card selection, cast, release and contact cues controlled by SFX Volume |

Card formation, selection, charge, and card text use live elements. Loki’s sword cards advance on the dock and use his sword cues. Yhannie casts a ring for Arcane Pulse and launches a spear for Moon Spear. The existing turn begins Bakunawa’s windup and resolves the player’s defense on impact. The pause controls halt both the animation clock and score. The operating system’s reduced-motion preference limits motion.

The developer test keeps its encounter state in memory. Chapter 1’s playable Tideborn encounter continues to use its real-time renderer, collision geometry, and save flow.

Both battle modes slow the clock during the Ultimate release and the first impact beat. The camera uses that clock, and the contact frames and sound cues follow the existing damage event. Reduced motion skips the close-up, slow motion, and camera shake.
