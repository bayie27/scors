"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Calendar,
  Clock,
  HelpCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Edit3,
  Trash2,
  Building2,
  Mail,
  Phone,
  Plus,
  Filter,
  Eye,
  Settings,
  ChevronLeft,
  CalendarDays,
  List,
  Bell,
  Wrench,
  FileText,
  Info,
} from "lucide-react"

// Status component for consistent styling
const StatusBadge = ({ type, label, icon: Icon }) => {
  const styles = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    reserved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    cancelled: "bg-gray-100 text-gray-800 border-gray-200",
  }

  return (
    <div className={`flex items-center gap-2 p-4 rounded-md border ${styles[type]}`}>
      <Icon className="h-5 w-5" />
      <div>
        <h4 className="font-semibold">{label}</h4>
        <p className="text-sm">
          {type === "pending"
            ? "Awaiting admin approval."
            : type === "reserved"
              ? "Reservation approved and confirmed."
              : type === "rejected"
                ? "Reservation was not approved. Check admin feedback for details."
                : "Reservation was cancelled by you or an admin."}
        </p>
      </div>
    </div>
  )
}

// Feature card component
const FeatureCard = ({ icon: Icon, title, description, steps }) => (
  <div className="border p-5 rounded-lg shadow-sm bg-white">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-[#006241] rounded-lg flex items-center justify-center">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h4 className="font-semibold text-[#006241] text-lg">{title}</h4>
    </div>
    <p className="text-gray-600 mb-4">{description}</p>
    {steps && (
      <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700">
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    )}
  </div>
)

// Contact card component
const ContactCard = ({ title, email, phone, hours, description }) => (
  <div className="border p-5 rounded-lg shadow-sm">
    <h4 className="font-semibold text-[#006241] mb-3 text-lg">{title}</h4>
    <ul className="space-y-3">
      <li className="flex items-start gap-2">
        <Mail className="h-5 w-5 mt-0.5 text-gray-500" />
        <span>{email}</span>
      </li>
      <li className="flex items-start gap-2">
        <Phone className="h-5 w-5 mt-0.5 text-gray-500" />
        <span>{phone}</span>
      </li>
      {hours && (
        <li className="flex items-start gap-2">
          <Clock className="h-5 w-5 mt-0.5 text-gray-500" />
          <span>{hours}</span>
        </li>
      )}
    </ul>
    <p className="mt-3 text-sm text-gray-600">{description}</p>
  </div>
)

// FAQ item component
const FaqItem = ({ question, answer }) => (
  <li className="py-3">
    <h4 className="font-medium text-gray-900 mb-1">{question}</h4>
    <p className="text-gray-600">{answer}</p>
  </li>
)

// Calendar view explanation component
const CalendarViewCard = ({ icon: Icon, title, description, features }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="h-5 w-5 text-[#006241]" />
      <h4 className="font-semibold text-[#006241]">{title}</h4>
    </div>
    <p className="text-gray-700 mb-3">{description}</p>
    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
      {features.map((feature, index) => (
        <li key={index}>{feature}</li>
      ))}
    </ul>
  </div>
)

export default function SCORSUserManual() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <header className="text-center mb-8 md:mb-12">
        <div className="w-16 h-16 bg-[#006241] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
          <BookOpen className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">SCORS User Manual</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
          Student Center Online Reservation System - Complete Guide for Organization Users
        </p>
        <Badge variant="outline" className="text-sm">
          Version 2.0 - Updated Guide
        </Badge>
      </header>

      {/* Tabbed Navigation */}
      <Tabs defaultValue="overview" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <Info className="h-4 w-4 hidden sm:inline" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 hidden sm:inline" />
            <span>Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="reservations" className="flex items-center gap-1.5">
            <Plus className="h-4 w-4 hidden sm:inline" />
            <span>Reservations</span>
          </TabsTrigger>
          <TabsTrigger value="managing" className="flex items-center gap-1.5">
            <Edit3 className="h-4 w-4 hidden sm:inline" />
            <span>Managing</span>
          </TabsTrigger>
          <TabsTrigger value="venues-equipment" className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4 hidden sm:inline" />
            <span>Venues & Equipment</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 hidden sm:inline" />
            <span>Support</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader className="bg-gradient-to-r from-[#006241] to-[#008055] text-white">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Info className="h-6 w-6" />
                Welcome to SCORS
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="prose max-w-none mb-8">
                <p className="text-lg text-gray-700 mb-6">
                  The Student Center Online Reservation System (SCORS) is designed to help organizations at DLSL
                  efficiently reserve venues and equipment for student activities. This comprehensive system provides an
                  intuitive interface for managing all your reservation needs.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <FeatureCard
                  icon={Calendar}
                  title="Calendar Management"
                  description="Navigate through different calendar views and manage your reservations with ease."
                />
                <FeatureCard
                  icon={Building2}
                  title="Venue Booking"
                  description="Browse available venues, check their facilities, and make informed reservation decisions."
                />
                <FeatureCard
                  icon={Wrench}
                  title="Equipment Rental"
                  description="Access equipment catalog and add required items to your venue reservations."
                />
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="key-features">
                  <AccordionTrigger className="text-lg font-medium">Key Features & Benefits</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-[#006241] flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          For Organizations
                        </h4>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                          <li>Real-time calendar view of all reservations</li>
                          <li>Easy venue and equipment booking process</li>
                          <li>Automatic approval workflow</li>
                          <li>Notification system for status updates</li>
                          <li>Comprehensive venue and equipment information</li>
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-[#006241] flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          System Capabilities
                        </h4>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                          <li>Multiple calendar views (Month, Week, Day, Agenda)</li>
                          <li>Advanced filtering and search options</li>
                          <li>Reservation editing and cancellation</li>
                          <li>Venue capacity and amenity information</li>
                          <li>Equipment specifications and availability</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader className="bg-gradient-to-r from-[#006241] to-[#008055] text-white">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="h-6 w-6" />
                Calendar View & Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="calendar-views">
                  <AccordionTrigger className="text-lg font-medium">Calendar Views</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <CalendarViewCard
                        icon={CalendarDays}
                        title="Month View"
                        description="Overview of all events in the month"
                        features={[
                          "See all reservations at a glance",
                          "Identify busy periods quickly",
                          "Navigate between months easily",
                        ]}
                      />
                      <CalendarViewCard
                        icon={Calendar}
                        title="Week View"
                        description="Detailed display of events within a specific week"
                        features={[
                          "Hour-by-hour breakdown",
                          "Perfect for detailed planning",
                          "See time conflicts clearly",
                        ]}
                      />
                      <CalendarViewCard
                        icon={Clock}
                        title="Day View"
                        description="Focused schedule for a single day"
                        features={[
                          "Detailed daily schedule",
                          "Precise time slot viewing",
                          "Ideal for same-day planning",
                        ]}
                      />
                      <CalendarViewCard
                        icon={List}
                        title="Agenda View"
                        description="List format showing upcoming reservations"
                        features={[
                          "Chronological list format",
                          "Easy to scan upcoming events",
                          "Includes reservation details",
                        ]}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="navigation-controls">
                  <AccordionTrigger className="text-lg font-medium">Navigation Controls</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-[#006241] mb-3 flex items-center gap-2">
                            <ChevronLeft className="h-5 w-5" />
                            Time Navigation
                          </h4>
                          <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            <li>
                              Use <strong>{"< Prev"}</strong> and <strong>{"Next >"}</strong> buttons to navigate
                              between time periods
                            </li>
                            <li>
                              Click <strong>Today</strong> to return to the current day's schedule
                            </li>
                            <li>Use date picker for quick navigation to specific dates</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#006241] mb-3 flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Interactive Features
                          </h4>
                          <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            <li>Click on any time slot to begin a new reservation</li>
                            <li>Click on existing events to view full details</li>
                            <li>Hover over events for quick preview information</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="filters-search">
                  <AccordionTrigger className="text-lg font-medium">Filters & Search</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-[#006241] mb-3 flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filter Options
                          </h4>
                          <p className="text-gray-700 mb-3">
                            Use Filter Options (top-left of calendar) to display events by:
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-gray-700">
                            <li>Venue type or specific venue</li>
                            <li>Reservation status (Reserved, Pending, Rejected)</li>
                            <li>Organization or event type</li>
                            <li>Date range</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#006241] mb-3 flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Search Functionality
                          </h4>
                          <p className="text-gray-700 mb-3">
                            Use the Search Bar to locate specific reservations using:
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-gray-700">
                            <li>Event names or keywords</li>
                            <li>Organization names</li>
                            <li>Venue names</li>
                            <li>Reservation IDs</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sidebar-management">
                  <AccordionTrigger className="text-lg font-medium">Sidebar Management</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-800 mb-2">
                        <strong>Pro Tip:</strong> Collapse/Expand the sidebar to maximize calendar viewing space,
                        especially useful when working on smaller screens or when you need to see more calendar details.
                      </p>
                      <p className="text-blue-700 text-sm">
                        The sidebar contains quick access to Venues, Equipment, Help sections, and the Reserve button.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Making Reservations Tab */}
        <TabsContent value="reservations">
          <Card>
            <CardHeader className="bg-gradient-to-r from-[#006241] to-[#008055] text-white">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Plus className="h-6 w-6" />
                Making Reservations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="create-reservation">
                  <AccordionTrigger className="text-lg font-medium">Create a New Reservation</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold text-[#006241] mb-3">Ways to Start a Reservation:</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <Button size="sm" className="bg-[#006241] hover:bg-[#005235]">
                            <Plus className="h-4 w-4 mr-1" />
                            Reserve
                          </Button>
                          <div>
                            <p className="font-medium">Sidebar Button</p>
                            <p className="text-sm text-gray-600">Click the "+ Reserve" button in the sidebar</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 border-2 border-dashed border-[#006241] rounded flex items-center justify-center">
                            <Plus className="h-4 w-4 text-[#006241]" />
                          </div>
                          <div>
                            <p className="font-medium">Calendar Click</p>
                            <p className="text-sm text-gray-600">Click on an open time slot in any calendar view</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="reservation-form">
                  <AccordionTrigger className="text-lg font-medium">Reservation Form Details</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-[#006241] mb-3">Required Information:</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <Calendar className="h-5 w-5 mt-0.5 text-[#006241]" />
                              <div>
                                <p className="font-medium">Date & Time</p>
                                <p className="text-sm text-gray-600">
                                  Use date/time pickers to select your preferred schedule
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Building2 className="h-5 w-5 mt-0.5 text-[#006241]" />
                              <div>
                                <p className="font-medium">Venue</p>
                                <p className="text-sm text-gray-600">Select from dropdown list of available venues</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <Wrench className="h-5 w-5 mt-0.5 text-[#006241]" />
                              <div>
                                <p className="font-medium">Equipment (Optional)</p>
                                <p className="text-sm text-gray-600">
                                  Choose any required equipment from the checklist
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <FileText className="h-5 w-5 mt-0.5 text-[#006241]" />
                              <div>
                                <p className="font-medium">Purpose & Details</p>
                                <p className="text-sm text-gray-600">Describe the event and any special requirements</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Bell className="h-5 w-5 mt-0.5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-800">Submission Process</p>
                            <p className="text-blue-700 text-sm mt-1">
                              Click <strong>Submit</strong> to send your reservation request for approval. You will
                              receive notifications about the status of your request.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="notification-system">
                  <AccordionTrigger className="text-lg font-medium">Notification System</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-[#006241] mb-3 flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        You will receive notifications when:
                      </h4>
                      <ul className="list-disc pl-5 space-y-2 text-gray-700">
                        <li>
                          <strong>Reservation is approved:</strong> Your event is confirmed and ready
                        </li>
                        <li>
                          <strong>Reservation is rejected:</strong> Check admin feedback for reasons and requirements
                        </li>
                        <li>
                          <strong>Reservation is updated:</strong> Any changes made by administrators
                        </li>
                        <li>
                          <strong>Reminders:</strong> Upcoming event notifications
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="best-practices">
                  <AccordionTrigger className="text-lg font-medium">Best Practices for Reservations</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-3">✓ Do's</h4>
                        <ul className="list-disc pl-5 space-y-1 text-green-700 text-sm">
                          <li>Submit reservations at least 3 days in advance</li>
                          <li>Check calendar for conflicts before submitting</li>
                          <li>Be specific in your event description</li>
                          <li>Include all necessary equipment in your request</li>
                          <li>Provide contact information for follow-up</li>
                        </ul>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-3">✗ Don'ts</h4>
                        <ul className="list-disc pl-5 space-y-1 text-red-700 text-sm">
                          <li>Don't submit last-minute reservations</li>
                          <li>Don't leave purpose field empty or vague</li>
                          <li>Don't forget to check venue capacity</li>
                          <li>Don't ignore equipment policies</li>
                          <li>Don't submit duplicate reservations</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Managing Reservations Tab */}
        <TabsContent value="managing">
          <Card>
            <CardHeader className="bg-gradient-to-r from-[#006241] to-[#008055] text-white">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Edit3 className="h-6 w-6" />
                Managing Existing Reservations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="viewing-reservations">
                  <AccordionTrigger className="text-lg font-medium">Viewing Your Reservations</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 mb-4">
                        All your organization's reservations are displayed on the calendar with different colors and
                        indicators based on their status.
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-[#006241] mb-2">Calendar Display</h4>
                          <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                            <li>Click any reservation to view full details</li>
                            <li>Status indicators show approval state</li>
                            <li>Color coding helps identify different event types</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#006241] mb-2">Detail View</h4>
                          <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                            <li>Complete event information</li>
                            <li>Equipment list and specifications</li>
                            <li>Admin comments and feedback</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="reservation-statuses">
                  <AccordionTrigger className="text-lg font-medium">
                    Understanding Reservation Statuses
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <StatusBadge type="pending" label="Pending" icon={Clock} />
                      <StatusBadge type="reserved" label="Reserved" icon={CheckCircle} />
                      <StatusBadge type="rejected" label="Rejected" icon={XCircle} />
                      <StatusBadge type="cancelled" label="Cancelled" icon={AlertTriangle} />
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-800 text-sm">
                        <strong>Note:</strong> Status changes trigger automatic notifications. Make sure to check your
                        email and system notifications regularly.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="modifying-reservations">
                  <AccordionTrigger className="text-lg font-medium">Modifying Reservations</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-[#006241] mb-3 flex items-center gap-2">
                          <Edit3 className="h-5 w-5" />
                          Editing Process
                        </h4>
                        <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                          <li>Click on your reservation in the calendar</li>
                          <li>Select the "Edit" button in the reservation details popup</li>
                          <li>Update the necessary information (date, time, venue, equipment, etc.)</li>
                          <li>Add any additional notes or changes in the comments section</li>
                          <li>Click "Submit" to resubmit for approval</li>
                        </ol>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-600" />
                          <div>
                            <p className="font-medium text-yellow-800">Important Notes:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-700 text-sm">
                              <li>Only reservations with "Pending" or "Reserved" status can be edited</li>
                              <li>Edited reservations will reset to "Pending" status for re-approval</li>
                              <li>Major changes may require additional review time</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="canceling-reservations">
                  <AccordionTrigger className="text-lg font-medium">Canceling Reservations</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-[#006241] mb-3 flex items-center gap-2">
                          <Trash2 className="h-5 w-5" />
                          Cancellation Process
                        </h4>
                        <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                          <li>Click on the reservation you want to cancel</li>
                          <li>Select the "Cancel" button in the reservation details</li>
                          <li>Provide a reason for cancellation (optional but recommended)</li>
                          <li>Confirm the cancellation</li>
                        </ol>
                      </div>

                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Clock className="h-5 w-5 mt-0.5 text-red-600" />
                          <div>
                            <p className="font-medium text-red-800">Cancellation Policy:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-red-700 text-sm">
                              <li>
                                <strong>Recommended:</strong> Cancel at least 24 hours in advance
                              </li>
                              <li>Late cancellations may affect future reservation privileges</li>
                              <li>Equipment reservations should be cancelled 48 hours in advance</li>
                              <li>Contact CSAO for emergency cancellations</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="admin-feedback">
                  <AccordionTrigger className="text-lg font-medium">Viewing Admin Feedback</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 mb-4">
                        When a reservation is rejected or requires modifications, administrators will provide detailed
                        feedback to help you understand the requirements.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <FileText className="h-5 w-5 mt-0.5 text-[#006241]" />
                          <div>
                            <p className="font-medium">Feedback Location</p>
                            <p className="text-sm text-gray-600">
                              Admin comments appear in the reservation details popup under "Admin Feedback" section
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Info className="h-5 w-5 mt-0.5 text-[#006241]" />
                          <div>
                            <p className="font-medium">Common Feedback Topics</p>
                            <p className="text-sm text-gray-600">
                              Venue availability conflicts, missing information, policy violations, or alternative
                              suggestions
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Venues & Equipment Tab */}
        <TabsContent value="venues-equipment">
          <Card>
            <CardHeader className="bg-gradient-to-r from-[#006241] to-[#008055] text-white">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-6 w-6" />
                Venues & Equipment Management
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="venue-browsing">
                  <AccordionTrigger className="text-lg font-medium">Exploring Available Venues</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-[#006241] mb-3">Access Venues Section</h4>
                        <p className="text-gray-700 mb-3">
                          Navigate to the Venues section from the sidebar to browse all available spaces and their
                          detailed information.
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="border p-4 rounded-lg">
                          <h4 className="font-semibold text-[#006241] mb-3 flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Venue Details Include:
                          </h4>
                          <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                            <li>
                              <strong>Capacity:</strong> Maximum occupancy and seating arrangements
                            </li>
                            <li>
                              <strong>Facilities & Amenities:</strong> Available equipment and features
                            </li>
                            <li>
                              <strong>Photos/Floor Plans:</strong> Visual layout and space overview
                            </li>
                            <li>
                              <strong>Location Map:</strong> Exact location within the campus
                            </li>
                            <li>
                              <strong>Usage Policies:</strong> Rules and restrictions for the venue
                            </li>
                          </ul>
                        </div>
                        <div className="border p-4 rounded-lg">
                          <h4 className="font-semibold text-[#006241] mb-3 flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Venue Filters:
                          </h4>
                          <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                            <li>
                              <strong>Capacity:</strong> Filter by minimum/maximum occupancy
                            </li>
                            <li>
                              <strong>Features:</strong> Audio/visual equipment, accessibility, etc.
                            </li>
                            <li>
                              <strong>Availability:</strong> Show only available venues for specific dates
                            </li>
                            <li>
                              <strong>Location:</strong> Filter by building or area
                            </li>
                            <li>
                              <strong>Type:</strong> Classrooms, auditoriums, outdoor spaces, etc.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="check-availability">
                  <AccordionTrigger className="text-lg font-medium">Check Venue Availability</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 mt-0.5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-800">Real-time Availability Check</p>
                          <p className="text-blue-700 text-sm mt-1 mb-3">
                            Click "Check on Calendar" from any venue details page to see real-time booking status and
                            available time slots.
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-blue-700 text-sm">
                            <li>View current and upcoming reservations</li>
                            <li>Identify available time slots</li>
                            <li>See recurring bookings and patterns</li>
                            <li>Plan around existing events</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="equipment-management">
                  <AccordionTrigger className="text-lg font-medium">Equipment Management</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-[#006241] mb-3 flex items-center gap-2">
                          <Wrench className="h-5 w-5" />
                          View Equipment Catalog
                        </h4>
                        <p className="text-gray-700 mb-3">
                          Access the Equipment section via the sidebar to browse all available equipment and their
                          specifications.
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="border p-4 rounded-lg">
                          <h4 className="font-semibold text-[#006241] mb-3">Equipment Details Include:</h4>
                          <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                            <li>
                              <strong>Specifications:</strong> Technical details and capabilities
                            </li>
                            <li>
                              <strong>Usage Instructions:</strong> Setup and operation guidelines
                            </li>
                            <li>
                              <strong>Availability:</strong> Current status and booking schedule
                            </li>
                            <li>
                              <strong>Compatibility:</strong> Venue compatibility information
                            </li>
                            <li>
                              <strong>Policies:</strong> Usage restrictions and requirements
                            </li>
                          </ul>
                        </div>
                        <div className="border p-4 rounded-lg">
                          <h4 className="font-semibold text-[#006241] mb-3">Adding Equipment to Reservations:</h4>
                          <ol className="list-decimal pl-5 space-y-1 text-gray-700 text-sm">
                            <li>During venue reservation process</li>
                            <li>Select required equipment from checklist</li>
                            <li>Review equipment policies and restrictions</li>
                            <li>Confirm equipment availability for your dates</li>
                            <li>Submit reservation with equipment included</li>
                          </ol>
                        </div>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-600" />
                          <div>
                            <p className="font-medium text-yellow-800">Equipment Usage Policy</p>
                            <p className="text-yellow-700 text-sm mt-1">
                              Review equipment guidelines and restrictions before use. Some equipment may require
                              special training or additional approval. Contact the Student Center Office for specialized
                              equipment requests.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support">
          <Card>
            <CardHeader className="bg-gradient-to-r from-[#006241] to-[#008055] text-white">
              <CardTitle className="flex items-center gap-2 text-xl">
                <HelpCircle className="h-6 w-6" />
                Help & Support
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq">
                  <AccordionTrigger className="text-lg font-medium">Frequently Asked Questions</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <ul className="space-y-4 divide-y">
                        <FaqItem
                          question="What if my reservation is rejected?"
                          answer="Check the admin comments in your reservation details for the specific reason. Address any issues mentioned and submit a new reservation with the required corrections."
                        />
                        <FaqItem
                          question="How do I find available time slots for a specific venue?"
                          answer="Use the calendar view and filter options to display only your desired venue. Available time slots will appear as empty spaces on the calendar."
                        />
                        <FaqItem
                          question="Why can't I reserve certain venues?"
                          answer="Some venues may be restricted by your organization type, require special permission, or have specific usage policies. Contact CSAO for clarification on venue restrictions."
                        />
                        <FaqItem
                          question="How far in advance can I make reservations?"
                          answer="Reservations can be made up to 3 months in advance. It's recommended to submit requests at least 3 days before your event date."
                        />
                        <FaqItem
                          question="Can I modify a reservation after it's been approved?"
                          answer="Yes, you can edit approved reservations, but they will need to go through the approval process again. Major changes may require additional review time."
                        />
                        <FaqItem
                          question="What happens if I need to cancel last minute?"
                          answer="While 24-hour advance notice is recommended, emergency cancellations can be made by contacting CSAO directly. Frequent last-minute cancellations may affect future reservation privileges."
                        />
                        <FaqItem
                          question="How do I request equipment that's not listed in the catalog?"
                          answer="Contact the Student Center Office directly for special equipment requests. They can advise on availability and any additional requirements or costs."
                        />
                        <FaqItem
                          question="Can I see other organizations' reservations?"
                          answer="You can see when venues are booked but cannot view detailed information about other organizations' reservations for privacy reasons."
                        />
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="contact-support">
                  <AccordionTrigger className="text-lg font-medium">Contact & Support</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <ContactCard
                        title="CSAO Support"
                        email="csao@dlsu.edu.ph"
                        phone="(02) 8524-4611 ext. 2345"
                        hours="Monday-Friday, 8:00 AM - 5:00 PM"
                        description="Contact CSAO Support for venue policies, special requests, reservation issues, or general inquiries about the Student Center facilities."
                      />
                      <ContactCard
                        title="Technical Support"
                        email="it-support@dlsu.edu.ph"
                        phone="(02) 8524-4611 ext. 1234"
                        hours="Monday-Friday, 8:00 AM - 5:00 PM"
                        description="Contact Technical Support for system access issues, login problems, bugs, or other technical difficulties with SCORS."
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Additional Support Resources:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-blue-700 text-sm">
                        <li>Visit the Help Center from the sidebar for quick guides and tutorials</li>
                        <li>Use the Support Form for non-urgent inquiries</li>
                        <li>Check the DLSU Student Center website for updated policies</li>
                        <li>Join the SCORS user community forum for tips and best practices</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="troubleshooting">
                  <AccordionTrigger className="text-lg font-medium">Common Troubleshooting</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-[#006241] mb-3">Login Issues</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                          <li>Ensure you're using your official DLSU credentials</li>
                          <li>Clear your browser cache and cookies</li>
                          <li>Try accessing from a different browser or device</li>
                          <li>Contact IT Support if problems persist</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-[#006241] mb-3">Calendar Not Loading</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                          <li>Check your internet connection</li>
                          <li>Refresh the page (Ctrl+F5 or Cmd+Shift+R)</li>
                          <li>Disable browser extensions temporarily</li>
                          <li>Try a different browser</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-[#006241] mb-3">Reservation Form Issues</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                          <li>Ensure all required fields are completed</li>
                          <li>Check date/time format requirements</li>
                          <li>Verify venue availability before submitting</li>
                          <li>Contact CSAO if specific venues aren't appearing</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200">
        <div className="text-center text-gray-600">
          <p className="mb-2">
            <strong>SCORS</strong> - Student Center Online Reservation System
          </p>
          <p className="text-sm">For additional assistance, visit the Help Center or contact CSAO Support</p>
        </div>
      </footer>
    </div>
  )
}
