import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { EventCalendar } from "@/components/calendar/event-calendar";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { UsersPage } from "./users-page";
import { VenuesPage } from "./venues-page";
import { Menu, Search, Plus } from 'lucide-react';
import scorsLogo from "@/assets/scors-logo.png";
import { format } from 'date-fns';

export function DashboardPage({ user, onSignOut }) {
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
    setActiveView(view);
    setSearchTerm(''); // Reset search term when changing views
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
      // Here you would typically add the event to your state or make an API call
      // For example:
      // addEvent(newEvent);
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
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleQuickAddEvent}
              className="hidden md:flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>Quick Add</span>
            </Button>
          </div>
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
          onReserve={handleReserveClick}
          collapsed={collapsed}
          onMenuItemClick={handleMenuItemClick}
          activeView={activeView}
        />

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col overflow-hidden pt-[60px] transition-all duration-300 ease-in-out ${collapsed ? 'ml-16' : 'ml-64'}`}>
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            {activeView === 'calendar' ? (
              <>
                <EventCalendar 
                  searchTerm={searchTerm} 
                  onSearchChange={handleSearch} 
                  selectedSlot={selectedSlot}
                  onSlotSelected={() => setIsReserveModalOpen(false)}
                />
              </>
            ) : activeView === 'users' ? (
              <UsersPage />
            ) : activeView === 'venues' ? (
              <VenuesPage />
            ) : (
              <div className="p-6">
                {activeView === 'equipment' && 'Equipment Management Coming Soon'}
                {activeView === 'approvals' && 'Pending Approvals Coming Soon'}
              </div>
            )}
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
