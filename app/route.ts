import game from '../game/html';
export const dynamic='force-dynamic';
export function GET(){return new Response(game,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})}
