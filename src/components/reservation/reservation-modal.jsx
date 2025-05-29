"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, MapPin, FileText, User, Building, Phone, MessageSquare, Calendar, X, Edit } from "lucide-react"

export function ReservationModal({ reservation, onClose }) {
    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING":
                return "bg-yellow-100 text-yellow-800"
            case "RESERVED":
                return "bg-green-100 text-green-800"
            case "DONE":
                return "bg-blue-100 text-blue-800"
            case "CANCELLED":
                return "bg-gray-100 text-gray-800"
            case "REJECTED":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader className="bg-blue-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg font-semibold">Collapsible Booth, JPIA</DialogTitle>
                            <p className="text-blue-100 text-sm">Reservation Details</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-blue-700">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* ID and Equipment Reservation */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="text-gray-500"># ID:</span>
                            <span className="font-medium">2</span>
                        </div>
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                            Equipment Reservation
                        </Badge>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-start space-x-3">
                        <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="font-medium text-gray-900">Date & Time</p>
                            <p className="text-gray-600">Wednesday, May 28, 2025</p>
                            <p className="text-gray-600">9:00 AM - 5:00 PM</p>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="font-medium text-gray-900">Location</p>
                            <p className="text-gray-600">Main Hallway</p>
                        </div>
                    </div>

                    {/* Purpose */}
                    <div className="flex items-start space-x-3">
                        <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="font-medium text-gray-900">Purpose</p>
                            <p className="text-gray-600">Membership drive</p>
                        </div>
                    </div>

                    {/* Reservation Information */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Reservation Information</h3>

                        <div className="space-y-4">
                            {/* Reserved by */}
                            <div className="flex items-start space-x-3">
                                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">Reserved by</p>
                                    <p className="text-gray-600">Maria Santos</p>
                                </div>
                            </div>

                            {/* Organization */}
                            <div className="flex items-start space-x-3">
                                <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">Organization</p>
                                    <p className="text-gray-600">JPIA - Junior Philippine Institute of Accountants</p>
                                </div>
                            </div>

                            {/* Officer in Charge */}
                            <div className="flex items-start space-x-3">
                                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">Officer in Charge</p>
                                    <p className="text-gray-600">John Doe</p>
                                </div>
                            </div>

                            {/* Contact Number */}
                            <div className="flex items-start space-x-3">
                                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">Contact Number</p>
                                    <p className="text-gray-600">987654321</p>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="flex items-start space-x-3">
                                <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">Remarks</p>
                                    <p className="text-gray-600">Need electrical outlet nearby</p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-start space-x-3">
                                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">Status</p>
                                    <Badge className="bg-yellow-100 text-yellow-800 mt-1">Pending</Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
