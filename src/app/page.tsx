"use client";

import React, { useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X, Twitter, Send, UserCircle, LogOut, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/lib/supabase";
import Web3NetworkViz from "@/components/Web3NetworkViz";
import { parseLocation } from '@/lib/locationParser';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export default function LandingPage() {
  const { user } = usePrivy();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDevelopers();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchProfilePicture();
    }
  }, [user?.id]);

  const fetchDevelopers = async () => {
    try {
      const { data: users, error } = await supabase
        .from("users")
        .select(`
          id,
          full_name,
          location,
          profile_picture_path,
          skill_ids
        `)
        .not('location', 'is', null);

      if (error) throw error;

      if (users) {
        const devProfiles = users.map(user => {
          const parsedLocation = parseLocation(user.location);
          return {
            id: user.id,
            avatarUrl: '', // Will be set below
            full_name: user.full_name,
            location: {
              lat: parsedLocation.lat,
              lng: parsedLocation.lng,
              city: parsedLocation.city,
              country: parsedLocation.country
            },
            skills: ['Web3', 'Blockchain'] // Default skills
          };
        });

        const developersWithAvatars = await Promise.all(
          devProfiles.map(async (dev) => {
            // Add avatar URL logic here if needed
            return dev;
          })
        );

        setDevelopers(developersWithAvatars);
      }
    } catch (error) {
      console.error("Error fetching developers:", error);
    }
  };

  const fetchProfilePicture = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("profile_picture_path")
        .eq("auth_id", user?.id)
        .single();

      if (error) throw error;

      if (data?.profile_picture_path) {
        const { data: imageUrl } = await supabase
          .storage
          .from("profile-pictures")
          .getPublicUrl(data.profile_picture_path);

        if (imageUrl) {
          setProfilePicture(imageUrl.publicUrl);
        }
      }
    } catch (error) {
      console.error("Error fetching profile picture:", error);
    }
  };

  const { logout } = usePrivy();

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Navigation - Updated styles */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
              Bhai Cabal
            </Link>

            {/* Desktop Navigation - Enhanced styles */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/jobs" className="text-sm font-medium hover:text-primary transition-colors">
                Jobs
              </Link>
              {user ? (
                <div className="flex items-center space-x-6">
                  <Link href="/dashboard">
                    <Button variant="default" className="h-10 px-6 font-medium bg-primary/10 hover:bg-primary/20 text-primary">
                      Dashboard
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-10 w-10 rounded-full p-0 hover:bg-accent/50">
                        {profilePicture ? (
                          <Avatar className="h-9 w-9 ring-2 ring-border">
                            <AvatarImage src={profilePicture} alt="Profile" />
                            <AvatarFallback><UserCircle /></AvatarFallback>
                          </Avatar>
                        ) : (
                          <UserCircle className="h-6 w-6" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/profile" className="flex items-center cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Profile Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => logout()} className="text-red-500 focus:text-red-500">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Link href="/login">
                  <Button variant="default" className="h-10 px-6 font-medium bg-primary hover:bg-primary/90">
                    Join Network
                  </Button>
                </Link>
              )}
              <div className="flex items-center space-x-6 border-l pl-6">
                <a href="https://twitter.com/bhaicabal" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="hover:text-primary transition-all hover:scale-110">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="https://t.me/bhaicabal" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="hover:text-primary transition-all hover:scale-110">
                  <Send className="h-5 w-5" />
                </a>
                <ThemeToggle />
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Updated with profile */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden absolute w-full bg-background/95 backdrop-blur-md border-b"
            >
              <div className="container mx-auto px-4 py-4 space-y-4">
                <Link href="/jobs" className="block hover:text-primary">
                  Jobs
                </Link>
                {user ? (
                  <>
                    <Link href="/dashboard" className="block">
                      <Button variant="default" className="w-full bg-primary/10 hover:bg-primary/20 text-primary">
                        Dashboard
                      </Button>
                    </Link>
                    <div className="pt-4 border-t">
                      <Button 
                        variant="ghost" 
                        onClick={() => logout()} 
                        className="w-full justify-start text-red-500 hover:text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  </>
                ) : (
                  <Link href="/login" className="block">
                    <Button variant="default" className="w-full bg-primary hover:bg-primary/90">
                      Join Network
                    </Button>
                  </Link>
                )}
                <div className="flex items-center space-x-4 pt-4 border-t">
                  <a href="https://twitter.com/bhaicabal" target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href="https://t.me/bhaicabal" target="_blank" rel="noopener noreferrer">
                    <Send className="h-5 w-5" />
                  </a>
                  <ThemeToggle />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Updated Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="h-screen relative">
          {/* Enhanced gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/40 to-transparent z-10"/>
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/20 to-transparent z-10"/>
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/5 to-background/20 z-10"/>

          {/* Map Background - Full height and width */}
          <div className="absolute inset-0">
            <Web3NetworkViz 
              developers={developers}
            />
          </div>

          {/* Hero Content - Better vertical positioning */}
          <div className="relative z-20">
            <div className="container mx-auto min-h-screen flex items-center justify-center px-4 pt-20">
              <div className="max-w-5xl w-full text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-block mb-6 px-6 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20"
                >
                  <span className="text-sm font-medium text-primary">
                    Web3's Premier Professional Network
                  </span>
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent leading-tight"
                >
                  Connect, Build, Grow
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto"
                >
                  Join a thriving community of Web3 professionals, innovators, and builders. 
                  Connect with like-minded individuals and unlock opportunities in the 
                  decentralized ecosystem.
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-center gap-6"
                >
                  {!user && (
                    <>
                      <Link href="/login">
                        <Button 
                          size="lg" 
                          className="text-lg h-14 px-10 rounded-full hover:scale-105 transition-transform"
                        >
                          Join Bhai Cabal
                        </Button>
                      </Link>
                      <Link 
                        href="/jobs" 
                        className="text-lg font-medium hover:text-primary transition-colors flex items-center gap-2"
                      >
                        Browse Opportunities
                        <motion.span
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          →
                        </motion.span>
                      </Link>
                    </>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
