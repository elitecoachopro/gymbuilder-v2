export function referenceModelKind(id: string) {
 if (id === 'cad_treadmill' || id === 'banda_alergare') return 'cad_treadmill';
 if (id === 'cad_leg_press' || id === 'aparat_picioare') return 'cad_leg_press';
 return undefined;
}
export const isOriginalReferenceModel = (id: string) => referenceModelKind(id) !== undefined;
export function referenceInspectionDirection(id: string, rotation: number): [number, number] | undefined {
 const x = isOriginalReferenceModel(id) ? -0.8 : ['real_multigym', 'real_cable_crossover'].includes(id) ? 0.8 : null;
 if (x === null) return undefined;
 const angle = -rotation * Math.PI / 180;
 return [x * Math.cos(angle) + Math.sin(angle), -x * Math.sin(angle) + Math.cos(angle)];
}
