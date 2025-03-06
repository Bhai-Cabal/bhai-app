import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onLogout: () => void;
}

export const Header = ({ onLogout }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-background/80 backdrop-blur-sm border-b">
      <div className="max-w-2xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm sm:text-base">Web3 Professional Network</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button 
            variant="outline" 
            onClick={onLogout}
            size="sm"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
