import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/landingPage.tsx"),
  route("/login", "routes/loginPage.tsx"),
  route("/dashboard", "routes/dashboard.tsx"),
  route("/profile", "routes/profile.tsx"),
] satisfies RouteConfig;
