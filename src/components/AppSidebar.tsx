import {
  LayoutDashboard,
  GitBranch,
  BarChart3,
  AlertTriangle,
  Map,
  Settings,
  Boxes,
  FileText,
  SquareKanban,
  Layers,
  Rocket,
  Github,
  BookOpen,
  Megaphone,
  Briefcase,
  Wallet,
  Users,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Cloud Usage", url: "/metrics", icon: BarChart3 },
  { title: "Jira", url: "/jira", icon: SquareKanban },
  { title: "Capabilities", url: "/capabilities", icon: Layers },
  { title: "Releases", url: "/releases", icon: Rocket },
  { title: "Roadmap", url: "/roadmap", icon: Map },
  { title: "Risks & Decisions", url: "/risks", icon: AlertTriangle },
  { title: "GitHub", url: "/github", icon: Github },
  { title: "Backstage", url: "/backstage", icon: BookOpen },
  { title: "Comms & Growth", url: "/communication", icon: Megaphone },
  { title: "Client Mgmt", url: "/clients", icon: Briefcase },
  { title: "Budget", url: "/budget", icon: Wallet },
  { title: "Cybersecurity", url: "/cybersecurity", icon: ShieldAlert },
  { title: "Architecture", url: "/architecture", icon: FileText },
  { title: "People", url: "/people", icon: Users },
  { title: "Snapshot AI", url: "/snapshots", icon: Sparkles },
];

const secondaryItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <GitBranch className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-heading text-sm font-bold text-sidebar-accent-foreground">
                OSES Program
              </h2>
              <p className="text-xs text-sidebar-foreground">Platform Engineering</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Program</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end={item.url === "/"}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="glass-card p-3">
            <p className="text-xs text-muted-foreground">
              Last sync: 2 min ago
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
