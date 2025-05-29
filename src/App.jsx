
import LoginPage from "./pages/login-page";
import { useAuth } from "./lib/useAuth";
import DashboardPage from "./pages/dashboard-page";
import { CalendarView } from "./components/calendar/calendar-view";

const mockReservations = {
  "2025-05-01": [
    {
      id: "1",
      title: "Labor Day",
      organization: "Holiday",
      time: "All Day",
      status: "RESERVED",
      venue: "N/A",
    },
  ],
  "2025-05-08": [
    {
      id: "2",
      title: "Meeting Room 1",
      organization: "JPCS",
      time: "7:30 - 10:30",
      status: "RESERVED",
      venue: "Meeting Room 1",
    },
  ],
  "2025-05-12": [
    {
      id: "3",
      title: "National and Local Election Holiday",
      organization: "Holiday",
      time: "All Day",
      status: "RESERVED",
      venue: "N/A",
    },
  ],
  "2025-05-14": [
    {
      id: "4",
      title: "Meeting Room 6",
      organization: "JPIA",
      time: "2:30 - 5:30",
      status: "RESERVED",
      venue: "Meeting Room 6",
    },
  ],
  "2025-05-20": [
    {
      id: "5",
      title: "Student Council Meeting",
      organization: "CSO",
      time: "9:00 - 12:00",
      status: "PENDING",
      venue: "Conference Room A",
    },
  ],
  "2025-05-22": [
    {
      id: "6",
      title: "Workshop",
      organization: "JPIA",
      time: "1:00 - 4:00",
      status: "CANCELLED",
      venue: "Meeting Room 2",
    },
  ],
  "2025-05-28": [
    {
      id: "7",
      title: "Annual Conference",
      organization: "JPCS",
      time: "8:00 - 5:00",
      status: "PENDING",
      venue: "Auditorium",
    },
  ],
}

const App = () => {
  const { user, isAuthorized, loading, signOut } = useAuth()

  if (loading) return <p className="text-center mt-10">Checking authentication...</p>

  if (!user || !isAuthorized) return <LoginPage />


  // were using mockReservations here but in 
  // the real application we would fetch this data in supabase!
  // const { data: reservationsData, error } = useReservations();

  return (
    <DashboardPage>
      <CalendarView reservationsData={mockReservations} />
    </DashboardPage>
  )
};

export default App;
