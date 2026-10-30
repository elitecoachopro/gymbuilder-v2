'use client';
import {Suspense,useEffect,useLayoutEffect,useMemo,type ReactNode} from 'react';
import {useGLTF} from '@react-three/drei';
import {useThree} from '@react-three/fiber';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import {createSledRigPose} from '@/lib/gym-athlete-motion';
import {PersonAssetBoundary} from './DetailedPerson';

function LoadedAthlete({time}:{time:number}){
 const {scene}=useGLTF('/models/people/athlete.glb?v=9',false,false),{invalidate}=useThree();
 const actor=useMemo(()=>{
  const instance=clone(scene),skeletons=new Set<THREE.Skeleton>();
  instance.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;}if(object instanceof THREE.SkinnedMesh){skeletons.add(object.skeleton);object.frustumCulled=false;}});
  return{instance,pose:createSledRigPose(instance),skeletons};
 },[scene]);
 useLayoutEffect(()=>{actor.pose(time);invalidate();},[actor,time,invalidate]);
 useEffect(()=>()=>actor.skeletons.forEach(skeleton=>skeleton.dispose()),[actor]);
 return <primitive object={actor.instance} dispose={null}/>;
}
export default function DetailedAthlete({time,fallback}:{time:number;fallback:ReactNode}){
 return <PersonAssetBoundary fallback={fallback}><Suspense fallback={fallback}><LoadedAthlete time={time}/></Suspense></PersonAssetBoundary>;
}
