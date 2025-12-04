import BOQForm from "@/components/BOQForm";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <Button 
        onClick={() => navigate("/admin")} 
        variant="outline"
        size="sm"
        className="absolute top-4 right-4 z-10"
      >
        <Shield className="w-4 h-4 mr-2" />
        Admin
      </Button>
      <BOQForm />
    </div>
  );
};

export default Index;
