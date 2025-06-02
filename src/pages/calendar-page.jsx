import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { EventCalendar } from "@/components/calendar/event-calendar";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { UsersPage } from "./users-page";
import { VenuesPage } from "./venues-page";
import { EquipmentPage } from "./equipment-page";
import { HelpPage } from "./help-page";
import { Users, Building2, Boxes, ClipboardCheck, LogOut, ChevronLeft, ChevronRight, Calendar, HelpCircle, Menu } from "lucide-react";
import scorsLogo from "@/assets/scors-logo.png";
import { format } from 'date-fns';
import { useRoleAccess } from "@/lib/useRoleAccess.jsx";

export function CalendarPage({ user, onSignOut }) {
  const { isAdmin, canManageUsers } = useRoleAccess();
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState('calendar');
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    // The search is now handled by the EventCalendar component
  }, []);

  const handleReserveClick = () => {
    setIsReserveModalOpen(true);
    setSelectedSlot({
      activity_date: format(new Date(), 'yyyy-MM-dd'),
      start_time: format(new Date(), 'HH:mm'),
      end_time: format(new Date(new Date().getTime() + 60 * 60 * 1000), 'HH:mm') // 1 hour later
    });
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleMenuItemClick = (view) => {
    // If user is trying to access Users page or Approvals but doesn't have permission, redirect to Calendar
    if ((view === 'users' || view === 'approvals') && !canManageUsers()) {
      console.warn('Access denied: User does not have permission to view this page');
      setActiveView('calendar');
    } else {
      setActiveView(view);
    }
    setSearchTerm(''); // Reset search term when changing views
  };
  
  // Ensure user is redirected from restricted pages on component mount
  useEffect(() => {
    if ((activeView === 'users' || activeView === 'approvals') && !canManageUsers()) {
      setActiveView('calendar');
    }
  }, [canManageUsers, activeView]);
  
  // Function to handle event creation from the calendar's quick add button
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

  // Render the appropriate component based on activeView
  const renderContent = () => {
    switch (activeView) {
      case 'calendar':
        return (
          <EventCalendar 
            searchTerm={searchTerm} 
            onSearchChange={handleSearch}
            selectedSlot={selectedSlot}
            onSlotSelected={() => setIsReserveModalOpen(false)}
            onQuickAddEvent={handleQuickAddEvent}
          />
        );
      case 'users':
        return <UsersPage />;
      case 'venues':
        return <VenuesPage />;
      case 'equipment':
        return <EquipmentPage />;
      case 'help':
        return <HelpPage />;
      case 'approvals':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Coming Soon</h2>
              <p className="text-gray-500">This feature is under development.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
              <p className="text-gray-500">The requested page could not be found.</p>
            </div>
          </div>
        );
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
              {isAdmin && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-base font-medium text-blue-600">
                    Admin
                  </span>
                </>
              )}
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
          onReserve={handleReserveClick}
          collapsed={collapsed}
          onMenuItemClick={handleMenuItemClick}
          activeView={activeView}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden pt-[60px] h-[calc(100vh-60px)]">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Reservation Modal */}
      {isReserveModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">New Reservation</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <div className="p-2 border rounded">
                    {selectedSlot.activity_date}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <div className="p-2 border rounded">
                      {selectedSlot.start_time}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <div className="p-2 border rounded">
                      {selectedSlot.end_time}
                    </div>
                  </div>
                </div>
                {/* Add more form fields as needed */}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsReserveModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // Handle form submission
                    console.log('Reservation submitted', selectedSlot);
                    setIsReserveModalOpen(false);
                  }}
                >
                  Create Reservation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
