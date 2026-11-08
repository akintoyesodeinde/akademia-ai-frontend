import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthSessionProvider, useAuthSession } from "../hooks/useAuthSession";
import { AuthScreen } from "../features/authentication/AuthScreen";
import { WorkspaceShell } from "../layouts/WorkspaceShell";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppGate: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthSession();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          color: "var(--text-secondary)",
        }}
      >
        Initializing Akademia AI secure session...
      </div>
    );
  }

  return isAuthenticated ? <WorkspaceShell /> : <AuthScreen />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>
        <AppGate />
      </AuthSessionProvider>
    </QueryClientProvider>
  );
};
