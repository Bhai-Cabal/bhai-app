// components/AccountDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, LogOut } from "lucide-react";
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
    phone: ""
  });

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user?.id)
      .single();

    if (!error && data) {
      setProfile({
        username: data.username,
        full_name: data.full_name,
        email: user?.email?.address || "",
        phone: user?.phone?.number || ""
      });
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
        variant: "destructive"
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
              <AvatarImage src={user?.avatarUrl || ""} />
              <AvatarFallback>{profile.full_name?.charAt(0)}</AvatarFallback>
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
              <Label>Email addresses</Label>
              <div className="flex items-center space-x-2">
                <Input value={profile.email} disabled />
                <span className="text-xs bg-secondary px-2 py-1 rounded">Primary</span>
              </div>
              <Button variant="ghost" size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add email address
              </Button>
            </div>

            <div>
              <Label>Phone numbers</Label>
              <div className="flex items-center space-x-2">
                <Input value={profile.phone} disabled />
                <span className="text-xs bg-secondary px-2 py-1 rounded">Primary</span>
              </div>
              <Button variant="ghost" size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add phone number
              </Button>
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