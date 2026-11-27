# New Marinie City NPCs

15 additions, preserving the original 10 NPCs, quests and save format.

| NPC | Role | Appearance | Behavior / action | Position |
| --- | --- | --- | --- | --- |
| Rusty | Shipwright | Goggles, grey beard and a tool-filled work vest. | Quiet and practical; repairs wooden hulls with rhythmic hammer strikes. | [1038, 746] |
| Lira | Bookseller | Round glasses, a flower-trimmed straw hat and a book satchel. | Reads and turns pages; dreams of visiting every island. | [322, 290] |
| Kairo | Tide Watcher | Dark blue hair, sea-worn clothes and a thoughtful pose. | Scans the horizon and quietly counts the rhythm of the tide. | [702, 390] |
| Sora | Ship Chandler | Green hair, white cap and an oversized supply backpack. | Cheerfully checks rope, lantern and food stock. | [1190, 586] |
| Vargas | Fish Auctioneer | Red bandana, muscular build, apron and a loud port-side manner. | Calls the catch and scans the crowd with energetic gestures. | [1278, 598] |
| Selene | Lighthouse Keeper | Pale hair, long navy coat and brass lantern details. | Maintains the light and inspects her lantern at dusk. | [238, 314] |
| Bobong | Fisherman | Friendly moustache, sturdy overalls and fishing gear. | Casts from the pier and gently reels when the float dips. | [306, 706] |
| Mari | Blacksmith Apprentice | Purple hair, brass goggles and a leather work apron. | Practises careful tool strikes and learns from Torin. | [1074, 618] |
| Tulip | Florist | Flower-covered hat, warm hair and a bright bouquet. | Sorts flowers and arranges a fresh bunch for the port. | [418, 286] |
| Kelvin | Tea Merchant | Glasses, dark hair, long coat and a travelling tea case. | Carefully pours tea and enjoys conversation more than bargaining. | [870, 298] |
| Milo | Cat Lover | Cat-eared cap, soft expression and a packed shoulder bag. | Crouches to feed a small stray and lets it approach at its own pace. | [258, 550] |
| Bell | Postal Worker | Blue postal cap, envelope and a practical mail satchel. | Patrols the plaza and checks letters at delivery stops. | [634, 310] |
| Dr. Hana | Veterinarian | Glasses, white veterinary coat and animal-care supplies. | Kneels for a gentle animal check and keeps her tools tidy. | [530, 306] |
| Ziggy | Boat Repair Kid | Spiky blond hair, oversized goggles and a small tool kit. | Tests a loose fitting with quick, curious repair motions. | [1162, 734] |
| Luna | Street Performer | Red headscarf, dark hair and a well-loved acoustic guitar. | Sways and strums; music notes drift above her while she performs. | [978, 638] |

## Implementation

Four directional poses and a portrait are extracted from the supplied character sheet. Source poses are retained as provided; there are no new hand-drawn frame sequences. Walking uses the existing procedural lower-body motion. Role gestures use existing hammer/fishing/music systems plus small Canvas book, supply, flower, tea, lantern and animal-care effects.

Talk options remain repeatable in daylight and at night. Watch-action options show a short role demonstration after dialogue closes. Bell patrols valid plaza stops and shows an envelope. New NPCs and existing patrols yield when an added character occupies the next step. Spawn points avoid existing NPCs and building approach points.

The role actions are ambient interactions and do not award items, gold or EXP. Existing shops, quests, account storage and player progress remain unchanged.

## Validation

node scripts/checks/new-npcs.mjs checks 15 unique NPC identities, 75 assets, all spawn/route positions, repeated day/night options, action dispatch and 30 seconds of collision-safe updates. Existing name/save and entry/edge tests also pass. Sprites and the Rusty portrait/dialogue/action menu were reviewed in the running browser scene. Actual phone performance remains unverified.
