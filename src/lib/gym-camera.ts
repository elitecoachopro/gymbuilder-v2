/** Fit the room's bounding sphere inside the narrower camera field of view. */
export function gymCameraDistance(length: number, width: number, aspect: number, fov = 50, height = 3): number {
  const vertical = fov * Math.PI / 360;
  const horizontal = Math.atan(Math.tan(vertical) * Math.max(aspect, 0.01));
  const radius = Math.hypot(length / 2, width / 2, height);
  return radius / Math.sin(Math.min(vertical, horizontal)) * 1.1;
}

export function initialGymCameraView(outline: ReadonlyArray<{ x: number; y: number }>) {
  return outline.length === 4 ? 'inside' : 'orbit';
}
