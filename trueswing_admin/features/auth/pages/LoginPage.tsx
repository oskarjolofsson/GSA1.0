import Image from "next/image";
import SignInForm from "@/features/auth/components/sign-in-form";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.1] dark:bg-zinc-900">
      <div className="mb-6 flex flex-col items-center gap-3">
        <Image
          src="/true_swing_logo3.png"
          alt="TrueSwing"
          width={160}
          height={48}
          priority
          className="h-10 w-auto invert dark:invert-0"
        />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to the admin dashboard
        </p>
      </div>
      <SignInForm />
    </div>
  );
}
