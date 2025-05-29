import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

export default function Sidebar(
    { sidebarCollapsed, setSidebarCollapsed }
) {
    const collapsed = sidebarCollapsed;


    const onToggle = () => {
        setSidebarCollapsed(!collapsed);
    }

    return (
        <div
            className={cn(
                "bg-white border-r border-gray-200 transition-all duration-300",
                sidebarCollapsed ? "w-20" : "w-72"
            )}
        >
            {/* SIDEBAR CONTENT */}
            <div className="p-4 border-b border-gray-200">
                <Button variant="ghost" size="sm" onClick={onToggle} className="w-full justify-start p-2">
                    {collapsed ? <ChevronRight className="w-4 h-4" />
                        : <ChevronLeft className="w-4 h-4" />}
                    {!collapsed && <span className="ml-2">Collapse</span>}
                </Button>
            </div>
        </div>
    )
}