import { useRoleAccess, ROLES } from "@/lib/useRoleAccess";
import AdminManual from "./help-page-admin";
import SCORSUserManual from "./help-page-user";

export default function HelpPage() {
  const { userRole } = useRoleAccess();
  if (!userRole) return <p>Loading...</p>;
  return userRole === ROLES.ADMIN ? <AdminManual /> : <SCORSUserManual />;
}
