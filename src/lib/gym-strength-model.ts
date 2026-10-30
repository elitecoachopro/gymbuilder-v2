import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { STRENGTH_VARIANTS, type SpecialisedStrengthModel } from './gym-strength-catalog.ts';
import {buildPlateChestPress} from './gym-plate-strength.ts';
import { createEquipmentAssembly } from './gym-model-assembly.ts';

export type StrengthModel = 'aparat_piept' | 'aparat_lat' | 'aparat_picioare' | SpecialisedStrengthModel;
export type StrengthFinish = 'frame' | 'chrome' | 'rubber' | 'pad' | 'accent' | 'shell' | 'label';
type Point = [number, number, number];

function padWelt(size: Point) {
  const thin = size.indexOf(Math.min(...size));
  const axes = [0,1,2].filter(axis=>axis!==thin);
  const a=size[axes[0]]*.45,b=size[axes[1]]*.45,r=Math.min(.035,a*.2,b*.2);
  const points: THREE.Vector3[]=[];
  for(const [x,y,start] of [[a-r,b-r,0],[-a+r,b-r,90],[-a+r,-b+r,180],[a-r,-b+r,270]]) {
    for(let i=0;i<=4;i++) {
      const angle=(start+i*90/4)*Math.PI/180;
      const p=[0,0,0];p[thin]=size[thin]*.51;p[axes[0]]=x+Math.cos(angle)*r;p[axes[1]]=y+Math.sin(angle)*r;
      points.push(new THREE.Vector3(...p));
    }
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,true),40,.0025,4,true);
}
function addPadWelt(add: ReturnType<typeof createEquipmentAssembly>['add'],position:Point,size:Point,rotation:Point) {
  const source=padWelt(size), seam=source.toNonIndexed();add(seam,position,[1,1,1],'rubber',rotation);source.dispose();seam.dispose();
}


