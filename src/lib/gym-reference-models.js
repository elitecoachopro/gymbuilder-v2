import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function createEquipmentModel(type,{texture=()=>null,upholstery='#a94b3f'}={}){
 const root=new THREE.Group();
 const material=(name,color,roughness,metalness,role='original')=>{
  const m=new THREE.MeshStandardMaterial({name,color,roughness,metalness});m.userData.gymbuilderSurface=role;return m;
 };
 const paint=material('Graphite powder coated frame','#3f494e',.46,.18,'paint');
 const plastic=material('Moulded charcoal housing','#252d31',.54,.02);
 const steel=material('Polished steel guide and collar','#c3ccd1',.23,.9,'steel');
 const rubber=material('Rubber grips and bumper plates','#292f2d',.86,0,'rubber');
 const tread=material('Textured running belt','#272c2d',.95,0);
 const vinyl=material('Stitched training upholstery',upholstery,.5,0,'upholstery');
 const red=material('Red adjustment control','#b32f25',.43,.02);
 const amber=material('Emergency switch surround','#c7a04b',.57,.05);
 const silver=material('Brushed fasteners','#9ba8ad',.38,.75,'steel');
 const stitch=material('Upholstery seam','#bcb1a1',.9,0);
 const add=(g,m,x,y,z,parent=root)=>{const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);parent.add(mesh);return mesh;};
 const rounded=(x,y,z,w,h,d,m,r=.015,parent=root)=>add(new RoundedBoxGeometry(w,h,d,1,Math.min(r,w/3,h/3,d/3)),m,x,y,z,parent);
 const box=(x,y,z,w,h,d,m,parent=root)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);
 const cyl=(x,y,z,r,length,m,axis='y',segments=16,parent=root)=>{
  const mesh=add(new THREE.CylinderGeometry(r,r,length,segments),m,x,y,z,parent);
  if(axis==='z')mesh.rotation.x=Math.PI/2;if(axis==='x')mesh.rotation.z=Math.PI/2;return mesh;
 };
 const tube=(points,r,m,parent=root)=>{
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(8,points.length*4),r,8,false),m);parent.add(mesh);return mesh;
 };
 const beam=(a,b,w,d,m)=>{
  const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),v=to.clone().sub(from);
  const mesh=rounded(...from.clone().add(to).multiplyScalar(.5).toArray(),w,v.length(),d,m,.012);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return mesh;
 };
 const nut=(x,y,z,axis='z',r=.011,parent=root)=>{
  cyl(x,y,z,r,.008,silver,axis,6,parent);cyl(x,y,z,r*.4,.009,plastic,axis,6,parent);
 };
 const ring=(x,y,z,r,t,m,axis='z')=>{
  const mesh=add(new THREE.TorusGeometry(r,t,6,32),m,x,y,z);if(axis==='y')mesh.rotation.x=Math.PI/2;return mesh;
 };
 const texturedPlate=(draw)=>{
  const map=texture(768,384,draw);return new THREE.MeshBasicMaterial({map,color:map?'#ffffff':'#8daaa4',toneMapped:false});
 };
 function treadmill(){
  root.name='Original detailed commercial treadmill';
  rounded(-.04,.125,0,1.82,.15,.75,paint,.035);
  rounded(-.14,.193,0,1.46,.07,.574,rubber,.03);
  box(-.14,.23,0,1.42,.007,.552,tread);
  for(const z of [-.368,.368]){
   rounded(-.035,.22,z,1.86,.10,.123,plastic,.025);
   rounded(-.14,.275,z,1.47,.014,.092,rubber,.006);
   for(const x of [-.77,.48])nut(x,.285,z,'y',.009);
   for(const x of [-.69,.66]){
    rounded(x,.04,z,.20,.074,.13,rubber,.02);
    cyl(x,.015,z,.045,.03,rubber);
   }
  }
  rounded(.726,.275,0,.435,.23,.755,plastic,.065);
  rounded(.755,.39,0,.22,.025,.66,paint,.01);
  for(let i=0;i<14;i++)rounded(.788,.407,-.252+i*.039,.09,.004,.009,rubber,.002);
  cyl(-.837,.18,0,.064,.58,tread,'z',24);
  for(const z of [-.325,.325]){
   rounded(-.874,.19,z,.13,.13,.10,plastic,.03);
   nut(-.907,.20,z,'x',.013);
  }
  for(let i=0;i<65;i++)box(-.815+i*.021,.234,0,.0013,.001,.54,tread);
  for(const side of [-1,1]){
   const z=side*.335;
   beam([.48,.28,z],[.735,1.15,z],.065,.072,paint);
   rounded(.49,.33,z,.17,.12,.12,plastic,.03);
   nut(.495,.35,z+side*.062);
   tube([[.72,1.10,z],[.61,1.09,side*.37],[.34,1.055,side*.381],[.12,.985,side*.381]],.027,paint);
   tube([[.36,1.055,side*.381],[.24,1.03,side*.381],[.12,.985,side*.381]],.030,rubber);
   rounded(.305,1.078,side*.381,.09,.009,.033,steel,.006);
  }
  const consoleGroup=new THREE.Group();consoleGroup.position.set(.684,1.245,0);consoleGroup.rotation.z=-.25;root.add(consoleGroup);
  rounded(0,0,0,.14,.27,.716,plastic,.04,consoleGroup);
  rounded(-.074,.027,0,.012,.185,.594,paint,.012,consoleGroup);
  const face=add(new THREE.PlaneGeometry(.548,.146),texturedPlate(ctx=>{
   ctx.fillStyle='#10292b';ctx.fillRect(0,0,768,384);ctx.strokeStyle='#41686b';ctx.lineWidth=3;ctx.strokeRect(10,10,748,364);
   ctx.textAlign='center';ctx.fillStyle='#d9f1e7';ctx.font='500 87px Inter';ctx.fillText('00:00',215,165);ctx.fillText('0.0',568,165);
   ctx.fillStyle='#a6bdb7';ctx.font='31px Inter';ctx.fillText('TIME',215,231);ctx.fillText('KM / H',568,231);ctx.font='24px Inter';ctx.fillText('IMPERIAL  /  TRAINING DEMO',384,327);
  }),-.082,.027,0,consoleGroup);face.rotation.y=-Math.PI/2;
  rounded(.532,1.087,0,.25,.067,.67,plastic,.025);
  for(const z of [-.274,.274]){
   cyl(.544,1.121,z,.043,.016,paint);cyl(.544,1.128,z,.033,.018,rubber);
   ring(.544,1.14,z,.037,.006,plastic,'y');
  }
  for(const z of [-.17,-.10,.10,.17])cyl(.492,1.125,z,.015,.012,silver);
  cyl(.474,1.13,0,.029,.015,amber);cyl(.474,1.145,0,.021,.02,red);
  tube([[.474,1.13,0],[.426,1.06,.025],[.40,.92,.025],[.37,.89,.012]],.0025,red);
 }
 function legPress(){
  root.name='Original detailed inclined plate loaded leg press';
  for(const z of [-.49,.49]){
   rounded(0,.09,z,1.94,.12,.12,paint,.02);
   for(const x of [-.78,.80]){
    rounded(x,.026,z,.23,.05,.18,rubber,.016);
    beam([x,.05,z],[x,.13,z],.07,.07,paint);
   }
   beam([.77,.13,z],[.77,1.46,z],.09,.10,paint);
   beam([-.33,.16,z],[.77,1.36,z],.085,.09,paint);
   cyl(.77,1.46,z,.047,.04,plastic);
   const lower=[-.38,.41,z],upper=[.64,1.43,z];
   const delta=new THREE.Vector3(...upper).sub(new THREE.Vector3(...lower));
   const rail=cyl(.13,.92,z,.028,delta.length(),steel);rail.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
   const slide=rounded(.315,1.105,z,.091,.29,.10,paint,.016);slide.rotation.z=-Math.PI/4;
   nut(.78,.15,z+.064);nut(.78,1.40,z+.064);
  }
  for(const x of [-.77,.77])rounded(x,.10,0,.12,.12,1.12,paint,.02);
  rounded(.77,1.35,0,.095,.10,1.06,paint,.016);
  beam([-.80,.12,0],[-.61,.33,0],.11,.38,paint);
  const seatBoard=rounded(-.52,.312,0,.42,.07,.54,plastic,.02);seatBoard.rotation.z=-.10;
  const seat=rounded(-.52,.372,0,.405,.092,.52,vinyl,.035);seat.rotation.z=-.10;
  const backBoard=rounded(-.825,.622,0,.53,.065,.525,plastic,.02);backBoard.rotation.z=-.95;
  const back=rounded(-.845,.652,0,.52,.103,.51,vinyl,.04);back.rotation.z=-.95;
  for(const z of [-.228,.228]){
   tube([[-.699,.429,z],[-.52,.411,z],[-.34,.393,z]],.0016,stitch);
   tube([[-.977,.875,z],[-.84,.684,z],[-.704,.494,z]],.0016,stitch);
   beam([-.77,.18,z],[-.89,.54,z],.045,.045,paint);
   for(let i=0;i<5;i++)rounded(-.85+i*.035,.246+i*.036,z,.028,.025,.025,silver,.004);
  }
  for(const side of [-1,1]){
   tube([[-.64,.30,side*.30],[-.62,.46,side*.32],[-.44,.48,side*.34],[-.31,.43,side*.34]],.021,paint);
   tube([[-.58,.465,side*.328],[-.44,.48,side*.34],[-.32,.437,side*.34]],.025,rubber);
   nut(-.69,.32,side*.29);
  }
  const plate=rounded(.385,1.115,0,.62,.05,.79,paint,.018);plate.rotation.z=Math.PI/4;
  for(let i=0;i<14;i++){
   const t=(i+.5)/14-.5;
   const rib=rounded(.385+.4384*t-.021,1.115+.4384*t+.021,0,.013,.008,.735,rubber,.002);rib.rotation.z=Math.PI/4;
  }
  for(const t of [-.40,.40])for(const z of [-.344,.344]){
   const x=.385+.4384*t-.024,y=1.115+.4384*t+.024;
   const bolt=cyl(x,y,z,.010,.009,silver,'y',6);bolt.rotation.z=Math.PI/4;
  }
  rounded(.365,.998,0,.12,.10,1.05,paint,.016);
  cyl(.365,.998,0,.025,1.42,steel,'z',20);
  for(const side of [-1,1]){
   for(const z of [.545,.583,.621]){
    cyl(.365,.998,side*z,.191,.032,rubber,'z',40);
    ring(.365,.998,side*(z+.017),.159,.0045,plastic);
    cyl(.365,.998,side*(z+.019),.044,.008,silver,'z',16);
   }
   cyl(.365,.998,side*.683,.038,.035,silver,'z',16);
   tube([[.57,.89,side*.45],[.52,.75,side*.48],[.37,.69,side*.49]],.013,steel);
   cyl(.36,.69,side*.49,.023,.09,red,'x',12);
   rounded(.08,.86,side*.49,.10,.05,.13,plastic,.012);
  }
 }
 function bearing(point,axis,radius=.05){
  const centre=new THREE.Vector3(...point),normal=new THREE.Vector3(...axis).normalize();
  for(const side of [-1,1]){
   const face=centre.clone().addScaledVector(normal,side*.014);
   const race=add(new THREE.TorusGeometry(radius*.65,.0025,4,20),silver,...face.toArray());race.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
   const hub=cyl(...face.toArray(),.013,.004,steel,'y',14);hub.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);
   const bolt=cyl(...face.clone().addScaledVector(normal,side*.003).toArray(),.007,.007,silver,'y',6);bolt.quaternion.copy(hub.quaternion);
  }
 }
 function badge(){
  return texturedPlate(ctx=>{ctx.fillStyle='#252d31';ctx.fillRect(0,0,768,384);ctx.fillStyle='#d9dfd8';ctx.font='600 110px Inter';ctx.textAlign='center';ctx.fillText('IMPERIAL',384,220);});
 }
 function plaque(x,y,z,w,h,m){
  const face=add(new THREE.PlaneGeometry(w,h),m,x,y,z);face.rotation.y=Math.PI/2;
 }
 function stackGuard(x,z,width,height,top,label,depth=.34){
  const bottom=.13,back=x-depth/2+.016;
  for(let i=0;i<9;i++)rounded(back,bottom+(i+.5)*height/9,z,.032,height/9-.008,width,plastic,.012);
  for(const side of [-1,1])rounded(x,bottom+height/2,z+side*(width/2+.009),depth,height,.024,plastic,.018);
  rounded(x+depth/2+.011,top,z,.044,.13,width+.04,plastic,.016);
  rounded(x+depth/2+.035,top-.049,z,.003,.008,width-.025,silver,.001);
  plaque(x+depth/2+.034,top+.008,z,width-.025,.073,label);
  rounded(x+depth/2+.011,.137,z,.044,.055,width+.025,plastic,.012);
 }
 function multiGymDetails(){
  root.name='Original multigym detail assembly';
  stackGuard(-.64,0,.39,1.61,1.765,badge());
  rounded(-.224,.882,0,.08,.58,.32,vinyl,.03);
  rounded(-.008,.502,0,.39,.085,.34,vinyl,.03);
  tube([[-.181,.632,-.13],[-.181,1.12,-.13],[-.181,1.14,-.11],[-.181,1.14,.11],[-.181,1.12,.13],[-.181,.632,.13]],.0012,stitch);
  tube([[-.175,.546,-.135],[.15,.546,-.135],[.166,.546,-.12],[.166,.546,.12],[.15,.546,.135],[-.175,.546,.135]],.0012,stitch);
  for(const [x,y,z,r,length] of [[.2272,.64,.125,.057,.19],[.2272,.64,-.125,.057,.19],[.3372,.155,.137,.064,.21],[.3372,.155,-.137,.064,.21]]){
   cyl(x,y,z,r,length,rubber,'z',24);
   for(const side of [-1,1]){const edge=z+side*(length/2+.002);cyl(x,y,edge,r*.74,.006,plastic,'z',18);cyl(x,y,edge+side*.004,.013,.008,silver,'z',12);}
  }
  for(const centre of [[-.3362,.1315,-.05],[-.5712,1.704,.068],[-.5712,2.1,0],[-.4293,2.1,-.05],[-.5712,2.1,-.05],[.2357,2.1,0]])bearing(centre,[0,0,1]);
  for(const side of [-1,1]){
   cyl(.1422,1.157,side*.29,.017,.009,silver,'y',14);
   nut(-.3178,1.06,side*.04,'z',.013);
  }
 }
 function cableStationDetails(){
  root.name='Original cable station detail assembly';const label=badge();
  for(const side of [-1,1]){
   stackGuard(-.235,side*1.52,.36,1.88,1.952,label,.40);
   for(const centre of [[-.0738,2.106,side*1.496],[.3117,2.106,side*1.264]])bearing(centre,[side*.516,0,.857]);
   bearing([.3927,1.3,side*1.24],[0,0,1],.045);
   cyl(.310,1.3,side*1.52,.014,.042,silver,'x',14);
   cyl(.338,1.3,side*1.52,.021,.023,red,'x',16);
   for(const y of [1.235,1.365])nut(.286,y,side*1.57,'x',.010);
  }
 }
 if(type==='cad_treadmill')treadmill();else if(type==='cad_leg_press')legPress();else if(type==='real_multigym')multiGymDetails();else if(type==='real_cable_crossover')cableStationDetails();else throw Error('Unsupported equipment model: '+type);
 root.updateMatrixWorld(true);const buckets=new Map(),originals=[];
 root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);const flat=g.index?g.toNonIndexed():g;if(flat!==g)g.dispose();const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,{material:o.material,geometries:[]});buckets.get(key).geometries.push(flat);originals.push(o.geometry);});
 const result=new THREE.Group();result.name=root.name;
 for(const {material,geometries} of buckets.values()){
  const geometry=mergeGeometries(geometries);if(!geometry)throw Error('Equipment geometry could not be merged');
  const mesh=new THREE.Mesh(geometry,material);mesh.name=material.name;mesh.castShadow=mesh.receiveShadow=true;result.add(mesh);geometries.forEach(g=>g.dispose());
 }
 for(const g of new Set(originals))g.dispose();
 result.userData.originalConcept=true;return result;
}

