"""Rebuild the 2-world-pixel, MSB-first water mask for the HD-2D remake."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/assets/city-hd2d"
WORLD = (1536, 864)
CELL = 2

# This shore follows the front of the city, including both channels at the center pier.
HARBOR = [
    (0, 603), (33, 614), (78, 640), (125, 656), (171, 677), (338, 677),
    (455, 653), (526, 652), (538, 602), (649, 604), (655, 645), (728, 647),
    (734, 604), (835, 606), (842, 636), (774, 689), (751, 750), (751, 809),
    (1223, 808), (1233, 659), (1286, 648), (1535, 657), (1535, 863), (0, 863)
]

# Artwork coordinates include spars, trailing lines, fingers, piles, and their painted shadows.
EXCLUDE = {
    "west quay": [(0,591),(123,541),(525,553),(544,579),(540,655),(477,669),(442,665),
                  (371,684),(323,694),(148,699),(98,664),(54,648),(0,625)],
    "old pier": [(151,657),(243,658),(244,788),(231,834),(218,850),(151,848),(151,809)],
    "second finger pier": [(254,658),(331,657),(336,788),(322,833),(315,849),(257,850),(255,804)],
    "central stair and moorings": [(645,548),(735,549),(740,655),(730,682),(647,681),(641,668)],
    "station and main dock": [(744,714),(771,674),(840,611),(974,581),(1215,612),
                              (1233,638),(1237,685),(1238,807),(1227,842),(1206,855),
                              (1109,854),(1103,863),(1027,863),(1025,850),(750,852),(741,829)],
    "east pier lamp": [(1251,609),(1274,609),(1274,675),(1250,678)],
    "west outrigger": [(0,744),(25,717),(67,687),(89,689),(137,730),(128,766),
                       (106,813),(77,834),(43,845),(0,802)],
    "trawler and buoy line": [(330,663),(345,655),(375,698),(413,700),(477,643),
                              (508,631),(540,674),(557,678),(565,648),(594,646),
                              (603,619),(639,615),(655,631),(655,667),(673,686),
                              (692,702),(727,723),(751,747),(748,802),(703,817),
                              (460,822),(444,840),(334,851),(332,825),(361,796),
                              (350,760),(334,725)],
    "east ferry and outriggers": [(1234,704),(1250,687),(1291,677),(1304,659),
                                  (1332,663),(1358,646),(1377,649),(1399,667),
                                  (1433,670),(1481,676),(1535,692),(1535,742),
                                  (1499,772),(1254,789),(1236,770)],
    "southeast canoe": [(1378,790),(1416,781),(1461,778),(1474,761),(1492,763),
                        (1500,783),(1535,783),(1535,841),(1378,841)]
}


def make_mask():
    with Image.open(ASSETS / "city-remake-v151.webp") as original:
        if original.width * WORLD[1] != original.height * WORLD[0]:
            raise ValueError("The remake does not match the 1536 × 864 world.")
        rgb = np.asarray(original.convert("RGB").resize(WORLD, Image.Resampling.BOX), dtype=np.int16)
    allowed = Image.new("L", WORLD)
    draw = ImageDraw.Draw(allowed)
    draw.polygon(HARBOR, fill=255)
    for polygon in EXCLUDE.values():
        draw.polygon(polygon, fill=0)
        draw.line(polygon + polygon[:1], fill=0, width=7, joint="curve")
    r, g, b = rgb.transpose(2, 0, 1)
    teal = (g - r >= 27) & (b - r >= 22) & (g >= 48) & (b >= 42)
    teal &= (g * 10 >= b * 8) & (b * 10 >= g * 6)
    mask = teal & (np.asarray(allowed) != 0)
    # All four native pixels must be water before a 2×2 cell can move.
    return mask.reshape(WORLD[1]//CELL, CELL, WORLD[0]//CELL, CELL).all(axis=(1, 3))


if __name__ == "__main__":
    wet = make_mask()
    target = ASSETS / "harbor-water-v2.bin"
    target.write_bytes(np.packbits(wet, bitorder="big").tobytes())
    print(f"{target.name}: {wet.shape[1]} × {wet.shape[0]} cells, {int(wet.sum())} wet")
