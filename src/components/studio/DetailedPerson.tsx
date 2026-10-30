'use client';
import {Component,Suspense,useMemo,type ReactNode} from 'react';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import {PEOPLE_MODELS} from '@/lib/gym-people-assets';

type Pose=keyof typeof PEOPLE_MODELS;
export class PersonAssetBoundary extends Component<{fallback:ReactNode;children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?this.props.fallback:this.props.children;}
}
function LoadedPerson({pose}:{pose:Pose}){
 const {scene}=useGLTF(PEOPLE_MODELS[pose].url,false,false);
 const instance=useMemo(()=>{
  const copy=scene.clone(true);
  copy.traverse(object=>{if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;}});
  return copy;
 },[scene]);
 return <primitive object={instance} dispose={null}/>;
}
export default function DetailedPerson({pose,fallback}:{pose:Pose;fallback:ReactNode}){
 return <PersonAssetBoundary key={PEOPLE_MODELS[pose].url} fallback={fallback}><Suspense fallback={fallback}><LoadedPerson pose={pose}/></Suspense></PersonAssetBoundary>;
}
