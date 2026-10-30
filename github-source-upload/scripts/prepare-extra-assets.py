from pathlib import Path
import sys, subprocess
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SKILL = Path.home() / '.codex/plugins/cache/openai-curated-remote/work-pets/0.1.6/skills/create-pet/scripts'
qa = ROOT / 'qa' / 'v1.1.0'
qa.mkdir(parents=True, exist_ok=True)
original = Image.open(ROOT.parent / '大肥鱼-pet/simple/idletail-update.png').convert('RGBA')
atlas = Image.new('RGBA', (1536, 2496))
atlas.paste(original, (0,0))
sources = dict(zip(['stretch','sleep','wave'],sys.argv[1:]))
if len(sources) != 3: raise ValueError('Supply stretch, sleep, wave source images')
for row,(name,source) in enumerate(sources.items(),9):
    run = qa / name
    decoded = run / 'decoded'; decoded.mkdir(parents=True,exist_ok=True)
    a = np.array(Image.open(source).convert('RGBA'))
    r,g,b = [a[:,:,i].astype(int) for i in range(3)]
    mask = (np.minimum(r,b)-g>100)&(r>150)&(b>150)
    a[mask]=0
    Image.fromarray(a).save(decoded/'idle.png')
    subprocess.run([sys.executable,str(SKILL/'extract_strip_frames.py'),'--decoded-dir',str(decoded),'--output-dir',str(run/'frames'),'--states','idle','--method','auto'],check=True)
    subprocess.run([sys.executable,str(SKILL/'inspect_frames.py'),'--frames-root',str(run/'frames'),'--json-out',str(run/'review.json'),'--states','idle','--require-components'],check=True)
    temp = Image.new('RGBA',(1536,1872))
    for i in range(6):
        # 最后一帧恢复首帧，保持循环衔接并避开源图最右缘。
        mapping = [0,2,3,3,4,0] if name == 'stretch' else ([0,2,3,2,4,0] if name == 'wave' else [0,1,2,3,4,0])
        f=Image.open(run/'frames/idle'/f'{mapping[i]:02}.png').convert('RGBA')
        temp.paste(f,(i*192,0))
    temp.save(run/'raw.png')
    subprocess.run([sys.executable,str(SKILL/'despill_chroma_edges.py'),str(run/'raw.png'),'--output',str(run/'clean.png'),'--json-out',str(run/'despill.json'),'--chroma-key','#ff00ff'],check=True)
    strip=Image.open(run/'clean.png').crop((0,0,1536,208))
    atlas.paste(strip,(0,row*208))
    frames=[strip.crop((i*192,0,(i+1)*192,208)) for i in range(6)]
    frames[0].save(qa/f'{name}.gif',save_all=True,append_images=frames[1:],duration=[550,700,850,1000,650,700],loop=0,disposal=2)
    strip.crop((0,0,1152,208)).save(qa/f'{name}.png')
atlas.save(ROOT/'app/assets/spritesheet.png')
print('Extended atlas:', atlas.size)
