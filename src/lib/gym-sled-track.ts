export function sledTrackLayout(width: number, depth: number) {
  const length = Math.max(width, depth), breadth = Math.min(width, depth);
  const last = Math.floor(length), inset = (length - last) / 2;
  return { length, breadth, horizontal: width > depth, marks: Array.from({length:last + 1}, (_,metres) => ({metres,offset:inset + metres})) };
}
