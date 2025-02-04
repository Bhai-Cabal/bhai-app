import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Globe, Users, Wallet } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="text-2xl font-bold">Web3 Network</div>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </nav>

        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            Connect with Web3 Professionals
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-8">
            Join the premier professional network for Web3 builders, creators, and
            innovators. Connect, collaborate, and grow in the decentralized
            ecosystem.
          </p>
          <Link href="/login">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="p-6">
            <Users className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Professional Network</h3>
            <p className="text-muted-foreground">
              Connect with other professionals in the Web3 space and expand your
              network.
            </p>
          </Card>

          <Card className="p-6">
            <Wallet className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Web3 Native</h3>
            <p className="text-muted-foreground">
              Built for the decentralized web with wallet-based authentication and
              verification.
            </p>
          </Card>

          <Card className="p-6">
            <Globe className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Global Community</h3>
            <p className="text-muted-foreground">
              Join a worldwide community of Web3 professionals and opportunities.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}