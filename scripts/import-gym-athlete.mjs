import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const toolRoot=process.env.GYM_GLTF_TOOLS,sourcePath=process.argv[2];
if(!toolRoot||!sourcePath)throw Error('GYM_GLTF_TOOLS and original GLB path required');
const load=p=>import(pathToFileURL(path.join(toolRoot,p)));
const {NodeIO}=await load('@gltf-transform/core/dist/index.js');
const {ALL_EXTENSIONS}=await load('@gltf-transform/extensions/dist/index.js');
const {weld,simplify,prune,dedup,getBounds,unweld,tangents}=await load('@gltf-transform/functions/dist/index.js');
const {MeshoptSimplifier}=await load('meshoptimizer/index.module.js');await MeshoptSimplifier.ready;
const {default:sharp}=await load('sharp/lib/index.js');
const {generateTangents}=await load('mikktspace/dist/main/mikktspace_main.js');
const sha=b=>createHash('sha256').update(b).digest('hex');
const original=await fs.readFile(sourcePath);
if(sha(original)!=='288af86ec0581d78bb8dc495e036736adfc35f8c7c11dc6a0d6b538ad2c0d7b7')throw Error('Source hash mismatch');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),doc=await io.readBinary(original);
for(const animation of doc.getRoot().listAnimations()){
 for(const channel of animation.listChannels())channel.dispose();
 for(const sampler of animation.listSamplers())sampler.dispose();
 animation.dispose();
}
for(const node of doc.getRoot().listNodes())if(node.getSkin())doc.getRoot().getDefaultScene().addChild(node);
for(const node of doc.getRoot().listNodes())if(node.getMesh()&&['Phone','teeth_base'].includes(node.getName()))node.dispose();
for(const extension of doc.getRoot().listExtensionsUsed())extension.dispose();
const basePath=process.argv[3];
if(!basePath)throw Error('Full anatomical base GLB path required');
const fullBodyBytes=await fs.readFile(basePath);
if(sha(fullBodyBytes)!=='d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8')throw Error('Anatomical base hash mismatch');
const fullBody=await io.readBinary(fullBodyBytes),source=fullBody.getRoot().listMeshes().find(m=>m.getName()==='base').listPrimitives()[0];
const skin=doc.getRoot().listSkins()[0],skinNames=skin.listJoints().map(n=>n.getName()),sourceNames=fullBody.getRoot().listSkins()[0].listJoints().map(n=>n.getName());
const remap=name=>{
 const side=name.endsWith('.L')?'l':'r';
 if(name.startsWith('upperleg'))return 'thigh_'+side;
 if(name.startsWith('lowerleg'))return 'calf_'+side;
 if(name.startsWith('foot'))return 'foot_'+side;
 if(name.startsWith('upperarm'))return 'upperarm_'+side;
 if(name.startsWith('lowerarm'))return 'lowerarm_'+side;
 if(name.startsWith('wrist'))return 'hand_'+side;
 return null;
};
const position=source.getAttribute('POSITION'),sourceJoints=source.getAttribute('JOINTS_0'),sourceWeights=source.getAttribute('WEIGHTS_0');
const jointArray=new Uint16Array(sourceJoints.getCount()*4),weightArray=new Float32Array(jointArray.length),valid=[];
for(let i=0;i<sourceJoints.getCount();i++){
 const js=sourceJoints.getElement(i,[]),ws=sourceWeights.getElement(i,[]),combined=new Map();
 for(let k=0;k<4;k++){const name=remap(sourceNames[js[k]]);if(name){const joint=skinNames.indexOf(name);combined.set(joint,(combined.get(joint)??0)+ws[k]);}}
 const entries=[...combined],sum=entries.reduce((n,v)=>n+v[1],0);valid[i]=sum>.95;
 if(sum>0)entries.forEach(([joint,weight],k)=>{jointArray[i*4+k]=joint;weightArray[i*4+k]=weight/sum;});
 else weightArray[i*4]=1;
}
const kept=[],sourceIndices=source.getIndices();
for(let i=0;i<sourceIndices.getCount();i+=3){
 const tri=[0,1,2].map(k=>sourceIndices.getScalar(i+k));
 const points=tri.map(j=>position.getElement(j,[]));
 if(tri.every(j=>valid[j])&&points.every(p=>(p[1]>.07&&p[1]<.76)||(Math.abs(p[0])>.23&&Math.abs(p[0])<.5&&p[1]>1.03)))kept.push(...tri);
}
const buffer=doc.getRoot().listBuffers()[0],patch=doc.createPrimitive();
for(const semantic of ['POSITION','NORMAL','TEXCOORD_0']){
 const old=source.getAttribute(semantic),array=new (old.getArray().constructor)(old.getArray());
 if(semantic==='POSITION')for(let i=0;i<array.length;i+=3){array[i]*=.98;array[i+1]-=.024*Math.max(0,Math.min(1,(array[i+1]-.08)/.42));array[i+2]-=.004;}
 patch.setAttribute(semantic,doc.createAccessor().setType(old.getType()).setArray(array).setBuffer(buffer));
}
patch.setAttribute('JOINTS_0',doc.createAccessor().setType('VEC4').setArray(jointArray).setBuffer(buffer));
patch.setAttribute('WEIGHTS_0',doc.createAccessor().setType('VEC4').setArray(weightArray).setBuffer(buffer));
patch.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(kept)).setBuffer(buffer));
patch.setMaterial(doc.getRoot().listMaterials().find(m=>m.getName().endsWith('anatomical body.body')));
doc.getRoot().getDefaultScene().addChild(doc.createNode('Complete athletic arms and calves').setMesh(doc.createMesh('Athletic limbs').addPrimitive(patch)).setSkin(skin));
function clipPolygonAgainstPlane(polygon,distance,interpolate){
 const clipped=[];
 for(let k=0;k<polygon.length;k++){
  const a=polygon[k],b=polygon[(k+1)%polygon.length],da=distance(a.POSITION),db=distance(b.POSITION);
  if(da>=0)clipped.push(a);
  if((da>=0)!==(db>=0))clipped.push(interpolate(a,b,da/(da-db)));
 }
 return clipped;
}
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
for(const mesh of doc.getRoot().listMeshes())for(const primitive of mesh.listPrimitives()){
 let positions=primitive.getAttribute('POSITION');const material=primitive.getMaterial()?.getName()??'';
 const indices=primitive.getIndices();
 if(indices&&(/original top|original bottom/.test(material))){
  const semantics=primitive.listSemantics(),rows=[],newIndices=[];
  const vertex=i=>Object.fromEntries(semantics.map(key=>[key,primitive.getAttribute(key).getElement(i,[])]));
  const interpolate=(a,b,t)=>{
   const value=Object.fromEntries(semantics.filter(k=>!['JOINTS_0','WEIGHTS_0'].includes(k)).map(k=>[k,a[k].map((x,i)=>x+(b[k][i]-x)*t)]));
   const weights=new Map();for(const [v,gain]of [[a,1-t],[b,t]])for(let k=0;k<4;k++)weights.set(v.JOINTS_0[k],(weights.get(v.JOINTS_0[k])??0)+v.WEIGHTS_0[k]*gain);
   const best=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,4);while(best.length<4)best.push([0,0]);const total=best.reduce((n,v)=>n+v[1],0);
   value.JOINTS_0=best.map(v=>v[0]);value.WEIGHTS_0=best.map(v=>v[1]/total);return value;
  };
  const planes=material.endsWith('original bottom')?[p=>p[1]-.62]:[p=>.29-p[0],p=>.29+p[0]];
  for(let i=0;i<indices.getCount();i+=3){
   let polygon=[0,1,2].map(k=>vertex(indices.getScalar(i+k)));
   for(const distance of planes)polygon=clipPolygonAgainstPlane(polygon,distance,interpolate);
   if(polygon.length<3)continue;
   const offset=rows.length;rows.push(...polygon);for(let k=1;k<polygon.length-1;k++)newIndices.push(offset,offset+k,offset+k+1);
  }
  for(const key of semantics){const old=primitive.getAttribute(key),array=new (old.getArray().constructor)(rows.flatMap(row=>row[key]));primitive.setAttribute(key,doc.createAccessor().setType(old.getType()).setArray(array).setBuffer(positions.getBuffer()));}
  primitive.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(newIndices)).setBuffer(positions.getBuffer()));
 }

 positions=primitive.getAttribute('POSITION');
 const body=/anatomical body.body|original top|original bottom/.test(material);
 if(!body)continue;
 const weights=primitive.getAttribute('WEIGHTS_0'),joints=primitive.getAttribute('JOINTS_0');
 const skin=doc.getRoot().listSkins()[0],bones=skin.listJoints();
 const limbPairs={upperarm_l:'lowerarm_l',upperarm_r:'lowerarm_r',thigh_l:'calf_l',thigh_r:'calf_r',calf_l:'foot_l',calf_r:'foot_r'};
 for(let i=0;i<positions.getCount();i++){
  const p=positions.getElement(i,[]),w=weights.getElement(i,[]),j=joints.getElement(i,[]),original=[...p];
  const torso=(1-smooth(.2,.3,Math.abs(p[0])))*smooth(.86,1.08,p[1])*(1-smooth(1.44,1.54,p[1]));
  p[0]*=1+.18*torso;p[2]=.065+(p[2]-.065)*(1+.18*torso);
  for(let k=0;k<4;k++){
   const bone=bones[j[k]],endName=limbPairs[bone.getName()];if(!endName||w[k]<.01)continue;
   const a=bone.getWorldTranslation(),b=bones.find(n=>n.getName()===endName).getWorldTranslation(),axis=b.map((x,n)=>x-a[n]);
   const length2=axis.reduce((n,x)=>n+x*x,0),u=original.reduce((n,x,c)=>n+(x-a[c])*axis[c],0)/length2;
   const gain=(bone.getName().startsWith('upperarm')?.6:.35)*w[k]*Math.sin(Math.PI*Math.max(0,Math.min(1,u)));
   for(let c=0;c<3;c++)p[c]+=(original[c]-a[c]-u*axis[c])*gain;
  }
  positions.setElement(i,p);
 }
}

