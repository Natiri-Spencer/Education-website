(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WhiteboardPersistence=factory();}(typeof self!=='undefined'?self:this,function(){
    'use strict';
    function load(storage,key,restore){
        const library=[];let activeId=null;
        try{const saved=JSON.parse(storage.getItem(key)||'null');if(saved&&Array.isArray(saved.boards)){activeId=saved.activeId;for(const raw of saved.boards.slice(0,100)){try{library.push(restore(raw));}catch(_){/* Skip one damaged board. */}}}}catch(_){/* Storage may be disabled. */}
        return{library,board:library.find(board=>board.id===activeId)||library[0]||null};
    }
    function save(storage,key,library,board,clone){
        board.updated=Date.now();const index=library.findIndex(value=>value.id===board.id),snapshot=clone(board);
        if(index<0)library.push(snapshot);else library[index]=snapshot;
        storage.setItem(key,JSON.stringify({version:1,activeId:board.id,boards:library}));return library;
    }
    return{load,save};
}));
