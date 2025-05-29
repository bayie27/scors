"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ReservationModal } from "../reservation/reservation-modal"


export function CalendarView(
    { reservationsData = {} } = { reservationsData: {} }
) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedReservation, setSelectedReservation] = useState(null)
    const [showReservationModal, setShowReservationModal] = useState(false)



    const handleReservationClick = (reservation) => {
        setSelectedReservation(reservation)
        setShowReservationModal(true)
    }

    const getDaysInMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        const days = []

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null)
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day))
        }

        return days
    }

    const formatDateKey = (date) => {
        return date.toISOString().split("T")[0]
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING":
                return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "RESERVED":
                return "bg-green-100 text-green-800 border-green-200"
            case "DONE":
                return "bg-blue-100 text-blue-800 border-blue-200"
            case "CANCELLED":
                return "bg-gray-100 text-gray-800 border-gray-200"
            case "REJECTED":
                return "bg-red-100 text-red-800 border-red-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const days = getDaysInMonth(currentDate)
    const today = new Date()
    const isToday = (date) => {
        if (!date) return false
        return date.toDateString() === today.toDateString()
    }

    const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

    return (
        <div className="flex-1 p-4 lg:p-6 bg-gray-50 overflow-auto">
            <Card className="shadow-sm">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 border-b border-gray-200">
                    {weekDays.map((day) => (
                        <div key={day} className="p-2 md:p-4 text-center">
                            <span className="text-xs md:text-sm font-medium text-gray-500">{day}</span>
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                    {days.map((date, index) => {
                        const dateKey = date ? formatDateKey(date) : ""
                        const reservations = date ? reservationsData[dateKey] || [] : []

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "min-h-[100px] md:min-h-[120px] p-1 md:p-2 border-r border-b border-gray-100",
                                    date && isToday(date) && "bg-blue-50",
                                    index % 7 === 6 && "border-r-0",
                                )}
                            >
                                {date && (
                                    <>
                                        <div
                                            className={cn(
                                                "w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full text-xs md:text-sm font-medium mb-1 md:mb-2",
                                                isToday(date) ? "bg-blue-600 text-white" : "text-gray-900",
                                            )}
                                        >
                                            {date.getDate()}
                                        </div>

                                        <div className="space-y-1">
                                            {reservations.map((reservation) => (
                                                <Button
                                                    key={reservation.id}
                                                    variant="ghost"
                                                    onClick={() => handleReservationClick(reservation)}
                                                    className={cn(
                                                        "w-full p-1 md:p-2 h-auto text-left justify-start rounded-md border text-xs",
                                                        reservation.organization === "Holiday"
                                                            ? "bg-green-600 text-white hover:bg-green-700"
                                                            : reservation.status === "PENDING"
                                                                ? "bg-yellow-200 text-yellow-900 hover:bg-yellow-300"
                                                                : reservation.status === "CANCELLED"
                                                                    ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                                                    : "bg-green-200 text-green-900 hover:bg-green-300",
                                                    )}
                                                >
                                                    <div className="truncate">
                                                        <div className="font-medium">{reservation.title}</div>
                                                        <div className="text-xs opacity-75">{reservation.time}</div>
                                                    </div>
                                                </Button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
            </Card>

            {/* Reservation Modal */}
            {showReservationModal && selectedReservation && (
                <ReservationModal reservation={selectedReservation} onClose={() => setShowReservationModal(false)} />
            )}
        </div>
    )
}
