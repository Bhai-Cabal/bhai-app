"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { checkUserRegistered } from "@/lib/supabase"; // Import the function to check if the user is registered

export default function LoginPage() {
  const { login, ready, authenticated, user } = usePrivy(); // Get the user object from usePrivy
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      if (ready && authenticated && user) {
        
        const isRegistered = await checkUserRegistered(user.id, user.email?.address ?? ""); // Check if the user is registered
        if (isRegistered) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      }
    };
    handleRedirect();
  }, [ready, authenticated, user, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Link href="/" className="absolute top-4 left-4">
        <Button variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </Link>
      
      <Card className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Welcome Back</h1>
        <Button
          className="w-full"
          size="lg"
          onClick={() => login()}
        >
          Sign In with Email or Wallet
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </Card>
    </div>
  );
}