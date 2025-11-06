import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    index("routes/loginPage.tsx"),
    index("routes/planPages.tsx"),
    index("routes/mapPage.tsx"),
    index("routes/chatbotPage.tsx"),
    index("routes/classesPage.tsx")
] satisfies RouteConfig;
