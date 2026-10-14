const test=require('node:test'),assert=require('node:assert/strict');
const model=require('../static/educations/grade8_model.js');
const visuals=require('../static/educations/grade8_visuals.js');
const render=(stage,p=1,mode='potato')=>visuals.scene('osmosis',stage,p,new Set(model.required('osmosis',mode)),model.frame('osmosis',stage,p,mode),mode);
test('osmosis shows filling water and solution before comparing living tissue',()=>{
 assert.match(render(2,.5),/data-osmosis-pour="water"/);
 assert.match(render(3,.5),/data-osmosis-pour="salt"/);
 assert.match(render(4),/data-osmosis-cell="raw"/);
 assert.match(render(4),/No comparable rise/);
 assert.match(render(5),/roots absorb water/);
});
test('tubing variants retain their own membrane explanation',()=>{
 assert.doesNotMatch(render(4,1,'combined'),/data-osmosis-cell=/);
 assert.match(render(4,1,'retained'),/large solute stays inside/);
 assert.match(render(4,1,'salt'),/Salt ions can diffuse/);
});
test('boiled potato water particles stay outside the cavity and do not move inward',()=>{
 const particles=p=>[...render(4,p).matchAll(/<circle data-osmosis-water="boiled" cx="([^"]+)"/g)].map(m=>Number(m[1]));
 assert.equal(particles(0).length,7);
 assert.deepEqual(particles(0),particles(.8));
 assert(particles(.8).every(x=>x<520+174));
 assert.equal(model.frame('osmosis',4,0).boiled,model.frame('osmosis',4,1).boiled);
});
test('raw potato gains water as its trough level falls while boiled levels stay unchanged',()=>{
 const start=model.frame('osmosis',4,0),end=model.frame('osmosis',4,1);
 assert(end.raw>start.raw);
 assert(end.rawOutside<start.rawOutside);
 assert.equal(end.boiledOutside,start.boiledOutside);
 const trough=p=>Number(render(4,p).match(/data-osmosis-trough="raw"[^>]*height="([^"]+)"/)[1]);
 assert(trough(1)<trough(0));
 assert.equal(model.frame('osmosis',5,0).rawOutside,end.rawOutside);
});
