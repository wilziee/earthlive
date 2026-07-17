/**
 * XAERISOFT LIVE MAP - User Interface Interaction Manager
 */
const UIManager = (() => {
    let currentTab = 'flight';
    const favorites = new Set();

    const init = () => {
        setupEventBinds();
        startTimeTicker();
    };

    const setupEventBinds = () => {
        // Tab switching implementation context logic
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentTab = e.target.dataset.tab;
                
                const legend = document.getElementById('weather-legend');
                if (currentTab === 'weather') {
                    legend.classList.remove('hidden');
                } else {
                    legend.classList.add('hidden');
                }
            });
        });

        // Layer controls structural adapters binding loops
        document.getElementById('btn-layer-dark').addEventListener('click', () => { setActiveLayerBtn('dark'); MapEngine.switchBaseLayer('dark'); });
        document.getElementById('btn-layer-light').addEventListener('click', () => { setActiveLayerBtn('light'); MapEngine.switchBaseLayer('light'); });
        document.getElementById('btn-layer-sat').addEventListener('click', () => { setActiveLayerBtn('sat'); MapEngine.switchBaseLayer('sat'); });
        document.getElementById('btn-layer-terrain').addEventListener('click', () => { setActiveLayerBtn('terrain'); MapEngine.switchBaseLayer('terrain'); });

        document.getElementById('btn-measure').addEventListener('click', () => MapEngine.toggleMeasurementTool());
        document.getElementById('btn-fullscreen').addEventListener('click', () => toggleSystemFullscreen());

        // Close Inspector triggers
        document.getElementById('close-inspector').addEventListener('click', () => {
            document.getElementById('inspector-card').classList.add('hidden');
        });

        // Search Interface engine binds
        document.getElementById('universal-search').addEventListener('input', (e) => handleSearchExecution(e.target.value));

        // Global Event listeners capture pipes from background logic threads
        document.addEventListener('map-coord-update', (e) => {
            document.getElementById('metric-coordinates').textContent = `${e.detail.lat}, ${e.detail.lng}`;
        });

        document.addEventListener('map-viewport-update', (e) => {
            document.getElementById('metric-scale').textContent = e.detail.scale;
        });

        document.addEventListener('flight-selected', (e) => renderInspectorContent('flight', e.detail));
        document.addEventListener('vessel-selected', (e) => renderInspectorContent('vessel', e.detail));
    };

    const setActiveLayerBtn = (key) => {
        document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`btn-layer-${key}`).classList.add('active');
    };

    const toggleSystemFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    const startTimeTicker = () => {
        setInterval(() => {
            const now = new Date();
            document.getElementById('metric-time').textContent = now.toUTCString().replace('GMT', 'UTC');
        }, 1000);
    };

    const handleSearchExecution = (val) => {
        const drop = document.getElementById('search-results');
        if (val.length < 2) { drop.classList.add('hidden'); return; }
        
        drop.innerHTML = '';
        drop.classList.remove('hidden');

        const flightMatches = FlightRadarEngine.searchFlights(val);
        const vesselMatches = ShipTrackerEngine.searchVessels(val);

        flightMatches.forEach(f => {
            const el = document.createElement('div');
            el.className = 'search-item';
            el.innerHTML = `<span>✈️ ${f.fn}</span><small>${f.airline}</small>`;
            el.onclick = () => { MapEngine.flyToCoordinates(f.lat, f.lng, 9); FlightRadarEngine.selectFlight(f.id); drop.classList.add('hidden'); };
            drop.appendChild(el);
        });

        vesselMatches.forEach(v => {
            const el = document.createElement('div');
            el.className = 'search-item';
            el.innerHTML = `<span>🚢 ${v.name}</span><small>${v.type}</small>`;
            el.onclick = () => { MapEngine.flyToCoordinates(v.lat, v.lng, 9); ShipTrackerEngine.selectVessel(v.id); drop.classList.add('hidden'); };
            drop.appendChild(el);
        });

        if(flightMatches.length === 0 && vesselMatches.length === 0) {
            drop.innerHTML = '<div class="search-item" style="cursor:default;">No records discovered.</div>';
        }
    };

    const renderInspectorContent = (mode, data) => {
        const card = document.getElementById('inspector-card');
        const content = document.getElementById('inspector-content');
        card.classList.remove('hidden');

        if (mode === 'flight') {
            content.innerHTML = `
                <div class="inspector-header">
                    <h3>${data.fn}</h3>
                    <div class="inspector-subtitle">${data.airline}</div>
                </div>
                <div class="inspector-grid">
                    <div><span class="data-lbl">Callsign</span><span class="data-val">${data.callsign}</span></div>
                    <div><span class="data-lbl">Aircraft</span><span class="data-val">${data.model}</span></div>
                    <div><span class="data-lbl">Route</span><span class="data-val">${data.origin} ➔ ${data.dest}</span></div>
                    <div><span class="data-lbl">Altitude</span><span class="data-val">${data.altitude} ft</span></div>
                    <div><span class="data-lbl">Speed</span><span class="data-val">${data.speed} kts</span></div>
                    <div><span class="data-lbl">Heading</span><span class="data-val">${data.heading}°</span></div>
                </div>
                <button class="action-btn-block" onclick="UIManager.toggleFavorite('${data.id}', '${data.fn}')">⭐ Save to Favorites</button>
            `;
        } else {
            content.innerHTML = `
                <div class="inspector-header">
                    <h3>${data.name}</h3>
                    <div class="inspector-subtitle">Type: ${data.type} [${data.country}]</div>
                </div>
                <div class="inspector-grid">
                    <div><span class="data-lbl">IMO / MMSI</span><span class="data-val">${data.imo}</span></div>
                    <div><span class="data-lbl">Voyage</span><span class="data-val">${data.origin} ➔ ${data.dest}</span></div>
                    <div><span class="data-lbl">Speed</span><span class="data-val">${data.speed} kn</span></div>
                    <div><span class="data-lbl">Heading</span><span class="data-val">${data.heading}°</span></div>
                    <div><span class="data-lbl">Status</span><span class="data-val">${data.status}</span></div>
                </div>
                <button class="action-btn-block" onclick="UIManager.toggleFavorite('${data.id}', '${data.name}')">⭐ Save to Favorites</button>
            `;
        }
    };

    const toggleFavorite = (id, label) => {
        const favList = document.getElementById('favorites-list');
        if (favorites.has(id)) {
            favorites.delete(id);
        } else {
            favorites.add(id);
        }
        
        // Refresh Favorites UI
        favList.innerHTML = '';
        if (favorites.size === 0) {
            favList.innerHTML = '<li class="empty-fav">No favorites saved</li>';
            return;
        }

        favorites.forEach(favId => {
            const li = document.createElement('li');
            li.style.padding = '6px 0';
            li.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            li.style.cursor = 'pointer';
            li.textContent = `📍 Item Reference [${favId}]`;
            favList.appendChild(li);
        });
    };

    return {
        init,
        toggleFavorite
    };
})();
