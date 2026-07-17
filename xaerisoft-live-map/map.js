/**
 * XAERISOFT LIVE MAP - Map Core Management Engine
 */
const MapEngine = (() => {
    let mapInstance = null;
    let baseLayers = {};
    let activeMeasureLine = null;
    let measurePoints = [];
    let isMeasuring = false;

    const init = (containerId) => {
        // Initialize structural engine center at Indonesia Archipelago coordinates
        mapInstance = L.map(containerId, {
            center: [-2.5489, 118.0149],
            zoom: 5,
            zoomControl: true,
            attributionControl: false
        });

        // Setup base layout tiles definitions
        baseLayers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 });
        baseLayers.light = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 });
        baseLayers.sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18 });
        baseLayers.terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17 });

        // Set default theme layer injection
        baseLayers.dark.addTo(mapInstance);

        // Bind core interface coordinate listener updates
        mapInstance.on('mousemove', (e) => {
            document.dispatchEvent(new CustomEvent('map-coord-update', {
                detail: { lat: e.latlng.lat.toFixed(4), lng: e.latlng.lng.toFixed(4) }
            }));
        });

        mapInstance.on('zoomend moveend', () => {
            const center = mapInstance.getCenter();
            document.dispatchEvent(new CustomEvent('map-viewport-update', {
                detail: { zoom: mapInstance.getZoom(), scale: `Zoom Level ${mapInstance.getZoom()}` }
            }));
        });

        // Click handler for distance computational tool
        mapInstance.on('click', (e) => {
            if (!isMeasuring) return;
            handleMeasureClick(e.latlng);
        });

        return mapInstance;
    };

    const switchBaseLayer = (layerKey) => {
        if (!baseLayers[layerKey]) return;
        Object.keys(baseLayers).forEach(k => mapInstance.removeLayer(baseLayers[k]));
        baseLayers[layerKey].addTo(mapInstance);
    };

    const flyToCoordinates = (lat, lng, targetZoom = 12) => {
        if (!mapInstance) return;
        mapInstance.flyTo([lat, lng], targetZoom, { animate: true, duration: 1.5 });
    };

    const toggleMeasurementTool = () => {
        isMeasuring = !isMeasuring;
        if (!isMeasuring) {
            clearMeasurement();
        } else {
            measurePoints = [];
            activeMeasureLine = L.polyline([], { color: '#f59e0b', weight: 3, dashArray: '6, 6' }).addTo(mapInstance);
            alert("Distance Measure Active. Click points on map to measure path distance.");
        }
    };

    const handleMeasureClick = (latlng) => {
        measurePoints.push(latlng);
        activeMeasureLine.setLatLngs(measurePoints);
        
        L.circleMarker(latlng, { radius: 5, color: '#f59e0b', fillColor: '#0b0813', fillOpacity: 1 }).addTo(mapInstance);

        if (measurePoints.length > 1) {
            let totalDistance = 0;
            for (let i = 1; i < measurePoints.length; i++) {
                totalDistance += measurePoints[i-1].distanceTo(measurePoints[i]);
            }
            const km = (totalDistance / 1000).toFixed(2);
            L.popup()
                .setLatLng(latlng)
                .setContent(`<b>Accumulated Distance:</b> ${km} km`)
                .openOn(mapInstance);
        }
    };

    const clearMeasurement = () => {
        if (activeMeasureLine) {
            mapInstance.removeLayer(activeMeasureLine);
            activeMeasureLine = null;
        }
        measurePoints = [];
        isMeasuring = false;
    };

    return {
        init,
        getMap: () => mapInstance,
        switchBaseLayer,
        flyToCoordinates,
        toggleMeasurementTool
    };
})();
