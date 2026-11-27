import {readFile,writeFile} from 'node:fs/promises';

const [html, battleCss] = await Promise.all([
  readFile(new URL('../game/index.html',import.meta.url),'utf8'),
  readFile(new URL('../public/assets/bakunawa/battle.css',import.meta.url),'utf8'),
]);

// Keep the battle HUD and its markup in the same hosted response.
const battleLink = '<link rel="stylesheet" href="/assets/bakunawa/battle.css">';
if (!html.includes(battleLink)) throw new Error('Missing battle HUD stylesheet link');
const prepared = html.replace(battleLink, () => '<style id="tideborn-css">\n' + battleCss + '</style>');
await writeFile(new URL('../game/html.ts',import.meta.url),'export default '+JSON.stringify(prepared)+';\n');
