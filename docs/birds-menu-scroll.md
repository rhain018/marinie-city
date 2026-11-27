# Animated map birds and menu scrolling

Six seagull illustrations are baked into the existing map texture. A small, cached runtime texture layer covers only their traced silhouettes (and two nearby painted bird shadows), sampling adjacent water/wall background. Original map files and HD tiles are unchanged. The existing six flying gulls now seed around these locations and use the existing wing animation and flight AI. Perched gull rendering is enabled again; their ten perch locations are within the current 1536 × 864 world. Tap/proximity takeoff and idle bob/head turns remain active. Flight destinations no longer target coordinates below the map.

The game menu options list has its own vertical scroll area, touch panning, momentum scrolling and a narrow scrollbar. The menu title and Return control remain outside the scroll area. The save/load/gallery content remains independent.

Validation: six background sampling regions, all perch/destination bounds, flyer motion, tap takeoff and a 70-second bird simulation; source syntax; browser views of harbor/south/wall bird areas, and scrolling from Account/Cloud Save down to Quit while Return stays visible in an 844 × 320 landscape viewport. Physical iOS touch testing was not available.
