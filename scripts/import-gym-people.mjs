import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const toolRoot=process.env.GYM_GLTF_TOOLS,sourceDir=process.argv[2];
if(!toolRoot||!sourceDir)throw Error('GYM_GLTF_TOOLS and original GLB directory required');
const load=p=>import(pathToFileURL(path.join(toolRoot,p)));
const {NodeIO}=await load('@gltf-transform/core/dist/index.js');
const {ALL_EXTENSIONS}=await load('@gltf-transform/extensions/dist/index.js');
const {flatten,join,weld,simplify,prune,dedup,center,getBounds,transformPrimitive,unweld,tangents}=await load('@gltf-transform/functions/dist/index.js');
const {MeshoptSimplifier}=await load('meshoptimizer/index.module.js');await MeshoptSimplifier.ready;
const {default:sharp}=await load('sharp/lib/index.js');
const {generateTangents}=await load('mikktspace/dist/main/mikktspace_main.js');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
const sha=b=>createHash('sha256').update(b).digest('hex');
const sources=JSON.parse(await fs.readFile(path.join(root,'assets/gym-people-sources.json'),'utf8'));
const manifest=[],runtime={};const out=path.join(root,'public/models/people');await fs.mkdir(out,{recursive:true});
for(const source of sources){
 const original=await fs.readFile(path.join(sourceDir,source.pose+'.glb'));
 if(sha(original)!==source.sourceSha256)throw Error('Source hash mismatch: '+source.pose);
 const doc=await io.readBinary(original),scene=doc.getRoot().getDefaultScene();
 for(const extension of doc.getRoot().listExtensionsUsed())extension.dispose();
 const bounds=getBounds(scene),scale=source.height_m/(bounds.max[1]-bounds.min[1]);
 const pivot=doc.createNode('Metre height').setScale([scale,scale,scale]);
 for(const node of scene.listChildren())pivot.addChild(node);scene.addChild(pivot);
 await doc.transform(flatten(),join({keepNamed:false}),weld(),simplify({simplifier:MeshoptSimplifier,ratio:.3,error:.0015}),dedup(),prune(),center({pivot:'below'}));
 for(const node of scene.listChildren()){
  for(const p of node.getMesh()?.listPrimitives()??[])transformPrimitive(p,node.getWorldMatrix());
  node.setMatrix([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
 }
 await doc.transform(unweld(),tangents({generateTangents}));
 for(const mesh of doc.getRoot().listMeshes())for(const primitive of mesh.listPrimitives())if(!primitive.getMaterial()?.getNormalTexture())primitive.setAttribute('TANGENT',null);
 await doc.transform(weld(),prune());
 let texturePixels=0;
 for(const texture of doc.getRoot().listTextures()){
  const name=texture.getName(),image=texture.getImage();if(!image)continue;
  const mask=/hair|eyebrow|eyelash/i.test(name),normal=/normal/i.test(name);
  const size=/diffuse2|suit.*diffuse/i.test(name)?1024:mask&& !/hair/i.test(name)?256:512;
  const resized=sharp(Buffer.from(image)).resize(size,size,{fit:'inside',withoutEnlargement:true});
  const encoded=await (mask||normal?resized.png({compressionLevel:9}):resized.jpeg({quality:94,chromaSubsampling:'4:4:4'})).toBuffer({resolveWithObject:true});
  texturePixels+=encoded.info.width*encoded.info.height;
  texture.setImage(encoded.data).setMimeType(mask||normal?'image/png':'image/jpeg');
 }
 for(const material of doc.getRoot().listMaterials())if(material.getAlphaMode()==='OPAQUE')material.setDoubleSided(false);
 let triangles=0,drawCalls=0;for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){drawCalls++;triangles+=(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3;}
 const bytes=await io.writeBinary(doc),url='/models/people/'+source.pose+'.glb';
 if(bytes.length>=3_000_000||triangles>=48000||drawCalls>10||texturePixels>4_000_000)throw Error('Person exceeds runtime budget: '+source.pose+JSON.stringify({bytes:bytes.length,triangles,drawCalls,texturePixels}));
 await fs.writeFile(path.join(root,'public',url),bytes);
 runtime[source.pose]={url,sourceUrl:source.sourceUrl,license:source.license};
 manifest.push({...source,url,sha256:sha(bytes),bytes:bytes.length,triangles,drawCalls,texturePixels,bounds:getBounds(scene),transforms:['uniform metre height, centre X/Z and floor Y=0','static geometry, simplified with relative error .0015','embedded skin/clothes maps <=1024, remaining maps <=512','opaque surfaces single-sided; preserve masked hair; MikkTSpace tangents baked','core GLB, no external textures or runtime decoder']});
 console.log(source.pose,JSON.stringify(manifest.at(-1)));
}
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(path.join(out,'LICENSE.txt'),'Innerscene, adapted from MakeHuman CC0 assets. Fictional characters; CC0-1.0. Source URLs, original and optimized hashes, metre bounds and transformations are in manifest.json.\nhttps://www.innerscene.com/tools/library/terms\nhttps://static.makehumancommunity.org/about/license.html\nhttps://creativecommons.org/publicdomain/zero/1.0/\n');
await fs.writeFile(path.join(root,'src/lib/gym-people-assets.ts'),'// Generated by scripts/import-gym-people.mjs.\nexport const PEOPLE_MODELS = '+JSON.stringify(runtime,null,2)+' as const;\n');
