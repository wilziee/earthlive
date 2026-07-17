const UI = {
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.initFPSCounter();
    },

    cacheDOM() {
        this.fabMain = document.getElementById('fab-main');
        this.fabMenu = document.getElementById('fab-menu');
        this.fabItems = document.querySelectorAll('.fab-item');
        this.modeBtns = document.querySelectorAll('.mode-btn');
        this.bottomSheet = document.getElementById('bottom-sheet');
        this.btnCloseSheet = document.getElementById('btn-close-sheet');
        this.sheetContent = document.getElementById('sheet-content');
        this.btnSettings = document.getElementById('btn-settings');
    },

    bindEvents() {
        // FAB Menu Toggle
        this.fabMain.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fabMenu.classList.toggle('open');
        }, { passive: true });

        // Klik di mana saja untuk menutup menu FAB
        document.addEventListener('click', () => {
            this.fabMenu.classList.remove('open');
        }, { passive: true });

        // Mode Switching (Flight / Ship / Weather)
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.modeBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const mode = e.currentTarget.dataset.mode;
                window.dispatchEvent(new CustomEvent('xaerisoft:modeChange', { detail: mode }));
            }, { passive: true });
        });

        // Close Bottom Sheet
        this.btnCloseSheet.addEventListener('click', () => this.closeBottomSheet(), { passive: true });

        // Settings Button di Header
        if (this.btnSettings) {
            this.btnSettings.addEventListener('click', () => {
                this.openSettings();
            }, { passive: true });
        }

        // Interaksi Tombol FAB Menu
        this.fabItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.currentTarget.dataset.action;
                this.handleFABAction(action);
                this.fabMenu.classList.remove('open'); // Tutup menu setelah dipilih
            }, { passive: true });
        });
    },

    handleFABAction(action) {
        switch (action) {
            case 'style':
                this.openMapStyleSelector();
                break;
            case 'locate':
                MapEngine.locateUser();
                break;
            case 'fullscreen':
                this.toggleFullscreen();
                break;
            case 'layers':
                this.openLayersControl();
                break;
            case 'measure':
                alert("📏 Jarak Pengukuran: Sentuh 2 titik di peta (Fitur premium segera hadir!)");
                break;
            default:
                console.log(`Aksi ${action} belum diimplementasikan.`);
        }
    },

    openBottomSheet(data) {
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

    // 🗺 FITUR GANTI MAP STYLE (Aktif di Bottom Sheet)
    openMapStyleSelector() {
        this.sheetContent.innerHTML = `
            <div class="data-card" style="grid-column: span 2;">
                <div class="data-label">CHOOSE MAP STYLE</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                    <button class="mode-btn btn-style" data-style="dark" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);">🕶 Dark Map</button>
                    <button class="mode-btn btn-style" data-style="light" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);">☀️ Light Map</button>
                    <button class="mode-btn btn-style" data-style="satellite" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);">🛰 Satellite</button>
                    <button class="mode-btn btn-style" data-style="terrain" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);">⛰ Terrain</button>
                </div>
            </div>
        `;
        this.bottomSheet.classList.add('open');

        const styleBtns = this.sheetContent.querySelectorAll('.btn-style');
        styleBtns.forEach(btn => {
            if (MapEngine.currentStyle === btn.dataset.style) {
                btn.classList.add('active');
                btn.style.borderColor = 'var(--neon-purple)';
            }
            btn.addEventListener('click', (e) => {
                styleBtns.forEach(b => {
                    b.classList.remove('active');
                    b.style.borderColor = 'var(--glass-border)';
                });
                const styleName = e.currentTarget.dataset.style;
                e.currentTarget.classList.add('active');
                e.currentTarget.style.borderColor = 'var(--neon-purple)';
                MapEngine.setMapStyle(styleName);
            });
        });
    },

    // 📚 FITUR LAYERS WEATHER / GRID CONTROL
    openLayersControl() {
        this.sheetContent.innerHTML = `
            <div class="data-card" style="grid-column: span 2;">
                <div class="data-label">ACTIVE MAP LAYERS</div>
                <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 12px;">
                    <label style="display: flex; align-items: center; gap: 12px; color: white; cursor: pointer;">
                        <input type="checkbox" checked style="accent-color: var(--neon-purple); width: 18px; height: 18px;"> 📡 Live Transponder Markers
                    </label>
                    <label style="display: flex; align-items: center; gap: 12px; color: white; cursor: pointer;">
                        <input type="checkbox" style="accent-color: var(--neon-purple); width: 18px; height: 18px;"> 🌦 Weather Precipitation
                    </label>
                </div>
            </div>
        `;
        this.bottomSheet.classList.add('open');
    },

    // ⚙️ FITUR SETTINGS MODAL
    openSettings() {
        this.sheetContent.innerHTML = `
            <div class="data-card" style="grid-column: span 2;">
                <div class="data-label">XAERISOFT SETTINGS</div>
                <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Developer FPS Counter</span>
                        <button class="mode-btn active" id="toggle-fps" style="background: rgba(255,255,255,0.05); border: 1px solid var(--neon-purple); width: 80px; padding: 5px 10px;">ON</button>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Offline PWA Mode</span>
                        <span style="color: var(--neon-blue); font-weight: bold;">STANDBY</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Engine Version</span>
                        <span style="color: var(--text-dim);">v2.0.26 Premium</span>
                    </div>
                </div>
            </div>
        `;
        this.bottomSheet.classList.add('open');

        const toggleFpsBtn = document.getElementById('toggle-fps');
        if (toggleFpsBtn) {
            const fpsCounter = document.getElementById('fps-counter');
            const isVisible = window.getComputedStyle(fpsCounter).display !== 'none';
            toggleFpsBtn.textContent = isVisible ? 'ON' : 'OFF';
            if (!isVisible) toggleFpsBtn.classList.remove('active');

            toggleFpsBtn.addEventListener('click', () => {
                const isDev = toggleFpsBtn.classList.toggle('active');
                toggleFpsBtn.textContent = isDev ? 'ON' : 'OFF';
                fpsCounter.style.display = isDev ? 'block' : 'none';
                toggleFpsBtn.style.borderColor = isDev ? 'var(--neon-purple)' : 'var(--glass-border)';
            });
        }
    },

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error Fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
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
