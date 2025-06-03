"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#006241] rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">SCORS</h1>
                  <p className="text-xs text-gray-500">Administrator Manual</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
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
                    <CardTitle className="flex items-center space-x-2 text-base">
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
                        <h5 className="font-medium">Agenda View</h5>
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
                          <p className="text-sm text-gray-600">Located on header or calendar interface</p>
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
                            <p>• Date and Time</p>
                            <p>• Organization Name</p>
                            <p>• Venue Selection</p>
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
                          <p className="text-sm text-gray-600">Request appears in Pending Approvals tab</p>
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
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-[#006241]">Adding a Venue</h4>
                    <div className="bg-white border rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Venue Name</label>
                          <Input placeholder="Conference Room A" disabled />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Status</label>
                          <div className="flex space-x-2">
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                            <Badge variant="outline">Inactive</Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Location</label>
                          <Input placeholder="3rd Floor, CMR Building" disabled />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Capacity</label>
                          <Input placeholder="60 pax" disabled />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Input placeholder="Brief description of venue purpose and layout" disabled />
                      </div>
                    </div>
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
                <AccordionContent className="space-y-4 pt-4">
                  <p className="text-gray-700">
                    The Pending Approvals tab displays all reservations awaiting administrator action.
                  </p>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-[#006241]">Filter Options</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">All</Badge>
                      <Badge variant="outline">Today</Badge>
                      <Badge variant="outline">Tomorrow</Badge>
                      <Badge variant="outline">This Week</Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-[#006241]">Approval Actions</h4>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Sample Pending Request</CardTitle>
                        <CardDescription>JPCS - Conference Room A</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Purpose:</span>
                            <p className="text-gray-600">Monthly General Assembly</p>
                          </div>
                          <div>
                            <span className="font-medium">Date & Time:</span>
                            <p className="text-gray-600">Dec 15, 2024 - 2:00 PM</p>
                          </div>
                          <div>
                            <span className="font-medium">Officer in Charge:</span>
                            <p className="text-gray-600">John Doe</p>
                          </div>
                          <div>
                            <span className="font-medium">Contact:</span>
                            <p className="text-gray-600">+63 912 345 6789</p>
                          </div>
                        </div>
                        <div className="flex space-x-2 pt-3">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
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
