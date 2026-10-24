(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WhiteboardSelection=factory();}(typeof self!=='undefined'?self:this,function(){
    'use strict';
    const selectionActions=new Set(['explain','hint','check']);
    function finite(value,fallback=0){return Number.isFinite(value)?value:fallback;}
    function rectangle(item,bounds){const b=bounds(item);return{x:finite(b.x),y:finite(b.y),w:Math.max(0,finite(b.w)),h:Math.max(0,finite(b.h))};}
    function distance(a,b){const dx=Math.max(a.x-b.x-b.w,b.x-a.x-a.w,0),dy=Math.max(a.y-b.y-b.h,b.y-a.y-a.h,0);return Math.hypot(dx,dy);}
    function serialise(item,bounds){
        const b=rectangle(item,bounds),result={id:String(item.id||'').slice(0,100),type:item.type,...b};
        if(['text','sticky','table'].includes(item.type)){result.text=String(item.text||'').slice(0,5000);if(['math','paragraph'].includes(item.format))result.format=item.format;}
        else if(item.type==='graph'){result.expression=String(item.expression||'').slice(0,200);for(const key of ['xMin','xMax','yMin','yMax'])if(Number.isFinite(item[key]))result[key]=item[key];}
        else if(item.type==='path')result.pointCount=Array.isArray(item.points)?item.points.length:0;
        return result;
    }
    function buildContext(board,selectedId,action,bounds){
        if(!board||!Array.isArray(board.items)||typeof bounds!=='function')throw new Error('The board is unavailable.');
        const selected=board.items.find(item=>item.id===selectedId);
        if(selectionActions.has(action)&&!selected)throw new Error('Select one element for this AI action.');
        let items,scope,sourceIds;
        if(selectionActions.has(action)){
            const target=rectangle(selected,bounds);
            const neighbours=board.items.filter(item=>item.id!==selected.id&&distance(target,rectangle(item,bounds))<=240).slice(0,11);
            items=[selected,...neighbours];scope='selection';sourceIds=[String(selected.id)];
        }else{
            items=board.items.filter(item=>['text','sticky','table','graph','path','rectangle','ellipse','line','arrow','image'].includes(item.type)).slice(0,60);
            if(!items.length)throw new Error('Add some work to the board first.');
            scope='board';sourceIds=items.map(item=>String(item.id));
        }
        return{scope,title:String(board.title||'').slice(0,80),notes:String(board.notes||'').slice(0,3000),sourceIds,items:items.map(item=>serialise(item,bounds))};
    }
    function needsImage(context){const source=new Set(context.sourceIds.map(String));return context.items.some(item=>source.has(String(item.id))&&['path','image','rectangle','ellipse','line','arrow'].includes(item.type));}
    return{buildContext,needsImage,serialise};
}));
