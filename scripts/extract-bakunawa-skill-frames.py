from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
import json
import sys

if len(sys.argv)<2:
    raise SystemExit('Usage: python scripts/extract-bakunawa-skill-frames.py <reference-image.png>')
SOURCE = Path(sys.argv[1])
OUT = Path('public/assets/bakunawa/skill-reference')
OUT.mkdir(parents=True, exist_ok=True)
image = Image.open(SOURCE).convert('RGB')
preview = image.resize((1600, 904), Image.Resampling.LANCZOS)
scale = image.width / 1600
x_starts = [350, 500, 650, 800, 950, 1110, 1260, 1417]
rows = {'abyssal_roar': 180, 'tidal_cataclysm': 359, 'maelstrom_prison': 535, 'stormfang_lightning': 712}
size = 112
inset = 9
frame_px = round(size * scale)
metadata = {'source': SOURCE.name, 'sourceDimensions': list(image.size), 'sourceFile': 'uploaded reference only',
            'extraction': {'previewGrid': '1600x904; source content boxes estimated from eight panel art areas per strip',
                           'insetPreviewPixels': inset, 'framePreviewPixels': size,
                           'alphaMatte': 'soft navy key matte derived from each frame perimeter; presentation card frame and labels excluded'},
            'animations': []}

def remove_navy_background(frame):
    rgb=np.asarray(frame,dtype=np.float32); h,w,_=rgb.shape
    corners=np.array([rgb[4,4],rgb[4,w-5],rgb[h-5,4],rgb[h-5,w-5]])
    bg=corners.mean(axis=0)
    d=np.sqrt(((rgb-bg)**2).sum(axis=2))
    # Feather at the silhouette edge; preserve darker colored linework beyond the navy matte.
    alpha=np.clip((d-17)*255/35,0,255).astype(np.uint8)
    rgba=frame.convert('RGBA');rgba.putalpha(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(.35)))
    return rgba

for name,y0 in rows.items():
    atlas=Image.new('RGBA',(frame_px*8,frame_px),(0,0,0,0))
    rowmeta={'id':name,'displayName':name.replace('_',' ').title(),'file':name+'.webp',
             'frameSize':[frame_px,frame_px],'frameCount':8,'layout':'8 columns × 1 row',
             'fps':8,'loop':False,'pivot':[.5,.5],
             'sourceConfidence':'high for visible art and progression; medium for exact panel boundaries',
             'visualSequence': {
               'abyssal_roar':['head lowered','jaw opening','throat energy','violet charge','energy flash','shockwave forms','ring expands','fragments dissipate'],
               'tidal_cataclysm':['ocean disturbance','water rises','curved wave forms','crest grows','curl builds','wave peaks','wave crashes','foam and spray disperse'],
               'maelstrom_prison':['ground ripple','rotation begins','currents expand','water rises','wall develops','vortex grows','water prison forms','energy arcs peak'],
               'stormfang_lightning':['boss charge','horn arcs','mane electrifies','electricity intensifies','mouth charges','discharge starts','branches strike','impact flash and spray']
             }[name],
             'events': {'tell':[0,1,2,3], 'impact':[4,5,6,7]},
             'collision':'uses existing boss attack hazard and hit timing; visuals do not define collision',
             'frames':[]}
    for i,x0 in enumerate(x_starts):
        left=round((x0+inset)*scale); top=round((y0+inset)*scale)
        crop=image.crop((left,top,left+frame_px,top+frame_px))
        keyed=remove_navy_background(crop)
        atlas.alpha_composite(keyed,(i*frame_px,0))
        rowmeta['frames'].append({'index':i,'sourcePreviewBounds':[x0+inset,y0+inset,size,size],
                                  'atlasRect':[i*frame_px,0,frame_px,frame_px]})
    atlas.save(OUT/rowmeta['file'],format='WEBP',quality=93,method=3,lossless=False,alpha_quality=100)
    metadata['animations'].append(rowmeta)
(OUT/'ANIMATION_MANIFEST.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps({'out':str(OUT),'framesPerAnimation':8,'frameSize':frame_px,'files':[a['file'] for a in metadata['animations']]}))
