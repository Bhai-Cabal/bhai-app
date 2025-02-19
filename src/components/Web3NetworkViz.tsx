"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { UserCircle } from 'lucide-react';
import NetworkGraph from './NetworkGraph';

interface DeveloperProfile {
  id: string;
  avatarUrl: string;
  full_name: string;
  title?: string;
  location: {
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  };
  skills: string[];
}

interface Web3NetworkVizProps {
  developers: DeveloperProfile[];
}

export default function Web3NetworkViz({ developers }: Web3NetworkVizProps) {
  const [selectedDeveloper, setSelectedDeveloper] = useState<DeveloperProfile | null>(null);

  if (!developers || developers.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-black/90">
        <p className="text-white">No developers found</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <NetworkGraph 
        developers={developers}
        onNodeClick={setSelectedDeveloper}
      />

      <AnimatePresence>
        {selectedDeveloper && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="absolute top-4 left-4 z-50 w-80"
          >
            <Card className="p-4 bg-black/75 backdrop-blur-md text-white border-none">
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12 ring-2 ring-indigo-500/20">
                  <AvatarImage src={selectedDeveloper.avatarUrl} alt={selectedDeveloper.full_name} />
                  <AvatarFallback>
                    <UserCircle className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedDeveloper.full_name}</h3>
                  {selectedDeveloper.title && (
                    <p className="text-sm text-gray-300">{selectedDeveloper.title}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedDeveloper.location.city && selectedDeveloper.location.country 
                      ? `${selectedDeveloper.location.city}, ${selectedDeveloper.location.country}`
                      : selectedDeveloper.location.city || selectedDeveloper.location.country || 'Location not specified'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDeveloper(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDeveloper.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 