export function enhanceStrengthModel(source,type,options={}){
 if(type==='real_multigym'){
  const pads=[];source.traverse(o=>{if(o.isMesh&&o.material.userData.gymbuilderSurface==='upholstery')pads.push(o);});
  for(const pad of pads){pad.parent.remove(pad);pad.geometry.dispose();}
 }else if(type==='real_cable_crossover'){
  source.updateMatrixWorld(true);
  source.traverse(o=>{
   if(!o.isMesh||o.material.name!=='black powder coat (textured)')return;
   const geometry=o.geometry,position=geometry.attributes.position,index=geometry.index,points=[];
   for(let i=0;i<position.count;i++)points.push(new THREE.Vector3().fromBufferAttribute(position,i).applyMatrix4(o.matrixWorld));
   const keep=[];
   for(let i=0;i<index.count;i+=3){
    const triangle=[index.getX(i),index.getX(i+1),index.getX(i+2)];
    const cover=triangle.every(j=>{const v=points[j];return v.x>=-.416&&v.x<=-.048&&v.y>=.099&&v.y<=2.061&&Math.abs(Math.abs(v.z)-1.52)<=.169;});
    if(!cover)keep.push(...triangle);
   }
   geometry.setIndex(keep);
  });
 }else throw Error('Unsupported strength enhancement: '+type);
 const details=createEquipmentModel(type,options);source.add(details);return source;
}
