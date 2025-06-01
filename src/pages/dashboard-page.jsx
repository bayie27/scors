import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { EventCalendar } from "@/components/calendar/event-calendar";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { UsersPage } from "./users-page";
import { Menu, Search } from 'lucide-react';
import scorsLogo from "@/assets/scors-logo.png";

export function DashboardPage({ user, onSignOut }) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState('calendar');

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    // The search is now handled by the EventCalendar component
  }, []);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleMenuItemClick = (view) => {
    setActiveView(view);
  };
  
  // Function to handle event creation from the dashboard's quick add button
  const handleQuickAddEvent = () => {
    const title = prompt('Quick Add Event (Today)');
    if (title) {
      const newEvent = {
        id: Date.now(),
        title,
        start: new Date(),
        end: new Date(new Date().setHours(new Date().getHours() + 1)),
        resource: 'Quick Add'
      };
      console.log('New event from quick add:', newEvent);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10 h-[60px] px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img 
            src={scorsLogo} 
            alt="SCORS" 
            className="h-10 w-auto"
          />
          {user?.organization ? (
            <div className="hidden md:flex items-center space-x-2 border-l border-gray-200 pl-4">
              <span className="text-base font-medium text-gray-800">
                {user.organization.org_code}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-base text-gray-700">
                {user.organization.org_name}
              </span>
            </div>
          ) : (
            <span className="text-sm text-red-500">No organization information</span>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          user={user} 
          onSignOut={onSignOut} 
          onReserve={handleQuickAddEvent}
          collapsed={collapsed}
          onMenuItemClick={handleMenuItemClick}
          activeView={activeView}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden pt-[60px]">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            {activeView === 'calendar' ? (
              <EventCalendar searchTerm={searchTerm} onSearchChange={handleSearch} />
            ) : activeView === 'users' ? (
              <UsersPage />
            ) : (
              <div className="p-6">
                {activeView === 'venues' && 'Venues Management Coming Soon'}
                {activeView === 'equipment' && 'Equipment Management Coming Soon'}
                {activeView === 'approvals' && 'Pending Approvals Coming Soon'}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
