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


export function Sidebar({ user, onSignOut, onReserve, className, collapsed = false }) {

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
        "flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out justify-between",
        collapsed ? "w-16" : "w-64",
        className
      )}
      style={{ height: 'calc(100vh - 60px)', marginTop: '60px' }}
    >
      <div className="flex-1 overflow-y-auto">
        {/* Reserve Button */}
        <div className="p-3">
          <Button
            variant="default"
            size="sm"
            className={cn(
              "w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white h-9",
              collapsed ? "px-2 justify-center" : "px-4"
            )}
            onClick={onReserve}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {!collapsed && <span>Reserve</span>}
          </Button>
        </div>

        <nav className="p-2 mt-2">
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

      <div className="border-t p-4 mt-auto">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar_url} alt={user?.email} />
              <AvatarFallback>
                {user?.email?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.organization?.org_name}
                </p>
              </div>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={onSignOut}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sign out</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
