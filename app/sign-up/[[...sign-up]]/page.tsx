import { SignUp } from "@clerk/nextjs";
import { AuthLayout } from "@/components/auth/auth-layout";
import { CLERK_APARIENCIA_REGISTRO } from "@/components/auth/clerk-apariencia";

export default function Page() {
  return (
    <AuthLayout>
      <SignUp appearance={CLERK_APARIENCIA_REGISTRO} />
    </AuthLayout>
  );
}
