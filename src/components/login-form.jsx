import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/useAuth"

export function LoginForm() {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="flex flex-col items-center bg-white rounded-xl shadow p-8 max-w-md mx-auto mt-8">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-2xl font-bold mb-1 text-center">Welcome to</h1>
        <div className="rounded-2xl h-20 flex items-center justify-center mb-4 overflow-hidden">
          <img
            src="/src/assets/scors-with-name-logo.png"
            alt="SCORS Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="font-medium text-center text-gray-600 text-base mb-4">
          De La Salle Lipa
        </div>
      </div>
      <Button
        onClick={signInWithGoogle}
        variant="outline"
        className="w-full flex items-center justify-center gap-2 text-base font-medium py-3"
      >
        <span className="inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24">
            <g>
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 32.9 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.1-2.7-.3-4z"/>
              <path fill="#34A853" d="M6.3 14.7l7 5.1C15.5 16.1 19.4 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 5.1 29.5 3 24 3c-7.2 0-13.4 3.1-17.7 8.1z"/>
              <path fill="#FBBC05" d="M24 45c5.5 0 10.5-1.8 14.4-4.9l-6.7-5.5C29.8 36 27 37 24 37c-5.7 0-10.6-3.1-13.1-7.7l-7 5.4C6.6 41.7 14.7 45 24 45z"/>
              <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-1.6 4.1-6.1 7.5-11.7 7.5-5.7 0-10.6-3.1-13.1-7.7l-7 5.4C6.6 41.7 14.7 45 24 45c10.5 0 20-7.6 20-21 0-1.3-.1-2.7-.3-4z"/>
            </g>
          </svg>
        </span>
        <span>Sign in with Google</span>
      </Button>
      <div className="text-center text-gray-500 text-sm mt-6">
        Use your DLSL Google account to access the system
      </div>
    </div>
  )
}
