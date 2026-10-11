# Puts the team's treat sprites (PNG files in art/treat-sprites/) on the
# plates and boards from make_treats.py, centered, and saves the stage
# pictures the game uses (public/assets/treats/treat-*.svg).
#
# Run from the project folder after changing a sprite:
#     python3 tools/place_sprites.py
#
# Each treat uses ONE size for all of its sprites, so they keep their sizes
# compared to each other. Each sprite is centered left-to-right and sits on
# the plate or board. Needs Pillow (pip install pillow).

import base64
import io
import os

from PIL import Image

import make_treats as art

HERE = os.path.dirname(__file__)
SPRITES = os.path.join(HERE, '..', 'art', 'treat-sprites')

# Where a sprite's bottom edge rests (in the 600 x 600 picture).
ON_PLATE = 530
ON_BOARD = 488

# treat: (widest sprite fits this many pixels, [(step, base, rests at)])
TREATS = {
    'roll': (400, [(1, 'board', ON_BOARD), (2, 'board', ON_BOARD), (3, 'board', ON_BOARD), (4, 'board', ON_BOARD), (5, 'plate', ON_PLATE)]),
    'cupcake': (330, [(1, 'plate', ON_PLATE), (2, 'plate', ON_PLATE), (3, 'plate', ON_PLATE), (4, 'plate', ON_PLATE), (5, 'plate', ON_PLATE)]),
}


def load(name):
    image = Image.open(os.path.join(SPRITES, name)).convert('RGBA')
    # Trim see-through edges so centering uses the drawing itself.
    return image.crop(image.getbbox())


def as_data_url(image):
    buffer = io.BytesIO()
    image.save(buffer, format='PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode()


def main():
    for treat, (widest, steps) in TREATS.items():
        sprites = {step: load(f'treat-{treat}-{step}.png') for step, _, _ in steps}
        scale = widest / max(s.width for s in sprites.values())
        for step, base, rests_at in steps:
            sprite = sprites[step]
            w, h = sprite.width * scale, sprite.height * scale
            x, y = 300 - w / 2, rests_at - h
            ground = art.plate() if base == 'plate' else art.board()
            picture = f'<image x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" href="{as_data_url(sprite)}"/>'
            art.save(f'treat-{treat}-{step}.svg', ground + picture)
            print(f'treat-{treat}-{step}.svg  {w:.0f} x {h:.0f}  on the {base}')


if __name__ == '__main__':
    main()
