import type { Route } from "./+types/loginPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function loginPage() {
  return(

  <div className="w-full h-screen bg-lime-200 flex items-center justify-center">
    <div className="w-[1450px] h-[825px] font-bold bg-lime-100 shadow-[10px_0px_40px_20px_rgba(0,0,0,0.05)] flex overflow-hidden">
      
      <div className="w-1/3 bg-lime-100 flex flex-col items-center justify-center">
        <h1 className = "text-7xl text-teal-600 text-center mb-15">Welcome<br />Back to<br />AI<br />Advisor!</h1>

        <div className = "flex items-center justify-center">
          <svg width="258" height="258" viewBox="0 0 258 258" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_397_366)">
              <path d="M254 125C254 194.036 198.036 250 129 250C59.9644 250 4 194.036 4 125C4 55.9644 59.9644 0 129 0C198.036 0 254 55.9644 254 125Z" fill="#E1EABB"/>
              <path d="M128.5 40C129.942 40 131.325 40.5483 132.345 41.5242C133.365 42.5002 133.938 43.8239 133.938 45.2041V50.4082H166.562C171.85 50.4082 176.921 52.4185 180.66 55.997C184.399 59.5755 186.5 64.429 186.5 69.4898V107.653C186.5 112.714 184.399 117.567 180.66 121.146C176.921 124.724 171.85 126.735 166.562 126.735H90.4375C87.8193 126.735 85.2267 126.241 82.8077 125.282C80.3888 124.323 78.1909 122.918 76.3396 121.146C72.6005 117.567 70.5 112.714 70.5 107.653V69.4898C70.5 64.429 72.6005 59.5755 76.3396 55.997C80.0786 52.4185 85.1497 50.4082 90.4375 50.4082H123.062V45.2041C123.062 43.8239 123.635 42.5002 124.655 41.5242C125.675 40.5483 127.058 40 128.5 40ZM75.9375 140.612C70.6497 140.612 65.5786 142.623 61.8396 146.201C58.1006 149.78 56 154.633 56 159.694V164.898C56 178.616 62.9673 190.169 75.6982 198.065C88.219 205.816 106.148 210 128.5 210C150.852 210 168.781 205.823 181.302 198.065C194.033 190.162 201 178.609 201 164.898V159.694C201 154.633 198.899 149.78 195.16 146.201C191.421 142.623 186.35 140.612 181.062 140.612H75.9375ZM106.75 98.9796C109.634 98.9796 112.4 97.883 114.44 95.9311C116.479 93.9792 117.625 91.3318 117.625 88.5714C117.625 85.811 116.479 83.1637 114.44 81.2117C112.4 79.2598 109.634 78.1633 106.75 78.1633C103.866 78.1633 101.1 79.2598 99.0602 81.2117C97.0208 83.1637 95.875 85.811 95.875 88.5714C95.875 91.3318 97.0208 93.9792 99.0602 95.9311C101.1 97.883 103.866 98.9796 106.75 98.9796ZM161.125 88.5714C161.125 85.811 159.979 83.1637 157.94 81.2117C155.9 79.2598 153.134 78.1633 150.25 78.1633C147.366 78.1633 144.6 79.2598 142.56 81.2117C140.521 83.1637 139.375 85.811 139.375 88.5714C139.375 91.3318 140.521 93.9792 142.56 95.9311C144.6 97.883 147.366 98.9796 150.25 98.9796C153.134 98.9796 155.9 97.883 157.94 95.9311C159.979 93.9792 161.125 91.3318 161.125 88.5714Z" fill="#6A8A83"/>
            </g>
            <defs>
              <filter id="filter0_d_397_366" x="0" y="0" width="258" height="258" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dy="4"/>
                <feGaussianBlur stdDeviation="2"/>
                <feComposite in2="hardAlpha" operator="out"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_397_366"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_397_366" result="shape"/>
              </filter>
            </defs>
          </svg> 
        </div> 
      </div>
      <div className = "w-2/3 bg-lime-200 flex flex-col justify-center px-18">
        <h2 className = "text-teal-600 text-7xl font-bold mb-10 -mt-20">Log In</h2>
        <input type="text" placeholder="Email" className = "w-full bg-lime-100 rounded-xl mb-10 text-5xl py-4 pl-2 cursor-pointer"/>
        <input type="password" placeholder="Password" className="w-full bg-lime-100 rounded-xl mb-20 text-5xl py-4 pl-2 cursor-pointer" />
        <div className="flex items-center">
          <button className="w-[300px] h-[85px] bg-teal-600 text-lime-100 rounded-xl text-4xl cursor-pointer">Sign In</button>
          <a className="text-teal-600 text-4xl underline cursor-pointer ml-20">Create An Account</a>          
        </div>
      </div>
    </div>
  </div>

  );
}