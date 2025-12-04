import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { FileText, Package, LogOut, Shield, Database } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoadingScreen } from "@/components/LoadingScreen";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth?mode=login");
        return;
      }

      setUserEmail(user.email || "");

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!roleData);
    } catch (error) {
      console.error("Error checking auth:", error);
      toast.error("Failed to verify authentication");
      navigate("/auth?mode=login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src="/belalogo.png"
              alt="Bela Logo"
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/profile")} className="gap-2">
              <Shield className="w-4 h-4" />
              Profile
            </Button>
            <Button variant="navy" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Welcome back{isAdmin && ", Admin"}!
            </h2>
            <p className="text-muted-foreground">
              Select an option below to get started
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Create BOQ Card */}
            <Card
              className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
              onClick={() => navigate("/boq/create")}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create New BOQ</h3>
              <p className="text-muted-foreground">
                Start a new Bill of Quantities for your project with predefined items and custom specifications.
              </p>
            </Card>

            {/* User Controls */}
            {!isAdmin && (
              <Card
                className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                onClick={() => navigate("/my-boqs")}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">View My BOQs</h3>
                <p className="text-muted-foreground">
                  View and manage your created BOQ projects.
                </p>
              </Card>
            )}

            {/* Admin Controls */}
            {isAdmin && (
              <>
                <Card
                  className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => navigate("/admin")}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">View All BOQs</h3>
                  <p className="text-muted-foreground">
                    View and manage all BOQ projects in the system. Admin access only.
                  </p>
                </Card>

                <Card
                  className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => navigate("/admin/items")}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Manage Items</h3>
                  <p className="text-muted-foreground">
                    Add, edit, or remove predefined BOQ items and their standard rates.
                  </p>
                </Card>

                <Card
                  className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => navigate("/admin/products")}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Manage Products</h3>
                  <p className="text-muted-foreground">
                    Create, update, and delete records in the products catalog.
                  </p>
                </Card>

                <Card
                  className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => navigate("/users")}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Manage Users</h3>
                  <p className="text-muted-foreground">
                    View all users and reset their passwords. Admin access only.
                  </p>
                </Card>

                <Card
                  className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => navigate("/admin/tables")}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Database className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Manage Tables</h3>
                  <p className="text-muted-foreground">
                    View, edit, export, and import data from all database tables.
                  </p>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
