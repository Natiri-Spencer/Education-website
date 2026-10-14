const test=require('node:test'),assert=require('node:assert/strict');
const model=require('../static/educations/grade8_model.js');
const visuals=require('../static/educations/grade8_visuals.js');
const scene=(p,mode='retained')=>visuals.scene('osmosis',4,p,new Set(model.required('osmosis',mode)),model.frame('osmosis',4,p,mode),mode);
const number=(svg,name)=>Number(svg.match(new RegExp(name+'="([^"]+)"'))[1]);
test('Visking sugar bag grows while external water falls and the solute count stays constant',()=>{
 const before=scene(0),after=scene(1);
 assert(number(after,'data-visking-bag-width')>number(before,'data-visking-bag-width'));
 assert(number(after,'data-visking-water-level')>number(before,'data-visking-water-level'));
 assert.equal((after.match(/fill="#e6b637"/g)||[]).length,(before.match(/fill="#e6b637"/g)||[]).length);
 assert.match(after,/ENLARGED MEMBRANE VIEW/);
});
test('salt comparison does not show lasting bag swelling',()=>{
 assert.equal(number(scene(0,'salt'),'data-visking-bag-width'),number(scene(1,'salt'),'data-visking-bag-width'));
 assert.match(scene(1,'salt'),/Small salt ions diffuse out/);
});
