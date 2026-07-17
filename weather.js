/**
 * XAERISOFT LIVE MAP - Dynamic Weather Radar Simulation Layer Engine
 */
const WeatherRadarEngine = (() => {
    let mapInstance = null;
    let weatherOverlay = null;
    let activeLayers = { rain: true, wind: true, temp: false, pressure: false };
    let particlePool = [];

    const init = (map) => {
        mapInstance = map;
        createWeatherOverlay();
        initWindParticles();
        
        // Setup separate rendering loop interface for atmospheric structures
        setInterval(animateAtmosphericSystems, 60);
    };

    const createWeatherOverlay = () => {
        const WeatherCanvas = L.Layer.extend({
            onAdd: function (map) {
                this._map = map;
                this._canvas = L.DomUtil.create('canvas', 'leaflet-weather-layer leaflet-layer');
                this._canvas.style.opacity = '0.45';
                this._canvas.style.pointerEvents = 'none';
                const size = this._map.getSize();
                this._canvas.width = size.x;
                this._canvas.height = size.y;
                map._panes.overlayPane.appendChild(this._canvas);
                this._render();
            },
            onRemove: function (map) {
                map._panes.overlayPane.removeChild(this._canvas);
            },
            _render: function () {
                if (!this._map) return;
                const ctx = this._canvas.getContext('2d');
                const size = this._map.getSize();
                ctx.clearRect(0, 0, size.x, size.y);

                // Simulation blocks for composite heat/precipitation matrix mapping
                if (activeLayers.rain) {
                    drawPrecipitationCells(ctx, size);
                }
                if (activeLayers.wind) {
                    drawWindFlowField(ctx, size);
                }
            }
        });

        weatherOverlay = new WeatherCanvas();
        weatherOverlay.addTo(mapInstance);

        mapInstance.on('moveend zoomend', () => {
            if (weatherOverlay && weatherOverlay._canvas) {
                const size = mapInstance.getSize();
                weatherOverlay._canvas.width = size.x;
                weatherOverlay._canvas.height = size.y;
                weatherOverlay._render();
            }
        });
    };

    const initWindParticles = () => {
        particlePool = [];
        for (let i = 0; i < 120; i++) {
            particlePool.push({
                x: Math.random(),
                y: Math.random(),
                age: Math.random() * 100,
                speed: 2 + Math.random() * 3
            });
        }
    };

    const drawPrecipitationCells = (ctx, size) => {
        // Creates procedural radar blobs patterns across map canvas space bounds
        const gradient = ctx.createRadialGradient(size.x * 0.4, size.y * 0.5, 20, size.x * 0.4, size.y * 0.5, 180);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 0, 0.6)');
        gradient.addColorStop(0.7, 'rgba(0, 255, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 102, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(size.x * 0.4, size.y * 0.5, 180, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawWindFlowField = (ctx, size) => {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
        ctx.lineWidth = 1.5;
        
        particlePool.forEach(p => {
            const px = p.x * size.x;
            const py = p.y * size.y;
            
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + (p.speed * 3), py + (Math.sin(p.x * 10) * 2));
            ctx.stroke();

            // Translate particle age tracking indices
            p.x += 0.004 * p.speed;
            if (p.x > 1) { p.x = 0; p.y = Math.random(); }
        });
    };

    const animateAtmosphericSystems = () => {
        if (weatherOverlay && weatherOverlay._map) {
            weatherOverlay._render();
        }
    };

    const toggleLayer = (layerKey, isVisible) => {
        if (layerKey in activeLayers) {
            activeLayers[layerKey] = isVisible;
            if (weatherOverlay) weatherOverlay._render();
        }
    };

    return {
        init,
        toggleLayer
    };
})();
