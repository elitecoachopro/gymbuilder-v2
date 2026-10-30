'use client';
import type { GymSpace } from '@/lib/gym-space';
import { FLOOR_RISE_M } from '@/lib/gym-building';
import { Part, Rod } from './EquipmentParts';

export default function StairArchitecture({ space }: { space: GymSpace }) {
  const stair = space.stairwell;
  if (!stair) return null;
  const { x, y, w, d, opening } = stair;
  const flightWidth = (w - 0.35) / 2,
    run = d - 1.2,
    steps = 11,
    rise = FLOOR_RISE_M / 2;
  return (
    <group position={[x, 0, y]}>
      {opening ? (
        <>
          {[0, w].map((side) => (
            <group key={side}>
              <Rod a={[side, 0.05, 0]} b={[side, 1.05, 0]} radius={0.025} />
              <Rod a={[side, 1.05, 0]} b={[side, 1.05, d]} radius={0.025} />
              {[1, 2, 3, 4].map((i) => (
                <Rod
                  key={i}
                  a={[side, 0, (d * i) / 4]}
                  b={[side, 1.05, (d * i) / 4]}
                  radius={0.018}
                />
              ))}
            </group>
          ))}
          <Rod a={[0, 1.05, d]} b={[w, 1.05, d]} radius={0.025} />
          <Rod a={[0, 0.5, d]} b={[w, 0.5, d]} radius={0.012} />
          <Part p={[flightWidth / 2, 0.015, 0.04]} s={[flightWidth, 0.03, 0.08]} finish="accent" />
        </>
      ) : (
        <>
          {[0, 1].map((flight) => (
            <group key={flight}>
              {Array.from({ length: steps }, (_, i) => {
                const z =
                  flight === 0 ? ((i + 0.5) * run) / steps : run - ((i + 0.5) * run) / steps;
                const h = ((flight * steps + i + 1) * FLOOR_RISE_M) / (steps * 2);
                const centreX = flight === 0 ? flightWidth / 2 : w - flightWidth / 2;
                return (
                  <group key={i}>
                    <Part
                      p={[centreX, h - 0.04, z]}
                      s={[flightWidth, 0.08, run / steps + 0.015]}
                      finish="frame"
                    />
                    <Part
                      p={[centreX, h + 0.005, z]}
                      s={[flightWidth - 0.04, 0.012, run / steps - 0.025]}
                      finish="rubber"
                    />
                  </group>
                );
              })}
              {[0, 1].map((side) => {
                const cx = flight === 0 ? side * flightWidth : w - flightWidth + side * flightWidth;
                const a: [number, number, number] = [cx, flight === 0 ? 0.2 : FLOOR_RISE_M, 0];
                const b: [number, number, number] = [cx, rise, run];
                return (
                  <group key={side}>
                    <Rod a={a} b={b} radius={0.045} />
                    <Rod a={[a[0], a[1] + 0.9, a[2]]} b={[b[0], b[1] + 0.9, b[2]]} radius={0.025} />
                    {[0, 0.33, 0.66, 1].map((t) => (
                      <Rod
                        key={t}
                        a={[cx, a[1] + (b[1] - a[1]) * t, run * t]}
                        b={[cx, a[1] + (b[1] - a[1]) * t + 0.9, run * t]}
                        radius={0.018}
                      />
                    ))}
                  </group>
                );
              })}
            </group>
          ))}
          <Part p={[w / 2, rise - 0.06, run + 0.6]} s={[w, 0.12, 1.2]} />
          <Rod a={[0, rise + 0.9, d - 0.05]} b={[w, rise + 0.9, d - 0.05]} radius={0.025} />
        </>
      )}
    </group>
  );
}
