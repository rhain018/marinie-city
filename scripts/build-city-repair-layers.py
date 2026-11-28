from pathlib import Path
import json,re
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import binary_erosion
root=Path(__file__).resolve().parents[1];p=root/'public/assets/city-hd2d'
world=lambda q:[round(q[0]*1536/1672,3),round(q[1]*864/940,3)]
out=[]
def shape(name,pts,base):
 a=np.array([world(q) for q in pts]);l,t=a.min(axis=0);r,b=a.max(axis=0)
 out.append({'n':name,'x':float(l),'y':float(t),'w':float(r-l),'h':float(b-t),'base':world([0,base])[1],'poly':a.tolist()})
shape('twin_sail_monument',[(737,420),(727,417),(731,406),(749,394),(758,382),(752,374),(744,365),(735,364),(734,357),(745,359),(755,355),(765,349),(768,339),(777,324),(791,314),(806,307),(804,318),(800,331),(798,348),(805,344),(815,331),(832,319),(851,307),(852,315),(847,325),(843,345),(842,354),(858,351),(859,356),(848,365),(833,371),(826,378),(827,385),(837,397),(849,409),(856,414),(855,420)],427)
shape('plaza_gazebo',[(583,430),(584,421),(591,411),(591,375),(582,365),(588,357),(605,349),(616,337),(624,329),(624,318),(628,312),(630,315),(631,329),(640,341),(656,349),(674,358),(675,365),(668,374),(669,413),(677,423),(677,429),(657,435),(606,435)],434)
shape('seafood_roof_and_facade',[(170,592),(171,450),(180,437),(175,427),(196,413),(209,411),(231,402),(246,390),(272,378),(299,372),(319,371),(341,378),(373,383),(400,396),(430,409),(452,420),(486,433),(510,447),(532,445),(560,456),(576,495),(569,502),(566,592)],594)
shape('market_awnings',[(1210,343),(1234,333),(1287,328),(1328,333),(1355,346),(1393,349),(1422,342),(1461,332),(1515,333),(1558,338),(1588,332),(1616,333),(1644,343),(1665,358),(1670,378),(1668,391),(1648,389),(1620,378),(1593,368),(1552,369),(1532,378),(1506,379),(1475,369),(1443,372),(1412,390),(1380,402),(1350,409),(1319,408),(1297,400),(1285,388),(1264,390),(1250,380),(1240,375),(1225,381),(1215,375)],416)
shape('coop_roof',[(836,747),(845,736),(845,722),(858,711),(883,699),(917,682),(933,675),(945,681),(965,689),(994,704),(1010,717),(1022,729),(1037,736),(1048,743),(1071,745),(1106,755),(1106,776),(1065,776),(1042,768),(1015,769),(1005,758),(983,755),(968,744),(941,744),(912,750),(890,752),(858,757),(838,760)],811)
shape('plaza_garden_bench',[(945,414),(945,398),(953,398),(953,390),(970,389),(976,383),(1010,383),(1017,391),(1042,392),(1044,401),(1044,416),(1038,416),(1038,407),(954,407),(954,417)],421)
shape('arcade_planter',[(1169,634),(1165,625),(1167,612),(1160,607),(1164,599),(1176,595),(1181,587),(1189,588),(1194,596),(1204,594),(1214,605),(1214,612),(1208,616),(1204,634)],636)
shape('dock_nets',[(1201,861),(1207,845),(1210,814),(1218,810),(1224,790),(1222,776),(1230,774),(1232,791),(1242,792),(1244,800),(1234,806),(1233,820),(1244,813),(1254,807),(1266,809),(1277,816),(1286,817),(1291,830),(1288,843),(1280,851),(1264,861),(1233,863)],866)
# Tightly bounded lamp silhouettes; post, lantern and flag share one cutout.
def lamp(name,x,top,bottom,flag=False):
 pts=[(x-3,top),(x+3,top),(x+4,top+6),(x+11,top+9),(x+13,top+17),(x+10,top+24),(x+4,top+25)]
 if flag:pts += [(x+20,top+27),(x+20,top+68),(x+12,top+76),(x+5,top+68),(x+5,top+29)]
 pts += [(x+3,bottom-7),(x+7,bottom-4),(x+7,bottom),(x-7,bottom),(x-7,bottom-4),(x-3,bottom-7),(x-3,top+25),(x-10,top+24),(x-13,top+17),(x-11,top+9),(x-4,top+6)]
 shape(name,pts,bottom)
