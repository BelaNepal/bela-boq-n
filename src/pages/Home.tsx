import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src="/belalogo.png"
              alt="Bela Nepal"
              className="h-10 w-auto cursor-pointer"
              onClick={async () => {
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session) navigate('/dashboard');
                  else navigate('/');
                } catch (e) {
                  navigate('/');
                }
              }}
            />
            <h1 className="text-xl font-bold text-foreground">Bela Nepal Industries</h1>
          </div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Button variant="default" className="bg-[#EF7E1E] hover:bg-[#d66c15] text-white" onClick={() => navigate("/customer-info")}>
              Estimate Your Project
            </Button>
            <Button variant="outline" onClick={() => navigate("/auth?mode=login")}>
              Login
            </Button>
            <Button variant="navy" onClick={() => navigate("/auth?mode=signup")}>
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-4xl">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Professional <span className="text-primary">BOQ Management</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create, manage, and export detailed Bill of Quantities with ease.
            Streamline your construction project estimates.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate("/auth?mode=signup")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth?mode=login")}>
              Login to Dashboard
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/50 backdrop-blur-sm py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear() > 2024 ? `2024-${new Date().getFullYear()}` : "2024"} Bela Nepal Industries. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
