import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart, Warehouse,
  Image, Megaphone, BarChart3, ClipboardList, Users, LogOut, Menu, X, Store, Code
} from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Produtos", url: "/admin/produtos", icon: Package },
  { title: "Categorias", url: "/admin/categorias", icon: FolderTree },
  { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingCart },
  { title: "Estoque", url: "/admin/estoque", icon: Warehouse },
  { title: "Clientes", url: "/admin/clientes", icon: Users },
  { title: "Banners", url: "/admin/banners", icon: Image },
  { title: "Marketing", url: "/admin/marketing", icon: Megaphone },
  { title: "Financeiro", url: "/admin/financeiro", icon: BarChart3 },
  { title: "Logs", url: "/admin/logs", icon: ClipboardList },
  { title: "Editor do Site", url: "/admin/editor", icon: Code },
];

export function AdminSidebar() {
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? "w-16" : "w-60"} bg-card border-r flex flex-col transition-all duration-200 flex-shrink-0`}>
      <div className="h-14 flex items-center justify-between px-3 border-b">
        {!collapsed && (
          <span className="font-display font-bold text-foreground text-sm flex items-center gap-2">
            <Store className="h-5 w-5 text-accent" /> Admin
          </span>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary">
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/admin"}
            className="flex items-center gap-3 px-3 py-2 mx-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            activeClassName="bg-accent/10 text-accent font-medium"
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-2">
        <NavLink to="/" className="flex items-center gap-3 px-3 py-2 mx-0 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Store className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Ver Loja</span>}
        </NavLink>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
