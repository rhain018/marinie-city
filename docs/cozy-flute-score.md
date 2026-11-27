# Original seaside flute soundtrack

Replaces the previous Celtic 6/8 background arrangement with four original 16-bar, six-pulse waltz themes. Uses the existing Web Audio instrument engine; no music downloads or save-format changes.

| Theme | Tempo | Arrangement |
| --- | --- | --- |
| Day | 76 BPM | Flute, acoustic arpeggios, soft strings, occasional bell |
| Dusk | 66 BPM | Mellow flute, piano, sparse acoustic notes |
| Night | 54 BPM | Airy flute, quiet piano and harp-like plucks |
| Mystery | 58 BPM | Restrained flute and sparse minor harmonies near the lighthouse at night/blackout |

Each theme has its own original melody and chord progression. Melody bars contain exactly six pulses, including breathing rests. Theme changes wait for a bar boundary; releases and reverb carry across the change. No silent gap is inserted at loop boundaries. The scheduler recovers from delayed mobile timers without emitting a backlog of notes.

A dedicated music duck gain falls to 30% during dialogue and gently restores afterward, leaving the main music-volume setting and cinematic music fades in control. Musical reverb follows the music bus so muting also mutes its tail. Existing SFX generators, ocean ambience, cinematic score functions, iOS audio-unlock flow and visibility suspension remain in place.

Validation: score structure, over-one-loop scheduling for day/dusk/night, mystery selection, dialogue gain and timer recovery tests. Browser audio ran with nonzero measured output for all three daily themes, verified dialogue gain 0.30, zero music RMS after mute and restored output. All inline scripts parse; hero/save-name compatibility checks pass. Physical iOS listening was not available.
