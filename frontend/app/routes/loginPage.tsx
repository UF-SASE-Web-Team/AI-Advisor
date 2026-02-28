import * as React from "react";
import type { Route } from "./+types/loginPage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login | AI Advisor" },
    { name: "description", content: "Log in to AI Advisor." },
  ];
}

type LoginFormState = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const [form, setForm] = React.useState<LoginFormState>({ email: "", password: "" });

  function onChange<K extends keyof LoginFormState>(key: K, value: LoginFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Placeholder needs to be connected to backend
    console.log("Login submit:", form);
  }

  function onGoogleLogin() {
    console.log("Google login clicked");
  }

  return (
    <main className="min-h-screen w-full bg-slate-100 p-4 sm:p-8">
      <section className="relative mx-auto flex w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-lg">
        <CornerAccent />

        <aside className="hidden w-[34%] flex-col items-center justify-center bg-sky-100 px-10 py-14 md:flex">
          <div className="mb-10">
            <RobotBadge />
          </div>

          <h1 className="text-center text-5xl font-semibold leading-tight text-rose-400">
            It&apos;s Good <br />
            to See You!
          </h1>
        </aside>

        <div className="flex flex-1 flex-col px-10 py-12 sm:px-14 sm:py-16">
          <form onSubmit={onSubmit} className="w-full max-w-2xl">
            <div className="space-y-10">
              <TextField
                label="Username"
                name="email"
                type="email"
                placeholder="jane.doe@ufl.edu"
                autoComplete="email"
                value={form.email}
                onChange={(v) => onChange("email", v)}
              />

              <div>
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(v) => onChange("password", v)}
                />
                <div className="mt-3">
                  <a
                    href="#"
                    className="text-sm text-blue-600 underline underline-offset-2 hover:text-blue-700"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-10">
                <button
                  type="submit"
                  className="inline-flex items-center gap-3 rounded-xl bg-blue-600 px-7 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
                >
                  <span className="text-xl leading-none" aria-hidden="true">
                    ➜
                  </span>
                  Log In
                </button>

                <a
                  href="#"
                  className="text-base text-blue-600 underline underline-offset-2 hover:text-blue-700"
                >
                  Create an Account
                </a>
              </div>

              <hr className="border-slate-200" />

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onGoogleLogin}
                  className="mx-auto block w-full max-w-xl rounded-xl border border-blue-500 bg-white px-6 py-5 text-lg font-semibold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-200"
                >
                  Continue with Google
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

type TextFieldProps = {
  label: string;
  name: string;
  type: React.HTMLInputTypeAttribute;
  placeholder?: string;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
};

function TextField({ label, name, type, placeholder, autoComplete, value, onChange }: TextFieldProps) {
  const id = `field-${name}`;

  return (
    <div>
      <label htmlFor={id} className="mb-3 block text-lg font-semibold text-slate-900">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-5 py-4 text-lg text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
      />
    </div>
  );
}

function CornerAccent() {
  const common = "pointer-events-none absolute h-12 w-12 border-[12px] border-rose-500";

  return (
    <>
      <div className={`${common} left-0 top-0 rounded-br-2xl border-r-0 border-b-0`} />
      <div className={`${common} right-0 top-0 rounded-bl-2xl border-l-0 border-b-0`} />
      <div className={`${common} left-0 bottom-0 rounded-tr-2xl border-r-0 border-t-0`} />
      <div className={`${common} right-0 bottom-0 rounded-tl-2xl border-l-0 border-t-0`} />
    </>
  );
}

function RobotBadge() {
  return (
    <div className="grid place-items-center">
      <div className="h-48 w-48 rounded-full bg-amber-400 shadow-lg" />
    </div>
  );
}
