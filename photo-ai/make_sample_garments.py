"""Generates placeholder flat-lay garment images for pipeline smoke tests.
Not photorealistic: replace with licensed garment photos before public use.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
OUT = Path(__file__).parent / "garments"
OUT.mkdir(exist_ok=True)
JOBS = {
    "escritor":((164,121,72),(243,231,206),(106,61,41)),
    "advogado":((34,40,51),(242,244,250),(104,42,59)),
    "medico":((232,243,249),(206,236,248),(35,144,182)),
    "empresario":((41,69,116),(246,249,255),(212,165,61)),
}
for key,(base,shirt,tie) in JOBS.items():
    img=Image.new("RGB",(768,1024),(246,246,245))
    d=ImageDraw.Draw(img)
    d.polygon([(203,140),(279,110),(384,174),(489,110),(565,140),
        (718,350),(634,429),(577,345),(580,900),(188,900),
        (191,345),(133,429),(50,350)],fill=base,outline=(70,75,80),width=5)
    d.polygon([(279,110),(384,174),(489,110),(457,388),(384,460),(311,388)],fill=shirt)
    d.polygon([(384,220),(361,260),(384,303),(407,260)],fill=tie)
    d.polygon([(384,303),(363,600),(384,643),(405,600)],fill=tie)
    if key=="medico":
        d.rectangle((210,540,312,660),outline=(118,183,216),width=8)
        d.rectangle((455,540,557,660),outline=(118,183,216),width=8)
    img.save(OUT/(key+".png"))
print("Imagens de teste criadas em",OUT)
