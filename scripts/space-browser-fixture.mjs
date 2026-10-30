import fs from 'node:fs';
import { fixtureUser, cleanupUsers, password } from '../tests/integration/helpers.mjs';
const path='/tmp/gymbuilder-space-browser-fixture.json';
if(process.argv[2]==='cleanup'){
 const value=JSON.parse(fs.readFileSync(path));await cleanupUsers([value.user]);fs.unlinkSync(path);console.log('Synthetic browser account and its projects removed from isolated database.');
}else{
 const user=await fixtureUser();fs.writeFileSync(path,JSON.stringify({user,password}),{mode:0o600});console.log(JSON.stringify({email:user.email,isolatedOrigin:'http://localhost:3100'}));
}
