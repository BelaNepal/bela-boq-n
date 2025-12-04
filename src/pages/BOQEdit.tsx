import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const BOQEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const [boq, setBoq] = useState({
    project_name: "",
    client_name: "",
    description: "",
  });

  // 🔹 FETCH BOQ FROM SUPABASE WITH ADMIN-ONLY ACCESS CONTROL
  useEffect(() => {
    const fetchDataWithAccessControl = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please login to edit BOQs");
          navigate("/auth?mode=login");
          return;
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          setAccessDenied(true);
          toast.error("Access denied. Admin privileges required to edit BOQs.");
          return;
        }

        const { data, error } = await supabase
          .from("boq_projects")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) {
          toast.error("Failed to load BOQ");
          return;
        }

        setBoq({
          project_name: data.project_name,
          client_name: data.client_name,
          description: data.updated_at || "",
        });
      } catch (error) {
        console.error("Error loading BOQ:", error);
        toast.error("Failed to load BOQ");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDataWithAccessControl();
    }
  }, [id, navigate]);

  // 🔹 UPDATE BOQ IN SUPABASE
  const updateBOQ = async () => {
    if (accessDenied) {
      toast.error("You do not have permission to edit this BOQ.");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("boq_projects")
      .update({
        project_name: boq.project_name,
        client_name: boq.client_name,
        description: boq.description,
      })
      .eq("id", id)
      .select();

    console.log("SUPABASE UPDATE RESULT:", { data, error });

    if (error) {
      toast.error("Failed: " + error.message);
    } else {
      toast.success("BOQ updated successfully!");
      navigate(`/boq/view/${id}`);
    }

    setSaving(false);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-10 w-10 text-muted-foreground" />
      </div>
    );

  if (accessDenied) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">You do not have permission to edit this BOQ.</p>
          <Button variant="navy" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <h1 className="text-3xl font-bold">Edit BOQ Project</h1>
        </div>

        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="font-medium">Project Name</label>
              <Input
                value={boq.project_name}
                onChange={(e) =>
                  setBoq({ ...boq, project_name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="font-medium">Client Name</label>
              <Input
                value={boq.client_name}
                onChange={(e) =>
                  setBoq({ ...boq, client_name: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="font-medium">Description</label>
            <Textarea
              className="min-h-[100px]"
              value={boq.description}
              onChange={(e) =>
                setBoq({ ...boq, description: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>

            <Button disabled={saving} onClick={updateBOQ}>
              {saving ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Changes"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BOQEdit;
