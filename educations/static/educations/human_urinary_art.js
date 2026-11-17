(() => {
    'use strict';
    const model = window.HumanUrinaryModel;
    const rightRoute = 'M234 157 C250 179 243 219 263 254 C283 288 300 309 330 341';
    const leftRoute = 'M486 138 C470 166 482 198 461 232 C439 271 421 309 390 341';
    const outlet = 'M360 375 C360 395 362 415 360 455';
    const bladder = 'M311 343 C311 322 332 316 360 319 C388 316 409 322 409 343 C409 364 393 378 376 383 Q366 385 366 393 H354 Q354 385 344 383 C327 378 311 364 311 343 Z';
    const kidney = 'M187 65 C227 60 253 85 251 110 C249 128 232 134 234 148 C235 165 251 175 235 188 C220 201 189 200 169 185 C140 165 132 129 142 101 Q155 72 187 65 Z';
    const drawOrder = ['veins','arteries','right-ureter','left-ureter','urethra','right-kidney','left-kidney','bladder'];

    function draw(ctx, path, fill, stroke, width = 1) {
        const shape = new Path2D(path);
        if (fill) {
            ctx.fillStyle = fill;
            ctx.fill(shape);
        }
        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke(shape);
        }
    }

    function shade(ctx, x, y, radius, bright, dark) {
        const gradient = ctx.createRadialGradient(x, y, 1, x, y, radius);
        gradient.addColorStop(0, bright);
        gradient.addColorStop(1, dark);
        return gradient;
    }

    function tube(ctx, path, edge, centre, outer, inner) {
        draw(ctx, path, null, edge, outer);
        draw(ctx, path, null, centre, inner);
    }

    function renderPart(ctx, id, x, y, scale = 1, fillLevel = 0) {
        const anchor = model.point[id];
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.translate(-anchor.x, -anchor.y);
        if (id.endsWith('kidney')) {
            if (id === 'left-kidney') {
                ctx.translate(720, -19);
                ctx.scale(-1, 1);
            }
            draw(ctx, kidney, shade(ctx, 172, 98, 105, '#e08478', '#913348'), '#642d43', 3.5);
            draw(ctx, 'M167 104 C152 127 159 157 180 174', null, '#f4a59a', 4.5);
            draw(ctx, 'M238 117 Q220 128 224 150 Q225 161 236 171', null, '#f5c3a1', 5);
        } else if (id === 'right-ureter' || id === 'left-ureter') {
            tube(ctx, id === 'right-ureter' ? rightRoute : leftRoute, '#95594e', '#f2be8e', 13, 8);
        } else if (id === 'urethra') {
            tube(ctx, outlet, '#9c4b58', '#e99c93', 15, 8);
        } else if (id === 'bladder') {
            draw(ctx, bladder, shade(ctx, 342, 332, 64, '#ffd0b2', '#b45461'), '#843f51', 3);
            ctx.save();
            ctx.clip(new Path2D(bladder));
            if (fillLevel > 0) {
                ctx.fillStyle = '#f6bc45';
                const surface = 385 - 46 * fillLevel;
                ctx.fillRect(315, surface, 90, 393 - surface);
            }
            draw(ctx, 'M325 345 C325 331 336 328 353 327', null, '#ffdfcf', 4);
            draw(ctx, 'M331 343 Q342 367 359 370 Q384 369 389 345', null, '#98465a', 2);
            ctx.restore();
        } else if (id === 'arteries') {
            tube(ctx, 'M337 57 V272 M337 122 C305 126 267 133 237 137 M337 111 C389 109 444 112 483 118', '#8e2f48', '#e66870', 17, 10);
        } else if (id === 'veins') {
            tube(ctx, 'M385 55 V276 M385 145 C324 145 275 148 236 148 M385 133 C419 128 451 127 483 129', '#345481', '#77a6d5', 18, 11);
        }
        ctx.restore();
    }

    const scales = {bladder: .73, urethra: .68, arteries: .23, veins: .23};
    function preview(canvas, id) {
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        const size = scales[id] ?? (id.endsWith('kidney') ? .41 : .28);
        renderPart(ctx, id, 60, 32, size);
    }

    function route(path) {
        const curve = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        curve.setAttribute('d', path);
        return {curve, length: curve.getTotalLength()};
    }

    const curves = [route(rightRoute), route(leftRoute), route(outlet)];
    function pulse(ctx, {curve, length}, progress) {
        const {x, y} = curve.getPointAtLength(length * progress);
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffe17a';
        ctx.fill();
        ctx.strokeStyle = '#694719';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function board(canvas, placements, progress = null, moving = null) {
        const ctx = canvas.getContext('2d');
        ctx.setTransform(2, 0, 0, 2, 0, 0);
        ctx.clearRect(0, 0, 720, 480);
        draw(ctx, 'M250 20 C191 31 155 42 116 47 C95 83 104 132 113 169 C122 222 134 262 118 310 C106 353 136 404 201 428 L256 461 M470 20 C529 31 565 42 604 47 C625 83 616 132 607 169 C598 222 586 262 602 310 C614 353 584 404 519 428 L464 461',
            null, '#46666f', 2.5);
        ctx.font = '600 22px system-ui';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#bed8dc';
        ctx.fillText("Person’s right", 195, 32);
        ctx.fillText("Person’s left", 525, 32);

        // Arrival, storage, and emptying are separate stages shown on a compressed timescale.
        const liquid = progress === null || progress < .53 ? 0 : progress < .74 ? .8 : Math.max(0, 1 - progress) * 3.07;
        for (const id of drawOrder) {
            const point = model.point[placements[id]];
            if (point && id !== moving?.id) renderPart(ctx, id, point.x, point.y, 1, liquid);
        }
        if (moving) {
            ctx.globalAlpha = .68;
            renderPart(ctx, moving.id, moving.x, moving.y);
            ctx.globalAlpha = 1;
        }
        if (progress === null) return;
        if (progress < .53) {
            pulse(ctx, curves[0], progress / .53);
            if (progress > .08) pulse(ctx, curves[1], (progress - .08) / .45);
        } else if (progress >= .74) {
            pulse(ctx, curves[2], (progress - .74) / .26);
        }
    }

    window.AnatomyLab = {
        model,
        art: {preview, board},
        orderedParts: ['bladder','left-ureter','right-kidney','urethra','right-ureter','left-kidney','veins','arteries'],
        duration: 4400,
        copy: {
            coreTitle: 'Build the urinary tract',
            extensionTitle: 'Connect the kidney blood vessels',
            corePassed: 'The urine pathway fits. Revise the blood vessels using the notes below.',
            trace: 'The kidneys filter blood and make urine. Urine moves down each ureter to the bladder, where it is stored. When the bladder empties, urine leaves through the urethra.',
            traceReady: 'The urine pathway in your saved build is ready to trace.',
            coreResult: 'urine pathway',
            invalidTarget: 'Choose one of the numbered points on the workbench.',
            extensionStarted: 'Add the renal arteries and veins. Your urinary tract is still on the bench.',
        },
    };
})();
