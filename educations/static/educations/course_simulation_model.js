(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CourseMath=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PI=22/7;
 function number(value,name,min=.1,max=1000){
  if(value===null||value===undefined||String(value).trim()==='')throw Error(`Enter ${name}.`);
  const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)throw Error(`${name} must be between ${min} and ${max}.`);return n;
 }
 function fmt(n,digits=2){return Number.isInteger(n)?String(n):n.toFixed(digits).replace(/\.?0+$/,'');}
 const relation=n=>Math.abs(Number(fmt(n))-n)>Math.max(1e-9,Math.abs(n)*1e-12)?'≈':'=';
 function area(shape,v){
  const read=k=>number(v[k],k),m={};let value,formula;
  if(shape==='rectangle'||shape==='parallelogram'){m.b=read('b');m.h=read('h');value=m.b*m.h;formula=`${fmt(m.b)} × ${fmt(m.h)}`;}
  else if(shape==='rhombus'){m.a=read('a');m.b=read('b');value=m.a*m.b/2;formula=`½ × ${fmt(m.a)} × ${fmt(m.b)}`;}
  else if(shape==='trapezium'){m.a=read('a');m.b=read('b');m.h=read('h');value=(m.a+m.b)*m.h/2;formula=`½ × (${fmt(m.a)} + ${fmt(m.b)}) × ${fmt(m.h)}`;}
  else if(shape==='circle'){m.r=read('r');value=PI*m.r*m.r;formula=`(22/7) × ${fmt(m.r)}²`;}
  else if(shape==='border'){m.l=read('l');m.w=read('w');m.t=read('t');value=(m.l+2*m.t)*(m.w+2*m.t)-m.l*m.w;formula=`${fmt(m.l+2*m.t)} × ${fmt(m.w+2*m.t)} − ${fmt(m.l)} × ${fmt(m.w)}`;}
  else if(shape==='composite'){m.l=read('l');m.h=read('h');m.cutL=read('cutL');m.cutH=read('cutH');if(m.cutL>=m.l||m.cutH>=m.h)throw Error('The removed corner must be smaller than the outer rectangle in both dimensions.');value=m.l*m.h-m.cutL*m.cutH;formula=`${fmt(m.l)} × ${fmt(m.h)} − ${fmt(m.cutL)} × ${fmt(m.cutH)}`;}
  else throw Error('Choose a supported shape.');
  return {shape,m,value,formula:`${formula} ${relation(value)} ${fmt(value)} cm²`};
 }
 function volume(shape,v){
  const read=k=>number(v[k],k),m={};let full,formula;
  if(shape==='cube'){m.s=read('s');m.l=m.w=m.h=m.s;full=m.s**3;formula=`${fmt(m.s)}³`;}
  else if(shape==='cuboid'){m.l=read('l');m.w=read('w');m.h=read('h');full=m.l*m.w*m.h;formula=`${fmt(m.l)} × ${fmt(m.w)} × ${fmt(m.h)}`;}
  else if(shape==='cylinder'){m.r=read('r');m.h=read('h');full=PI*m.r*m.r*m.h;formula=`(22/7) × ${fmt(m.r)}² × ${fmt(m.h)}`;}
  else throw Error('Choose a cube, cuboid or cylinder.');
  const fill=number(v.fill,'fill percentage',0,100),water=full*fill/100;
  return {shape,m,full,water,litres:full/1000,waterLitres:water/1000,depth:m.h*fill/100,fill,formula:`${formula} ${relation(full)} ${fmt(full)} cm³`};
 }
 function inequality(v){
  const a=number(v.a,'boundary',-10,10),x=number(v.x,'test value',-100,100),b=v.compound?number(v.b,'upper boundary',-10,10):null;
  if(v.compound&&a>=b)throw Error('The lower boundary must be smaller than the upper boundary.');
  let contains,statement;
  if(v.compound){contains=(v.includeA?x>=a:x>a)&&(v.includeB?x<=b:x<b);statement=`${a} ${v.includeA?'≤':'<'} x ${v.includeB?'≤':'<'} ${b}`;}
  else {const operations={'<':n=>n<a,'<=':n=>n<=a,'>':n=>n>a,'>=':n=>n>=a};if(!operations[v.op])throw Error('Choose an inequality symbol.');contains=operations[v.op](x);statement=`x ${{'<':'<','<=':'≤','>':'>','>=':'≥'}[v.op]} ${a}`;}
  const integers=[];for(let n=-10;n<=10;n++){const ok=v.compound?(v.includeA?n>=a:n>a)&&(v.includeB?n<=b:n<b):({'<':n<a,'<=':n<=a,'>':n>a,'>=':n>=a}[v.op]);if(ok)integers.push(n);}
  return {a,b,x,contains,statement,integers,compound:v.compound,includeA:v.includeA,includeB:v.includeB,op:v.op};
 }
 function gcd(a,b){a=Math.abs(a);while(b){[a,b]=[b,a%b];}return a||1;}
 function rational(n,d=1){if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d===0)throw Error('These numbers are too large. Reset and use smaller steps.');if(d<0){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
 const add=(a,b)=>rational(a.n*b.d+b.n*a.d,a.d*b.d),mul=(a,b)=>rational(a.n*b.n,a.d*b.d);
 const qtext=a=>a.d===1?String(a.n):`${a.n}/${a.d}`;
 function equation(a,b,c){return {a:rational(...(Array.isArray(a)?a:[a])),b:rational(b),c:rational(c)};}
 function applyEquation(state,op,value){
  const n=number(value,'operation amount',-100,100);if(!Number.isInteger(n))throw Error('Use a whole number for the operation amount.');
  if(!['add','subtract','multiply','divide'].includes(op))throw Error('Choose an operation.');
  if((op==='divide'||op==='multiply')&&n===0)throw Error('Use a nonzero amount: multiplying by zero loses the unknown, and division by zero is undefined.');
  if(op==='add'||op==='subtract'){const q=rational(op==='add'?n:-n);return {...state,b:add(state.b,q),c:add(state.c,q)};}
  const factor=op==='divide'?rational(1,n):rational(n);return {a:mul(state.a,factor),b:mul(state.b,factor),c:mul(state.c,factor)};
 }
 function equationText(s){const coefficient=qtext(s.a),term=coefficient==='1'?'x':coefficient==='-1'?'-x':s.a.d===1?`${coefficient}x`:`(${coefficient})x`,constant=s.b.n===0?'':`${s.b.n<0?' − ':' + '}${qtext(rational(Math.abs(s.b.n),s.b.d))}`;return `${term}${constant} = ${qtext(s.c)}`;}
 function solution(s){return mul(add(s.c,rational(-s.b.n,s.b.d)),rational(s.a.d,s.a.n));}
 const solved=s=>s.a.n===s.a.d&&s.b.n===0;
 function checkAnswer(answer,expected){const n=number(answer,'your prediction',-1e12,1e12);return Math.abs(n-expected)<=Math.max(.0051,Math.abs(expected)*.000001);}
 return {PI,number,fmt,area,volume,inequality,equation,applyEquation,equationText,solution,solved,qtext,checkAnswer};
});
