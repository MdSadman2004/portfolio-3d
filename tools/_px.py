
from PIL import Image
import colorsys
im = Image.open(r"D:/Outputs/Playwright/shot-hero.png").convert("RGB")
w,h = im.size
px = list(im.getdata())
n = len(px)
def lum(p): return 0.2126*p[0]+0.7152*p[1]+0.0722*p[2]
L = [lum(p) for p in px]
mean = sum(L)/n
# colourfulness: mean chroma (max-min per pixel)
chroma = sum(max(p)-min(p) for p in px)/n
# unique quantised colours
uniq = len({(p[0]//16,p[1]//16,p[2]//16) for p in px})
# hue spread of non-grey pixels
hues = set()
for p in px[::7]:
    mx,mn = max(p), min(p)
    if mx-mn > 26:
        hh,_,_ = colorsys.rgb_to_hsv(p[0]/255,p[1]/255,p[2]/255)
        hues.add(int(hh*12))
print(f"size={w}x{h} pixels={n}")
print(f"mean_luma={mean:.1f}/255  mean_chroma={chroma:.1f}  unique_colour_buckets={uniq}")
print(f"hue_sectors_present={len(hues)}/12 -> {sorted(hues)}")
dark = sum(1 for l in L if l < 12)/n
print(f"near_black_fraction={dark*100:.1f}%")
bright = sum(1 for l in L if l > 120)/n
print(f"bright_text_fraction={bright*100:.2f}%")
