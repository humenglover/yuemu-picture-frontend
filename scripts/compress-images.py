"""Compress all images (PNG/JPG/GIF) using Pillow."""
import os
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).parent.parent

exts = ('*.png', '*.jpg', '*.jpeg', '*.gif')
images = []
for ext in exts:
    for f in ROOT.glob(f'src/**/{ext}'):
        if 'node_modules' not in str(f) and 'dist' not in str(f):
            images.append(f)
    for f in ROOT.glob(f'public/**/{ext}'):
        images.append(f)

print(f'Found {len(images)} images\n')

total_before = 0
total_after = 0
compressed = 0
skipped = 0

for img_path in images:
    ext = img_path.suffix.lower()
    size_before = img_path.stat().st_size
    total_before += size_before

    try:
        img = Image.open(img_path)

        if ext == '.gif':
            frames = []
            durations = []
            try:
                while True:
                    frame = img.copy().convert('P', palette=Image.Palette.ADAPTIVE)
                    w, h = frame.size
                    if w > 800:
                        ratio = 800 / w
                        frame = frame.resize((800, int(h * ratio)), Image.LANCZOS)
                    frame = frame.quantize(colors=128)
                    frames.append(frame)
                    durations.append(img.info.get('duration', 100))
                    img.seek(img.tell() + 1)
            except EOFError:
                pass

            if len(frames) > 1:
                frames[0].save(str(img_path), save_all=True, append_images=frames[1:],
                              optimize=True, duration=durations,
                              loop=img.info.get('loop', 0), disposal=2)
            elif frames:
                frames[0].save(str(img_path), optimize=True)
            else:
                img.save(str(img_path), optimize=True)

        elif ext == '.png':
            if img.mode in ('RGBA', 'LA', 'P', 'RGB'):
                img = img.quantize(colors=256, method=Image.Quantize.MEDIANCUT) if img.mode != 'P' else img
            img.save(str(img_path), optimize=True)

        elif ext in ('.jpg', '.jpeg'):
            w, h = img.size
            if w > 1920:
                img = img.resize((1920, int(h * 1920 / w)), Image.LANCZOS)
            img.save(str(img_path), quality=80, optimize=True)

        size_after = img_path.stat().st_size
        total_after += size_after

        if size_after < size_before:
            pct = (1 - size_after / size_before) * 100
            tag = 'GIF' if ext == '.gif' else ext[1:].upper()
            print(f'[{tag}] {img_path.name:40s} {size_before/1024:7.0f}KB → {size_after/1024:7.0f}KB  -{pct:.1f}%')
            compressed += 1
        else:
            total_after -= (size_after - size_before)
            print(f'[{ext[1:].upper()}] {img_path.name:40s} {size_before/1024:7.0f}KB → (already optimal)')
            skipped += 1

    except Exception as e:
        print(f'[ERR] {img_path.name}: {e}')
        total_after += size_before
        skipped += 1

saved = total_before - total_after
print(f'\n{"="*60}')
print(f'Total: {total_before/1024/1024:.1f}MB → {total_after/1024/1024:.1f}MB')
print(f'Saved: {saved/1024/1024:.1f}MB  ({saved/total_before*100:.1f}%)')
print(f'Compressed: {compressed}  Skipped: {skipped}')
