'use client';

import { Ball, Part, Rod } from './EquipmentParts';

export default function Sauna() {
  return <group>
    <Part p={[0, 1.1, -0.96]} s={[2, 2.2, 0.08]} finish="wood" />
    {[-0.96, 0.96].map(x => <Part key={x} p={[x, 1.1, 0]} s={[0.08, 2.2, 2]} finish="wood" />)}
    <Part p={[0, 2.15, 0]} s={[2, 0.1, 2]} finish="wood" />
    {Array.from({ length: 13 }, (_, i) => <group key={i}>
      <Part p={[-0.84 + i * 0.14, 1.05, -0.909]} s={[0.125, 1.95, 0.015]} finish="wood" sharp />
      {[-1, 1].map(side => <Part key={side} p={[side * 0.909, 1.05, -0.84 + i * 0.14]} s={[0.015, 1.95, 0.125]} finish="wood" sharp />)}
    </group>)}
    {[0, 1, 2, 3, 4].map(i => <Part key={i} p={[0, 0.48, -0.78 + i * 0.1]} s={[1.78, 0.075, 0.085]} finish="wood" sharp />)}
    {[-0.6, 0.6].map(x => <Part key={x} p={[x, 0.24, -0.58]} s={[0.08, 0.45, 0.45]} finish="wood" />)}
    <Part p={[0, 0.91, -0.86]} s={[1.78, 0.07, 0.06]} finish="wood" />
    <Part p={[0.62, 0.33, 0.35]} s={[0.36, 0.6, 0.36]} finish="shell" />
    {[-0.09, 0.02, 0.11].map((x, i) => <Ball key={x} p={[0.62 + x, 0.66 + (i % 2) * 0.04, 0.35]} s={[0.08, 0.065, 0.08]} finish="chrome" />)}
    <Part p={[0, 1.05, 0.96]} s={[1.9, 2.1, 0.02]} finish="glass" sharp />
    <Rod a={[0.23, 0.8, 0.99]} b={[0.23, 1.3, 0.99]} radius={0.018} finish="chrome" />
    <Part p={[0, 2.03, -0.87]} s={[1.76, 0.012, 0.025]} finish="light" sharp />
  </group>;
}
