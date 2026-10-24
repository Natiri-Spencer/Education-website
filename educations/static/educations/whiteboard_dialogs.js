(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WhiteboardDialogs=factory();}(typeof self!=='undefined'?self:this,function(){
    'use strict';
    function open(dialog,focus){if(!dialog.open)dialog.showModal();if(focus&&typeof focus.focus==='function')focus.focus();}
    function close(dialog){if(dialog.open)dialog.close();}
    function clear(dialog){for(const element of dialog.querySelectorAll('[data-dialog-reset]')){if('value'in element)element.value='';element.hidden=true;}}
    return{open,close,clear};
}));
