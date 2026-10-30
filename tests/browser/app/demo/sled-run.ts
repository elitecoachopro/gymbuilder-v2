import {SLED_SPEED} from '../../../../src/lib/gym-athlete-motion.ts';
export function sledRunAt(seconds:number){
 const time=Math.max(0,Math.min(12,seconds-72));
 return {time,y:3.4+time*SLED_SPEED};
}
