'use client';
import {Suspense,useEffect,useLayoutEffect,useMemo,useRef,type ReactNode} from 'react';
import {useGLTF} from '@react-three/drei';
import {useFrame,useThree} from '@react-three/fiber';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import {createSledRigPose} from '@/lib/gym-athlete-motion';
import {PersonAssetBoundary} from './DetailedPerson';

function LoadedAthlete({time,motionTime}:{time:number;motionTime?:{current:number}}){
 const {scene}=useGLTF('/models/people/athlete.glb?v=9',false,false),{invalidate}=useThree();
 const actor=useMemo(()=>{
  const instance=clone(scene),skeletons=new Set<THREE.Skeleton>();
  instance.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;}if(object instanceof THREE.SkinnedMesh){skeletons.add(object.skeleton);object.frustumCulled=false;}});
  return{instance,pose:createSledRigPose(instance),skeletons};
 },[scene]);
 useLayoutEffect(()=>{actor.pose(time);invalidate();},[actor,time,invalidate]);
 const lastPose=useRef(-1);
 useFrame(()=>{if(motionTime&&lastPose.current!==motionTime.current){actor.pose(motionTime.current);lastPose.current=motionTime.current;}});
 useEffect(()=>()=>actor.skeletons.forEach(skeleton=>skeleton.dispose()),[actor]);
 return <primitive object={actor.instance} dispose={null}/>;
}
export default function DetailedAthlete({time,fallback,motionTime}:{time:number;fallback:ReactNode;motionTime?:{current:number}}){
 return <PersonAssetBoundary fallback={fallback}><Suspense fallback={fallback}><LoadedAthlete time={time} motionTime={motionTime}/></Suspense></PersonAssetBoundary>;
}
