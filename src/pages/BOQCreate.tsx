import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import BOQForm from "@/components/BOQForm";
import { toast } from "sonner";

const BOQCreate = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login to create BOQ");
      navigate("/auth?mode=login");
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute top-4 left-4 z-10">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
      <BOQForm />
    </div>
  );
};

export default BOQCreate;
