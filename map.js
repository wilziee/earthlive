const MapEngine = {
    map: null,
    layers: {},

    init() {
        // Inisialisasi Leaflet Map
        this.map = L.map('map-container', {
            zoomControl: false,
            preferCanvas: true, // Optimasi performa untuk banyak marker
            wheelDebounceTime: 150
        }).setView([0, 115], 5); // Default: Indonesia

        // Dark Theme Tile Layer (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; XAERISOFT LIVE',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);

        // Layer Groups untuk tiap Mode
        this.layers = {
            flight: L.layerGroup().addTo(this.map),
            ship: L.layerGroup(),
            weather: L.layerGroup()
        };

        this.listenToModeChanges();
    },

    listenToModeChanges() {
        window.addEventListener('xaerisoft:modeChange', (e) => {
            const activeMode = e.detail;
            // Sembunyikan semua layer
            Object.values(this.layers).forEach(layer => this.map.removeLayer(layer));
            // Tampilkan layer yang aktif
            this.map.addLayer(this.layers[activeMode]);
        });
    },

    getLayer(mode) {
        return this.layers[mode];
    }
};
