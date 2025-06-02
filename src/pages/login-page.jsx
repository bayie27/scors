import { LoginForm } from "../components/login-form";

export default function LoginPage() {
  return (
    <div className="relative min-h-svh flex items-center justify-center p-4 safe-area-inset">
      <div className="absolute inset-0 -z-10">
        <img
          src="student-center.png"
          alt="DLSL Campus"
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      <div className="w-full flex justify-center items-center py-6 px-4 sm:px-6 md:px-8">
        <LoginForm />
      </div>
    </div>
  );
}
