/**
 * XAERISOFT LIVE MAP - Marine Vessel Tracking Engine (Dynamic Canvas Overlays)
 */
const ShipTrackerEngine = (() => {
    let mapInstance = null;
    let canvasLayer = null;
    let vesselsRegistry = new Map();
    let selectedVesselId = null;
    let voyageRouteLine = null;

    const shipTypeColors = {
        'Cargo': '#06b6d4',
        'Tanker': '#10b981',
        'Passenger': '#f59e0b',
        'Military': '#ef4444',
        'Fishing': '#a855f7'
    };

    const mockVesselIdentities = [
        { id: 'SH001', name: 'EVER GIVEN', imo: '9811000', mmsi: '353136000', type: 'Cargo', origin: 'Singapore', dest: 'Rotterdam', speed: 16, heading: 290, country: 'PA' },
        { id: 'SH002', name: 'MAERSK MC-KINNEY', imo: '9632064', mmsi: '219419000', type: 'Cargo', origin: 'Tanjung Pelepas', dest: 'Shanghai', speed: 18, heading: 45, country: 'DK' },
        { id: 'SH003', name: 'US CORONADO', imo: 'MIL8830', mmsi: '369970000', type: 'Military', origin: 'Subic Bay', dest: 'Yokosuka', speed: 24, heading: 12, country: 'US' },
        { id: 'SH004', name: 'PACIFIC RUBY', imo: '9744677', mmsi: '563035800', type: 'Tanker', origin: 'Bontang', dest: 'Tokyo', speed: 12, heading: 32, country: 'SG' },
        { id: 'SH005', name: 'ALBATROSS V', imo: '9123477', mmsi: '525112000', type: 'Fishing', origin: 'Jakarta', dest: 'Java Sea', speed: 6, heading: 180, country: 'ID' }
    ];

    const init = (map) => {
        mapInstance = map;
        setupMockDataset();
        createCanvasLayer();
        
        requestAnimationFrame(updatePositionsTick);
    };

    const setupMockDataset = () => {
        mockVesselIdentities.forEach(v => {
            const lat = -7.0 + (Math.random() * 5);
            const lng = 105.0 + (Math.random() * 12);
            vesselsRegistry.set(v.id, {
                ...v,
                lat: lat,
                lng: lng,
                status: 'Underway Using Engine',
                history: [[lat, lng]]
            });
        });
    };

    const createCanvasLayer = () => {
        const VesselCanvasOverlay = L.Layer.extend({
            onAdd: function (map) {
                this._map = map;
                this._canvas = L.DomUtil.create('canvas', 'leaflet-vessel-layer leaflet-layer');
                const size = this._map.getSize();
                this._canvas.width = size.x;
                this._canvas.height = size.y;
                map._panes.overlayPane.appendChild(this._canvas);
                map.on('moveend', this._reset, this);
                this._reset();
            },
            onRemove: function (map) {
                map._panes.overlayPane.removeChild(this._canvas);
                map.off('moveend', this._reset, this);
            },
            _reset: function () {
                const topLeft = this._map.getPixelBounds().getTopLeft();
                L.DomUtil.setPosition(this._canvas, topLeft);
                this._render();
            },
            _render: function () {
                if (!this._map) return;
                const ctx = this._canvas.getContext('2d');
                ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
                
                const size = this._map.getSize();
                this._canvas.width = size.x;
                this._canvas.height = size.y;

                vesselsRegistry.forEach((vessel) => {
                    const point = this._map.latLngToContainerPoint([vessel.lat, vessel.lng]);
                    if (point.x < 0 || point.x > size.x || point.y < 0 || point.y > size.y) return;

                    ctx.save();
                    ctx.translate(point.x, point.y);
                    ctx.rotate((vessel.heading * Math.PI) / 180);

                    // Dynamic color rendering mapping based on vessel categorization
                    ctx.fillStyle = selectedVesselId === vessel.id ? '#00ffcc' : (shipTypeColors[vessel.type] || '#ffffff');
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.shadowBlur = selectedVesselId === vessel.id ? 10 : 0;

                    // Procedural sharp boat hull vectors outline
                    ctx.beginPath();
                    ctx.moveTo(0, -9); 
                    ctx.lineTo(4, -3);  
                    ctx.lineTo(4, 7);   
                    ctx.lineTo(-4, 7);  
                    ctx.lineTo(-4, -3); 
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();

                    ctx.fillStyle = 'rgba(255,255,255,0.7)';
                    ctx.font = '9px Arial';
                    ctx.fillText(vessel.name, point.x + 10, point.y + 3);
                });
            }
        });

        canvasLayer = new VesselCanvasOverlay();
        canvasLayer.addTo(mapInstance);

        mapInstance.on('click', (e) => {
            let found = null;
            const clickPoint = mapInstance.latLngToContainerPoint(e.latlng);
            vesselsRegistry.forEach((vessel, id) => {
                const pt = mapInstance.latLngToContainerPoint([vessel.lat, vessel.lng]);
                if (Math.hypot(clickPoint.x - pt.x, clickPoint.y - pt.y) < 12) found = { ...vessel, id };
            });
            if (found) selectVessel(found.id);
        });
    };

    const updatePositionsTick = () => {
        vesselsRegistry.forEach((vessel) => {
            const rad = (vessel.heading * Math.PI) / 180;
            // Marine displacement vectors operate orders of magnitude slower than aviation modules
            const speedModifier = 0.000005 * (vessel.speed / 15);
            vessel.lat += Math.cos(rad) * speedModifier;
            vessel.lng += Math.sin(rad) * speedModifier;

            vessel.history.push([vessel.lat, vessel.lng]);
            if (vessel.history.length > 300) vessel.history.shift();
        });

        if (canvasLayer && mapInstance) canvasLayer._render();

        if (selectedVesselId && vesselsRegistry.has(selectedVesselId)) {
            const current = vesselsRegistry.get(selectedVesselId);
            if (voyageRouteLine) voyageRouteLine.setLatLngs(current.history);
        }

        requestAnimationFrame(updatePositionsTick);
    };

    const selectVessel = (id) => {
        selectedVesselId = id;
        const vesselData = vesselsRegistry.get(id);

        if (voyageRouteLine) mapInstance.removeLayer(voyageRouteLine);
        voyageRouteLine = L.polyline(vesselData.history, { color: '#06b6d4', weight: 3, opacity: 0.8 }).addTo(mapInstance);

        document.dispatchEvent(new CustomEvent('vessel-selected', { detail: vesselData }));
    };

    const searchVessels = (query) => {
        const results = [];
        vesselsRegistry.forEach((v) => {
            if (v.name.toLowerCase().includes(query.toLowerCase()) || v.imo.includes(query)) {
                results.push(v);
            }
        });
        return results;
    };

    return {
        init,
        getRegistry: () => vesselsRegistry,
        selectVessel,
        searchVessels
    };
})();
