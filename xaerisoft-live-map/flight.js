/**
 * XAERISOFT LIVE MAP - Flight Telemetry Engine (High Performance Canvas Overlay)
 */
const FlightRadarEngine = (() => {
    let mapInstance = null;
    let canvasLayer = null;
    let flightsRegistry = new Map();
    let selectedFlightId = null;
    let trajectoryLine = null;

    // Decoupled dynamic simulated live payload generation scheme
    const mockFlightIdentities = [
        { id: 'FL001', fn: 'GA102', origin: 'CGK', dest: 'SIN', airline: 'Garuda Indonesia', model: 'Boeing 777-300ER', reg: 'PK-GIE', country: 'ID', callsign: 'GIA102' },
        { id: 'FL002', fn: 'SQ957', origin: 'SIN', dest: 'CGK', airline: 'Singapore Airlines', model: 'Airbus A350-900', reg: '9V-SMF', country: 'SG', callsign: 'SIA957' },
        { id: 'FL003', fn: 'EK356', origin: 'DXB', dest: 'DPS', airline: 'Emirates', model: 'Airbus A380-800', reg: 'A6-EEV', country: 'AE', callsign: 'UAE356' },
        { id: 'FL004', fn: 'QZ502', origin: 'DPS', dest: 'SIN', airline: 'AirAsia', model: 'Airbus A320-200', reg: 'PK-AXV', country: 'ID', callsign: 'AWQ502' },
        { id: 'FL005', fn: 'NH835', origin: 'NRT', dest: 'CGK', airline: 'ANA', model: 'Boeing 787-9 Dreamliner', reg: 'JA873A', country: 'JP', callsign: 'ANA835' }
    ];

    const init = (map) => {
        mapInstance = map;
        setupMockDataset();
        createCanvasLayer();
        
        // Start mathematical state updater frame loop
        requestAnimationFrame(updatePositionsTick);
    };

    const setupMockDataset = () => {
        mockFlightIdentities.forEach(f => {
            // Distribute start positions pseudo-randomly across coordinate windows
            const lat = -6.0 + (Math.random() * 4);
            const lng = 106.0 + (Math.random() * 9);
            flightsRegistry.set(f.id, {
                ...f,
                lat: lat,
                lng: lng,
                altitude: Math.floor(28000 + Math.random() * 10000),
                speed: Math.floor(420 + Math.random() * 80),
                heading: Math.floor(Math.random() * 360),
                status: 'En Route',
                history: [[lat, lng]]
            });
        });
    };

    const createCanvasLayer = () => {
        const CanvasOverlay = L.Layer.extend({
            onAdd: function (map) {
                this._map = map;
                this._canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-layer leaflet-layer');
                
                const size = this._map.getSize();
                this._canvas.width = size.x;
                this._canvas.height = size.y;

                const animated = this._map.options.zoomAnimation && L.Browser.any3d;
                L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));
                
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

                // Render operational units vector paths
                flightsRegistry.forEach((flight) => {
                    const point = this._map.latLngToContainerPoint([flight.lat, flight.lng]);
                    
                    // Boundary control checks
                    if (point.x < 0 || point.x > size.x || point.y < 0 || point.y > size.y) return;

                    ctx.save();
                    ctx.translate(point.x, point.y);
                    ctx.rotate((flight.heading * Math.PI) / 180);

                    // Draw clean procedural vector aircraft icons shapes
                    ctx.fillStyle = selectedFlightId === flight.id ? '#a855f7' : '#ffffff';
                    ctx.shadowColor = '#a855f7';
                    ctx.shadowBlur = selectedFlightId === flight.id ? 12 : 0;
                    
                    ctx.beginPath();
                    ctx.moveTo(0, -12); // Nose
                    ctx.lineTo(3, -3);   // Right cockpit fuselage link
                    ctx.lineTo(14, 2);   // Right wing edge terminus
                    ctx.lineTo(14, 5);   // Wing trailing edge
                    ctx.lineTo(3, 2);    // Fuselage intersection aft
                    ctx.lineTo(3, 9);    // Horizontal stabilizer link
                    ctx.lineTo(7, 12);   // Tail wing extension point
                    ctx.lineTo(0, 10);   // Rear centerline junction
                    ctx.lineTo(-7, 12);  // Mirror left stabilizers
                    ctx.lineTo(-3, 9);
                    ctx.lineTo(-3, 2);
                    ctx.lineTo(-14, 5);  // Left wing components
                    ctx.lineTo(-14, 2);
                    ctx.lineTo(-3, -3);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();

                    // Font rendering tags label overlay next to elements
                    ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.font = '10px monospace';
                    ctx.fillText(flight.fn, point.x + 14, point.y + 4);
                });
            }
        });

        canvasLayer = new CanvasOverlay();
        canvasLayer.addTo(mapInstance);

        // Map Click handling translation logic for canvas programmatic points
        mapInstance.on('click', (e) => {
            let found = null;
            const clickPoint = mapInstance.latLngToContainerPoint(e.latlng);
            
            flightsRegistry.forEach((flight, id) => {
                const pt = mapInstance.latLngToContainerPoint([flight.lat, flight.lng]);
                const dist = Math.hypot(clickPoint.x - pt.x, clickPoint.y - pt.y);
                if (dist < 15) found = { ...flight, id };
            });

            if (found) {
                selectFlight(found.id);
            }
        });
    };

    const updatePositionsTick = () => {
        flightsRegistry.forEach((flight) => {
            // Compute coordinate trajectories derivations based on headings indices
            const rad = (flight.heading * Math.PI) / 180;
            const speedModifier = 0.00005 * (flight.speed / 400); 
            
            flight.lat += Math.cos(rad) * speedModifier;
            flight.lng += Math.sin(rad) * speedModifier;
            
            // Random dynamic heading turbulence alterations simulations
            if (Math.random() > 0.98) {
                flight.heading = (flight.heading + Math.floor(Math.random() * 20 - 10)) % 360;
            }

            // Route trail coordinates storage history limit trackers
            flight.history.push([flight.lat, flight.lng]);
            if (flight.history.length > 200) flight.history.shift();
        });

        if (canvasLayer && mapInstance) {
            canvasLayer._render();
        }

        // Keep updating path rendering layers dynamically
        if (selectedFlightId && flightsRegistry.has(selectedFlightId)) {
            const current = flightsRegistry.get(selectedFlightId);
            if (trajectoryLine) trajectoryLine.setLatLngs(current.history);
        }

        requestAnimationFrame(updatePositionsTick);
    };

    const selectFlight = (id) => {
        selectedFlightId = id;
        const flightData = flightsRegistry.get(id);
        
        if (trajectoryLine) mapInstance.removeLayer(trajectoryLine);
        
        trajectoryLine = L.polyline(flightData.history, {
            color: '#a855f7',
            weight: 3,
            opacity: 0.8
        }).addTo(mapInstance);

        document.dispatchEvent(new CustomEvent('flight-selected', { detail: flightData }));
    };

    const searchFlights = (query) => {
        const results = [];
        flightsRegistry.forEach((f) => {
            if (f.fn.toLowerCase().includes(query.toLowerCase()) || 
                f.airline.toLowerCase().includes(query.toLowerCase())) {
                results.push(f);
            }
        });
        return results;
    };

    return {
        init,
        getRegistry: () => flightsRegistry,
        selectFlight,
        searchFlights
    };
})();
