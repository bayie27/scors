import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { EventCalendar } from "@/components/calendar/event-calendar";

export function DashboardPage({ user, onSignOut }) {
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
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">SCORS Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button 
              onClick={onSignOut} 
              variant="outline" 
              className="text-sm"
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Calendar Only */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Event Calendar</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleQuickAddEvent}
              >
                + Add Event
              </Button>
            </div>
          </div>
          <div className="p-4">
            <EventCalendar />
          </div>
        </div>
      </main>
    </div>
  );
}
