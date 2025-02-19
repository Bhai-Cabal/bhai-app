"use client";

import { useState } from 'react';
import { Map, Marker, ZoomControl } from 'pigeon-maps';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { RefreshCcw } from 'lucide-react';

interface DeveloperNode {
  id: string;
  full_name: string;
  avatarUrl: string;
  location: {
    lat: number;
    lng: number;
    display_name: string;
  };
  skills: string[];
}

interface NetworkGraphProps {
  developers: DeveloperNode[];
  onNodeClick?: (developer: DeveloperNode) => void;
}

function GroupedMarker({ developers, onClick, onHover, onLeave }: any) {
  const count = developers.length;
  
  return (
    <div
      className="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
      onMouseEnter={() => onHover(developers)}
      onMouseLeave={onLeave}
    >
      {count === 1 ? (
        <Avatar className="w-12 h-12 border-2 border-white shadow-lg transform transition-transform duration-200 group-hover:scale-110">
          <AvatarImage src={developers[0].avatarUrl} alt={developers[0].full_name} />
          <AvatarFallback><UserCircle /></AvatarFallback>
        </Avatar>
      ) : (
        <div className="relative">
          {developers.slice(0, 3).map((dev: any, index: number) => (
            <Avatar
              key={dev.id}
              className={`w-10 h-10 border-2 border-white shadow-lg absolute transition-transform duration-200
                ${index === 0 ? '-translate-x-4' : ''}
                ${index === 1 ? 'translate-x-0' : ''}
                ${index === 2 ? 'translate-x-4' : ''}
              `}
              style={{ zIndex: 3 - index }}
            >
              <AvatarImage src={dev.avatarUrl} alt={dev.full_name} />
              <AvatarFallback><UserCircle /></AvatarFallback>
            </Avatar>
          ))}
          {count > 3 && (
            <div className="absolute -right-2 -bottom-2 bg-primary text-white text-xs rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
              +{count - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NetworkGraph({ developers, onNodeClick }: NetworkGraphProps) {
  const [hoveredDevs, setHoveredDevs] = useState<DeveloperNode[] | null>(null);
  const [center, setCenter] = useState<[number, number]>([20, 0]);
  const [zoom, setZoom] = useState(2);

  // Filter out developers with invalid coordinates
  const validDevelopers = developers.filter(dev => 
    dev.location?.lat && 
    dev.location?.lng &&
    dev.location.lat >= -90 && 
    dev.location.lat <= 90 &&
    dev.location.lng >= -180 && 
    dev.location.lng <= 180
  );

  // Group developers by location
  const groupedDevelopers = developers.reduce((acc, dev) => {
    const key = `${dev.location.lat},${dev.location.lng}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(dev);
    return acc;
  }, {} as Record<string, DeveloperNode[]>);

  // Custom map tiles using Positron
  const mapTiler = (x: number, y: number, z: number) => {
    return `https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/${z}/${x}/${y}.png`;
  };

  const resetMap = () => {
    setCenter([20, 0]);
    setZoom(2);
  };

  return (
    <div className="relative h-[600px] w-full rounded-lg overflow-hidden">
      <Map
        height={600}
        center={center}
        zoom={zoom}
        onBoundsChanged={({ center, zoom }) => {
          setCenter(center);
          setZoom(zoom);
        }}
        provider={mapTiler}
        attribution={false} // Removes the watermark
        metaWheelZoom={true} // Enables zoom with meta/ctrl key
        twoFingerDrag={false} // Disables two finger drag requirement on mobile
      >
        <ZoomControl />
        
        {Object.entries(groupedDevelopers).map(([key, devs]) => {
          const [lat, lng] = key.split(',').map(Number);
          return (
            <Marker
              key={key}
              width={devs.length > 1 ? 80 : 48}
              anchor={[lat, lng]}
            >
              <GroupedMarker
                developers={devs}
                onClick={onNodeClick}
                onHover={setHoveredDevs}
                onLeave={() => setHoveredDevs(null)}
              />
            </Marker>
          );
        })}
      </Map>

      {/* Reset Map Button */}
      <button
        onClick={resetMap}
        className="absolute bottom-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg 
                   hover:bg-gray-100 transition-colors duration-200 z-10"
        title="Reset map view"
      >
        <RefreshCcw className="h-5 w-5 text-gray-600" />
      </button>

      <AnimatePresence>
        {hoveredDevs && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-4 left-4 z-50"
          >
            <Card className="p-3 bg-white/90 backdrop-blur-sm">
              <div className="space-y-2">
                {hoveredDevs.map(dev => (
                  <div key={dev.id} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={dev.avatarUrl} alt={dev.full_name} />
                      <AvatarFallback><UserCircle className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{dev.full_name}</div>
                      {hoveredDevs.length === 1 && (
                        <div className="text-xs text-gray-500">{dev.location.display_name}</div>
                      )}
                    </div>
                  </div>
                ))}
                {hoveredDevs.length > 1 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {hoveredDevs[0].location.display_name}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}