export function buildStrengthModel(type: StrengthModel): Record<StrengthFinish, THREE.BufferGeometry> {
  if(type==='plate_chest_press')return buildPlateChestPress();
  const specialised = STRENGTH_VARIANTS.find(model => model.id === type);
  if (specialised) return buildSpecialisedStrength(specialised);
  const {add,box,rod,disc,bolt,finish} = createEquipmentAssembly();
  const seat = new RoundedBoxGeometry(1,1,1,2,0.14), back = seat.clone();
  for (const [geometry,isBack] of [[seat,false],[back,true]] as const) {
    const position = geometry.getAttribute('position');
    for (let i=0;i<position.count;i++) {
      const x=position.getX(i), y=position.getY(i), z=position.getZ(i);
      if (isBack) position.setZ(i,z*(0.84+0.16*(1-4*y*y)));
      else position.setX(i,x*(0.88+0.12*(z+0.5)));
    }
    geometry.computeVertexNormals();
  }
  function cushion(p: Point, scale: Point, rotation: Point = [0,0,0]) {
    const shape = scale[1] > scale[0] ? back : seat;
    add(shape,p,scale,'rubber',rotation);
    add(shape,[p[0]+0.003,p[1]+0.006,p[2]],[scale[0]*0.95,scale[1]*0.94,scale[2]*0.95],'pad',rotation);
    addPadWelt(add,p,scale,rotation);
  }
  function grip(a: Point, b: Point, radius: number) {
    rod(a,b,radius,'rubber');
    const start = new THREE.Vector3(...a), direction = new THREE.Vector3(...b).sub(start);
    for (let i=1;i<9;i++) {
      const from = start.clone().addScaledVector(direction,i/10);
      const to = from.clone().addScaledVector(direction,0.025);
      rod(from.toArray() as Point,to.toArray() as Point,radius*1.1,'rubber');
    }
  }
  const lat = type === 'aparat_lat', leg = type === 'aparat_picioare';
  const length = leg ? 2.2 : lat ? 1.4 : 1.5;
  const tower = -length/2 + 0.23, towerHeight = lat ? 2.23 : 1.55;
  const footWidth = leg ? 0.86 : 0.88;
  for (const x of [-length/2+0.16,length/2-0.16]) {
    box([x,0.075,0],[0.14,0.1,footWidth]);
    for (const side of [-1,1]) {
      box([x,0.036,side*(footWidth/2-0.065)],[0.19,0.07,0.13],'rubber');
      bolt([x,0.105,side*(footWidth/2-0.08)]);
    }
  }
  box([0,0.13,0],[length-0.22,0.11,0.12]);
  box([tower-0.15,towerHeight/2,0],[0.045,towerHeight,0.49],'shell');
  for (const side of [-1,1]) {
    box([tower-.035,towerHeight/2,side*0.255],[0.25,towerHeight-0.12,0.035],'shell');
    box([tower-.17,towerHeight/2,side*.255],[.035,towerHeight-.05,.065]);
    box([tower+0.17,towerHeight/2,side*0.255],[0.055,towerHeight,0.06]);
    box([tower-0.12,towerHeight*0.6,side*0.278],[0.025,towerHeight*0.66,0.008],'chrome');
    for (const y of [0.18,towerHeight-0.13]) bolt([tower+0.17,y,side*0.288]);
    for (let i=0;i<5;i++) box([tower-0.015,towerHeight-0.19-i*0.035,side*0.275],[0.17,0.012,0.005],'rubber');
  }
  box([tower,towerHeight-0.035,0],[0.37,0.07,0.54],'frame');
  for (const z of [-0.13,0.13]) rod([tower+0.075,0.16,z],[tower+0.075,towerHeight-0.1,z],0.012,'chrome');
  for (let i=0;i<13;i++) {
    const y=0.19+i*0.047;
    box([tower+0.035,y,0],[0.22,0.037,0.35],'rubber');
    disc([tower+.15,y,0],.006,.012,'chrome');
    disc([tower+0.15,y,0.18],0.006,0.005,'chrome');
  }
  rod([tower+0.035,0.79,0],[tower+0.035,towerHeight-0.12,0],0.004,'rubber');
  disc([tower+0.035,towerHeight-0.13,0],0.071,0.09);
  disc([tower+0.035,towerHeight-0.13,0.05],0.052,0.012,'accent');
  rod([tower+0.12,0.425,0.17],[tower+0.23,0.425,0.17],0.009,'chrome');
  box([tower+0.24,0.425,0.17],[0.042,0.03,0.06],'accent');
  box([tower,towerHeight*0.72,0.278],[0.19,0.22,0.006],'label');
  box([0.08,0.32,0],[0.1,0.42,0.11]);
  box([0.08,0.4,0],[0.065,0.28,0.075],'chrome');
  for (let i=0;i<6;i++) disc([0.08,0.3+i*0.035,0.039],0.005,0.003,'rubber');
  rod([0.08,0.405,0.04],[0.08,0.405,0.14],0.008,'chrome');
  disc([0.08,0.405,0.15],0.022,0.03,'accent');
  cushion([0.17,0.55,0],[0.42,0.105,0.4]);
  cushion([-0.045,0.9,0],[0.12,0.58,0.38],[0,0,-0.1]);
  box([0.12,0.42,0.1],[0.04,0.028,0.11],'accent');
  for (const side of [-1,1]) {
    box([0.32,0.21,side*0.19],[0.23,0.05,0.14],'rubber',[0,0,0.08]);
    for (const y of [0.43,0.47,0.51]) bolt([0.08,y,side*0.063]);
  }
  if (lat) {
    box([tower+0.1,2.13,0],[0.1,0.13,0.4]);
    rod([tower+0.12,2.13,0],[0.35,2.13,0],0.04);
    disc([0.35,2.12,0],0.075,0.085);
    disc([0.35,2.12,0.05],0.05,0.012,'accent');
    rod([0.35,2.08,0],[0.35,1.82,0],0.004,'rubber');
    rod([0.35,1.82,-0.29],[0.35,1.82,0.29],0.014,'chrome');
    for (const side of [-1,1]) {
      grip([0.35,1.82,side*0.29],[0.35,1.7,side*0.45],0.019);
      disc([0.28,0.76,side*0.14],0.08,0.2,'pad');
      disc([0.28,0.76,side*0.245],0.055,0.012,'shell');
      bolt([0.28,0.76,side*0.255]);
    }
  } else if (leg) {
    for (const side of [-1,1]) {
      rod([-0.3,0.27,side*0.36],[0.89,1.31,side*0.36],0.028,'chrome');
      rod([-0.22,0.27,side*0.36],[0.97,1.31,side*0.36],0.045,'frame');
      box([0.58,0.99,side*0.36],[0.19,0.14,0.1],'shell',[0,0,-0.72]);
      grip([0.12,0.5,side*0.29],[-0.08,0.5,side*0.29],0.023);
      bolt([0.57,0.99,side*0.42]);
    }
    box([0.76,1.13,0],[0.1,0.5,0.72],'shell',[0,0,-0.5]);
    for (let i=0;i<8;i++) box([0.815+i*0.022,0.975+i*0.04,0],[0.018,0.012,0.6],'rubber',[0,0,-0.5]);
    rod([tower+0.1,0.22,0],[0.6,0.88,0],0.004,'rubber');
  } else {
    for (const side of [-1,1]) {
      rod([tower+0.16,0.2,side*0.38],[tower+0.16,1.39,side*0.38],0.038);
      box([tower+0.16,1.38,side*0.38],[0.16,0.16,0.1],'shell');
      disc([tower+0.16,1.38,side*0.44],0.072,0.045,'chrome');
      disc([tower+0.16,1.38,side*0.47],0.044,0.022,'accent');
      rod([tower+0.16,1.38,side*0.4],[0.42,1.07,side*0.46],0.035);
      rod([0.42,1.07,side*0.46],[0.53,0.86,side*0.46],0.023,'chrome');
      grip([0.51,0.9,side*0.46],[0.6,0.86,side*0.34],0.026);
      rod([tower+0.16,1.38,side*0.38],[tower+0.14,0.55,side*0.2],0.004,'rubber');
      for (const y of [0.22,1.38]) bolt([tower+0.16,y,side*0.5]);
    }
  }
  const merged = finish() as Record<StrengthFinish,THREE.BufferGeometry>;
  seat.dispose(); back.dispose();
  return merged;
}

