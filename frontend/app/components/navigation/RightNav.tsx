import React from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/profile", label: "Profile" },
  { href: "/upload", label: "Upload" },
];

export default function RightNav() {
  return (
    <nav
      aria-label="Right navigation"
      className="group fixed right-0 top-0 h-screen w-12 hover:w-28 bg-[#FFE48B] flex flex-col items-center z-50 border-l border-[#FFAF01] transition-all duration-300 ease-in-out overflow-hidden"
    >
      {/* collapsed arrow */}
      <div className="absolute top-8 w-full flex justify-center group-hover:hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10 text-[#4A4848]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </div>

      {/* expanded content */}
      <div className="hidden group-hover:flex flex-col items-center h-full w-full py-6 mt-6">
        {/* Top icons */}
        <div className="flex flex-col items-center gap-6 flex-1">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} title={link.label}>
              <div className="w-20 h-20 rounded-2xl border-2 border-[#FFAF01] bg-[#FFE48B] flex items-center justify-center shadow-md hover:shadow-lg transition">
                {getIcon(link.label)}
              </div>
            </a>
          ))}
        </div>

        {/* Bottom logout button */}
        <div className="pb-4">
          <a href="/logout" title="Logout">
            <div className="w-20 h-20 rounded-2xl border-2 border-[#FFAF01] bg-[#FFB300] flex items-center justify-center shadow-md hover:shadow-lg transition">
              {getIcon("Logout")}
            </div>
          </a>
        </div>
      </div>
    </nav>
  );
}

function getIcon(name: string) {
  switch (name) {
    case "Home":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-9 h-9 text-[#4A4848]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10L12 3l9 7v10a1 1 0 01-1 1h-6v-6H10v6H4a1 1 0 01-1-1V10z"
          />
        </svg>
      );

    case "Profile":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-9 h-9 text-[#4A4848]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-8 2.5-8 5v1h16v-1c0-2.5-3-5-8-5z"
          />
        </svg>
      );

    case "Upload":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-9 h-9 text-[#4A4848]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l4 4m-4-4l-4 4"
          />
        </svg>
      );

    case "Logout":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-9 h-9 text-[#FF5A5F]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V5"
          />
        </svg>
      );

    default:
      return null;
  }
}