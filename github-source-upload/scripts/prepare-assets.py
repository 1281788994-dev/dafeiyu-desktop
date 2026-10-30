from pathlib import Path
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / '大肥鱼-pet' / 'simple' / 'idletail-update.png'
assets = ROOT / 'app' / 'assets'
assets.mkdir(parents=True, exist_ok=True)
shutil.copy2(SOURCE, assets / 'spritesheet.png')
atlas = Image.open(SOURCE).convert('RGBA')
frame = atlas.crop((0, 0, 192, 208))
icon = Image.new('RGBA', (1024, 1024))
icon.alpha_composite(frame.resize((864, 936), Image.Resampling.LANCZOS), (80, 44))
icon.save(assets / 'icon.png')
icon.save(assets / 'icon.ico', sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)])
icon.save(assets / 'icon.icns')
tray = icon.resize((44,44), Image.Resampling.LANCZOS)
alpha = tray.getchannel('A')
tray = Image.new('RGBA', (44,44), (0,0,0,0))
tray.putalpha(alpha)
tray.save(assets / 'trayTemplate.png')
print('素材已准备：spritesheet, PNG, ICO, ICNS, tray')
