export type EquipmentSurface = 'paint' | 'upholstery' | 'rubber' | 'steel' | 'display' | 'control' | 'original';

export function equipmentSurface(name: string): EquipmentSurface {
  if (/printed labels|decal|weld bead|pad board/i.test(name)) return 'original';
  if (/display|screen/i.test(name)) return 'display';
  if (/control key|emergency|switch/i.test(name)) return 'control';
  if (/textured grip|barbell|load bar|axle|spindle|guide rod|inclined press rail|plated steel|brushed stainless|brushed aluminium/i.test(name)) return 'steel';
  if (/rubber|belt|strap|pedal|circular head|weight plate|hand grip|cycle handle/i.test(name)) return 'rubber';
  if (/mount|bearer|bracket|mast|pedestal|crossmember|backbone|seatpost clamp/i.test(name)) return 'paint';
  if (/backrest|back pad|bench seat|reclined seat base|bicycle saddle|cushion|upholstery vinyl/i.test(name)) return 'upholstery';
  if (/powder coat/i.test(name)) return 'paint';
  if (/frame|rail|support|upright|cross.?bar|spine|enclosure|cover|shelf|tray|column|leg\b|base/i.test(name)) return 'paint';
  return 'original';
}
