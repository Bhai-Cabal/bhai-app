// components/AccountDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/lib/supabase";
import { Loader2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AccountDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AccountDialog({ open, onClose }: AccountDialogProps) {
  const { user, logout } = usePrivy();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    full_name: "",
    email: "",
  });
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    // Add event listener for profile picture updates
    const handleProfilePictureUpdate = (event: CustomEvent<{ url: string }>) => {
      setProfilePictureUrl(event.detail.url);
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener);

    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener);
    };
  }, []);

  const fetchProfile = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("username, full_name, profile_picture_path")
        .eq("auth_id", user.id)
        .single();

      if (error) throw error;

      setProfile({
        username: data.username,
        full_name: data.full_name,
        email: user?.email?.address || "",
      });

      if (data.profile_picture_path) {
        const { data: imageUrl } = await supabase
          .storage
          .from("profile-pictures")
          .getPublicUrl(data.profile_picture_path);

        if (imageUrl) {
          setProfilePictureUrl(imageUrl.publicUrl);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to fetch profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (field: string, value: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ [field]: value })
        .eq("auth_id", user?.id);

      if (error) throw error;

      toast({
        title: "Updated successfully",
        description: `Your ${field} has been updated.`
      });

      await fetchProfile();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              {profilePictureUrl ? (
                <AvatarImage src={profilePictureUrl} alt={profile.full_name} />
              ) : (
                <AvatarFallback>{profile.full_name?.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="font-medium">{profile.full_name}</h3>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Username</Label>
              <div className="flex space-x-2">
                <Input 
                  value={profile.username}
                  onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                />
                <Button 
                  size="sm"
                  onClick={() => handleUpdate("username", profile.username)}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update
                </Button>
              </div>
            </div>

            <div>
              <Label>Full Name</Label>
              <div className="flex space-x-2">
                <Input 
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                />
                <Button 
                  size="sm"
                  onClick={() => handleUpdate("full_name", profile.full_name)}
                  disabled={isLoading}
                >
                  Update
                </Button>
              </div>
            </div>

            <div>
              <Label>Email address</Label>
              <Input value={profile.email} disabled />
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-3"
            onClick={() => logout()}
          >
            <LogOut className="mr-3 h-8 w-8" />
            <span className="text-base font-medium">Logout</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}