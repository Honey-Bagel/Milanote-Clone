// app/auth/reset-password/page.tsx
"use client";

import { SignIn } from "@clerk/nextjs";

export default function ResetPasswordPage() {
  return (
    <SignIn
      routing="path"
      path="/auth/reset-password"
      appearance={{ elements: { card: "bg-transparent shadow-none" } }}
    />
  );
}