"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  FileText,
  Building,
  Wrench,
  Clock,
  Phone,
  Mail,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
} from "lucide-react"

export default function UserManual() {
  const [activeTab, setActiveTab] = useState("introduction")

  const statusIcons = {
    pending: <Pause className="w-4 h-4" style={{ color: "#006241" }} />,
    reserved: <CheckCircle className="w-4 h-4" style={{ color: "#006241" }} />,
    rejected: <XCircle className="w-4 h-4 text-red-500" />,
    cancelled: <AlertCircle className="w-4 h-4 text-gray-500" />,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-center mb-4">
            <img src="scors-logo.png" alt="SCORS Logo" className="h-16" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">User Manual</h1>
            <p className="text-lg text-gray-600 mb-1">Student Center Online Reservation System</p>
            <p className="text-sm text-gray-500">De La Salle Lipa - College Student Activities Office (CSAO)</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 mb-8 border border-green-200 rounded-lg p-2">
            <TabsTrigger 
              value="introduction" 
              className="text-xs md:text-sm transition-all duration-200 hover:bg-green-50 hover:shadow-md hover:scale-105 hover:text-green-800 hover:border-b-2 hover:border-green-600"
            >
              <FileText className="w-4 h-4 mr-1" style={{ color: "#006241" }} />
              <span>Intro</span>
            </TabsTrigger>
            <TabsTrigger 
              value="overview" 
              className="text-xs md:text-sm transition-all duration-200 hover:bg-green-50 hover:shadow-md hover:scale-105 hover:text-green-800 hover:border-b-2 hover:border-green-600"
            >
              <Eye className="w-4 h-4 mr-1" style={{ color: "#006241" }} />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="text-xs md:text-sm transition-all duration-200 hover:bg-green-50 hover:shadow-md hover:scale-105 hover:text-green-800 hover:border-b-2 hover:border-green-600"
            >
              <Calendar className="w-4 h-4 mr-1" style={{ color: "#006241" }} />
              <span>Calendar</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reservations" 
              className="text-xs md:text-sm transition-all duration-200 hover:bg-green-50 hover:shadow-md hover:scale-105 hover:text-green-800 hover:border-b-2 hover:border-green-600"
            >
              <Plus className="w-4 h-4 mr-1" style={{ color: "#006241" }} />
              <span>Reserve</span>
            </TabsTrigger>
            <TabsTrigger 
              value="venues" 
              className="text-xs md:text-sm transition-all duration-200 hover:bg-green-50 hover:shadow-md hover:scale-105 hover:text-green-800 hover:border-b-2 hover:border-green-600"
            >
              <Building className="w-4 h-4 mr-1" style={{ color: "#006241" }} />
              <span>Venues</span>
            </TabsTrigger>
            <TabsTrigger 
              value="equipment" 
              className="text-xs md:text-sm transition-all duration-200 hover:bg-green-50 hover:shadow-md hover:scale-105 hover:text-green-800 hover:border-b-2 hover:border-green-600"
            >
              <Wrench className="w-4 h-4 mr-1" style={{ color: "#006241" }} />
              <span>Equipment</span>
            </TabsTrigger>
            <TabsTrigger 
              value="status" 
              className="text-xs md:text-sm transition-all duration-200 hover:bg-green-50 hover:shadow-md hover:scale-105 hover:text-green-800 hover:border-b-2 hover:border-green-600"
            >
              <Clock className="w-4 h-4 mr-1" style={{ color: "#006241" }} />
              <span>Status</span>
            </TabsTrigger>
            <TabsTrigger 
              value="support" 
              className="text-xs md:text-sm transition-all duration-200 hover:bg-green-50 hover:shadow-md hover:scale-105 hover:text-green-800 hover:border-b-2 hover:border-green-600"
            >
              <Phone className="w-4 h-4 mr-1" style={{ color: "#006241" }} />
              <span>Support</span>
            </TabsTrigger>
          </TabsList>

          {/* Introduction Tab */}
          <TabsContent value="introduction">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText style={{ color: "#006241" }} />
                  Introduction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  This user manual is developed to guide students and accredited organization members of De La Salle
                  Lipa in effectively utilizing the Student Center Online Reservation System (SCORS).
                </p>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Key Benefits</h4>
                  <ul className="text-green-700 space-y-1">
                    <li>• Digital reservation of venues and equipment</li>
                    <li>• Promotes transparency and efficiency</li>
                    <li>• Real-time status monitoring</li>
                    <li>• Streamlined approval process</li>
                  </ul>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Through this system, users can view availability, create reservation requests, and monitor their
                  status in real time. This document outlines the platform's features and provides step-by-step
                  instructions for optimal usage.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye style={{ color: "#006241" }} />
                  System Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-800">Available Features</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-5 h-5" style={{ color: "#006241" }} />
                        <span>Centralized event calendar</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Plus className="w-5 h-5" style={{ color: "#006241" }} />
                        <span>Reservation request submission</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Clock className="w-5 h-5" style={{ color: "#006241" }} />
                        <span>Real-time status viewing</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Building className="w-5 h-5" style={{ color: "#006241" }} />
                        <span>Venue and equipment browsing</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-800">System Modules</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Badge variant="outline" className="p-3 justify-center">
                        <Calendar className="w-4 h-4 mr-2" style={{ color: "#006241" }} />
                        Calendar
                      </Badge>
                      <Badge variant="outline" className="p-3 justify-center">
                        <FileText className="w-4 h-4 mr-2" style={{ color: "#006241" }} />
                        Reservations
                      </Badge>
                      <Badge variant="outline" className="p-3 justify-center">
                        <Building className="w-4 h-4 mr-2" style={{ color: "#006241" }} />
                        Venues
                      </Badge>
                      <Badge variant="outline" className="p-3 justify-center">
                        <Wrench className="w-4 h-4 mr-2" style={{ color: "#006241" }} />
                        Equipment
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> Administrative functions such as user management, reservation approval, and
                    venue/equipment editing are restricted to system administrators.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar style={{ color: "#006241" }} />
                    Calendar Module
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="navigation">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4" style={{ color: "#006241" }} />
                          Navigation and Filtering
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Search className="w-5 h-5 mt-1" style={{ color: "#006241" }} />
                            <div>
                              <h5 className="font-medium">Live Search</h5>
                              <p className="text-sm text-gray-600">
                                Use the search bar in the header for quick access to reservations based on keywords.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Filter className="w-5 h-5 mt-1" style={{ color: "#006241" }} />
                            <div>
                              <h5 className="font-medium">Filter Panel</h5>
                              <p className="text-sm text-gray-600 mb-2">Filter calendar results by:</p>
                              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                                <li>• Organization</li>
                                <li>• Venue</li>
                                <li>• Equipment</li>
                                <li>• Status (Pending, Reserved, Rejected, Cancelled)</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="views">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" style={{ color: "#006241" }} />
                          Calendar Views
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="p-3 border rounded-lg">
                              <h5 className="font-medium">Month View</h5>
                              <p className="text-sm text-gray-600">Displays all events for the selected month</p>
                            </div>
                            <div className="p-3 border rounded-lg">
                              <h5 className="font-medium">Week View</h5>
                              <p className="text-sm text-gray-600">Detailed layout of reservations per week</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="p-3 border rounded-lg">
                              <h5 className="font-medium">Day View</h5>
                              <p className="text-sm text-gray-600">Focus on activities within a single day</p>
                            </div>
                            <div className="p-3 border rounded-lg">
                              <h5 className="font-medium">List View</h5>
                              <p className="text-sm text-gray-600">Upcoming reservations in list format</p>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="controls">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <ChevronLeft className="w-4 h-4" style={{ color: "#006241" }} />
                          Navigation Controls & Interactive Features
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-medium mb-2">Navigation Controls</h5>
                            <div className="flex gap-2 mb-4">
                              <Button variant="outline" size="sm">
                                <ChevronLeft className="w-4 h-4" />
                                Prev
                              </Button>
                              <Button variant="outline" size="sm">
                                Today
                              </Button>
                              <Button variant="outline" size="sm">
                                Next
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium mb-2">Interactive Features</h5>
                            <ul className="space-y-2 text-sm text-gray-600">
                              <li>
                                • <strong>Click on a Time Slot:</strong> Opens reservation form with selected date/time
                              </li>
                              <li>
                                • <strong>Click on an Event:</strong> Displays detailed reservation information
                              </li>
                              <li>
                                • <strong>Click on Your Own Event:</strong> Allows cancellation
                              </li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus style={{ color: "#006241" }} />
                  Reservation Submission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">How to Create a Reservation</h4>
                    <ol className="text-green-700 space-y-2 list-decimal list-inside">
                      <li>
                        Select the <strong>"+ Reserve"</strong> button in the calendar or reservation module
                      </li>
                      <li>A modal window will appear with current date and default one-hour time slot</li>
                      <li>Complete the reservation form with required fields</li>
                      <li>
                        Click <strong>"Create Reservation"</strong> to submit
                      </li>
                      <li>Your reservation will be reviewed by the administrator</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Required Fields</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="p-3 border rounded-lg">
                        <h5 className="font-medium text-sm">Purpose of Reservation</h5>
                        <p className="text-xs text-gray-600">Describe the event or activity</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h5 className="font-medium text-sm">Date and Time</h5>
                        <p className="text-xs text-gray-600">When you need the reservation</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h5 className="font-medium text-sm">Organization Name</h5>
                        <p className="text-xs text-gray-600">Your organization or department</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h5 className="font-medium text-sm">Venue</h5>
                        <p className="text-xs text-gray-600">Select from available venues</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h5 className="font-medium text-sm">Officer-in-Charge</h5>
                        <p className="text-xs text-gray-600">Responsible person's name</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h5 className="font-medium text-sm">Contact Number</h5>
                        <p className="text-xs text-gray-600">For communication purposes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Venues Tab */}
          <TabsContent value="venues">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building style={{ color: "#006241" }} />
                  Venue Module
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="venue-search">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4" style={{ color: "#006241" }} />
                        Venue Search and Filter
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">Click the 🔍 search icon to expand the filter input.</p>
                        <div>
                          <h5 className="font-medium mb-2">Search venues by:</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Name</li>
                            <li>• Description</li>
                            <li>• Location</li>
                            <li>• Equipment</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="venue-details">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" style={{ color: "#006241" }} />
                        Viewing Venue Details
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Venues are presented in a card-based layout, each featuring a preview image.
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium mb-2">Clicking on a venue opens a modal with:</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Venue name </li>
                            <li>• Venue status </li>
                            <li>• Venue image </li>
                            <li>• Venue description </li>
                            <li>• Venue Capacity </li>
                            <li>• Available equipment and amenities</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="venue-sync">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" style={{ color: "#006241" }} />
                        Real-Time Data Synchronization
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-gray-600">
                        Venue data is updated in real-time. All additions, updates, and
                        removals are automatically reflected on the user interface.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench style={{ color: "#006241" }} />
                  Equipment Module
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="equipment-search">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4" style={{ color: "#006241" }} />
                        Equipment Search and Filter
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">Click the 🔍 search icon to expand the filter input.</p>
                        <div>
                          <h5 className="font-medium mb-2">Search equipment by:</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Name</li>
                            <li>• Description</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="equipment-info">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" style={{ color: "#006241" }} />
                        Viewing Equipment Details
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium mb-2">Equipment cards display:</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Item Name</li>
                            <li>• Status Badge (Available/Unavailable)</li>
                            <li>• First Image Preview</li>
                            <li>• Location</li>
                            <li>• Short Description</li>
                          </ul>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium mb-2">
                            Selecting "View" or clicking equipment image opens modal with:
                          </h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Full image carousel</li>
                            <li>• Comprehensive description</li>
                            <li>• Availability details</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="equipment-sync">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" style={{ color: "#006241" }} />
                        Real-Time Data Synchronization
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-gray-600">
                        Equipment data is updated in real-time. All additions, updates, and
                        removals are automatically reflected on the user interface.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock style={{ color: "#006241" }} />
                  Reservation Status Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700 mb-4">Reservations progress through the following statuses:</p>

                  <div className="grid gap-4">
                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                      {statusIcons.pending}
                      <div>
                        <h4 className="font-semibold text-yellow-800">Pending</h4>
                        <p className="text-sm text-yellow-700">Awaiting approval by CSAO</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-green-50 border-green-200">
                      {statusIcons.reserved}
                      <div>
                        <h4 className="font-semibold text-green-800">Reserved</h4>
                        <p className="text-sm text-green-700">Approved and officially scheduled</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-red-50 border-red-200">
                      {statusIcons.rejected}
                      <div>
                        <h4 className="font-semibold text-red-800">Rejected</h4>
                        <p className="text-sm text-red-700">Declined by administrator</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 border-gray-200">
                      {statusIcons.cancelled}
                      <div>
                        <h4 className="font-semibold text-gray-800">Cancelled</h4>
                        <p className="text-sm text-gray-700">Withdrawn by user prior to approval</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone style={{ color: "#006241" }} />
                  Support and Assistance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <p className="text-gray-700">
                    For technical concerns, general inquiries, or support related to the SCORS platform, users are
                    encouraged to contact the following:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-2 border-green-100">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Mail className="w-5 h-5" style={{ color: "#006241" }} />
                          <h4 className="font-semibold">Developer Team</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Technical support and system issues</p>
                        <Button variant="outline" size="sm" className="w-full">
                          <Mail className="w-4 h-4 mr-2" />
                          scors.devteam@gmail.com
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-green-100">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Building className="w-5 h-5" style={{ color: "#006241" }} />
                          <h4 className="font-semibold">CSAO Office</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">General inquiries and policy questions</p>
                        <Button variant="outline" size="sm" className="w-full">
                          <Mail className="w-4 h-4 mr-2" />
                          collegesao.office@dlsl.edu.ph
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Additional Support:</strong> Assistance may also be coordinated through official internal
                      channels or designated representatives of recognized student organizations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-600"> 2025 De La Salle Lipa - College Student Activities Office (CSAO)</p>
          <p className="text-xs text-gray-500 mt-1">Student Center Online Reservation System (SCORS)</p>
        </div>
      </div>
    </div>
  )
}
