const UI = {
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.initFPSCounter();
    },

    cacheDOM() {
        this.fabMain = document.getElementById('fab-main');
        this.fabMenu = document.getElementById('fab-menu');
        this.modeBtns = document.querySelectorAll('.mode-btn');
        this.bottomSheet = document.getElementById('bottom-sheet');
        this.btnCloseSheet = document.getElementById('btn-close-sheet');
        this.sheetContent = document.getElementById('sheet-content');
    },

    bindEvents() {
        // FAB Toggle
        this.fabMain.addEventListener('click', () => {
            this.fabMenu.classList.toggle('open');
        }, { passive: true });

        // Mode Switching
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.modeBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const mode = e.target.dataset.mode;
                window.dispatchEvent(new CustomEvent('xaerisoft:modeChange', { detail: mode }));
            }, { passive: true });
        });

        // Close Bottom Sheet
        this.btnCloseSheet.addEventListener('click', () => this.closeBottomSheet(), { passive: true });
    },

    openBottomSheet(data) {
        // Skeleton / Data population mapping
        this.sheetContent.innerHTML = Object.entries(data).map(([key, value]) => `
            <div class="data-card">
                <div class="data-label">${key.toUpperCase()}</div>
                <div class="data-value">${value}</div>
            </div>
        `).join('');
        this.bottomSheet.classList.add('open');
    },

    closeBottomSheet() {
        this.bottomSheet.classList.remove('open');
    },

    initFPSCounter() {
        const fpsEl = document.getElementById('fps-counter');
        let lastTime = performance.now();
        let frames = 0;
        const calcFPS = () => {
            const now = performance.now();
            frames++;
            if (now >= lastTime + 1000) {
                fpsEl.textContent = `FPS: ${frames}`;
                frames = 0;
                lastTime = now;
            }
            requestAnimationFrame(calcFPS);
        };
        requestAnimationFrame(calcFPS);
    }
};
