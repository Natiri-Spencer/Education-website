# Answering document questions on the whiteboard

Choose **More → Open questions**, select a file and a page, then press
**Write on this page**. For an existing file card, double-click it or use
**More → Images & files → Open pages**. Write answers with a pen, text or
equations.

Question sheets stay locked behind your answers. The eraser removes ink
without changing the source sheet. Undo restores erased answers. Use
**All pages** to browse or add another page; adding an existing page
returns to it without replacing its answers. Scroll, pan or zoom for space.

The toolbar above the canvas has **Previous**, **Next** and a page-number box.
Type a page number and press **Enter**, or finish editing the number to jump.
Unopened pages are added automatically; returning to a page keeps its answers.
**Alt+Page Up / Alt+Page Down** turns pages while working on the board.
**All pages** opens page thumbnails at the current page. The viewer also offers
First/Last buttons, a quick-browse slider and keyboard navigation. Adjacent pages are prepared in
the background so the next page opens faster. The active page is saved.

Original attachments and page references remain in saved boards and portable
editable-board backups. Rendering happens locally with self-hosted PDF.js;
no third-party document conversion service is used.

- PDF: original page layout, including scanned questions and diagrams.
- DOCX, XLSX, PPTX: readable text pages. Export an Office file to PDF to retain
  original formatting, images, diagrams and equation layout.
- TXT and CSV: paginated text.
- Legacy DOC, XLS and PPT: kept as downloadable attachments; export to PDF
  before adding their pages to the board.

Files are limited to 10 MB. PDFs may contain up to 500 pages; pages are added
individually. Locked/password-protected PDFs need an unlocked copy. Keep an
editable-board backup to move the document and answers to another device.

Checks: `node --test educations/js_tests/whiteboard_documents.test.cjs
educations/js_tests/whiteboard_uploads.test.cjs` and the existing whiteboard
regression suites. Browser QA covers PDF rendering, Word text rendering,
page navigation, pen/eraser interaction, undo, saving and reload.

## Workspace and saving

- The main toolbar offers Move, Pen, Eraser, Text, Undo, Redo and More. Desktop
  users also have Select. Advanced tools and file commands are under More.
- Present expands the teaching surface. Fit switches between page width and
  whole-page views. Two fingers pan or zoom. Move also supports double-click
  reading zoom.
- Clear annotations opens an in-page confirmation. Undo restores cleared work.
- Each board saves separately after device storage acknowledges the write.
  Continue work includes up to three earlier recovery copies. Existing library
  data is retained during migration. Editable exports include source documents.
- Once More shows Available offline, the editor and downloaded question files
  can reopen offline. Handwriting awaiting server recognition stays as ink.
  Online saving resumes through the existing account verification and revision
  checks. Signing out selects guest storage for subsequent offline access.
- Simultaneous editors open separate copies of the same board. Each tab
  remembers its own active board. Device-specific views keep phone and laptop
  zoom preferences separate.

## Verification

Run `node --test educations/js_tests/whiteboard*.test.cjs
educations/js_tests/learning_sync.test.cjs` and
`Scripts/python.exe manage.py test educations.test_whiteboard learning.tests`.
Deployment uses the existing collectstatic and migrate steps. The added data
migration repairs original-document references in drafts and submissions.

Browser viewport checks cover 360×640, 390×844, 640×360, 844×390, 768×1024,
1366×768 and 1920×1080. Main controls meet the 44-pixel target and reserve
74–80% writing space on the tested phone layouts. Tests include a 129-page PDF,
1,000 strokes, partial erasing, undo/redo, retained answers, thumbnail browsing,
presentation and offline reopening. Physical phones, styluses, basic-phone
performance targets and teacher/learner classroom trials still need validation.
