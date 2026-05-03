document.addEventListener('DOMContentLoaded', () => {
    const stickerBg = document.getElementById('sticker-background');
    const mascot = document.getElementById('mascot-container');
    const totalStickers = 40;
    const stickers = [];

    // --- 1. Generate Non-Overlapping Stickers ---
    const stickerSize = 120;
    const padding = 30;
    const cols = Math.floor(window.innerWidth / (stickerSize + padding));
    const rows = Math.floor(window.innerHeight / (stickerSize + padding));
    const gridPositions = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            gridPositions.push({
                x: c * (stickerSize + padding) + padding,
                y: r * (stickerSize + padding) + padding
            });
        }
    }

    // Shuffle
    for (let i = gridPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gridPositions[i], gridPositions[j]] = [gridPositions[j], gridPositions[i]];
    }

    for (let i = 1; i <= totalStickers; i++) {
        if (i > gridPositions.length) break;
        const sticker = document.createElement('img');
        const num = i.toString().padStart(3, '0');
        sticker.src = `background/sticker${num}.png`;
        sticker.className = 'bg-sticker';
        
        const pos = gridPositions[i - 1];
        const x = pos.x + (Math.random() - 0.5) * 20;
        const y = pos.y + (Math.random() - 0.5) * 20;
        const rotation = Math.random() * 360;
        const rotationSpeed = (Math.random() - 0.5) * 1.5; // Random slow rotation
        const scale = 0.8 + Math.random() * 0.4;

        sticker.style.left = `${x}px`;
        sticker.style.top = `${y}px`;
        sticker.style.transform = `rotate(${rotation}deg) scale(${scale})`;
        
        stickerBg.appendChild(sticker);
        stickers.push({ el: sticker, x, y, vx: 0, vy: 0, rotation, rotationSpeed, scale, isDragging: false });
    }

    // --- 2. Unified Dragging Logic ---
    let draggedItem = null;
    let dragStartX = 0, dragStartY = 0;
    let itemStartX = 0, itemStartY = 0;

    const startDrag = (e, item, isMascot = false) => {
        draggedItem = { item, isMascot };
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        dragStartX = clientX;
        dragStartY = clientY;
        
        if (isMascot) {
            const rect = mascot.getBoundingClientRect();
            itemStartX = rect.left;
            itemStartY = rect.top;
            mascot.style.cursor = 'grabbing';
            mascot.style.transition = 'none';
            mascot.classList.add('is-dragging');
        } else {
            itemStartX = item.x;
            itemStartY = item.y;
            item.isDragging = true;
            item.el.style.zIndex = '100';
        }
    };

    const handleMove = (e) => {
        if (!draggedItem) {
            // Repel effect when not dragging
            const mx = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const my = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            
            stickers.forEach(item => {
                if (!item.isDragging) {
                    const dx = item.x + 60 - mx;
                    const dy = item.y + 60 - my;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 180) {
                        const force = (180 - dist) / 180;
                        item.vx += (dx / dist) * force * 10;
                        item.vy += (dy / dist) * force * 10;
                    }
                }
            });

            // Card Glow
            document.querySelectorAll('.portal-card').forEach(card => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mouse-x', `${mx - rect.left}px`);
                card.style.setProperty('--mouse-y', `${my - rect.top}px`);
            });
            return;
        }

        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        const dx = clientX - dragStartX;
        const dy = clientY - dragStartY;

        if (draggedItem.isMascot) {
            mascot.style.left = `${itemStartX + dx}px`;
            mascot.style.top = `${itemStartY + dy}px`;
            mascot.style.bottom = 'auto'; // Break the initial bottom constraint
        } else {
            const item = draggedItem.item;
            item.x = itemStartX + dx;
            item.y = itemStartY + dy;
            item.el.style.left = `${item.x}px`;
            item.el.style.top = `${item.y}px`;
        }
    };

    const stopDrag = () => {
        if (draggedItem) {
            if (draggedItem.isMascot) {
                mascot.style.cursor = 'grab';
                mascot.classList.remove('is-dragging');
            } else {
                draggedItem.item.isDragging = false;
                draggedItem.item.el.style.zIndex = '1';
            }
            draggedItem = null;
        }
    };

    // Listeners
    mascot.addEventListener('mousedown', (e) => startDrag(e, mascot, true));
    mascot.addEventListener('touchstart', (e) => startDrag(e, mascot, true), {passive: false});
    
    stickers.forEach(item => {
        item.el.addEventListener('mousedown', (e) => startDrag(e, item));
        item.el.addEventListener('touchstart', (e) => startDrag(e, item), {passive: false});
    });

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, {passive: false});
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);

    // --- 3. Animation Loop ---
    function animate() {
        stickers.forEach(item => {
            if (!item.isDragging) {
                item.vx *= 0.9;
                item.vy *= 0.9;
                item.x += item.vx;
                item.y += item.vy;
                item.rotation += item.rotationSpeed; // Continuous rotation

                // Bounce
                if (item.x < 0 || item.x > window.innerWidth - 120) item.vx *= -1;
                if (item.y < 0 || item.y > window.innerHeight - 120) item.vy *= -1;

                item.el.style.left = `${item.x}px`;
                item.el.style.top = `${item.y}px`;
                item.el.style.transform = `rotate(${item.rotation}deg) scale(${item.scale})`;
            }
        });
        requestAnimationFrame(animate);
    }
    animate();
});
