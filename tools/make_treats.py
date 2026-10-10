# Draws the treat stage pictures as SVG files in public/assets/treats/.
# Style follows "The Speakery Art Kit": flat shapes, no outlines, two-tone shading.
# Run from the project folder:  python3 tools/make_treats.py
# These are stand-ins until the team makes final art; replacing a file with a
# same-named PNG or SVG is all it takes.

import math
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'treats')
os.makedirs(OUT, exist_ok=True)

SPRINKLE_COLORS = ['#f28ca6', '#7ec4f0', '#ffd15c', '#b79cf0', '#9fd48a']


def svg(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">{body}</svg>'


def save(name, body):
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(svg(body))


def shadow(rx=230, cy=548):
    return f'<ellipse cx="300" cy="{cy}" rx="{rx}" ry="30" fill="#3b2350" opacity="0.08"/>'


def plate():
    return (
        shadow()
        + '<ellipse cx="300" cy="528" rx="215" ry="42" fill="#e6d9c8"/>'
        + '<ellipse cx="300" cy="518" rx="215" ry="42" fill="#ffffff"/>'
        + '<ellipse cx="300" cy="518" rx="150" ry="27" fill="#f6f0e7"/>'
    )


def board():
    return (
        shadow(260)
        + '<path d="M70 500 Q70 540 110 540 L490 540 Q530 540 530 500 L530 470 L70 470 Z" fill="#d6a874"/>'
        + '<rect x="70" y="420" width="460" height="92" rx="40" fill="#e8c59a"/>'
        + '<path d="M120 455 Q300 445 480 458" stroke="#dbb382" stroke-width="5" fill="none" stroke-linecap="round"/>'
        + '<path d="M150 482 Q320 474 450 486" stroke="#dbb382" stroke-width="4" fill="none" stroke-linecap="round"/>'
    )


def sprinkles(spots):
    out = ''
    for i, (x, y, angle) in enumerate(spots):
        color = SPRINKLE_COLORS[i % len(SPRINKLE_COLORS)]
        out += f'<rect x="{x - 11}" y="{y - 4.5}" width="22" height="9" rx="4.5" fill="{color}" transform="rotate({angle} {x} {y})"/>'
    return out


# ---------- S'more ----------

CRACKER = '#dda663'
CRACKER_EDGE = '#c48a48'
CRACKER_HOLE = '#c8904f'
CHOCOLATE = '#7a4a30'
CHOCOLATE_EDGE = '#5a3322'
MALLOW = '#fff8ee'
MALLOW_SHADE = '#efe2cc'
TOASTED = '#e0a05a'
TOASTED_DARK = '#c47f3e'


def cracker(x, y, w=150, h=74, rotate=0, groove=False):
    holes = ''
    cols = [0.3, 0.7] if not groove else [0.15, 0.35, 0.65, 0.85]
    for fx in cols:
        for fy in (0.35, 0.68):
            holes += f'<circle cx="{x + w * fx:.0f}" cy="{y + h * fy:.0f}" r="5" fill="{CRACKER_HOLE}"/>'
    line = f'<path d="M{x + w / 2} {y + 6} V{y + h - 6}" stroke="{CRACKER_EDGE}" stroke-width="4" stroke-dasharray="3 9" stroke-linecap="round"/>' if groove else ''
    body = (
        f'<rect x="{x}" y="{y + 14}" width="{w}" height="{h}" rx="14" fill="{CRACKER_EDGE}"/>'
        + f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="{CRACKER}"/>'
        + holes + line
    )
    if rotate:
        return f'<g transform="rotate({rotate} {x + w / 2} {y + h / 2})">{body}</g>'
    return body


def chocolate():
    return (
        f'<rect x="166" y="424" width="118" height="54" rx="8" fill="{CHOCOLATE_EDGE}"/>'
        + f'<rect x="166" y="412" width="118" height="54" rx="8" fill="{CHOCOLATE}"/>'
        + f'<path d="M205 416 V462 M245 416 V462 M170 439 H280" stroke="#69402a" stroke-width="4"/>'
        + '<rect x="174" y="418" width="26" height="14" rx="4" fill="#8f5c3e"/>'
    )


def marshmallow():
    spots = ''.join(
        f'<ellipse cx="{x}" cy="{y}" rx="9" ry="4" fill="{TOASTED_DARK}"/>' for x, y in [(206, 344), (238, 350), (224, 338)]
    )
    return (
        f'<rect x="172" y="340" width="106" height="96" rx="26" fill="{MALLOW}"/>'
        + f'<path d="M250 352 Q276 360 276 400 Q276 430 250 434 Z" fill="{MALLOW_SHADE}"/>'
        + f'<ellipse cx="225" cy="348" rx="53" ry="18" fill="{TOASTED}"/>'
        + spots
    )


def smushed():
    return (
        f'<path d="M246 456 Q250 488 254 494 Q262 502 266 490 Q266 470 264 456 Z" fill="{CHOCOLATE}"/>'
        + f'<ellipse cx="160" cy="410" rx="26" ry="26" fill="{MALLOW_SHADE}"/>'
        + f'<ellipse cx="158" cy="404" rx="24" ry="24" fill="{MALLOW}"/>'
        + f'<ellipse cx="292" cy="412" rx="28" ry="28" fill="{MALLOW_SHADE}"/>'
        + f'<ellipse cx="290" cy="406" rx="26" ry="26" fill="{MALLOW}"/>'
        + f'<rect x="160" y="352" width="130" height="86" rx="30" fill="{MALLOW}"/>'
        + f'<path d="M168 418 Q225 440 284 418 L284 430 Q225 446 168 430 Z" fill="{MALLOW_SHADE}"/>'
        + cracker(150, 296, h=62)
    )


def smores():
    base = plate()
    save('treat-smore-1.svg', base + cracker(150, 430, w=300, groove=True))
    save('treat-smore-2.svg', base + cracker(150, 430) + cracker(330, 432, rotate=5))
    save('treat-smore-3.svg', base + cracker(150, 430) + cracker(330, 432, rotate=5) + chocolate())
    save('treat-smore-4.svg', base + cracker(150, 430) + cracker(330, 432, rotate=5) + chocolate() + marshmallow())
    save('treat-smore-5.svg', base + cracker(150, 430) + chocolate() + smushed())


# ---------- Cinnamon roll ----------

DOUGH = '#f4ddb0'
DOUGH_SHADE = '#e6c591'
CINNAMON = '#b8743f'
CINNAMON_DARK = '#95592c'


def dough_ball():
    return (
        f'<path d="M180 440 C180 340 240 300 300 300 C360 300 420 340 420 440 Q420 458 400 458 L200 458 Q180 458 180 440 Z" fill="{DOUGH_SHADE}"/>'
        + f'<path d="M188 432 C188 344 244 308 300 308 C356 308 412 344 412 432 Q300 450 188 432 Z" fill="{DOUGH}"/>'
        + '<ellipse cx="258" cy="352" rx="34" ry="18" fill="#fbecd0" transform="rotate(-25 258 352)"/>'
    )


def dough_sheet(filling):
    out = (
        f'<path d="M126 452 L474 452 L474 466 Q474 476 462 476 L138 476 Q126 476 126 466 Z" fill="{DOUGH_SHADE}"/>'
        + f'<path d="M150 360 L450 360 Q462 360 466 372 L476 440 Q478 452 466 452 L134 452 Q122 452 124 440 L134 372 Q138 360 150 360 Z" fill="{DOUGH}"/>'
    )
    if filling:
        out += f'<path d="M168 374 L432 374 L448 438 L152 438 Z" fill="{CINNAMON}"/>'
        for x, y in [(200, 392), (260, 418), (320, 390), (380, 420), (412, 396), (232, 426), (350, 402)]:
            out += f'<circle cx="{x}" cy="{y}" r="7" fill="{CINNAMON_DARK}"/>'
    return out


def rolled_log():
    spiral = ''
    r = 40
    points = []
    for i in range(0, 300):
        a = i / 300 * 2.6 * 2 * math.pi
        rr = 4 + (r - 6) * i / 300
        points.append((424 + rr * math.cos(a) * 0.82, 412 + rr * math.sin(a)))
    spiral = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in points)
    return (
        f'<rect x="150" y="366" width="280" height="96" rx="46" fill="{DOUGH_SHADE}"/>'
        + f'<rect x="150" y="360" width="276" height="88" rx="44" fill="{DOUGH}"/>'
        + f'<path d="M190 380 Q300 372 400 380" stroke="#fbecd0" stroke-width="10" fill="none" stroke-linecap="round"/>'
        + f'<ellipse cx="424" cy="412" rx="40" ry="50" fill="{DOUGH}"/>'
        + f'<path d="{spiral}" stroke="{CINNAMON}" stroke-width="8" fill="none" stroke-linecap="round"/>'
    )


