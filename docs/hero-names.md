# Hero display name ownership

A hero's display name now belongs to its save, not device-global settings. The active runtime stores playerName, nameAuto and nameHero; local saves, manual/quick/auto snapshots, cloud payloads and hot snapshots include playerName, nameAuto and nameVersion. Settings retain a mirror for the existing edit UI only.

HUD, overhead name tag, dialogue and player narration all use heroName(). Gallery playback uses the selected gallery character's default name while keeping the active save's custom name intact for return. Save-slot and cloud summaries resolve the saved identity.

Legacy automatic settings resolve to the saved character's default. Legacy slot metadata retains non-default nicknames; stale metadata containing the other character's default is corrected. A legacy active save may recover an explicitly customized device nickname when it belongs to the same hero. Bare external saves with no name information use their own character default. New explicit custom names, including intentionally naming one character after another, are preserved. The loadSave read no longer changes global name settings.

Rename persistence updates only name fields on the active save, so changing a name does not force a position/progress save when autosave is off. Existing inventory, coins, quest flags and other progress fields remain intact.

Validation: node scripts/checks/hero-name.mjs covers default identity, cross-save custom names, legacy migration, gallery switching, HUD output and progress preservation. Existing entry/edge movement checks and production build also pass.
