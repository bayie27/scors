import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { EventCalendar } from "@/components/calendar/event-calendar";
import { Sidebar } from "@/components/sidebar/Sidebar";

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar user={user} onSignOut={onSignOut} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">SCORS Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleQuickAddEvent}
              >
                + Add Event
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content - Calendar */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-auto">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Event Calendar</h3>
              </div>
            </div>
            <div className="p-4">
              <EventCalendar />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
