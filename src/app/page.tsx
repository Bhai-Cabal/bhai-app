"use client";

import React, { useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Globe, Users, Wallet, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// A new component to render animated 3D-inspired shapes in the background.
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ perspective: '1000px' }}>
      <motion.div
        className="absolute bg-purple-300 rounded-full opacity-30"
        style={{ width: 150, height: 150, top: '10%', left: '5%' }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
      />
      <motion.div
        className="absolute bg-blue-300 rounded-lg opacity-30"
        style={{ width: 120, height: 120, top: '50%', left: '80%' }}
        animate={{ rotateX: 360, rotateY: 360 }}
        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
      />
      <motion.div
        className="absolute bg-green-300 rounded-full opacity-30"
        style={{ width: 100, height: 100, top: '70%', left: '20%' }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
      />
      <motion.div
        className="absolute bg-yellow-300 rounded-lg opacity-30"
        style={{ width: 180, height: 180, top: '30%', left: '50%' }}
        animate={{ rotateX: 360, rotateY: 360 }}
        transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
      />
    </div>
  );
};

export default function LandingPage() {
  const { user,logout } = usePrivy();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("users")
        .select("profile_picture_path")
        .eq("auth_id", user.id)
        .single();

      if (!error && data) {
        const { data: imageUrl } = await supabase
          .storage
          .from("profile-pictures")
          .getPublicUrl(data.profile_picture_path);

        if (imageUrl) {
          setProfilePicture(imageUrl.publicUrl);
        }
      }
    };

    fetchProfilePicture();
  }, [user]);

  const featureCards = [
    {
      icon: Users,
      title: "Professional Network",
      description: "Connect with Web3 professionals and expand your network.",
      iconColor: "text-blue-500"
    },
    {
      icon: Wallet,
      title: "Web3 Native",
      description: "Wallet-based authentication for decentralized verification.",
      iconColor: "text-green-500"
    },
    {
      icon: Globe,
      title: "Global Community",
      description: "Join a worldwide community of Web3 innovators.",
      iconColor: "text-purple-500"
    }
  ];

  return (
    <div className="relative bg-background overflow-hidden">
      {/* Animated background shapes */}
      <AnimatedBackground />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <nav className="flex justify-between items-center mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold"
          >
            Web3 Network
          </motion.div>
          <div className="flex items-center space-x-4">
            
            <Link href={user ? "/dashboard/jobs" : "/jobs"}>
              Jobs
            </Link>
            {user ? (
              <>
                <Link href="/dashboard">
                  Dashboard
                </Link>
                {profilePicture ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/profile" className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => logout()} className="flex items-center text-red-500">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/profile">
                    <Button variant="outline">Profile</Button>
                  </Link>
                )}
              </>
            ) : (
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </nav>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Connect with Web3 Professionals
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join the premier professional network for Web3 builders, creators, and innovators.
          </p>
          <Link href="/login">
            <Button size="lg">Get Started</Button>
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {featureCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.2 }}
            >
              <Card>
                <CardHeader>
                  <card.icon className={`w-12 h-12 mb-4 ${card.iconColor}`} />
                  <CardTitle>{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
