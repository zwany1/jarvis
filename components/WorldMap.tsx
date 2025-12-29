import React, { useEffect, useRef, useState } from 'react';

interface WorldMapProps {
  onClose: () => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ onClose }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Baidu Map API key
  const baiduApiKey = 'mAdFvDSo0EWjzLX7I0r0geGdByu3WxP5';

  useEffect(() => {
    // Check if BMap is already loaded
    if (window['BMap']) {
      setMapLoaded(true);
      return;
    }

    // Create a script element to load Baidu Map API
    const script = document.createElement('script');
    
    // Use a workaround to avoid document.write() by using a custom callback
    const callbackName = 'initBaiduMap_' + Date.now();
    
    // Override document.write temporarily
    const originalWrite = document.write;
    document.write = (html: string) => {
      // Only allow writing script tags for Baidu Map API
      if (html.includes('api.map.baidu.com')) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const scriptTags = tempDiv.querySelectorAll('script');
        scriptTags.forEach(scriptTag => {
          const newScript = document.createElement('script');
          newScript.src = scriptTag.src;
          newScript.async = true;
          newScript.defer = true;
          document.body.appendChild(newScript);
        });
      }
    };

    // Load Baidu Map API
    script.src = `https://api.map.baidu.com/api?v=3.0&ak=${baiduApiKey}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    
    // Set up the callback
    (window as any)[callbackName] = () => {
      // Restore original document.write
      document.write = originalWrite;
      setMapLoaded(true);
    };

    // Add script to document
    document.body.appendChild(script);

    // Cleanup
    return () => {
      document.write = originalWrite;
      const scriptElement = document.querySelector(`script[src*="api.map.baidu.com"]`);
      if (scriptElement) {
        scriptElement.remove();
      }
      delete (window as any)[callbackName];
    };
  }, [baiduApiKey]);

  // Initialize map after BMap is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window['BMap']) return;

    try {
      // Create map instance
      const map = new window['BMap'].Map(mapRef.current, { enableMapClick: false });
      // Set center and zoom (Beijing by default)
      const point = new window['BMap'].Point(116.404, 39.915);
      map.centerAndZoom(point, 12);
      // Enable scroll wheel zoom
      map.enableScrollWheelZoom(true);

      // Add click event listener to open street view
      map.addEventListener('click', (e: any) => {
        const { lng, lat } = e.point;
        // Open Baidu Street View in new window
        window.open(`https://map.baidu.com/@${lat},${lng},19z`, '_blank');
      });

      // Add user location marker if geolocation is supported
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const userPoint = new window['BMap'].Point(longitude, latitude);
            // Add marker for user location
            const marker = new window['BMap'].Marker(userPoint);
            map.addOverlay(marker);
            // Set map center to user location
            map.setCenter(userPoint);
            // Add info window
            const infoWindow = new window['BMap'].InfoWindow('我的位置', {
              width: 100,
              height: 50,
              title: '位置信息'
            });
            marker.addEventListener('click', () => {
              map.openInfoWindow(infoWindow, userPoint);
            });
            // Open info window by default
            map.openInfoWindow(infoWindow, userPoint);
          },
          (error) => {
            console.error('Error getting user location:', error);
          }
        );
      }

      return () => {
        // Clean up map instance
        map.clearOverlays();
      };
    } catch (error) {
      console.error('Error initializing Baidu Map:', error);
    }
  }, [mapLoaded]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full h-full bg-gray-900 border-0">
        {/* Map container */}
        <div 
          ref={mapRef} 
          className="w-full h-full" 
          style={{ 
            width: '100%', 
            height: '100%',
            background: mapLoaded ? 'transparent' : '#1a1a1a' // Show loading background
          }}
        >
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-xl">
              地图加载中...
            </div>
          )}
        </div>

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

        {/* Usage hint */}
        <div className="absolute top-4 right-48 z-10 bg-white/90 text-black px-4 py-2 rounded shadow-lg">
          <p className="text-sm">🖱️ 点击地图任意位置查看百度街景</p>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;