function buildSpecialisedStrength(spec: typeof STRENGTH_VARIANTS[number]): Record<StrengthFinish, THREE.BufferGeometry> {
  const type = spec.id;
  const { add, box, rod, disc, bolt, finish } = createEquipmentAssembly();
  const padShape = new RoundedBoxGeometry(1, 1, 1, 2, 0.13);
  const towerX = -spec.length_m / 2 + 0.25;
  const pad = (p: Point, s: Point, r: Point = [0, 0, 0]) => {
    add(padShape, p, s, 'rubber', r);
    add(padShape, [p[0] + .004, p[1] + .006, p[2]], [s[0] * .96, s[1] * .94, s[2] * .95], 'pad', r);
    addPadWelt(add,p,s,r);
  };
  const grip = (a: Point, b: Point) => {
    rod(a, b, .023, 'rubber');
    for (const t of [.12, .3, .48, .66, .84]) {
      const point = a.map((v, i) => v + (b[i] - v) * t) as Point;
      const end = a.map((v, i) => v + (b[i] - v) * (t + .03)) as Point;
      rod(point, end, .025, 'rubber');
    }
  };
  const pulley = (p: Point, radius = .08) => {
    disc(p, radius, .064, 'rubber');
    disc([p[0], p[1], p[2] + .04], radius * .7, .016, 'chrome');
    bolt([p[0], p[1], p[2] + .055]);
  };
  const pivot = (p: Point) => {
    disc(p, .068, .065, 'shell');
    disc([p[0], p[1], p[2] + .04], .044, .012, 'chrome');
    bolt([p[0], p[1], p[2] + .052]);
  };
  const back = () => pad([-.06, .98, 0], [.13, .65, .44], [0, 0, -.12]);
  const seat = () => pad([.15, .57, 0], [.46, .11, .44]);
  const roller = (p: Point, width: number) => {
    disc(p, .085, width, 'pad');
    for (const side of [-1, 1]) {
      disc([p[0], p[1], p[2] + side * (width / 2 + .006)], .07, .012, 'shell');
      bolt([p[0], p[1], p[2] + side * (width / 2 + .018)]);
    }
  };
  for (const x of [-spec.length_m / 2 + .16, spec.length_m / 2 - .18]) {
    box([x, .085, 0], [.14, .12, .96]);
    for (const side of [-1, 1]) {
      box([x, .043, side * .43], [.21, .085, .15], 'rubber');
      bolt([x, .145, side * .38]);
    }
  }
  box([0, .15, 0], [spec.length_m - .28, .12, .13]);
  box([towerX - .12, .98, 0], [.075, 1.78, .58], 'shell');
  for (const side of [-1, 1]) {
    rod([towerX + .15, .16, side * .27], [towerX + .15, 1.8, side * .27], .034);
    box([towerX-.035, .99, side * .295], [.22, 1.59, .026], 'shell');
    box([towerX+.105,.99,side*.295],[.045,1.64,.052]);
    box([towerX-.17,.99,side*.295],[.035,1.64,.052]);
    box([towerX - .04, 1.35, side * .313], [.032, .71, .009], 'chrome');
    box([towerX + .04, 1.48, side * .315], [.19, .27, .008], 'label');
    for (const y of [.2, 1.75]) bolt([towerX + .13, y, side * .321]);
    for (let i = 0; i < 5; i++) box([towerX - .035, .36 + i * .035, side * .313], [.18, .012, .006], 'rubber');
    rod([towerX + .08, .2, side * .12], [towerX + .08, 1.76, side * .12], .012, 'chrome');
  }
  box([towerX, 1.82, 0], [.4, .08, .65]);
  for (let i = 0; i < 14; i++) {
    box([towerX + .065, .23 + i * .046, 0], [.24, .035, .36], 'rubber');
    disc([towerX+.19,.23+i*.046,0],.006,.012,'chrome');
    disc([towerX + .065, .23 + i * .046, .185], .007, .005, 'chrome');
  }
  rod([towerX + .22, .46, .12], [towerX + .32, .46, .12], .009, 'chrome');
  box([towerX + .33, .46, .12], [.035, .035, .06], 'accent');
  pulley([towerX + .1, 1.7, 0]);
  pulley([towerX + .1, .21, 0], .065);
  rod([towerX + .17, .23, 0], [towerX + .17, 1.7, 0], .004, 'rubber');
  rod([towerX + .1, .21, 0], [.22, .32, 0], .004, 'rubber');
  box([.1, .32, 0], [.13, .4, .13]);
  box([.1, .4, 0], [.075, .25, .08], 'chrome');
  for (let i = 0; i < 5; i++) disc([.1, .3 + i * .035, .043], .005, .004, 'rubber');
  rod([.1, .4, .05], [.1, .4, .16], .008, 'chrome');
  disc([.1, .4, .17], .023, .03, 'accent');
  const noSeat = type === 'glute_kickback' || type === 'hip_thrust';
  if (!noSeat) seat();
  if (['pec_fly', 'shoulder_press', 'leg_extension', 'triceps_press', 'ab_crunch'].includes(type)) back();

  if (type === 'pec_fly' || type === 'shoulder_press' || type === 'lateral_raise') {
    for (const side of [-1, 1]) {
      const high = type === 'shoulder_press' ? 1.75 : type === 'pec_fly' ? 1.65 : 1.04;
      rod([towerX + .1, .22, side * .43], [towerX + .1, high, side * .43], .038);
      pivot([towerX + .1, high, side * .46]);
      rod([towerX + .1, high, side * .43], [.4, high - .07, side * .48], .035);
      if (type === 'shoulder_press') {
        rod([.4, high - .07, side * .48], [.57, 1.9, side * .4], .025, 'chrome');
        grip([.57, 1.9, side * .4], [.57, 1.9, side * .25]);
      } else if (type === 'pec_fly') {
        pad([.4, 1.3, side * .48], [.13, .4, .14]);
        grip([.47, 1.46, side * .48], [.47, 1.65, side * .48]);
      } else {
        pad([.3, .97, side * .46], [.3, .12, .18]);
        grip([.4, .93, side * .43], [.59, .93, side * .43]);
      }
    }
  } else if (type === 'seated_row') {
    pad([.42, 1.01, 0], [.13, .48, .4], [0, 0, .14]);
    rod([.27, .2, 0], [.42, .95, 0], .036);
    for (const side of [-1, 1]) {
      rod([towerX + .12, 1.59, side * .4], [.65, 1.03, side * .43], .034);
      pivot([towerX + .12, 1.59, side * .44]);
      grip([.65, 1.03, side * .43], [.65, .85, side * .43]);
      box([.68, .23, side * .2], [.25, .05, .23], 'rubber', [0, 0, .25]);
    }
  } else if (type === 'leg_extension') {
    pad([.35, .57, 0], [.65, .1, .45]);
    pivot([.42, .57, .35]);
    rod([.42, .57, .31], [.65, .27, .31], .044);
    roller([.68, .29, 0], .65);
    for (const side of [-1, 1]) grip([.03, .66, side * .33], [.25, .66, side * .33]);
  } else if (type === 'hip_thrust') {
    pad([-.02, .72, 0], [.48, .17, .83]);
    rod([-.16, .18, 0], [-.02, .64, 0], .045);
    for (const side of [-1, 1]) {
      rod([towerX + .17, .28, side * .47], [.44, .52, side * .47], .045);
      pivot([towerX + .17, .28, side * .49]);
      grip([.3, .59, side * .48], [.47, .59, side * .48]);
    }
    roller([.42, .54, 0], .75);
    box([.75, .22, 0], [.48, .08, .8], 'rubber', [0, 0, .12]);
    box([.03, .83, 0], [.17, .025, .65], 'rubber');
  } else if (type === 'glute_kickback') {
    pad([.05, 1.15, 0], [.15, .43, .48], [0, 0, -.14]);
    rod([.02, .2, 0], [.02, 1.15, 0], .04);
    box([.38, .22, 0], [.5, .06, .6], 'rubber');
    rod([towerX + .1, .32, .37], [.8, .63, .37], .045);
    pivot([towerX + .1, .32, .41]);
    box([.82, .67, 0], [.07, .37, .38], 'rubber', [0, 0, -.18]);
    for (const side of [-1, 1]) {
      rod([-.15, 1.32, side * .32], [.42, 1.32, side * .32], .025, 'chrome');
      grip([.27, 1.32, side * .32], [.48, 1.32, side * .32]);
    }
  } else if (type === 'biceps_curl') {
    pad([.36, .99, 0], [.52, .14, .75], [0, 0, -.28]);
    rod([.2, .2, 0], [.3, .94, 0], .034);
    pivot([.6, .83, .43]);
    for (const side of [-1, 1]) {
      rod([.6, .83, side * .28], [.76, 1.15, side * .2], .03);
      grip([.76, 1.15, side * .2], [.76, 1.15, side * .07]);
    }
  } else if (type === 'triceps_press') {
    for (const side of [-1, 1]) {
      rod([towerX + .15, .48, side * .42], [.5, .84, side * .4], .037);
      pivot([towerX + .15, .48, side * .45]);
      grip([.5, .84, side * .4], [.69, .84, side * .4]);
      box([.15, .62, side * .32], [.27, .06, .09], 'shell');
    }
  } else if (type === 'ab_crunch') {
    for (const side of [-1, 1]) {
      rod([towerX + .12, 1.57, side * .39], [.4, 1.33, side * .39], .035);
      pivot([towerX + .12, 1.57, side * .42]);
      grip([.4, 1.33, side * .39], [.51, 1.16, side * .39]);
    }
    pad([.42, 1.13, 0], [.16, .25, .64]);
    roller([.61, .26, 0], .6);
  } else {
    rod([.1, .16, 0], [.1, .73, 0], .05, 'chrome');
    pad([.12, .6, 0], [.46, .16, .5]);
    for (const side of [-1, 1]) {
      pad([.32, .79, side * .15], [.29, .22, .14]);
      rod([-.05, .55, side * .36], [-.05, 1.45, side * .36], .033);
      pad([-.05, 1.15, side * .31], [.25, .45, .12]);
      grip([-.05, 1.43, side * .36], [.15, 1.43, side * .36]);
    }
    pivot([.1, .3, .16]);
  }
  padShape.dispose();
  return finish() as Record<StrengthFinish, THREE.BufferGeometry>;
}
