import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { RouterProvider } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { router } from "./router";
import { UpdatePrompt } from "./update-prompt";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});
// another user's cached rows must never survive a sign-out
const clearCache = () => queryClient.clear();

export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthProvider onSignOut={clearCache}>
          <RouterProvider router={router} />
        </AuthProvider>
        <Toaster position="top-center" />
        <UpdatePrompt />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
