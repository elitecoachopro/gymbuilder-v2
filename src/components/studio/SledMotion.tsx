'use client';
import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Vector3,type Group} from 'three';
import type {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {sampleSledPush,type SledPushRoute} from '@/lib/gym-sled-motion';
import {SledTraining} from './FitnessPeople';
export type SledPlayback = {running:boolean;run:number};
export default function SledMotion({route,playback,onEnd,follow}:{route:SledPushRoute;playback:SledPlayback;onEnd:()=>void;follow:boolean}) {
 const group=useRef<Group>(null),time=useRef(0),visible=useRef(true);
 const {invalidate,gl,camera,controls:defaultControls}=useThree();
 const controls=defaultControls as OrbitControls|undefined,world=useRef(new Vector3());
 const following=follow&&!!route.cameraOffset;
 useEffect(()=>{if(!playback.running||!following||!controls)return;controls.enabled=false;return()=>{controls.enabled=true;};},[playback.running,following,controls]);
 useEffect(()=>{time.current=0;if(group.current)group.current.position.z=0;invalidate();},[playback.run,route,invalidate]);
 useEffect(()=>{
  if(!playback.running)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const hidden=()=>{if(document.hidden||reduced.matches)onEnd();};
  reduced.addEventListener('change',hidden);
  const observer=new IntersectionObserver(entries=>{visible.current=entries[0]?.isIntersecting??true;});observer.observe(gl.domElement);
  const timer=window.setInterval(()=>{if(!document.hidden&&visible.current)invalidate();},1000/24);
  document.addEventListener('visibilitychange',hidden);hidden();invalidate();
  return()=>{clearInterval(timer);observer.disconnect();document.removeEventListener('visibilitychange',hidden);reduced.removeEventListener('change',hidden);};
 },[playback.running,onEnd,invalidate,gl]);
 useFrame((_state,delta)=>{
  if(!playback.running||document.hidden||!visible.current)return;
  const pose=sampleSledPush(route,time.current+Math.min(delta,.1));time.current=pose.time;
  if(group.current){
   group.current.position.z=pose.localZ;
   if(following&&route.cameraOffset&&controls){
    group.current.updateWorldMatrix(true,false);group.current.getWorldPosition(world.current);
    camera.position.set(world.current.x+route.cameraOffset[0],1.65,world.current.z+route.cameraOffset[1]);
    controls.target.set(world.current.x-route.dx*.35,.85,world.current.z-route.dy*.35);controls.enabled=false;controls.update();
   }
  }
  if(pose.time>=route.duration)onEnd();
 });
 return <group ref={group} name="sled-demo-motion"><SledTraining motionTime={time}/></group>;
}