lamp('cafe_banner_lamp',508,281,366,True)
lamp('plaza_anchor_lamp',1034,299,425,True)
lamp('court_west_banner_lamp',195,597,715,True)
lamp('court_twin_lamp',487,603,708)
lamp('lookout_twin_banner_lamp',207,264,356,True)
lamp('arcade_west_twin_lamp',925,605,710)
lamp('dock_west_banner_lamp',1065,661,758,True)
lamp('dock_central_banner_lamp',1247,644,786,True)
lamp('harbor_twin_lamp',1366,645,714)
for name,l,t,r,b in [('cafe_bench_west',321,333,356,352),('cafe_bench_middle',400,334,437,353),('cafe_bench_east',461,335,499,353),('net_table_west',290,637,355,690),('net_table_east',359,637,420,689)]:shape(name,[(l,t),(r,t),(r,b),(l,b)],b)
shape('market_landing_west_coping',[(1120,443),(1236,443),(1236,457),(1120,457)],459)
shape('market_landing_east_coping',[(1304,444),(1669,444),(1669,460),(1304,460)],462)
(p/'repair-foreground.json').write_text(json.dumps(out,separators=(',',':')))
# Water classification is material data only; the authored artwork is never resampled or warped.
im=Image.open(p/'city-geometry-repair.png').convert('RGB');rgb=np.asarray(im).astype(float);r,g,b=rgb.transpose(2,0,1)
y,x=np.indices(r.shape)
region=(y>635)|((x<270)&(y<290-x*.2))|((x<80)&(y>490))
wet=region&(b>r*1.10)&(g>r*1.22)&(g>45)&((b+g)>r*2.45)
# Explicit exclusions protect boat hulls, rigging, jetty posts, ropes and dock furniture.
exclude=Image.new('1',im.size);d=ImageDraw.Draw(exclude)
for pts in [
 [(20,817),(42,785),(47,765),(105,770),(115,801),(107,850),(81,902),(45,885)],
 [(389,797),(449,787),(525,793),(525,772),(580,751),(588,723),(613,711),(614,676),(620,676),(625,711),(645,720),(645,737),(664,752),(688,768),(732,773),(755,785),(780,810),(804,808),(801,829),(759,851),(540,893),(472,891),(421,875)],
 [(1351,818),(1386,787),(1408,751),(1427,726),(1434,721),(1438,737),(1455,736),(1462,742),(1489,744),(1509,743),(1529,752),(1553,758),(1578,776),(1618,787),(1659,787),(1661,800),(1628,823),(1583,845),(1470,852),(1390,842)],
 [(1494,871),(1521,857),(1540,858),(1546,840),(1553,842),(1556,859),(1578,867),(1614,867),(1628,875),(1637,892),(1612,910),(1539,913),(1505,900)],
 [(111,639),(493,639),(502,627),(580,627),(580,724),(536,746),(355,749),(355,891),(282,891),(282,750),(255,750),(255,900),(176,900),(176,749),(110,714)],
 [(707,606),(799,606),(799,734),(707,734)],
 [(830,699),(931,660),(1009,679),(1047,695),(1109,694),(1120,684),(1230,685),(1231,754),(1328,753),(1333,871),(1210,884),(1210,939),(1128,939),(1128,884),(827,885)],
 [(652,908),(670,893),(704,884),(750,879),(789,881),(791,890),(750,890),(709,895),(676,906),(660,916)]
]:d.polygon(pts,fill=1)
wet &= ~np.asarray(exclude,dtype=bool)
wet=binary_erosion(wet,iterations=2)
# Match decodeHarborWater's fixed 2-world-unit cell contract.
yy=np.minimum(939,((np.arange(432)*2+1)*940/864).astype(int));xx=np.minimum(1671,((np.arange(768)*2+1)*1672/1536).astype(int))
bits=wet[yy[:,None],xx[None,:]]
(p/'repair-water.bin').write_bytes(np.packbits(bits).tobytes())
print('Foreground',len(out),'Water cells',bits.sum())
mesh=json.loads((p/'city-repair-projection.json').read_text())
src=(root/'game/index.html').read_text();import base64
raw=np.unpackbits(np.frombuffer(base64.b64decode(re.search(r'const GRID="([^"]+)";',src)[1]),dtype=np.uint8)).reshape(216,384)
floor=np.zeros((216,384),dtype=np.uint8)
for ids in mesh['triangles']:
 a=np.array(mesh['renderWorld'])[ids];dest=np.array(mesh['canonicalWorld'])[ids]
 lo=np.maximum(0,np.floor(a.min(axis=0)/4).astype(int));hi=np.minimum([383,215],np.floor(a.max(axis=0)/4).astype(int))
 if np.any(hi<lo):continue
 ys,xs=np.mgrid[lo[1]:hi[1]+1,lo[0]:hi[0]+1];pts=np.stack([xs.ravel()*4+2,ys.ravel()*4+2],axis=1)
 uv=np.linalg.solve(np.stack([a[1]-a[0],a[2]-a[0]],axis=1),(pts-a[0]).T).T
 ok=(uv[:,0]>=-1e-7)&(uv[:,1]>=-1e-7)&(uv.sum(axis=1)<=1.0000001)
 can=dest[0]+uv@(dest[1:]-dest[0]);cx=np.clip((can[:,0]/4).astype(int),0,383);cy=np.clip((can[:,1]/4).astype(int),0,215)
 floor[ys.ravel()[ok],xs.ravel()[ok]]=raw[cy[ok],cx[ok]]*255
(p/'repair-floor.bin').write_bytes(floor.tobytes())
print('Projected floor cells',np.count_nonzero(floor))
