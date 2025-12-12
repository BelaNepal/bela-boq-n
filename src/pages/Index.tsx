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
      <Button
        onClick={() => navigate("/customer-info")}
        variant="outline"
        size="sm"
        className="absolute top-4 right-28 z-10 border-[#EF7E1E] text-[#EF7E1E] hover:bg-[#EF7E1E]/10"
      >
        Customer-Info-Form
      </Button>
      <BOQForm />
    </div>
  );
};

export default Index;
