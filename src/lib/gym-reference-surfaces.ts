import * as THREE from 'three';

export async function loadReferenceNormals() {
 const loader = new THREE.TextureLoader();
 async function load(file: string, repeat: [number, number]) {
  let expired = false, timer: ReturnType<typeof setTimeout>;
  const pending = loader.loadAsync('/textures/gym/reference/' + file).then(texture => {
   if (expired) { texture.dispose(); return null; }
   texture.colorSpace = THREE.NoColorSpace;
   texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
   texture.repeat.set(...repeat); texture.anisotropy = 4;
   return texture;
  }).catch(() => null);
  const deadline = new Promise<null>(resolve => { timer = setTimeout(() => { expired = true; resolve(null); }, 3000); });
  return Promise.race([pending, deadline]).finally(() => clearTimeout(timer));
 }
 const [upholsteryNormal, rubberNormal] = await Promise.all([load('upholstery-normal.png', [3, 3]), load('rubber-normal.png', [2, 2])]);
 return {upholsteryNormal, rubberNormal};
}
