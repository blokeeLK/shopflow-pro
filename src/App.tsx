import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreLayout } from "@/components/StoreLayout";
import Index from "./pages/Index";
import ProductPage from "./pages/ProductPage";
import CategoryPage from "./pages/CategoryPage";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AccountPage from "./pages/AccountPage";
import CheckoutPage from "./pages/CheckoutPage";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminStock from "./pages/admin/AdminStock";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminMarketing from "./pages/admin/AdminMarketing";
import AdminFinancial from "./pages/admin/AdminFinancial";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminSiteEditor from "./pages/admin/AdminSiteEditor";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminFaq from "./pages/admin/AdminFaq";
import AdminDesign from "./pages/admin/AdminDesign";
import FaqPage from "./pages/FaqPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<StoreLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/produto/:slug" element={<ProductPage />} />
                <Route path="/categoria/:slug" element={<CategoryPage />} />
                <Route path="/carrinho" element={<CartPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cadastro" element={<SignupPage />} />
                <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/conta" element={<AccountPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/faq" element={<FaqPage />} />
              </Route>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/produtos" element={<AdminProducts />} />
                <Route path="/admin/produtos/:id" element={<AdminProductForm />} />
                <Route path="/admin/categorias" element={<AdminCategories />} />
                <Route path="/admin/pedidos" element={<AdminOrders />} />
                <Route path="/admin/estoque" element={<AdminStock />} />
                <Route path="/admin/clientes" element={<AdminCustomers />} />
                <Route path="/admin/banners" element={<AdminBanners />} />
                <Route path="/admin/marketing" element={<AdminMarketing />} />
                <Route path="/admin/financeiro" element={<AdminFinancial />} />
                <Route path="/admin/logs" element={<AdminLogs />} />
                <Route path="/admin/editor" element={<AdminSiteEditor />} />
                <Route path="/admin/configuracoes" element={<AdminSettings />} />
                <Route path="/admin/design" element={<AdminDesign />} />
                <Route path="/admin/faq" element={<AdminFaq />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
