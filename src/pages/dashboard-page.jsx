import React from 'react';
import { cn } from '../lib/utils';
import Sidebar from '../components/layout/sidebar';
import Header from '../components/layout/header';


const DashboardPage = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <div
                className={cn(
                    "grid min-h-screen transition-all duration-300",
                    sidebarCollapsed ? "grid-cols-[80px_1fr]" : "grid-cols-[280px_1fr]",
                )}
            >
                <Sidebar sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />


                <div className="flex flex-col">
                    <Header />
                    <main className="flex-1 overflow-hidden">{children}</main>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;