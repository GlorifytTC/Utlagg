export { default } from "next-auth/middleware";

// Protect these route trees — unauthenticated users are redirected to /login.
export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