def baked_bun():
    points = []
    for i in range(0, 400):
        a = i / 400 * 3 * 2 * math.pi
        rr = 10 + 130 * i / 400
        points.append((300 + rr * math.cos(a), 392 + rr * math.sin(a) * 0.55))
    spiral = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in points)
    icing = (
        '<path d="M190 380 Q230 350 280 362 Q330 340 380 360 Q420 352 418 384 Q412 404 392 396 Q370 420 350 400 '
        'Q320 428 296 404 Q268 430 246 404 Q214 420 204 398 Q178 400 190 380 Z" fill="#fff8ee"/>'
    )
    return (
        '<ellipse cx="300" cy="420" rx="158" ry="78" fill="#c98845"/>'
        + '<ellipse cx="300" cy="396" rx="158" ry="80" fill="#e3a55e"/>'
        + f'<path d="{spiral}" stroke="#b06c35" stroke-width="12" fill="none" stroke-linecap="round"/>'
        + icing
    )


def rolls():
    save('treat-roll-1.svg', board() + dough_ball())
    save('treat-roll-2.svg', board() + dough_sheet(filling=False))
    save('treat-roll-3.svg', board() + dough_sheet(filling=True))
    save('treat-roll-4.svg', board() + rolled_log())
    save('treat-roll-5.svg', plate() + baked_bun())


