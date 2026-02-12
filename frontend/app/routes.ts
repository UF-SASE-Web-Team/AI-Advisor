import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/landing-page", "routes/landingPage.tsx"),
  route("/login", "routes/loginPage.tsx"),
  route("/dashboard", "routes/dashboard.tsx"),
  route("/plans", "routes/planPages.tsx"),
  route("/map", "routes/mapPage.tsx"),
  route("/chatbot", "routes/chatbotPage.tsx"),
  route("/classes", "routes/classesPage.tsx"),
] satisfies RouteConfig;
