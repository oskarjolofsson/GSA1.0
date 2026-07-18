import SignOutButton from "./sign-out-button";

export default function NoAccess() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        No access
      </h1>
      <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
        Your account is signed in but is not an admin, so you can&apos;t open the
        dashboard.
      </p>
      <SignOutButton />
    </div>
  );
}
