import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Gallery from "./pages/Gallery";
import AcademicCalendar from "./pages/AcademicCalendar";
import Enrollment from "./pages/Enrollment";
import About from "./pages/About";
import Curriculum from "./pages/Curriculum";
import News from "./pages/News";
import Contact from "./pages/Contact";
import Administrators from "./pages/Administrators";
import Staff from "./pages/Staff";
import Students from "./pages/Students";
import Events from "./pages/Events";
import MediaLibrary from "./pages/MediaLibrary";
import Newsletters from "./pages/Newsletters";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/administrators" element={<Administrators />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/students" element={<Students />} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/media-library" element={<MediaLibrary />} />
          <Route path="/news" element={<News />} />
          <Route path="/newsletters" element={<Newsletters />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/events" element={<Events />} />
          <Route path="/calendar" element={<AcademicCalendar />} />
          <Route path="/enrollment" element={<Enrollment />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
