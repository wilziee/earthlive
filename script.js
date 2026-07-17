/**
 * XAERISOFT LIVE MAP - Primary Orchestrator System Bootloader
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing Xaerisoft Live Map Tracking Infrastructure Layer...");

    // 1. Fire core structural geographic mapping canvas container layout
    const map = MapEngine.init('main-map');

    // 2. Initialize telemetry streams matrices data structures
    FlightRadarEngine.init(map);
    ShipTrackerEngine.init(map);
    WeatherRadarEngine.init(map);

    // 3. Mount User Interfaces control listeners engines
    UIManager.init();

    // 4. Hook internal telemetry registries states counters up to dashboard UI counters pipelines
    setInterval(() => {
        const flightsCount = FlightRadarEngine.getRegistry().size;
        const shipsCount = ShipTrackerEngine.getRegistry().size;

        document.getElementById('stat-aircraft-count').textContent = flightsCount;
        document.getElementById('stat-ship-count').textContent = shipsCount;
    }, 1000);

    // 5. Connect Dynamic Atmospheric Toggles down into core engine fields
    document.getElementById('layer-toggle-rain').addEventListener('change', (e) => {
        WeatherRadarEngine.toggleLayer('rain', e.target.checked);
    });
    document.getElementById('layer-toggle-wind').addEventListener('change', (e) => {
        WeatherRadarEngine.toggleLayer('wind', e.target.checked);
    });

    // 6. Extinguish loading veil screen upon operational confirmation loops completion
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 600);
        }
    }, 1500);
});
