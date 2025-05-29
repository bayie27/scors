import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/useAuth"

export function LoginForm() {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="flex flex-col items-center bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-10 w-full max-w-md mx-4 ring-1 ring-white/50">
      <div className="flex flex-col items-center space-y-8 w-full">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-green-900">Welcome to</h1>
          <div className="h-24 flex items-center justify-center bg-white/90 rounded-xl p-4">
            <img
              src="/src/assets/scors-logo.png"
              alt="SCORS Logo"
              className="w-auto h-full object-contain"
            />
          </div>
          <div className="font-medium text-gray-700 text-lg">
            De La Salle Lipa
          </div>
        </div>
        <Button
          onClick={signInWithGoogle}
          variant="outline"
          className="w-full flex items-center justify-center gap-3 text-base font-medium py-3 px-6 rounded-lg border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-200 shadow-sm"
        >
          <div className="bg-white p-1.5 rounded-full">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <span className="text-gray-700">Sign in with Google</span>
        </Button>
        <div className="text-center text-gray-500 text-sm">
          Use your DLSL Google account to access the system
        </div>
      </div>
    </div>
  )
}