for(const material of doc.getRoot().listMaterials()){
 if(material.getName().endsWith('original top'))material.setBaseColorFactor([.32,.025,.018,1]);
 if(material.getName().endsWith('original bottom'))material.setBaseColorFactor([.012,.018,.024,1]);
 if(material.getName().endsWith('anatomical body.shoes01'))material.setBaseColorTexture(null).setBaseColorFactor([.6,.66,.7,1]).setRoughnessFactor(.68);
 if(material.getAlphaMode()==='OPAQUE')material.setDoubleSided(false);
}
await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.24,error:.0015}),dedup(),prune());
await doc.transform(unweld(),tangents({generateTangents}));
for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives())if(!p.getMaterial()?.getNormalTexture())p.setAttribute('TANGENT',null);
await doc.transform(weld(),prune());
let texturePixels=0;
for(const texture of doc.getRoot().listTextures()){
 const name=texture.getName(),image=texture.getImage();if(!image)continue;
 const mask=/hair|eyebrow|eyelash/i.test(name),normal=/normal/i.test(name),size=/male_diffuse2/i.test(name)?1024:mask?256:512;
 const resized=sharp(Buffer.from(image)).resize(size,size,{fit:'inside',withoutEnlargement:true});
 const encoded=await(mask||normal?resized.png({compressionLevel:9}):resized.jpeg({quality:94,chromaSubsampling:'4:4:4'})).toBuffer({resolveWithObject:true});
 texturePixels+=encoded.info.width*encoded.info.height;texture.setImage(encoded.data).setMimeType(mask||normal?'image/png':'image/jpeg');
}
let triangles=0,drawCalls=0;for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){drawCalls++;triangles+=(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3;}
const bytes=await io.writeBinary(doc);
if(bytes.length>3_000_000||triangles>50_000||drawCalls>14||texturePixels>4_000_000)throw Error('Runtime budget exceeded '+JSON.stringify({bytes:bytes.length,triangles,drawCalls,texturePixels}));
const record={url:'/models/people/athlete.glb',sourceUrl:'https://www.innerscene.com/tools/library/3d-parts/locomotion-collection-sam-3d-person-animated-dc23800f',license:'CC0-1.0',author:'Innerscene, adapted from MakeHuman/MPFB CC0 assets',sourceSha256:sha(original),anatomicalBase:{sourceUrl:'https://www.innerscene.com/tools/library/3d-parts/male-base-mesh-3d-person-rigged-a-pose-380e6d89',license:'CC0-1.0',sourceSha256:sha(fullBodyBytes)},sha256:sha(bytes),bytes:bytes.length,triangles,drawCalls,texturePixels,bounds:getBounds(doc.getRoot().getDefaultScene()),joints:doc.getRoot().listSkins()[0].listJoints().map(j=>j.getName()),transforms:['preserved skin weights and 56-joint skeleton; removed source animation clips','removed held phone and interior teeth meshes','completed anatomical limbs on preserved rig; authored athletic torso and limb volume; pale training shoes; tailored short sleeves and above-knee shorts; red training top and dark shorts; embedded bounded textures; simplified geometry; baked tangents','authored deterministic Imperial Gym sled motion at runtime; no motion capture']};
await fs.writeFile(path.join(root,'public',record.url),bytes);
await fs.writeFile(path.join(root,'public/models/people/athlete-manifest.json'),JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify(record,null,2));
