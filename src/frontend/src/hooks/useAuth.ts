import { useCallerProfile, useIsCallerAdmin } from "@/hooks/useQueries";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";

// Central auth + profile hook used by the router gate and the layout.
// Combines Internet Identity state with the backend profile and admin role.
export function useAuth() {
  const {
    identity,
    login,
    clear,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
  } = useInternetIdentity();
  const queryClient = useQueryClient();

  const profileQuery = useCallerProfile();
  const adminQuery = useIsCallerAdmin();

  const profile = profileQuery.data ?? null;
  const isAdmin = adminQuery.data ?? false;

  // The profile query is only "fetched" once the actor is ready and the
  // request has resolved, so we can safely decide whether to show setup.
  const profileFetched =
    !!identity && !profileQuery.isLoading && profileQuery.isFetched;

  const handleLogout = () => {
    clear();
    queryClient.clear();
  };

  return {
    identity,
    login,
    clear: handleLogout,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    profile,
    profileFetched,
    isAdmin,
    profileLoading: profileQuery.isLoading,
  };
}
