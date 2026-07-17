const FlightMode = {
    aircrafts: new Map(),
    
    init() {
        this.layer = MapEngine.getLayer('flight');
        this.simulateLiveData();
        this.animate();
    },

    createMarker(data) {
        // Custom HTML Icon for Aircraft to enable CSS transforms
        const icon = L.divIcon({
            html: `<div class="custom-marker" style="transform: rotate(${data.heading}deg); font-size: 24px; color: var(--neon-purple);">✈</div>`,
            className: 'flight-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const marker = L.marker([data.lat, data.lng], { icon }).bindTooltip(data.flightNo);
        
        marker.on('click', () => {
            UI.openBottomSheet({
                Flight: data.flightNo,
                Type: data.type,
                Altitude: `${data.alt} ft`,
                Speed: `${data.speed} kts`,
                Origin: data.origin,
                Destination: data.dest
            });
        });

        this.aircrafts.set(data.id, { marker, data });
        marker.addTo(this.layer);
    },

    simulateLiveData() {
        // API-ready mock data
        this.createMarker({ id: 1, flightNo: 'XA01', type: 'B777', lat: -6.1, lng: 106.8, heading: 45, alt: 35000, speed: 480, origin: 'CGK', dest: 'HND' });
        this.createMarker({ id: 2, flightNo: 'XA02', type: 'A350', lat: 1.3, lng: 103.8, heading: 120, alt: 32000, speed: 460, origin: 'SIN', dest: 'SYD' });
    },

    animate() {
        // Simulasi pergerakan realtime menggunakan requestAnimationFrame
        this.aircrafts.forEach((item) => {
            // Logika interpolasi pergerakan di sini untuk prod
            // const newLat = item.data.lat + (speed * timeDelta);
            // item.marker.setLatLng([newLat, newLng]);
        });
        requestAnimationFrame(() => this.animate());
    }
};
