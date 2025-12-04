import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import BOQCreate from "./pages/BOQCreate";
import Admin from "./pages/Admin";
import BOQEdit from "./pages/BOQEdit";
import BOQView from "./pages/BOQView";
import AdminItems from "./pages/AdminItems";
import AdminProducts from "./pages/AdminProducts";
import UserManagement from "./pages/UserManagement";
import MyBOQs from "./pages/MyBOQs";
import AdminTables from "./pages/AdminTables";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const queryClient = new QueryClient();

const GAListener = () => {
  const location = useLocation();
  useEffect(() => {
    const id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
    if (!id) return;
    const w = window as unknown as { dataLayer?: unknown[] };
    if (!w.dataLayer) return;
    w.dataLayer.push({ event: "page_view", page_path: location.pathname });
  }, [location.pathname]);
  return null;
};

const App = () => {
  useEffect(() => {
    const id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
    if (!id) return;
    const w = window as unknown as { dataLayer?: unknown[] };
    if (!w.dataLayer) w.dataLayer = [];
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    script.onload = () => {
      (w.dataLayer as unknown[]).push({ js: new Date() });
      (w.dataLayer as unknown[]).push({ config: id });
    };
    document.head.appendChild(script);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GAListener />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/boq/create" element={<BOQCreate />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/boq/view/:id" element={<BOQView />} />
            <Route path="/boq/edit/:id" element={<BOQEdit />} />
            <Route path="/admin/items" element={<AdminItems />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/my-boqs" element={<MyBOQs />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/tables" element={<AdminTables />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Analytics />
        <SpeedInsights />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
