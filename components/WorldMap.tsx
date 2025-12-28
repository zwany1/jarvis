import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface WorldMapProps {
  onClose: () => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ onClose }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Initialize Leaflet map
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [0, 0],
        zoom: 2,
        zoomControl: true,
        attributionControl: true
      });

      // Add tile layer with domestic accessible service
      L.tileLayer('https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
        attribution: '© 高德地图',
        maxZoom: 18
      }).addTo(mapInstanceRef.current);

      // Get user location and add marker
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            
            // Add marker for user location
            const userMarker = L.marker([latitude, longitude])
              .addTo(mapInstanceRef.current!)
              .bindPopup('<b>我的位置</b><br>当前所在位置');
            
            // Zoom to user location
            mapInstanceRef.current?.setView([latitude, longitude], 12);
            
            // Open popup
            userMarker.openPopup();
          },
          (error) => {
            console.error('Error getting user location:', error);
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
      }
    }

    return () => {
      // Clean up map instance when component unmounts
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full h-full bg-gray-900 border-0">
        {/* Map container */}
        <div ref={mapRef} className="w-full h-full" style={{ width: '100%', height: '100%' }}></div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full border border-holo-cyan hover:border-white transition-all"
          aria-label="Close map"
        >
          ×
        </button>

        {/* Title */}
        <div className="absolute top-4 left-4 z-10 bg-black/70 text-holo-cyan px-4 py-2 rounded border border-holo-cyan">
          <h2 className="text-xl font-bold">世界地图</h2>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;