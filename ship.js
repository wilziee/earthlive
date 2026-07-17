const ShipMode = {
    vessels: new Map(),

    init() {
        this.layer = MapEngine.getLayer('ship');
        this.simulateLiveData();
    },

    createMarker(data) {
        const icon = L.divIcon({
            html: `<div class="custom-marker" style="transform: rotate(${data.heading}deg); font-size: 20px; color: var(--neon-blue);">🚢</div>`,
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
                Destination: data.dest,
                ETA: data.eta,
                MMSI: data.mmsi
            });
        });

        this.vessels.set(data.mmsi, { marker, data });
        marker.addTo(this.layer);
    },

    simulateLiveData() {
        this.createMarker({ name: 'EVER GIVEN', type: 'Cargo', lat: -5.0, lng: 110.0, heading: 90, speed: 18, dest: 'Rotterdam', eta: '12 Oct', mmsi: '353136000' });
        this.createMarker({ name: 'SYMPHONY', type: 'Passenger', lat: -8.0, lng: 115.0, heading: 270, speed: 22, dest: 'Bali', eta: '2 Oct', mmsi: '311000100' });
    }
};
