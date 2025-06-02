import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { BookOpen } from "lucide-react"

export function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#006241] rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">SCORS Admin Manual</h1>
        <p className="text-gray-600">Complete guide for managing the Student Center Online Reservation System</p>
      </div>

      {/* Two-column Cards Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Quick Start Guide Card */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-[#006241]">Key Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Reserving a Venue/Equipment</h4>
              <p className="text-sm text-gray-600">
                To book a space or item, click "+ Reserve," specify the details including the purpose, exact date and
                time, the responsible organization, and select the required venue and equipment from the dropdowns.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Managing User Access</h4>
              <p className="text-sm text-gray-600">
                The "Users" section allows you to control who can use the system. You can add new users by associating
                them with an organization and email, as well as modify or remove existing user accounts.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Handling Pending Requests</h4>
              <p className="text-sm text-gray-600">
                The "Pending Approvals" area is where you review reservations made by users. You can examine the details
                and then either approve the booking, granting access to the resource, or reject it.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation & Features Card */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-[#006241]">Understanding the Interface</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">The Dashboard Calendar</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  The main calendar provides a visual overview of all scheduled reservations. You can switch between
                  different views (Month, Week, Day, Agenda) to get a perspective that suits your needs. Clicking on an
                  event will show you more details.
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">User and Organization Management</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  The "Users" page lists all registered users, categorized by their organization. Administrators can
                  manage these accounts and also maintain the list of recognized student organizations within the
                  system.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-[#006241]">Troubleshooting & Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>What if a requested time slot is already booked?</AccordionTrigger>
              <AccordionContent>
                The system will prevent double-booking. When creating a reservation, the calendar will visually indicate
                any conflicts. You may need to choose an alternative time or venue.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>How do I associate a user with a specific student organization?</AccordionTrigger>
              <AccordionContent>
                In the "Users" section, when adding a new user, you'll be prompted to select their organization from a
                dropdown list. For existing users, you can edit their profile to change their organization.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>What happens after I approve a reservation?</AccordionTrigger>
              <AccordionContent>
                Once approved, the reservation is confirmed and will appear on the calendar for all users to see. The
                user who made the request may also receive a notification (if that feature is enabled).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Can I see a log of all reservation activities?</AccordionTrigger>
              <AccordionContent>
                Currently, the system primarily displays active and pending reservations. If you require a detailed log
                of past activities, please contact the system administrators for assistance.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>How do I know what equipment is available for a venue?</AccordionTrigger>
              <AccordionContent>
                When creating a reservation and selecting a venue, the equipment dropdown will list items that are
                generally available or can be requested for that venue. The system doesn't currently track equipment
                availability per venue in real-time.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#006241]">Contact & Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Technical Support</h4>
              <p className="text-sm text-gray-600">Email: it-support@dlsu.edu.ph</p>
              <p className="text-sm text-gray-600">Phone: (02) 8524-4611 ext. 1234</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Student Center Office</h4>
              <p className="text-sm text-gray-600">Email: studentcenter@dlsu.edu.ph</p>
              <p className="text-sm text-gray-600">Phone: (02) 8524-4611 ext. 5678</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}