const test=require('node:test');
const assert=require('node:assert/strict');
const visuals=require('../static/educations/grade8_visuals.js');
const model=require('../static/educations/grade8_model.js');
const placed=new Set(model.required('oxygen'));
const scene=(stage,p=1)=>visuals.scene('oxygen',stage,p,placed,model.frame('oxygen',stage,p));
test('oxygen bench and chemical bottles are visible before the experiment starts',()=>{
 assert.match(scene(0),/g8-bench-top/);
 for(const id of ['water','peroxide','catalyst','stands'])assert.match(visuals.icon(id),/<svg/);
 assert.match(scene(0),/Water and hydrogen peroxide: colourless liquid/);
});
test('water-filled jar inverts, gas displaces its water and the splint relights',()=>{
 assert.match(scene(2),/rotate\(180 61 133.5\)/);
 assert.match(scene(3),/fill="#171b22"/);
 assert.match(scene(4,.5),/Bubbles|stroke="#f0fcff"/);
 assert.match(scene(5,0),/height="259"/);
 assert.doesNotMatch(scene(5,1),/width="114" height="259"/);
 assert.doesNotMatch(scene(6,.1),/Glowing splint relights/);
 assert.match(scene(6,1),/Glowing splint relights/);
});
