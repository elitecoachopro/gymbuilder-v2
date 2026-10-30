import type { Object3D, Group, Texture } from 'three';
export interface ReferenceOptions { texture?: (width: number, height: number, draw: (context: CanvasRenderingContext2D) => void) => Texture | null; upholstery?: string }
export function createEquipmentModel(type: string, options?: ReferenceOptions): Group;
export function enhanceStrengthModel(source: Object3D, type: string, options?: ReferenceOptions): Object3D;
