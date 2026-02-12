import type { Route } from "./+types/home";
import { mainLanding } from "../components/landingPage/mainLanding";
import { aboutLanding } from "../components/landingPage/aboutLanding";
import { profileLanding } from "../components/landingPage/profileLanding";
import { otherProjectsLanding } from "../components/landingPage/otherProjectsLanding";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function landingPage() {
  return <>
    {mainLanding()}
    {aboutLanding()}
    {profileLanding()}
    {otherProjectsLanding()}
  </>;
}