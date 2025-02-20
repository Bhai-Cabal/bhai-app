"use client";

import { useState } from 'react';
import { Map, Marker, ZoomControl } from 'pigeon-maps';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';

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
}

interface MapProps {
  darkMode?: boolean;
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
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg 
                      transform transition-transform duration-200 group-hover:scale-110">
          <Avatar className="w-full h-full">
            <AvatarImage src={developer.avatarUrl} alt={developer.full_name} />
            <AvatarFallback>
              <UserCircle className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
        </div>
        {/* Pulsing effect */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 animate-ping bg-indigo-400 rounded-full opacity-20" />
        </div>
        {/* Pin */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-4 bg-indigo-500">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-500 
                        rounded-full border-2 border-white" />
        </div>
      </div>
    </div>
  );
}

export default function NetworkGraph({ developers, onNodeClick }: NetworkGraphProps) {
  const [hoveredDev, setHoveredDev] = useState<DeveloperNode | null>(null);
  const [center, setCenter] = useState<[number, number]>([20, 0]);
  const [zoom, setZoom] = useState(2.5); // Increased initial zoom

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Map
        defaultCenter={[20, 0]}
        defaultZoom={3.5}
        center={center}
        zoom={zoom}
        onBoundsChanged={({ center, zoom }) => {
          setCenter(center);
          setZoom(zoom);
        }}
        attribution={false}
        minZoom={2}
        maxZoom={8}
        metaWheelZoom={true}
        metaWheelZoomWarning="Use two fingers to navigate"
        twoFingerDrag={false}
        mouseEvents={true}
        touchEvents={true}
      >
        <ZoomControl />

        {developers.map((developer) => (
          <Marker
            key={developer.id}
            width={48}
            anchor={[developer.location.lat, developer.location.lng]}
          >
            <CustomMarker
              developer={developer}
              onClick={onNodeClick}
              onHover={setHoveredDev}
              onLeave={() => setHoveredDev(null)}
            />
          </Marker>
        ))}
      </Map>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredDev && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-4 left-4 z-50"
          >
            <Card className="p-3 bg-white/90 backdrop-blur-sm shadow-lg">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 ring-2 ring-indigo-500/20">
                  <AvatarImage src={hoveredDev.avatarUrl} alt={hoveredDev.full_name} />
                  <AvatarFallback>
                    <UserCircle className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{hoveredDev.full_name}</div>
                  <div className="text-xs text-gray-500">
                    {hoveredDev.location.city || hoveredDev.location.country || 'Unknown location'}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {hoveredDev.skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 text-xs rounded-full bg-indigo-500/10 text-indigo-600"
                  >
                    {skill}
                  </span>
                ))}
                {hoveredDev.skills.length > 3 && (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                    +{hoveredDev.skills.length - 3}
                  </span>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset view button */}
      <button
        onClick={() => {
          setCenter([20, 0]);
          setZoom(2.5);
        }}
        className="absolute bottom-4 right-4 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50"
        title="Reset view"
      >
        <UserCircle className="h-4 w-4 dark:text-black" />
      </button>
    </div>
  );
}