# ---------- Cupcake ----------

def liner(empty):
    inside = '<ellipse cx="300" cy="332" rx="128" ry="22" fill="#cf8a3d"/>' if empty else ''
    stripes = ''
    for i in range(9):
        t = i / 8
        x_top = 182 + t * 236
        x_bot = 208 + t * 184
        stripes += f'<path d="M{x_top:.0f} 338 L{x_bot:.0f} 500" stroke="#e8a44f" stroke-width="9" stroke-linecap="round"/>'
    return (
        inside
        + '<path d="M168 332 L432 332 L404 492 Q402 508 386 508 L214 508 Q198 508 196 492 Z" fill="#f4bc6a"/>'
        + stripes
        + '<path d="M168 332 L432 332 L428 352 L172 352 Z" fill="#f7c97f"/>'
    )


def batter():
    # Raw batter filling the liner, a little below the rim.
    return (
        '<ellipse cx="300" cy="334" rx="128" ry="22" fill="#e9c77f"/>'
        + '<ellipse cx="300" cy="338" rx="118" ry="17" fill="#f6dfa0"/>'
        + '<ellipse cx="262" cy="334" rx="34" ry="6" fill="#fbeec6"/>'
    )


def cake_top():
    return (
        '<path d="M160 340 C160 268 226 236 300 236 C374 236 440 268 440 340 Z" fill="#e0a159"/>'
        + '<path d="M196 300 C214 266 252 252 290 250 C258 262 232 280 218 306 Z" fill="#ecb876"/>'
    )


def frosting():
    tiers = [(300, 336, 164, 46), (300, 286, 124, 40), (300, 244, 88, 36), (300, 206, 52, 30)]
    out = ''
    for cx, cy, rx, ry in tiers:
        out += f'<ellipse cx="{cx}" cy="{cy + 10}" rx="{rx}" ry="{ry}" fill="#efe0c6"/>'
        out += f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#fff7ea"/>'
    out += '<path d="M282 182 C284 150 320 150 312 126 C336 146 330 182 300 186 Z" fill="#fff7ea"/>'
    return out


CANDY = [
    (230, 322, 20), (300, 340, -15), (370, 320, 40), (255, 282, -30), (345, 284, 15),
    (300, 262, 70), (272, 236, 30), (330, 230, -40), (200, 340, -60), (402, 338, 60),
]


def candy_top():
    return (
        sprinkles(CANDY)
        + '<circle cx="300" cy="170" r="22" fill="#e8506a"/>'
        + '<circle cx="292" cy="162" r="7" fill="#f58ca0"/>'
    )


def cupcakes():
    base = plate()
    save('treat-cupcake-1.svg', base + liner(empty=True))
    save('treat-cupcake-2.svg', base + liner(empty=True) + batter())
    save('treat-cupcake-3.svg', base + cake_top() + liner(empty=False))
    save('treat-cupcake-4.svg', base + cake_top() + liner(empty=False) + frosting())
    save('treat-cupcake-5.svg', base + cake_top() + liner(empty=False) + frosting() + candy_top())


if __name__ == '__main__':
    smores()
    rolls()
    cupcakes()
    # Write as .svg (the ".png.svg" step above keeps names readable while testing).
    for name in os.listdir(OUT):
        if name.endswith('.svg'):
            os.replace(os.path.join(OUT, name), os.path.join(OUT, name.replace('.svg', '.svg')))
    print('treats written to', os.path.abspath(OUT))
