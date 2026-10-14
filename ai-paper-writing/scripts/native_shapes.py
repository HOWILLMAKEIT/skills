"""Small native DrawingML helpers; no task-specific diagrams or coordinates."""
from pptx.oxml.xmlchemy import OxmlElement


def clear_effects(shape):
    """Remove explicit and inherited effects when the chosen style is flat."""
    sp = shape._element.spPr
    for child in list(sp):
        if child.tag.split('}')[-1] in {'effectLst', 'effectDag'}:
            sp.remove(child)
    effect = OxmlElement('a:effectLst')
    index = next((i for i, child in enumerate(sp)
                  if child.tag.split('}')[-1] in {'scene3d', 'sp3d', 'extLst'}), len(sp))
    sp.insert(index, effect)
    for ref in shape._element.xpath('./p:style/a:effectRef'):
        ref.set('idx', '0')


def linear_gradient(shape, start, end, angle_degrees=90):
    """Set an editable two-stop RGB gradient; color arguments are six hex digits."""
    colors = [start.lstrip('#'), end.lstrip('#')]
    if any(len(c) != 6 or any(x not in '0123456789abcdefABCDEF' for x in c) for c in colors):
        raise ValueError('Gradient colors must be six-digit RGB hex strings.')
    sp = shape._element.spPr
    for child in list(sp):
        if child.tag.split('}')[-1] in {'noFill', 'solidFill', 'gradFill', 'blipFill', 'pattFill', 'grpFill'}:
            sp.remove(child)
    grad = OxmlElement('a:gradFill'); grad.set('rotWithShape', '1')
    stops = OxmlElement('a:gsLst')
    for position, color in zip((0, 100000), colors):
        stop = OxmlElement('a:gs'); stop.set('pos', str(position))
        rgb = OxmlElement('a:srgbClr'); rgb.set('val', color.upper())
        stop.append(rgb); stops.append(stop)
    grad.append(stops)
    line = OxmlElement('a:lin'); line.set('ang', str(round(angle_degrees % 360 * 60000)))
    line.set('scaled', '1'); grad.append(line)
    index = next((i for i, child in enumerate(sp) if child.tag.split('}')[-1]
                  in {'ln', 'effectLst', 'effectDag', 'scene3d', 'sp3d', 'extLst'}), len(sp))
    sp.insert(index, grad)
