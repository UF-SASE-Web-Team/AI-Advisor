import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/login", "routes/loginPage.tsx"),
  route("/dashboard", "routes/dashboard.tsx"),
] satisfies RouteConfig;
