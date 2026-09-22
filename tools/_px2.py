
from PIL import Image
import colorsys
for name in ["shot-hero-top","shot-skills"]:
    p = f"D:/Outputs/Playwright/{name}.png"
    im = Image.open(p).convert("RGB")
    w,h = im.size
    px = list(im.getdata()); n=len(px)
    L=[0.2126*a+0.7152*b+0.0722*c for a,b,c in px]
    chroma = sum(max(t)-min(t) for t in px)/n
    uniq = len({(a//16,b//16,c//16) for a,b,c in px})
    hues=set()
    for a,b,c in px[::5]:
        mx,mn=max(a,b,c),min(a,b,c)
        if mx-mn>26:
            hh,_,_=colorsys.rgb_to_hsv(a/255,b/255,c/255); hues.add(int(hh*12))
    print(f"{name}: {w}x{h} luma={sum(L)/n:.1f} chroma={chroma:.1f} colours={uniq} hues={len(hues)}/12 near_black={sum(1 for l in L if l<12)/n*100:.1f}%")
