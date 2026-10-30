import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type Point = [number, number, number];
export type PersonPose = 'reception' | 'coach' | 'push';
export type PersonSurface = 'skin' | 'shirt' | 'trousers' | 'hair' | 'shoes' | 'eyes' | 'trim';
export function createPersonGeometry(pose: PersonPose, alternateStride = false) {
  const parts: Partial<Record<PersonSurface, THREE.BufferGeometry[]>> = {};
  const sphere = new THREE.SphereGeometry(1, 16, 12).toNonIndexed();
  const limb = new THREE.LatheGeometry([
    new THREE.Vector2(.72,-.5),new THREE.Vector2(.89,-.4),
    new THREE.Vector2(1,-.12),new THREE.Vector2(.94,.2),
    new THREE.Vector2(.78,.43),new THREE.Vector2(.7,.5),
  ],12).toNonIndexed();
  const skinTone = new THREE.Color(pose === 'coach' ? '#b58a6b' : '#cfa282');
  const shadeSkin = (geometry: THREE.BufferGeometry, colour = skinTone) => {
    const vertices = geometry.getAttribute('position');
    const values = new Float32Array(vertices.count * 3);
    for (let i=0;i<vertices.count;i++) {
      const variation = .97 + .03 * Math.sin(vertices.getX(i)*21 + vertices.getY(i)*13);
      values[i*3]=colour.r*variation; values[i*3+1]=colour.g*variation; values[i*3+2]=colour.b*variation;
    }
    geometry.setAttribute('color',new THREE.BufferAttribute(values,3));
    return geometry;
  };
  const matrix = new THREE.Object3D();
  const add = (
    source: THREE.BufferGeometry,
    p: Point,
    size: Point,
    finish: PersonSurface,
    rotation: Point = [0, 0, 0],
    colour?: THREE.Color
  ) => {
    matrix.position.set(...p);
    matrix.rotation.set(...rotation);
    matrix.scale.set(...size);
    matrix.updateMatrix();
    const geometry = source.clone().applyMatrix4(matrix.matrix);
    (parts[finish] ??= []).push(finish === 'skin' ? shadeSkin(geometry,colour) : geometry);
  };
  const ellipsoid = (p: Point, s: Point, f: PersonSurface, colour?: THREE.Color) => add(sphere, p, s, f, [0,0,0], colour);
  const segment = (a: Point, b: Point, r: number, finish: PersonSurface) => {
    const start = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b),
      delta = end.clone().sub(start);
    matrix.position.copy(start).add(end).multiplyScalar(0.5);
    matrix.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
    matrix.scale.set(r, delta.length(), r);
    matrix.updateMatrix();
    const geometry = limb.clone().applyMatrix4(matrix.matrix);
    (parts[finish] ??= []).push(finish === 'skin' ? shadeSkin(geometry) : geometry);
    ellipsoid(a, [r*.77,r*.77,r*.77], finish);
    ellipsoid(b, [r*.72,r*.72,r*.72], finish);
  };
  const pushing = pose === 'push';
  const hipY = pushing ? 0.83 : 0.92,
    hipZ = pushing ? -0.25 : 0;
  const shoulderY = pushing ? 1.26 : 1.43,
    shoulderZ = pushing ? 0.2 : 0;
  const torso = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.145, 0),
      new THREE.Vector2(0.17, 0.09),
      new THREE.Vector2(0.205, 0.3),
      new THREE.Vector2(0.23, 0.42),
      new THREE.Vector2(0.18, 0.49),
    ],
    20
  ).toNonIndexed();
  add(torso, [0, hipY, hipZ], [1, 1, 0.68], 'shirt', [pushing ? 0.68 : 0, 0, 0]);
  ellipsoid([0, hipY - 0.035, hipZ], [0.18, 0.14, 0.12], 'trousers');
  for (const side of [-1, 1]) {
    const leadingLeg = (side === 1) !== alternateStride;
    const hip: Point = [side * 0.105, hipY - 0.05, hipZ];
    const knee: Point = pushing
      ? [side * 0.13, 0.43, leadingLeg ? -0.12 : -0.5]
      : [side * 0.115, 0.49, 0.015];
    const ankle: Point = pushing
      ? [side * 0.15, 0.08, leadingLeg ? -0.05 : -0.74]
      : [side * 0.12, 0.08, 0];
    segment(hip, knee, 0.078, 'trousers');
    segment(knee, ankle, 0.057, 'trousers');
    ellipsoid([ankle[0], 0.065, ankle[2] + 0.065], [0.073, 0.06, 0.15], 'shoes');
    ellipsoid([ankle[0], 0.022, ankle[2] + 0.065], [0.077, 0.018, 0.155], 'trim');
    const shoulder: Point = [side * 0.225, shoulderY, shoulderZ];
    const elbow: Point = pushing
      ? [side * 0.29, 1.11, 0.5]
      : pose === 'coach' && side === 1
        ? [0.34, 1.23, 0.16]
        : [side * 0.28, 1.15, 0.015];
    let wrist: Point = [side * 0.25, 0.95, 0.07];
    if (pushing) wrist = [side * 0.34, 1.1, 0.9];
    else if (pose === 'coach' && side === 1) wrist = [0.43, 1.37, 0.29];
    else if (pose === 'reception' && side === 1) wrist = [0.26, 1.05, 0.28];
    const sleeveEnd = shoulder.map((v,i)=>v+(elbow[i]-v)*.68) as Point;
    segment(shoulder, sleeveEnd, 0.069, 'shirt');
    segment(sleeveEnd, elbow, 0.052, 'skin');
    segment(elbow, wrist, 0.045, 'skin');
    ellipsoid([wrist[0], wrist[1] - 0.035, wrist[2] + 0.01], [0.045, 0.07, 0.025], 'skin');
    for (let finger = 0; finger < 4; finger++)
      segment(
        [wrist[0] + (finger - 1.5) * 0.017, wrist[1] - 0.07, wrist[2] + 0.01],
        [wrist[0] + (finger - 1.5) * 0.016, wrist[1] - 0.105, wrist[2] + 0.025],
        0.007,
        'skin'
      );
    segment([wrist[0]+side*.035,wrist[1]-.025,wrist[2]+.015],
      [wrist[0]+side*.06,wrist[1]-.065,wrist[2]+.042],.012,'skin');
    for(let lace=0;lace<3;lace++) segment(
      [ankle[0]-.04,.103,ankle[2]+.08+lace*.027],
      [ankle[0]+.04,.103,ankle[2]+.08+lace*.027],.003,'trim');
  }
  const headY = pushing ? 1.43 : 1.62,
    headZ = pushing ? 0.31 : 0;
  segment([0, shoulderY - 0.08, shoulderZ], [0, headY - 0.1, headZ], 0.048, 'skin');
  const headStarts = Object.fromEntries(Object.entries(parts).map(([key,geometries])=>[key,geometries.length]));
  const headSource = new THREE.SphereGeometry(1,28,20).toNonIndexed();
  const hp = headSource.getAttribute('position');
  for(let i=0;i<hp.count;i++) {
    const x=hp.getX(i), y=hp.getY(i), z=hp.getZ(i);
    const jaw = y < -.22 ? .72 + .28*(y+1)/.78 : 1;
    const cheek = z>0 ? .04*Math.exp(-Math.pow((y+.05)*4,2)) : 0;
    hp.setXYZ(i,x*jaw,y,z+cheek);
  }
  headSource.computeVertexNormals();
  add(headSource,[0,headY,headZ],[.104,.139,.094],'skin');
  headSource.dispose();
  ellipsoid([0,headY-.083,headZ+.055],[.058,.038,.038],'skin');
  ellipsoid([0,headY+.088,headZ-.018],[.107,.061,.094],'hair');
  ellipsoid([0,headY+.027,headZ-.066],[.101,.087,.041],'hair');
  const eyeWhite = new THREE.Color('#f5f3ef');
  const lips = new THREE.Color(pose==='coach'?'#8b584a':'#a66d61');
  for (const side of [-1,1]) {
    ellipsoid([side*.103,headY-.009,headZ-.003],[.017,.029,.018],'skin');
    ellipsoid([side*.107,headY-.01,headZ+.006],[.007,.016,.008],'skin',lips);
    ellipsoid([side*.038,headY+.019,headZ+.086],[.019,.0065,.008],'skin',eyeWhite);
    ellipsoid([side*.038,headY+.018,headZ+.094],[.007,.007,.003],'eyes');
    segment([side*.02,headY+.039,headZ+.086],[side*.058,headY+.036,headZ+.083],.004,'hair');
    ellipsoid([side*.023,headY-.017,headZ+.102],[.01,.009,.01],'skin');
    ellipsoid([side*.011,headY-.024,headZ+.112],[.004,.003,.003],'eyes');
  }
  ellipsoid([0,headY+.003,headZ+.099],[.012,.029,.019],'skin');
  ellipsoid([0,headY-.016,headZ+.111],[.016,.011,.015],'skin');
  ellipsoid([0,headY-.055,headZ+.086],[.028,.005,.008],'skin',lips);
  segment([-.023,headY-.054,headZ+.094],[.023,headY-.054,headZ+.094],.0015,'eyes');
  const headTransform = new THREE.Matrix4().makeTranslation(0,headY,headZ)
    .multiply(new THREE.Matrix4().makeScale(.84,.86,.92))
    .multiply(new THREE.Matrix4().makeTranslation(0,-headY,-headZ));
  for (const key of Object.keys(parts) as PersonSurface[])
    parts[key]!.slice(headStarts[key] ?? 0).forEach(geometry=>geometry.applyMatrix4(headTransform));
  for (const side of [-1, 1])
    segment(
      [side * 0.035, shoulderY - 0.085, shoulderZ + 0.09],
      [side * 0.09, shoulderY - 0.04, shoulderZ + 0.12],
      0.012,
      'trim'
    );
  const result: Partial<Record<PersonSurface, THREE.BufferGeometry>> = {};
  for (const key of Object.keys(parts) as PersonSurface[]) {
    result[key] = mergeGeometries(parts[key]!, false)!;
    parts[key]!.forEach((g) => g.dispose());
  }
  sphere.dispose();
  limb.dispose();
  torso.dispose();
  return result;
}
