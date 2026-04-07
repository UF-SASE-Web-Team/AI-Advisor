import { mainLanding } from "../components/landingPage/mainLanding";
import { AboutLanding } from "../components/landingPage/aboutLanding";
import { ProfileLanding } from "../components/landingPage/profileLanding";
import { OtherProjectsLanding } from "../components/landingPage/otherProjectsLanding";

export default function landingPage() {
  return (
    <div className="min-h-screen">
      {mainLanding()}
      <AboutLanding />
      <ProfileLanding />
      <OtherProjectsLanding />
    </div>
  );
}