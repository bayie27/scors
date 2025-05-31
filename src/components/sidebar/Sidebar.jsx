import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  Boxes,
  ClipboardCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Sidebar({ user, onSignOut, className }) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const menuItems = [
    {
      title: "Users",
      icon: <Users size={20} />,
      href: "/users",
    },
    {
      title: "Venues",
      icon: <Building2 size={20} />,
      href: "/venues",
    },
    {
      title: "Equipment",
      icon: <Boxes size={20} />,
      href: "/equipment",
    },
    {
      title: "Pending Approvals",
      icon: <ClipboardCheck size={20} />,
      href: "/approvals",
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col justify-between h-screen bg-white border-r border-gray-200 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && <h2 className="font-semibold text-lg">SCORS</h2>}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn("ml-auto", collapsed && "mx-auto")}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        <nav className="p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.title}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    collapsed ? "px-2" : "px-3"
                  )}
                  asChild
                >
                  <a href={item.href} className="flex items-center">
                    <span className="mr-3">{item.icon}</span>
                    {!collapsed && <span>{item.title}</span>}
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center justify-start",
            collapsed ? "px-2" : "px-3"
          )}
          onClick={onSignOut}
        >
          {!collapsed ? (
            <>
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-medium truncate">
                  {user?.name || "User"}
                </span>
                <span className="text-xs text-gray-500 truncate">
                  {user?.email}
                </span>
              </div>
              <LogOut size={18} className="ml-auto" />
            </>
          ) : (
            <LogOut size={20} />
          )}
        </Button>
      </div>
    </div>
  );
}
