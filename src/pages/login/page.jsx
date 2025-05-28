import { LoginForm } from "../../components/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-gray-100">
      <div className="w-full max-x-xs flex flex-1 items-center justify-center">
        <LoginForm />
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/src/assets/student-center.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
