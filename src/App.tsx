import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Upload from "./pages/Upload";
import Categories from "./pages/Categories";
import CategoryFolder from "./pages/CategoryFolder";
import SmartTags from "./pages/SmartTags";
import Search from "./pages/Search";
import Chat from "./pages/Chat";
import DocumentDetail from "./pages/DocumentDetail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background flex">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <div className="flex w-full">
                      <Sidebar />
                      <div className="flex-1">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="upload" element={<Upload />} />
                          <Route path="categories" element={<Categories />} />
                          <Route path="category/:categoryId" element={<CategoryFolder />} />
                          <Route path="smart-tags" element={<SmartTags />} />
                          <Route path="search" element={<Search />} />
                          <Route path="chat" element={<Chat />} />
                          <Route path="document/:id" element={<DocumentDetail />} />
                          <Route path="profile" element={<Profile />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
