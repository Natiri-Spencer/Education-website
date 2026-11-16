const {test}=require('node:test');
const assert=require('node:assert/strict');
const Docs=require('../static/educations/whiteboard_documents.js');
const M=require('../static/educations/whiteboard_model.js');
const U=require('../static/educations/whiteboard_uploads.js');
const paper=()=>M.create('document-page',100,200,{attachmentId:'worksheet-original',fileName:'Questions.pdf',fileSize:100,pageNumber:2,pageCount:5,w:900,h:1160});

test('direct jumps cover a long document and stop at the first and last pages',()=>{
    for(const [input,expected] of [[19,19],['129',129],[130,129],[0,1],[-10,1],[19.9,19],['bad',1],[Infinity,1]])assert.equal(Docs.pageNumber(input,129),expected);
    assert.deepEqual(Docs.adjacentPages(1,129),[2]);
    assert.deepEqual(Docs.adjacentPages(19,129),[20,18]);
    assert.deepEqual(Docs.adjacentPages(129,129),[128]);
    assert.deepEqual(Docs.adjacentPages(1,1),[]);
});

test('navigation follows the visible page instead of the last page added',()=>{
    const earlier={...paper(),id:'page-19',pageNumber:19,pageCount:129,y:1800};
    const later={...paper(),id:'page-129',pageNumber:129,pageCount:129,y:9000};
    const items=[M.create('text',0,0,{text:'Answer: 20'}),earlier,later];
    assert.equal(Docs.activePage(items,later.id,{x:400,y:1900}).id,earlier.id);
    assert.equal(Docs.activePage(items,earlier.id,{x:400,y:9300}).id,later.id);
    assert.equal(Docs.activePage(items,earlier.id).id,earlier.id);
    assert.equal(Docs.activePage([],null,{x:0,y:0}),null);
});

test('saving and reloading remembers the active page and retains answers on other pages',()=>{
    const first={...paper(),id:'page-19',pageNumber:19,pageCount:129};
    const last={...paper(),id:'page-129',pageNumber:129,pageCount:129,y:9000};
    const answer=M.create('text',200,400,{text:'20'}),board={...M.newBoard(),activeDocumentPageId:first.id,items:[first,answer,last]};
    const restored=M.restore(JSON.parse(JSON.stringify(board)));
    assert.equal(restored.activeDocumentPageId,first.id);assert.equal(restored.items[1].text,'20');assert.equal(restored.items[2].pageNumber,129);
    assert.equal(M.restore({...board,activeDocumentPageId:'missing'}).activeDocumentPageId,undefined);
    assert.equal(M.restore({...board,activeDocumentPageId:answer.id}).activeDocumentPageId,undefined);
});

test('document pages save a reference to the original and keep the question sheet locked',()=>{
    const item=paper(),board=M.newBoard();board.items=[{...item,src:'https://bad.example/page',fileData:'untrusted'}];
    const restored=M.restore(JSON.parse(JSON.stringify(board))).items[0];
    assert.equal(restored.pageNumber,2);assert.equal(restored.pageCount,5);assert.equal(restored.attachmentId,item.attachmentId);
    assert.equal(restored.locked,true);assert.equal(restored.src,undefined);assert.equal(restored.fileData,undefined);
    assert.deepEqual(M.move(restored,20,50),restored);assert.deepEqual(M.resize(restored,500,500),restored);
});
test('eraser removes answers while leaving the original document page unchanged and undoable',()=>{
    const question=paper(),answer=M.create('path',150,300,{points:[[150,300],[220,300]],pen:'pen'}),before=[question,answer];
    const after=M.eraseInk(before,{x:130,y:300},{x:240,y:300},15);
    assert.deepEqual(after,[question]);const history=M.history();history.commit(before,after);assert.deepEqual(history.undo(after),before);
});
test('page metadata rejects nonexistent, fractional and excessive page numbers and oversized dimensions',()=>{
    for(const change of [{pageNumber:0},{pageNumber:6},{pageNumber:1.5},{pageCount:501},{w:6000},{h:Infinity}]){
        assert.throws(()=>M.restore({...M.newBoard(),items:[{...paper(),...change}]}),/Invalid document page/);
    }
});
test('portable backup requires original attachments even when the download card was removed',async()=>{
    const board=M.newBoard();board.items=[paper()];
    await assert.rejects(()=>U.unpack(board,undefined,()=> 'new-id'),/missing its document attachments/);
    await assert.rejects(()=>U.pack(board),/Document storage is unavailable/);
});
test('text pages preserve question order, blank answer lines and every character across page breaks',()=>{
    const input=Array.from({length:110},(_,i)=>`Question ${i+1}: 12 + 8 = ?`).join('\n');
    const pages=Docs.textPages(input);assert.equal(pages.length,3);assert.equal(pages.flat().join('\n'),input);
    const blanks=Docs.textPages('One\n\n\nTwo').flat();assert.deepEqual(blanks,['One','','','Two']);
    assert(Docs.textPages('A'.repeat(200)).flat().every(line=>line.length<=74));
    assert.throws(()=>Docs.textPages('A'.repeat(200001)),/too long/);
});
test('adding the next page uses fresh space beneath pages and handwritten answers',()=>{
    const first=paper(),answer=M.create('path',150,1000,{points:[[150,1000],[200,1900]],h:0});
    const next=Docs.placement([first,answer],900,1160,{x:500,y:400});
    assert.equal(next.x,first.x);assert.equal(next.y,2000);
    for(const name of ['Questions.PDF','Worksheet.docx','Results.xlsx','Slides.pptx','questions.txt','data.csv'])assert(Docs.canOpen(name));
    for(const name of ['old.doc','old.xls','old.ppt','script.html'])assert.equal(Docs.canOpen(name),false);
});
