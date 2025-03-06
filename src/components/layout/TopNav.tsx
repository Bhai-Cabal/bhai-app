import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, User, LogOut } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { AccountDialog } from "../AccountDialog";

interface TopNavProps {
  className?: string;
}

export function TopNav({ className }: TopNavProps) {
  const { user, logout } = usePrivy();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProfilePicture = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from("users")
        .select("profile_picture_path")
        .eq("auth_id", user.id)
        .single();

      if (!error && data?.profile_picture_path) {
        const { data: imageUrl } = await supabase
          .storage
          .from("profile-pictures")
          .getPublicUrl(data.profile_picture_path);

        if (imageUrl) {
          setProfilePictureUrl(imageUrl.publicUrl);
        }
      }
    };

    fetchProfilePicture();
  }, [user?.id]);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/80 backdrop-blur-sm",
      className
    )}>
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex flex-row gap-2 font-semibold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
        <img className="w-8 h-8 rounded-xl border" src="/bhai-cabal.jpg" ></img>
          Bhai Cabal
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profilePictureUrl || ''} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setAccountDialogOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AccountDialog
        open={accountDialogOpen}
        onClose={() => setAccountDialogOpen(false)}
      />
    </header>
  );
}
