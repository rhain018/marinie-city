# In-game calendar

Day 1 is Monday. flags.days stores completed days (zero-based), so existing saves without it start at Day 1. Weekday is derived, not saved separately. Night-to-day and sleeping until morning advance once. Evening naps and story-forced night do not advance. The existing manual time controls remain; no real-world/offline clock was added.

Browser integration checks passed: legacy save with active nets quest, night rollover, phase changes, morning sleep, evening nap, Sunday to Monday, autosave reload, manual/quick snapshot, new-game reset, restoring another save. Temporary harness used actual game functions with a disposable save and was removed before publication.

HUD inspected at 640x360 and 844x390. Physical Safari/iPhone not tested. Inline scripts pass Node syntax validation.
