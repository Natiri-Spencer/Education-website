(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WhiteboardGestures=factory();}(typeof self!=='undefined'?self:this,function(){
    'use strict';
    function touchIntent(count){return count>=4?'clear':count>=2?'pan-zoom':'draw';}
    function midpoint(touches,rect={left:0,top:0}){const values=[...touches.values()];if(values.length<2)throw new Error('Two touches are required.');const[a,b]=values;return{x:(a.x+b.x)/2-rect.left,y:(a.y+b.y)/2-rect.top,distance:Math.hypot(b.x-a.x,b.y-a.y)};}
    return{touchIntent,midpoint};
}));
