import json, re
import numpy as np
from scipy.spatial import Delaunay
from PIL import Image, ImageDraw
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'public/assets/city-hd2d'
old=json.loads((p/'city-projection.json').read_text())
# Landmark positions measured on the repaired 1672 x 940 art, never on a warped image.
px={0:[0,0],1:[836,0],2:[1671,0],3:[1671,939],4:[836,939],5:[0,939],6:[0,709],7:[1671,687],
8:[79,176],9:[79,261],10:[217,356],11:[513,366],12:[411,270],
13:[676,295],14:[752,295],15:[676,359],16:[752,359],17:[715,260],
18:[729,427],19:[857,427],20:[589,433],21:[674,433],22:[1045,427],
23:[1082,345],24:[1143,345],25:[1082,415],26:[1143,415],27:[1149,246],28:[1207,246],29:[1207,345],30:[1440,180],
31:[1267,430],32:[1244,452],33:[1296,452],34:[1244,612],35:[1296,612],36:[1455,451],37:[1644,451],
38:[105,447],39:[159,447],40:[105,592],41:[159,592],42:[583,449],43:[640,449],44:[583,592],45:[640,592],46:[383,591],
47:[713,592],48:[793,592],49:[713,618],50:[793,618],51:[713,711],52:[793,711],53:[955,625],54:[1169,625],55:[1064,625],
56:[502,620],57:[573,620],58:[502,712],59:[573,712],60:[191,742],61:[249,742],62:[191,876],63:[249,876],
64:[298,742],65:[354,742],66:[298,876],67:[354,876],68:[1120,703],69:[1190,703],70:[1120,790],71:[1190,790],
72:[833,862],73:[1324,862],74:[1139,868],75:[1203,868],76:[1139,925],77:[1203,925],78:[1271,686],79:[1561,691],80:[971,840],81:[1109,270],82:[1190,448],83:[1375,448]}
world=lambda q:[round(q[0]*1536/1672,4),round(q[1]*864/940,4)]
canonical=old['canonicalWorld'];canonical[58][1]=637;canonical[59][1]=637;render=[world(px[i]) for i in range(len(canonical))]
# Retain the canonical simulation, path grid and all saved positions. Explicit entrances
# bind the new doorsteps to their original coordinates in both projection directions.
entries=[('hotel',[1026,262],[1109,286]),('cityhall',[662,270],[715,291]),('cafe',[370,258],[411,289]),
('seafood',[350,550],[383,606]),('lantern',[202,546],[221,606]),('corner',[478,550],[521,606]),
('kiosk',[602,398],[660,437]),('tunnel',[746,542],[817,604]),('arcade',[970,590],[1068,637]),
('anchor',[1090,584],[1210,637]),('market',[1158,410],[1267,448]),('fisher',[1374,410],[1495,448]),
('betterdays',[1386,586],[1513,657]),('hut',[898,790],[971,857]),('power',[1110,206],[1174,232]),
('apts',[846,262],[930,285]),('port',[1430,606],[1560,681]),('pier',[202,798],[220,875]),('ladder',[694,646],[752,710])]
for name,a,b in entries:
 if a in canonical:render[canonical.index(a)]=world(b)
 else:canonical.append(a);render.append(world(b))
tri=Delaunay(np.array(canonical)).simplices.tolist()
folds=[]
for ids in tri:
 a=np.array(canonical)[ids];b=np.array(render)[ids]
 ca=np.linalg.det(np.array([a[1]-a[0],a[2]-a[0]]));cb=np.linalg.det(np.array([b[1]-b[0],b[2]-b[0]]))
 if ca*cb<=0:folds.append((ids,ca,cb))
print('FOLDS',folds)
if folds:raise SystemExit(1)
mesh={'canonicalWorld':canonical,'renderWorld':render,'triangles':tri}
(p/'city-repair-projection.json').write_text(json.dumps(mesh,separators=(',',':')))
(p/'repair-landmarks.json').write_text(json.dumps({'artSize':[1672,940],'entries':[{'id':n,'canonical':a,'render':world(b)} for n,a,b in entries]},indent=2))
print('Saved',len(canonical),'landmarks',len(tri),'triangles')
