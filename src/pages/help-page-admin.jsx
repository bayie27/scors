"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import {
  Calendar,
  FileText,
  Users,
  Building,
  Wrench,
  Clock,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
} from "lucide-react"

export default function UserManual() {
  const [activeSection, setActiveSection] = useState("overview")

  const modules = [
    { id: "calendar", name: "Calendar", icon: Calendar, color: "#006241" },
    { id: "reservations", name: "Reservations", icon: FileText, color: "#006241" },
    { id: "users", name: "Users", icon: Users, color: "#006241" },
    { id: "venues", name: "Venues", icon: Building, color: "#006241" },
    { id: "equipment", name: "Equipment", icon: Wrench, color: "#006241" },
    { id: "approvals", name: "Pending Approvals", icon: Clock, color: "#006241" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-center mb-4">
            <img src="scors-logo.png" alt="SCORS Logo" className="h-16" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Administrator Manual</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList
  className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8 border border-green-600 bg-white shadow-sm rounded-xl overflow-hidden"
>
  <TabsTrigger
    value="overview"
    className="flex items-center justify-center gap-2 py-2 px-3 font-semibold text-xs md:text-sm transition-all duration-200 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 hover:bg-green-50 hover:shadow-md hover:scale-105 hover:text-green-800 hover:border-b-2 hover:border-green-600 data-[state=active]:bg-green-100 data-[state=active]:text-green-900 data-[state=active]:border-b-2 data-[state=active]:border-green-700"
    aria-label="Overview"
  >
    <FileText className="w-4 h-4" style={{ color: '#006241' }} />
    <span>Overview</span>
  </TabsTrigger>
  <TabsTrigger
    value="modules"
    className="flex items-center justify-center gap-2 py-2 px-3 font-semibold text-xs md:text-sm transition-all duration-200 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 hover:bg-green-50 hover:shadow-md hover:scale-105 hover:text-green-800 hover:border-b-2 hover:border-green-600 data-[state=active]:bg-green-100 data-[state=active]:text-green-900 data-[state=active]:border-b-2 data-[state=active]:border-green-700"
    aria-label="Modules"
  >
    <Wrench className="w-4 h-4" style={{ color: '#006241' }} />
    <span>Modules</span>
  </TabsTrigger>
  <TabsTrigger
    value="workflows"
    className="flex items-center justify-center gap-2 py-2 px-3 font-semibold text-xs md:text-sm transition-all duration-200 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 hover:bg-green-50 hover:shadow-md hover:scale-105 hover:text-green-800 hover:border-b-2 hover:border-green-600 data-[state=active]:bg-green-100 data-[state=active]:text-green-900 data-[state=active]:border-b-2 data-[state=active]:border-green-700"
    aria-label="Workflows"
  >
    <Clock className="w-4 h-4" style={{ color: '#006241' }} />
    <span>Workflows</span>
  </TabsTrigger>
  <TabsTrigger
    value="support"
    className="flex items-center justify-center gap-2 py-2 px-3 font-semibold text-xs md:text-sm transition-all duration-200 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 hover:bg-green-50 hover:shadow-md hover:scale-105 hover:text-green-800 hover:border-b-2 hover:border-green-600 data-[state=active]:bg-green-100 data-[state=active]:text-green-900 data-[state=active]:border-b-2 data-[state=active]:border-green-700"
    aria-label="Support"
  >
    <Mail className="w-4 h-4" style={{ color: '#006241' }} />
    <span>Support</span>
  </TabsTrigger>
</TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#006241] rounded flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <span>Welcome to SCORS</span>
                </CardTitle>
                <CardDescription>Student Center Online Reservation System - Administrator Guide</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Welcome to the Administrator User Manual for the Student Center Online Reservation System (SCORS).
                  This manual is intended to guide CSAO staff and administrators at De La Salle Lipa in effectively managing the
                  SCORS platform.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Key Features</h4>
                  <ul className="text-blue-800 space-y-1 text-sm">
                    <li>• Real-time reservation management</li>
                    <li>• Interactive calendar interface</li>
                    <li>• Venue and equipment tracking</li>
                    <li>• Streamlined approval workflows</li>
                    <li>• Organization and user management</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Module Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module) => (
                <Card key={module.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center space-x-2">
                      <module.icon className="w-5 h-5" style={{ color: module.color }} />
                      <span>{module.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {module.id === "calendar" &&
                        "Visual representation of all scheduled reservations with multiple view options."}
                      {module.id === "reservations" &&
                        "Create and manage reservation requests with detailed form inputs."}
                      {module.id === "users" && "Manage user accounts and organization memberships."}
                      {module.id === "venues" && "Add, edit, and maintain venue information and availability."}
                      {module.id === "equipment" && "Track and manage equipment inventory and availability."}
                      {module.id === "approvals" && "Review and process pending reservation requests."}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {/* Calendar Module */}
              <AccordionItem value="calendar" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5" style={{ color: "#006241" }} />
                    <span className="font-semibold">Calendar Page</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <p className="text-gray-700">
                    The Calendar page provides a visual representation of all scheduled reservations with multiple views
                    and interactive elements.
                  </p>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-[#006241]">Search and Filter Functionality</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4 text-[#006241]" />
                        <span className="font-medium">Live Search:</span>
                        <span className="text-sm text-gray-600">Quick retrieval by keyword</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-[#006241]" />
                        <span className="font-medium">Filter Options:</span>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">Organization</Badge>
                          <Badge variant="outline">Venue</Badge>
                          <Badge variant="outline">Equipment</Badge>
                          <Badge variant="outline">Status</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-[#006241]">Calendar Views</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white border rounded-lg p-3">
                        <h5 className="font-medium">Month View</h5>
                        <p className="text-sm text-gray-600">Grid format showing all monthly reservations</p>
                      </div>
                      <div className="bg-white border rounded-lg p-3">
                        <h5 className="font-medium">Week View</h5>
                        <p className="text-sm text-gray-600">Detailed breakdown of current week events</p>
                      </div>
                      <div className="bg-white border rounded-lg p-3">
                        <h5 className="font-medium">Day View</h5>
                        <p className="text-sm text-gray-600">Focus on specific date bookings</p>
                      </div>
                      <div className="bg-white border rounded-lg p-3">
                        <h5 className="font-medium">List View</h5>
                        <p className="text-sm text-gray-600">Chronological list of upcoming reservations</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-[#006241]">Navigation Controls</h4>
                    <div className="flex items-center space-x-4 bg-gray-50 rounded-lg p-4">
                      <Button variant="outline" size="sm">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Prev
                      </Button>
                      <Button variant="outline" size="sm">
                        Today
                      </Button>
                      <Button variant="outline" size="sm">
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Reservations Module */}
              <AccordionItem value="reservations" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5" style={{ color: "#006241" }} />
                    <span className="font-semibold">Reservation Management</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-[#006241]">Creating a Reservation</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 bg-gray-50 rounded-lg p-4">
                        <div className="w-6 h-6 bg-[#006241] rounded-full flex items-center justify-center text-white text-sm font-bold">
                          1
                        </div>
                        <div>
                          <p className="font-medium">Click "+ Reserve" button</p>
                          <p className="text-sm text-gray-600">Located below the header of calendar interface</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 bg-gray-50 rounded-lg p-4">
                        <div className="w-6 h-6 bg-[#006241] rounded-full flex items-center justify-center text-white text-sm font-bold">
                          2
                        </div>
                        <div>
                          <p className="font-medium">Complete required fields</p>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p>• Purpose of Reservation</p>
                            <p>• Start and End - Date and Time</p>
                            <p>• Organization Name</p>
                            <p>• Venue Selection</p>
                            <p>• Equipment Selection</p>
                            <p>• Reserved by</p>
                            <p>• Officer in Charge</p>
                            <p>• Contact Number</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 bg-gray-50 rounded-lg p-4">
                        <div className="w-6 h-6 bg-[#006241] rounded-full flex items-center justify-center text-white text-sm font-bold">
                          3
                        </div>
                        <div>
                          <p className="font-medium">Submit for approval</p>
                          <p className="text-sm text-gray-600">Request appears in Pending Approvals page</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Users Module */}
              <AccordionItem value="users" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5" style={{ color: "#006241" }} />
                    <span className="font-semibold">User and Organization Management</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-[#006241]">User Management</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Eye className="w-4 h-4 text-[#006241]" />
                          <span className="text-sm">View searchable user list</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Search className="w-4 h-4 text-[#006241]" />
                          <span className="text-sm">Search user by name</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Plus className="w-4 h-4 text-[#006241]" />
                          <span className="text-sm">Add user by email</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Edit className="w-4 h-4 text-[#006241]" />
                          <span className="text-sm">Edit user details</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Trash2 className="w-4 h-4 text-[#006241]" />
                          <span className="text-sm">Delete user account</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-[#006241]">Organization Management</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Search className="w-4 h-4 text-[#006241]" />
                          <span className="text-sm">Search organization</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Plus className="w-4 h-4 text-[#006241]" />
                          <span className="text-sm">Add new organization</span>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <p className="text-sm text-blue-800">
                            <strong>Required fields:</strong> Organization Acronym and Full Name
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Venues Module */}
              <AccordionItem value="venues" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5" style={{ color: "#006241" }} />
                    <span className="font-semibold">Venue Management</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  <div className="space-y-6">
                    <section>
                      <h4 className="font-semibold text-[#006241] text-lg mb-3">Adding a New Venue</h4>
                      <p className="text-gray-700 mb-4">
                        To add a new venue to the system, follow these steps:
                      </p>
                      <ol className="list-decimal pl-6 space-y-4 text-gray-700">
                        <li>
                          <span className="font-medium">Click the "+ Add Venue" button</span> in the top-right corner of the Venues page.
                        </li>
                        <li>
                          <span className="font-medium">Fill in the venue details</span> in the form that appears:
                          <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li>
                              <span className="font-medium">Name*:</span> Enter a clear, descriptive name for the venue (e.g., "Main Auditorium")
                            </li>
                            <li>
                              <span className="font-medium">Status*:</span> Select the current status from the dropdown (Active, Inactive, or Under Maintenance)
                            </li>
                            <li>
                              <span className="font-medium">Location:</span> Specify the building and floor (e.g., "Building B, 3rd Floor")
                            </li>
                            <li>
                              <span className="font-medium">Capacity:</span> Enter the maximum number of people the venue can accommodate
                            </li>
                            <li>
                              <span className="font-medium">Description:</span> Provide additional details about the venue's features, layout, or restrictions
                            </li>
                          </ul>
                        </li>
                        <li>
                          <span className="font-medium">Add available equipment</span> by typing the item name and clicking "Add"
                          <div className="bg-gray-50 p-3 rounded-lg mt-2 text-sm text-gray-600">
                            <p>Tip: List all available equipment (e.g., Projector, Whiteboard, Sound System) to help users make informed reservations.</p>
                          </div>
                        </li>
                        <li>
                          <span className="font-medium">Upload venue images</span> by dragging and dropping files or clicking to browse
                          <div className="bg-gray-50 p-3 rounded-lg mt-2 text-sm text-gray-600">
                            <p>Recommended: High-quality images that showcase the venue's features and layout help users make better decisions.</p>
                          </div>
                        </li>
                        <li>
                          <span className="font-medium">Click "Add Venue"</span> to save the new venue to the system
                        </li>
                      </ol>
                    </section>

                    <section className="pt-4">
                      <h4 className="font-semibold text-[#006241] text-lg mb-3">Editing Venue Information</h4>
                      <p className="text-gray-700 mb-4">
                        To modify an existing venue's details:
                      </p>
                      <ol className="list-decimal pl-6 space-y-3 text-gray-700">
                        <li>Locate the venue in the venues list using the search bar if needed</li>
                        <li>Click on the venue you wish to edit</li>
                        <li>Update any of the venue's details in the form</li>
                        <li>Click "Save Changes" to apply your updates</li>
                      </ol>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                              <span className="font-medium">Note:</span> Changing a venue's status to "Not Available" will prevent it from being booked for new reservations but won't affect existing bookings.
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="pt-4">
                      <h4 className="font-semibold text-[#006241] text-lg mb-3">Managing Equipment</h4>
                      <p className="text-gray-700 mb-4">
                        Each venue can have multiple pieces of equipment associated with it. To manage equipment:
                      </p>
                      <div className="space-y-4">
                        <div className="bg-white border rounded-lg p-4">
                          <h5 className="font-medium mb-2">Adding Equipment</h5>
                          <ol className="list-decimal pl-6 space-y-2 text-gray-700 text-sm">
                            <li>Open the venue's details</li>
                            <li>Scroll to the Equipment section</li>
                            <li>Type the equipment name in the input field</li>
                            <li>Click "Add" or press Enter</li>
                          </ol>
                        </div>
                        <div className="bg-white border rounded-lg p-4">
                          <h5 className="font-medium mb-2">Removing Equipment</h5>
                          <ol className="list-decimal pl-6 space-y-2 text-gray-700 text-sm">
                            <li>Locate the equipment item in the list</li>
                            <li>Click the "×" icon next to the item you want to remove</li>
                            <li>Save your changes to update the venue</li>
                          </ol>
                        </div>
                      </div>
                    </section>

                    <section className="pt-4">
                      <h4 className="font-semibold text-[#006241] text-lg mb-3">Venue Statuses</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="font-medium">Active</span>
                          </div>
                          <p className="text-sm text-gray-600">Venue is available for reservations and appears in search results.</p>
                        </div>
                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="font-medium">Not Available</span>
                          </div>
                          <p className="text-sm text-gray-600">Venue is temporarily unavailable. Users won't be able to see it.</p>
                        </div>

                      </div>
                    </section>

                    <section className="pt-4">
                      <h4 className="font-semibold text-[#006241] text-lg mb-3">Best Practices</h4>
                      <div className="space-y-4">
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-blue-700">
                                <span className="font-medium">Tip:</span> Keep venue information up-to-date, especially status changes during maintenance periods.
                              </p>
                            </div>
                          </div>
                        </div>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                          <li>Use clear, consistent naming conventions for venues (e.g., "Building-Room Number" format)</li>
                          <li>Upload multiple high-quality images showing different angles of the venue</li>
                          <li>Include all relevant equipment to help users make informed decisions</li>
                          <li>Update venue statuses promptly when maintenance is scheduled</li>
                          <li>Regularly review and update venue capacities to ensure compliance with safety regulations</li>
                        </ul>
                      </div>
                    </section>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Equipment Module */}
              <AccordionItem value="equipment" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <Wrench className="w-5 h-5" style={{ color: "#006241" }} />
                    <span className="font-semibold">Equipment Management</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Equipment Card Layout</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">Projector - Sony VPL</h5>
                          <Badge className="bg-green-100 text-green-800">Available</Badge>
                        </div>
                        <p className="text-sm text-gray-600">High-definition projector for presentations</p>
                        <p className="text-xs text-gray-500">Location: Conference Room A</p>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-[#006241]">Management Actions</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Search className="w-4 h-4 text-[#006241]" />
                          <span className="text-sm">Search by name, description, location</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Plus className="w-4 h-4 text-[#006241]" />
                          <span className="text-sm">Add new equipment</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Edit className="w-4 h-4 text-[#006241]" />
                          <span className="text-sm">Edit equipment details</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Trash2 className="w-4 h-4 text-[#006241]" />
                          <span className="text-sm">Delete equipment</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Pending Approvals Module */}
              <AccordionItem value="approvals" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5" style={{ color: "#006241" }} />
                    <span className="font-semibold">Pending Approvals</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  <section>
                    <h4 className="font-semibold text-[#006241] text-lg mb-3">Overview</h4>
                    <p className="text-gray-700 mb-4">
                      The Pending Approvals section is where administrators review and manage all reservation requests. 
                      This centralized dashboard helps you efficiently process requests and maintain the reservation schedule.
                    </p>
                    
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">Tip:</span> Check this section regularly to ensure timely responses to reservation requests.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="font-semibold text-[#006241] text-lg mb-3">Navigating the Interface</h4>
                    <div className="bg-white border rounded-lg p-4 space-y-4">
                      <div className="space-y-2">
                        <h5 className="font-medium">1. Search and Filter</h5>
                        <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-3 rounded">
                          <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                              placeholder="Search by organization, venue, or purpose" 
                              className="pl-10 w-full"
                              disabled
                            />
                          </div>
                          <Select disabled>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Requests</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select disabled>
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="newest">Newest First</SelectItem>
                              <SelectItem value="oldest">Oldest First</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" disabled>
                            <Filter className="w-4 h-4 mr-1" />
                            More Filters
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="font-medium">2. Request List</h5>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="grid grid-cols-12 bg-gray-50 p-3 text-sm font-medium text-gray-600">
                            <div className="col-span-3">Organization</div>
                            <div className="col-span-2">Venue</div>
                            <div className="col-span-2">Date & Time</div>
                            <div className="col-span-3">Purpose</div>
                            <div className="col-span-2 text-right">Status</div>
                          </div>
                          
                          {/* Sample Request Row */}
                          <div className="grid grid-cols-12 p-3 text-sm border-t hover:bg-gray-50">
                            <div className="col-span-3 font-medium">JPCS - IT Department</div>
                            <div className="col-span-2">Conference Room A</div>
                            <div className="col-span-2">
                              <div>Jun 15, 2024</div>
                              <div className="text-gray-500 text-xs">1:00 PM - 3:00 PM</div>
                            </div>
                            <div className="col-span-3 truncate">Monthly General Assembly and Project Planning</div>
                            <div className="col-span-2 flex justify-end">
                              <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-700">
                                Pending
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="font-semibold text-[#006241] text-lg mb-3">Processing Requests</h4>
                    <div className="space-y-4">
                      <div className="bg-white border rounded-lg p-4">
                        <h5 className="font-medium mb-3">Reviewing Request Details</h5>
                        <ol className="list-decimal pl-5 space-y-3 text-gray-700">
                          <li>Click on any request to view full details</li>
                          <li>Review the following information:
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                              <li>Organization and point of contact</li>
                              <li>Venue and equipment requested</li>
                              <li>Date and time of the event</li>
                              <li>Expected number of attendees</li>
                              <li>Purpose of the reservation</li>
                              <li>Additional notes or special requests</li>
                            </ul>
                          </li>
                          <li>Check for any scheduling conflicts</li>
                          <li>Verify organization's reservation privileges</li>
                        </ol>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h5 className="font-medium text-green-800 mb-2">Approving a Request</h5>
                          <ol className="list-decimal pl-5 space-y-1 text-sm text-green-700">
                            <li>Click the green "Approve" button</li>
                            <li>Add any additional notes if needed</li>
                            <li>Confirm your approval</li>
                            <li>The requester will be automatically notified</li>
                          </ol>
                          <div className="mt-3 flex justify-end">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h5 className="font-medium text-red-800 mb-2">Rejecting a Request</h5>
                          <ol className="list-decimal pl-5 space-y-1 text-sm text-red-700">
                            <li>Click the red "Reject" button</li>
                            <li>Provide a clear reason for rejection</li>
                            <li>Suggest alternative options if available</li>
                            <li>Confirm the rejection</li>
                          </ol>
                          <div className="mt-3 flex justify-end">
                            <Button size="sm" variant="destructive" disabled>
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="font-semibold text-[#006241] text-lg mb-3">Best Practices</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-5 h-5 rounded-full bg-[#006241] flex items-center justify-center text-white text-xs">1</div>
                        </div>
                        <div>
                          <p className="font-medium">Respond Promptly</p>
                          <p className="text-sm text-gray-600">Aim to process all requests within 24-48 hours to help organizations with their planning.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-5 h-5 rounded-full bg-[#006241] flex items-center justify-center text-white text-xs">2</div>
                        </div>
                        <div>
                          <p className="font-medium">Be Consistent</p>
                          <p className="text-sm text-gray-600">Apply the same approval criteria to all requests to ensure fairness.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-5 h-5 rounded-full bg-[#006241] flex items-center justify-center text-white text-xs">3</div>
                        </div>
                        <div>
                          <p className="font-medium">Communicate Clearly</p>
                          <p className="text-sm text-gray-600">When rejecting a request, provide constructive feedback to help the requester understand the decision.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-5 h-5 rounded-full bg-[#006241] flex items-center justify-center text-white text-xs">4</div>
                        </div>
                        <div>
                          <p className="font-medium">Check for Conflicts</p>
                          <p className="text-sm text-gray-600">Always verify that there are no scheduling conflicts before approving a request.</p>
                        </div>
                      </div>
                    </div>
                  </section>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Common Workflows</CardTitle>
                <CardDescription>Step-by-step guides for frequent administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="workflow-1">
                    <AccordionTrigger>Processing a New Reservation Request</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="space-y-3">
                        {[
                          "Navigate to Pending Approvals tab",
                          "Review request details including purpose, date, venue, and organization",
                          "Check venue and equipment availability",
                          "Verify organization credentials and officer information",
                          "Click 'Approve' to confirm or 'Reject' with reason",
                          "System automatically notifies the requesting organization",
                        ].map((step, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-[#006241] rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {index + 1}
                            </div>
                            <p className="text-sm text-gray-700">{step}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="workflow-2">
                    <AccordionTrigger>Adding a New Venue</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="space-y-3">
                        {[
                          "Go to Venues module and click '+ Add Venue'",
                          "Enter venue name and select status (Active/Inactive)",
                          "Specify location and capacity details",
                          "Write a brief description of the venue",
                          "Select available equipment for the venue",
                          "Upload venue images (JPG/PNG format)",
                          "Click 'Add Venue' to save to database",
                        ].map((step, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-[#006241] rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {index + 1}
                            </div>
                            <p className="text-sm text-gray-700">{step}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="workflow-3">
                    <AccordionTrigger>Managing User Organizations</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="space-y-3">
                        {[
                          "Navigate to Users module",
                          "Click 'Add Organization' for new organizations",
                          "Enter organization acronym (e.g., JPCS)",
                          "Provide full organization name",
                          "System auto-syncs to database via Supabase",
                          "Add users to organization by email address",
                          "Assign appropriate roles and permissions",
                        ].map((step, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-[#006241] rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {index + 1}
                            </div>
                            <p className="text-sm text-gray-700">{step}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-[#006241]" />
                    <span>Technical Support</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Developer Team</h4>
                    <p className="text-sm text-gray-600">For technical issues and enhancement suggestions</p>
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="w-4 h-4 mr-2" />
                      scors.devteam@gmail.com
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">CSAO Office</h4>
                    <p className="text-sm text-gray-600">Administrative support and policy questions</p>
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="w-4 h-4 mr-2" />
                      collegesao.office@dlsl.edu.ph
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Help</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-[#006241]">Common Issues</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-gray-50 rounded">
                        <strong>Q:</strong> Reservation not appearing in calendar?
                        <br />
                        <strong>A:</strong> Check if reservation status is "Reserved" and refresh the page.
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <strong>Q:</strong> Cannot add new venue?
                        <br />
                        <strong>A:</strong> Ensure all required fields are filled and images are in JPG/PNG format.
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <strong>Q:</strong> User cannot access system?
                        <br />
                        <strong>A:</strong> Verify user email is correctly added to their organization.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <h5 className="font-semibold text-[#006241]">Institution</h5>
                    <p className="text-gray-600">De La Salle Lipa</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-[#006241]">Office</h5>
                    <p className="text-gray-600">College Student Activities Office</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-[#006241]">System</h5>
                    <p className="text-gray-600">SCORS</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-[#006241]">Database</h5>
                    <p className="text-gray-600">Supabase</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
