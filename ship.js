const ShipMode = {
    vessels: new Map(),
    layer: null,

    init() {
        this.layer = MapEngine.getLayer('ship');
        this.loadShipData();
    },

    loadShipData() {
        // Default: Buat 250 kapal simulasi[span_3](start_span)[span_3](end_span)
        this.generateSimulatedFleet(250); 
        
        // 💡 JIKA ANDA SUDAH PUNYA API KEY (Misal dari Spire / MarineTraffic), nyalakan kode di bawah ini:
        // this.fetchRealShips(); 
    },

    async fetchRealShips() {
        try {
            console.log("[Ship] Mencoba mengambil data AIS asli...");
            const response = await fetch('https://api.namaprovideranda.com/v1/vessels?limit=500'); 
            const data = await response.json();
            
            this.layer.clearLayers();
            this.vessels.clear();

            // DIUBAH: Menggunakan sistem batch array agar hemat resource browser
            const markersToCluster = [];

            data.forEach(ship => {
                const marker = this.createMarker(ship);
                markersToCluster.push(marker);
            });

            // Masukkan seluruh marker asli sekaligus ke cluster
            this.layer.addLayers(markersToCluster);

        } catch (error) {
            console.warn("API Kapal tidak tersedia atau butuh API Key. Menggunakan armada simulasi.");
        }
    },

    // 🌊 GENERATOR KAPAL PINTAR (Dioptimalkan dengan Batch Rendering)
    generateSimulatedFleet(count) {
        this.layer.clearLayers();
        this.vessels.clear();

        const shipTypes = ['Cargo Vessel', 'Oil Tanker', 'Passenger Ship', 'Fishing', 'Yacht'];
        const destinations = ['Port of Tanjung Priok', 'Port of Singapore', 'Rotterdam', 'Shanghai', 'Sydney', 'Tokyo'];

        // Tempat penyimpanan marker sementara sebelum dimasukkan ke layer
        const markersToCluster = [];

        for (let i = 0; i < count; i++) {
            // Mengacak koordinat di sekitar laut Indonesia & Asia Tenggara
            // Lat: -10 sampai 10, Lng: 95 sampai 140
            const randomLat = (Math.random() * 20) - 10; 
            const randomLng = (Math.random() * 45) + 95;
            const randomHeading = Math.floor(Math.random() * 360);
            const randomSpeed = Math.floor(Math.random() * 25) + 5; // 5 - 30 knots
            const type = shipTypes[Math.floor(Math.random() * shipTypes.length)];
            const dest = destinations[Math.floor(Math.random() * destinations.length)];

            // Panggil createMarker dan simpan hasilnya ke array
            const marker = this.createMarker({
                mmsi: `999${Math.floor(Math.random() * 1000000)}`,
                name: `VESSEL-${Math.floor(Math.random() * 9000) + 1000}`,
                type: type,
                lat: randomLat,
                lng: randomLng,
                heading: randomHeading,
                speed: randomSpeed,
                dest: dest,
                eta: 'In Transit'
            });

            markersToCluster.push(marker);
        }

        // DIUBAH: Tambahkan semua marker simulasi sekaligus ke layer cluster
        this.layer.addLayers(markersToCluster);

        console.log(`[Ship] Berhasil menyebar ${count} kapal di perairan.`);
    },

    createMarker(data) {
        const icon = L.divIcon({
            html: `<div class="custom-marker" style="transform: rotate(${data.heading}deg); font-size: 18px; color: var(--neon-blue);">🚢</div>`,
            className: 'ship-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const marker = L.marker([data.lat, data.lng], { icon });
        
        marker.on('click', () => {
            UI.openBottomSheet({
                Name: data.name,
                Type: data.type,
                Speed: `${data.speed} kn`,
                Heading: `${data.heading}°`,
                Destination: data.dest,
                MMSI: data.mmsi
            });
        });

        this.vessels.set(data.mmsi, { marker, data });

        // DIUBAH: Marker tidak langsung di-addTo layer per satuan, melainkan di-return
        // untuk kemudian diproses masal oleh .addLayers() di atas demi performa optimal.
        return marker;
    }
};
