import * as THREE from 'three';
import {createEquipmentModel,enhanceStrengthModel} from './gym-reference-models.js';
import {equipmentSurface} from './gym-surface.ts';
const originals = new Map<string, THREE.Group>();
const strength = new WeakMap<THREE.Object3D, THREE.Object3D>();
function texture(width: number, height: number, draw: (context: CanvasRenderingContext2D) => void) {
 const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
 const context = canvas.getContext('2d'); if (!context) return null; draw(context);
 const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
}
export function referenceStrengthSource(scene: THREE.Object3D, id: string) {
 if (id !== 'real_multigym' && id !== 'real_cable_crossover') return scene;
 let source = strength.get(scene);
 if (!source) {
  source = scene.clone(true);
  source.traverse(object => {
   if (!(object instanceof THREE.Mesh)) return;
   object.geometry = object.geometry.clone();
   const clone = (material: THREE.Material) => {
    const owned = material.clone(); owned.userData.gymbuilderSurface = equipmentSurface(owned.name); return owned;
   };
   object.material = Array.isArray(object.material) ? object.material.map(clone) : clone(object.material);
  });
  enhanceStrengthModel(source, id, { texture }); strength.set(scene, source);
 }
 return source;
}
export function originalReferenceSource(id: string) {
 let source = originals.get(id);
 if (!source) { source = createEquipmentModel(id, { texture }); originals.set(id, source); }
 return source;
}
