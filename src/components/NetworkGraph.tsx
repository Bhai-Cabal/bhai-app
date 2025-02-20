"use client";

import { useState, useEffect, useMemo } from 'react';
import { Map, Marker, ZoomControl } from 'pigeon-maps';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserCircle, ArrowLeftRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from './ui/button';

interface DeveloperNode {
  id: string;
  full_name: string;
  avatarUrl: string;
  location: {
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  };
  skills: string[];
}

interface NetworkGraphProps {
  developers: DeveloperNode[];
  onNodeClick: (developer: DeveloperNode) => void;
  showResetButton?: boolean;
}

interface LocationGroup {
  location: {
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  };
  developers: DeveloperNode[];
}

// Custom marker component
function CustomMarker({ developer, onClick, onHover, onLeave }: any) {
  return (
    <div
      className="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
      onClick={() => onClick(developer)}
      onMouseEnter={() => onHover(developer)}
      onMouseLeave={onLeave}
    >
      <div className="relative">
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-lg 
                      transform transition-transform duration-200 group-hover:scale-110">
          <Avatar className="w-full h-full">
            <AvatarImage src={developer.avatarUrl} alt={developer.full_name} />
            <AvatarFallback>
              <UserCircle className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
        {/* Pulsing effect */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 animate-ping bg-indigo-400 rounded-full opacity-20" />
        </div>
        {/* Pin */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-indigo-500">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-500 
                        rounded-full border-2 border-white" />
        </div>
      </div>
    </div>
  );
}

// Update the GroupedMarker's pin positioning
function GroupedMarker({ group, onClick, onHover, onLeave, zoom }: { 
  group: LocationGroup; 
  onClick: (dev: DeveloperNode) => void;
  onHover: (dev: DeveloperNode[]) => void;
  onLeave: () => void;
  zoom: number;
}) {
  const count = group.developers.length;
  const mainDev = group.developers[0];

  // Calculate size based on zoom level
  const baseSize = 36; // Base size in pixels
  const sizeMultiplier = Math.min(1.2, Math.max(1, zoom / 6)); // Slowly increase size with zoom
  const avatarSize = baseSize * sizeMultiplier;
  const secondaryAvatarSize = (avatarSize * 0.625); // 20px at base size

  return (
    <div
      className="absolute cursor-pointer group"
      onClick={() => onClick(mainDev)}
      onMouseEnter={() => onHover(group.developers)}
      onMouseLeave={onLeave}
      style={{
        transform: 'translate(-50%, -50%)',
        width: avatarSize,
        height: avatarSize
      }}
    >
      {/* Main avatar */}
      <div 
        className="absolute rounded-full overflow-hidden border-2 border-white shadow-lg 
                   transform transition-transform duration-200 group-hover:scale-110"
        style={{
          width: avatarSize,
          height: avatarSize,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <Avatar className="w-full h-full">
          <AvatarImage src={mainDev.avatarUrl} alt={mainDev.full_name} />
          <AvatarFallback>
            <UserCircle className="w-1/2 h-1/2" />
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Second avatar */}
      {count > 1 && (
        <div 
          className="absolute rounded-full overflow-hidden border-2 border-white shadow-lg bg-background"
          style={{
            width: secondaryAvatarSize,
            height: secondaryAvatarSize,
            right: -4,
            bottom: -4
          }}
        >
          <Avatar className="w-full h-full">
            <AvatarImage src={group.developers[1].avatarUrl} alt={group.developers[1].full_name} />
            <AvatarFallback>
              <UserCircle className="w-1/2 h-1/2" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Count badge */}
      {count > 2 && (
        <div className="absolute -right-1 -top-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full border border-white shadow-lg dark:text-black">
          +{count - 2}
        </div>
      )}

      {/* Pin - Made more precise */}
      <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
        <div className="w-[2px] h-[6px] bg-indigo-500">
          <div className="absolute -top-[2px] left-1/2 w-[6px] h-[6px] bg-indigo-500 
                         rounded-full border border-white transform -translate-x-1/2" />
        </div>
      </div>
    </div>
  );
}

// Update the tiles function to use Cartodb Voyager tiles
const cartoTiles = (x: number, y: number, z: number, dpr?: number) => {
  return `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}${dpr === 2 ? '@2x' : ''}.png`;
};

export default function NetworkGraph({ developers, onNodeClick, showResetButton = false }: NetworkGraphProps) {
  const [hoveredDevs, setHoveredDevs] = useState<DeveloperNode[] | null>(null);
  const [center, setCenter] = useState<[number, number]>([20, 0]);
  const [zoom, setZoom] = useState(2);

  // Group developers by location
  const groupedDevelopers = useMemo(() => {
    const groups: { [key: string]: LocationGroup } = {};
    
    developers.forEach(dev => {
      const key = `${dev.location.lat},${dev.location.lng}`;
      if (!groups[key]) {
        groups[key] = {
          location: dev.location,
          developers: []
        };
      }
      groups[key].developers.push(dev);
    });

    return Object.values(groups);
  }, [developers]);

  // Reset map function
  const resetMap = () => {
    setCenter([20, 0]);
    setZoom(2);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Map
        defaultCenter={[20, 20]}
        defaultZoom={3}
        center={center}
        zoom={zoom}
        onBoundsChanged={({ center, zoom }) => {
          setCenter(center);
          setZoom(zoom);
        }}
        attribution={<>&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a></>}
        minZoom={2}
        maxZoom={8}
        metaWheelZoom={true}
        metaWheelZoomWarning="Use two fingers to navigate"
        twoFingerDrag={false}
        mouseEvents={true}
        touchEvents={true}
        provider={(x, y, z, dpr) => cartoTiles(x, y, z, dpr)}
        dprs={[1, 2]} // Support retina displays
        boxClassname="brightness-[0.97] contrast-[0.95]" // Remove grayscale, keep subtle styling
      >
        <ZoomControl />

        {groupedDevelopers.map((group) => (
          <Marker
            key={`${group.location.lat},${group.location.lng}`}
            width={16} // Smaller base width for more precise positioning
            anchor={[group.location.lat, group.location.lng]}
            offset={[0, 8]} // Offset to align pin point with location
          >
            <GroupedMarker
              group={group}
              onClick={onNodeClick}
              onHover={setHoveredDevs}
              onLeave={() => setHoveredDevs(null)}
              zoom={zoom}
            />
          </Marker>
        ))}
      </Map>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredDevs && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-4 left-4 z-50"
          >
            <Card className="p-3 bg-white/90 backdrop-blur-sm shadow-lg">
              <div className="space-y-3">
                {hoveredDevs.map(dev => (
                  <div key={dev.id} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 ring-2 ring-indigo-500/20">
                      <AvatarImage src={dev.avatarUrl} alt={dev.full_name} />
                      <AvatarFallback><UserCircle className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{dev.full_name}</div>
                      <div className="text-xs text-gray-500">
                        {dev.location.city || dev.location.country || 'Unknown location'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset button */}
      {showResetButton && (
        <Button
          onClick={resetMap}
          variant="outline"
          size="icon"
          className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm shadow-lg"
          title="Reset map view"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}