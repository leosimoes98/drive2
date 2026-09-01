import { LoadingScreen } from "@/components/LoadingScreen";
import { ProfileSetup } from "@/components/ProfileSetup";
import { useAuth } from "@/hooks/useAuth";
import { LoginPage } from "@/pages/LoginPage";
import { ProfileRole } from "@/types";
import {
  Navigate,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { type ComponentType, Suspense, lazy } from "react";

// Experience pages are lazy-loaded so their full bodies can land in later
// page tasks without blocking the foundation router.
function lazyPage(loader: () => Promise<{ default: ComponentType }>) {
  const LazyComponent = lazy(loader);
  return function LazyPage() {
    return (
      <Suspense fallback={<LoadingScreen label="Carregando…" />}>
        <LazyComponent />
      </Suspense>
    );
  };
}

// Redirects the root path to the experience matching the caller's role.
function RoleRedirect() {
  const { profile, isAdmin } = useAuth();
  const target = isAdmin
    ? "/admin"
    : profile?.role === ProfileRole.driver
      ? "/driver"
      : "/customer";
  return <Navigate to={target} />;
}

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: RoleRedirect,
});

const customerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customer",
  component: lazyPage(() => import("@/pages/CustomerPage")),
});

const driverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/driver",
  component: lazyPage(() => import("@/pages/DriverPage")),
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: lazyPage(() => import("@/pages/AdminPage")),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  customerRoute,
  driverRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

export default function App() {
  const { isAuthenticated, isInitializing, profile, profileFetched } =
    useAuth();

  if (isInitializing) {
    return <LoadingScreen label="Restaurando sessão…" />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (!profileFetched) {
    return <LoadingScreen label="Carregando perfil…" />;
  }

  if (!profile) {
    return <ProfileSetup />;
  }

  return <RouterProvider router={router} />;
}
