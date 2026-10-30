'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { StudioRoom } from '../../../../src/components/studio/SpaceScene';
import { EquipmentMaterials } from '../../../../src/components/studio/EquipmentParts';
import { SurfaceMaterials } from '../../../../src/components/studio/SurfaceMaterials';
import { demoBuildingSpace, FLOOR_RISE_M } from '../../../../src/lib/gym-building';
import ClassesFloor,{classesFloor} from './ClassesFloor';
import {sledRunAt} from './sled-run';
import StairArchitecture from '../../../../src/components/studio/StairArchitecture';
import {SledTraining} from '../../../../src/components/studio/FitnessPeople';
import EquipmentModel from '../../../../src/components/studio/EquipmentModel';
import { EQUIPMENT_CATALOG } from '../../../../src/lib/gym-catalog';
import { EconomicReflections, EquipmentContactShadows } from '../../../../src/components/studio/StudioLighting';
import TourEquipment, { TourSign } from './TourEquipment';
import { tourSpace, tourItems, tourChapter, musclePairs } from './tour-layout';

const DURATION=120;
const upperFloor={...demoBuildingSpace().upperFloor!,stairwell:{x:16.6,y:.3,w:3,d:4.8,opening:true}};
function cameraPose(t:number){
 const p=new THREE.Vector3(),target=new THREE.Vector3();
 if(t<5){p.set(11.3,1.75,14.5-t*0.55);target.set(10.5,1.1,3);}
 else if(t<13){const u=(t-5)/8;p.set(13+u*3,7.5,18-u);target.set(16,0.4,12.9);}
 else if(t<18){const u=(t-13)/5;p.set(11.1,1.68,10.85-u*.2);target.set(11.5,1.3,8.9);}
 else if(t<21){p.set(13.7,1.5,10.3);target.set(12.8,1.1,7.7);}
 else if(t<28){const u=(t-21)/7;p.set(10.8+u*0.5,3.4,10.4-u*1.7);target.set(16,0.8,7);}
 else if(t<40){const u=(t-28)/12;p.set(20-u*3.5,9,9-u*0.5);target.set(7.7,0.6,3.8);}
 else if(t<43){const u=(t-40)/3;p.set(3.6-u*.2,1.4,3.4);target.set(1.7,.95,1.6);}
 else if(t<46){const u=(t-43)/3;p.set(12.1,1.65,7.35-u*.1);target.set(10.8,1.22,8.6);}
 else if(t<52){const u=(t-46)/6;p.set(6.9-u*0.8,5,14-u*2);target.set(2.8,0.4,11.8);}
 else if(t<57){const u=(t-52)/5;p.set(8.7,3.7,9.9+u*0.3);target.set(8.4,1,13.5);}
 else if(t<64){const u=(t-57)/7;p.set(21,8+u*2,8);target.set(17.8,2.5+u,2.8);}
 else if(t<68){const u=(t-64)/4;p.set(12-u*1.5,FLOOR_RISE_M+1.75,9.2);target.set(10.5,FLOOR_RISE_M+1.15,2.8);}
 else if(t<72){const u=(t-68)/4;p.set(16-u,FLOOR_RISE_M+1.7,6.1);target.set(14,FLOOR_RISE_M+1.25,3);}
 else if(t<84){const sled=sledRunAt(t);p.set(t<78?3.6:5.6,FLOOR_RISE_M+1.65,sled.y+(t<78?1.8:4.5));target.set(1.95,FLOOR_RISE_M+1.0,sled.y);}
 else if(t<90){p.set(24,18,22);target.set(10,FLOOR_RISE_M*2+.5,7.5);}
 else if(t<96){const u=(t-90)/6;p.set(8.7-u*.4,FLOOR_RISE_M*2+1.7,6.2);target.set(4.3,FLOOR_RISE_M*2+1.1,2.5);}
 else if(t<102){const u=(t-96)/6;p.set(8.7-u*.4,FLOOR_RISE_M*2+1.7,14.2);target.set(4.5,FLOOR_RISE_M*2+1.1,10.2);}
 else if(t<108){p.set(15.7,FLOOR_RISE_M*2+1.55,5.4);target.set(12.8,FLOOR_RISE_M*2+.9,3.6);}
 else if(t<114){const u=(t-108)/6;p.set(18.5-u*.5,FLOOR_RISE_M*2+1.7,14.2);target.set(14.7,FLOOR_RISE_M*2+1,9.5);}
 else {const u=(t-114)/6;p.set(31-u*2,24,30);target.set(10,7.5,7.5);}
 return {p,target};
}
function Scene({seconds}:{seconds:number}){
 const phase=seconds<5?0:seconds<28?1:seconds<46?2:seconds<52?3:4;
 const space=useMemo(()=>({...tourSpace,
  walls:tourSpace.walls.filter(w=>phase>=1&&w.id.startsWith('locker')||phase>=3&&w.id.startsWith('aerobic')||phase>=4&&w.id.startsWith('recovery')),
  openings:tourSpace.openings.filter(o=>(o.id==='entry'||o.kind==='window'&&o.wallId.startsWith('edge-'))||phase>=1&&o.wallId.startsWith('locker')||phase>=3&&o.wallId.startsWith('aerobic')||phase>=4&&o.wallId.startsWith('recovery')),
  areas:tourSpace.areas.filter(a=>phase>=1&&(a.id==='vestiare'||a.id==='cardio'||a.id==='receptie'||a.id==='aparate'&&phase>=2)||phase>=3&&a.id==='studio'||phase>=4&&a.id==='stretching'),
 }),[phase]);
 const cutaway=seconds>=5&&seconds<13||seconds>=28&&seconds<40||seconds>=46;
 const shadowSpace=useMemo(()=>({...space,items:tourItems.filter(item=>seconds>=item.at&&EQUIPMENT_CATALOG.some(t=>t.id===item.model)).map(item=>({id:item.id,templateId:item.model,x:item.x,y:item.z,rotation:item.rotation}))}),[space,seconds]);
 const sled=sledRunAt(seconds);
 const upstairs={...upperFloor,items:upperFloor.items.map(item=>item.templateId==='sled_training'?{...item,y:sled.y}:item)};
 const elevation=seconds>=114?FLOOR_RISE_M+3:FLOOR_RISE_M;
 return <SurfaceMaterials><StudioRoom space={space} height={3.5} cutaway={cutaway} showAreas={false} view={cutaway?'orbit':'inside'}/>
  <EquipmentContactShadows space={shadowSpace}/>
  <EquipmentMaterials frame={space.finishes.frame} upholstery={space.finishes.upholstery}>
   {tourItems.filter(item=>seconds>=item.at).map(item=>{
    const progress=Math.min(1,(seconds-item.at)/0.55);const ease=1-Math.pow(1-progress,3);
    return <group key={item.id} position={[item.x,0.025,item.z]} rotation={[0,-item.rotation*Math.PI/180,0]} scale={[ease,Math.max(0.01,ease),ease]}>
     {item.model==='sign'?<group position={[0,2.55,-0.075]} rotation={[0,Math.PI,0]}><TourSign text={item.label!}/></group>:<TourEquipment model={item.model}/>}
    </group>;
   })}
  </EquipmentMaterials>
  {seconds>=28&&musclePairs.map((pair,i)=>seconds>=28+i*1.1&&<group key={pair.name} position={[pair.x+1.4,0.025,pair.z+1.05]} rotation={[-Math.PI/2,0,0]}><TourSign text={`${pair.name} · 2 APARATE`} width={3.2}/></group>)}
  {seconds>=57&&<group position={[0,elevation,0]}>
   <StudioRoom space={upperFloor} height={3.5} cutaway={seconds<64||seconds>=84} view={seconds>=64&&seconds<84?'inside':'orbit'} showAreas={false}/>
   <EquipmentContactShadows space={upstairs}/>
   <EquipmentMaterials frame={upstairs.finishes.frame} upholstery={upstairs.finishes.upholstery}>{upstairs.items.map(item=><group key={item.id} position={[item.x,.025,item.y]} rotation={[0,-item.rotation*Math.PI/180,0]}>{item.templateId==='sled_training'?<SledTraining time={sled.time}/>:<EquipmentModel templateId={item.templateId} frame={upstairs.finishes.frame} upholstery={upstairs.finishes.upholstery}/>}</group>)}
   {seconds>=84&&<StairArchitecture space={{...upperFloor,stairwell:{...upperFloor.stairwell,opening:false}}}/>}
   </EquipmentMaterials>
  </group>}
  {seconds>=84&&<group position={[0,FLOOR_RISE_M*2+(seconds>=114?6:0),0]}>
   <StudioRoom space={classesFloor} height={3.5} cutaway={seconds<90||seconds>=114} showAreas={false} view={seconds>=90&&seconds<114?'inside':'orbit'}/>
   <EquipmentContactShadows space={classesFloor}/>
   <EquipmentMaterials frame={classesFloor.finishes.frame} upholstery={classesFloor.finishes.upholstery}><ClassesFloor/></EquipmentMaterials>
  </group>}
 </SurfaceMaterials>;
}
function Director({seconds,running,start,output}:{seconds:number;running:boolean;start:React.RefObject<number>;output:React.RefObject<HTMLCanvasElement|null>}){
 const {invalidate}=useThree();
 useEffect(()=>{if(!running)return;const timer=setInterval(()=>invalidate(),1000/24);return()=>clearInterval(timer);},[running,invalidate]);
 useFrame(({gl,scene,camera})=>{
  const t=running?Math.min(DURATION,(performance.now()-start.current)/1000):seconds;
  const {p,target}=cameraPose(t);camera.position.copy(p);camera.lookAt(target);camera.updateMatrixWorld();gl.render(scene,camera);
  const ctx=output.current?.getContext('2d');if(!ctx)return;
  ctx.fillStyle='#0c171c';ctx.fillRect(0,0,1920,1080);ctx.drawImage(gl.domElement,0,96,1920,825);
  ctx.fillStyle='#e7d19c';ctx.font='600 40px sans-serif';ctx.fillText('IMPERIAL GYM',42,62);
  ctx.fillStyle='#d0dbdc';ctx.font='25px sans-serif';ctx.textAlign='right';ctx.fillText('CONSTRUCȚIE + TUR INTERIOR · 3 × 300 m²',1875,60);ctx.textAlign='left';
  const [title,description]=tourChapter(t);
  ctx.fillStyle='#e8d3a2';ctx.font='600 32px sans-serif';ctx.fillText(title,42,977);
  ctx.fillStyle='#d3dcdd';ctx.font='27px sans-serif';ctx.fillText(description,42,1024,1740);
  ctx.fillStyle='#92a8ad';ctx.font='20px sans-serif';ctx.textAlign='right';ctx.fillText(`${Math.floor(t).toString().padStart(2,'0')} / 120 s`,1875,1056);ctx.textAlign='left';
  ctx.fillStyle='#b89c63';ctx.fillRect(0,1073,1920*t/DURATION,7);
 },1);
 return null;
}
export default function DemoRecording(){
 const [seconds,setSeconds]=useState(DURATION),[running,setRunning]=useState(false),[status,setStatus]=useState('Previzualizare · sala completă');
 const output=useRef<HTMLCanvasElement>(null),start=useRef(0),recorder=useRef<MediaRecorder|null>(null);
 useEffect(()=>{if(!running)return;const timer=setInterval(()=>{const t=Math.min(DURATION,(performance.now()-start.current)/1000);setSeconds(t);if(t>=DURATION){setRunning(false);setStatus('Se salvează filmul…');recorder.current?.stop();}},1000/24);return()=>clearInterval(timer);},[running]);
 useEffect(()=>()=>{if(recorder.current?.state==='recording')recorder.current.stop();},[]);
 function record(){
  if(!output.current||running)return;
  if(!MediaRecorder.isTypeSupported('video/webm;codecs=vp8')){setStatus('Este necesar un browser cu înregistrare VP8.');return;}
  const stream=output.current.captureStream(24),chunks:BlobPart[]=[];
  const instance=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:6_000_000});recorder.current=instance;
  instance.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  instance.onerror=()=>{setStatus('Înregistrarea a eșuat.');setRunning(false);stream.getTracks().forEach(track=>track.stop());};
  instance.onstop=async()=>{stream.getTracks().forEach(track=>track.stop());try{const blob=new Blob(chunks,{type:'video/webm'});const r=await fetch('/api/demo-recording',{method:'POST',headers:{'Content-Type':'video/webm'},body:blob});if(!r.ok)throw new Error(`HTTP ${r.status}`);setStatus(`Film salvat · ${(blob.size/1024/1024).toFixed(1)} MB`);}catch(error){setStatus(`Salvare eșuată: ${String(error)}`);}};
  start.current=performance.now();setSeconds(0);setRunning(true);setStatus('Înregistrare în curs · 120 secunde');instance.start(1000);
 }
 return <main className="p-4 text-white"><h1>Imperial Gym · construcție și tur de la zero</h1><p role="status">{status}</p>
  <button className="my-3 rounded bg-amber-400 px-5 py-3 text-black" disabled={running} onClick={record}>Înregistrează noul tur 120 secunde</button>
  <label className="ml-4">Previzualizare secunda <input type="number" min="0" max={DURATION} value={seconds.toFixed(1)} disabled={running} onChange={e=>setSeconds(Math.min(DURATION,Math.max(0,Number(e.target.value))))} className="w-24 text-black"/></label>
  <div style={{width:1920,height:825,position:'absolute',left:-2000,top:0}}><Canvas dpr={1} frameloop="demand" camera={{fov:57,near:0.05,far:200}} gl={{antialias:true,powerPreference:'low-power',preserveDrawingBuffer:false,toneMapping:THREE.ACESFilmicToneMapping}}>
   <color attach="background" args={['#bcc8c9']}/><EconomicReflections/><ambientLight intensity={0.35}/><hemisphereLight args={['#f3f5f1','#596c77',0.7]}/><directionalLight position={[4,15,9]} intensity={2.8} color="#fff0d8"/><directionalLight position={[20,8,-4]} intensity={1.2} color="#ccdfed"/>
   <Scene seconds={seconds}/><Director seconds={seconds} running={running} start={start} output={output}/>
  </Canvas></div><canvas ref={output} width={1920} height={1080} style={{width:'min(100%,1920px)',height:'auto',background:'#101820'}} aria-label="Previzualizare film Imperial Gym"/>
  <p>Concept video: aparate și personaje din configurator, pardoseală sport neagră. Fără generare AI sau date de cont.</p>
 </main>;
}
