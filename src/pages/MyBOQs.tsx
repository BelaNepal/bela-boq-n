import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, FileText, Calendar, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingScreen } from "@/components/LoadingScreen";

interface BOQ {
  id: string;
  project_name: string;
  client_name: string | null;
  created_at: string;
}

const MyBOQs = () => {
  const navigate = useNavigate();
  const [boqs, setBoqs] = useState<BOQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndFetchBOQs();
  }, []);

  const checkAuthAndFetchBOQs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth?mode=login");
        return;
      }

      await fetchMyBOQs(user.id);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to verify authentication");
      navigate("/auth?mode=login");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBOQs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("boq_projects")
        .select("id, project_name, client_name, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBoqs(data || []);
    } catch (error: any) {
      console.error("Error fetching BOQs:", error);
      toast.error("Failed to fetch your BOQs");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("boq_projects")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast.success("BOQ deleted successfully");
      setBoqs(boqs.filter((boq) => boq.id !== deleteId));
      setDeleteId(null);
    } catch (error: any) {
      console.error("Error deleting BOQ:", error);
      toast.error("Failed to delete BOQ");
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">My BOQs</h1>
                <p className="text-muted-foreground">View and manage your created BOQs</p>
              </div>
            </div>
            <Button onClick={() => navigate("/boq/create")}>
              Create New BOQ
            </Button>
          </div>

          {boqs.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No BOQs yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first BOQ to get started
              </p>
              <Button onClick={() => navigate("/boq/create")}>
                Create BOQ
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {boqs.map((boq) => (
                <Card
                  key={boq.id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">
                        {boq.project_name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {boq.client_name && (
                          <span>Client: {boq.client_name}</span>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(boq.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/boq/view/${boq.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/boq/edit/${boq.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(boq.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete BOQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this BOQ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyBOQs;
