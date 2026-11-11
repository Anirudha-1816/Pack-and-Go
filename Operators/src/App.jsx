import { Link, Route, Routes } from "react-router-dom";
import OperatorLogin from "./Pages/OperatorsLogin";
import Signup from "./Pages/OperatorSignup";

function OperatorHome() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fafaf7] px-5 py-8 font-['Plus_Jakarta_Sans',system-ui,-apple-system,'Segoe_UI',sans-serif] text-[#243746]">
      <div
        aria-hidden="true"
        className="absolute -right-32 -top-36 h-[30rem] w-[30rem] rounded-full bg-[#e8eff1] sm:-right-20 sm:-top-44"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-48 -left-36 h-[28rem] w-[28rem] rounded-full border-[48px] border-[#e8eff1]/70"
      />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#e8e5de] bg-white shadow-[0_24px_70px_rgba(20,43,59,0.12)] md:min-h-[36rem] md:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-between bg-[linear-gradient(145deg,#142b3b,#2f6b8a)] p-7 text-white sm:p-10 md:p-12">
          <Link to="/" className="flex w-fit items-center gap-3 no-underline">
            <img src="/favicon.svg" alt="" className="h-10 w-10" />
            <span className="font-['Bricolage_Grotesque',Outfit,system-ui,sans-serif] text-2xl font-extrabold tracking-tight">
              Pack<span className="text-[#c49a55]">&amp;</span>Go
            </span>
          </Link>

          <div className="my-12 max-w-lg">
            <div className="mb-6 h-1 w-12 rounded-full bg-[#c49a55]" />
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#d9c39d]">
              Pack&amp;Go operator portal
            </p>
            <h1 className="font-['Bricolage_Grotesque',Outfit,system-ui,sans-serif] text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-5xl">
              Make every trip worth remembering.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[#e1ebef]">
              Sign in to manage your operator account, or apply to bring your
              next great travel experience to Pack&amp;Go.
            </p>
          </div>

          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Pack&amp;Go
          </p>
        </div>

        <div className="flex items-center px-6 py-10 sm:px-10 md:px-12">
          <div className="mx-auto w-full max-w-sm">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#e8eff1] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#24566f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c49a55]" />
              Welcome
            </p>
            <h2 className="font-['Bricolage_Grotesque',Outfit,system-ui,sans-serif] text-3xl font-extrabold tracking-[-0.04em] text-[#142b3b] sm:text-4xl">
              Your next journey starts here.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#61717b]">
              Choose how you’d like to continue.
            </p>

            <div className="mt-8 grid gap-3">
              <Link
                to="/operator/login"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#2f6b8a] px-5 text-sm font-bold text-white no-underline shadow-[0_8px_20px_rgba(47,107,138,0.2)] transition hover:bg-[#24566f] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#c49a55]"
              >
                Sign in to your account
              </Link>
              <Link
                to="/operator/register"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#d9e0e2] bg-white px-5 text-sm font-bold text-[#24566f] no-underline transition hover:border-[#2f6b8a] hover:bg-[#e8eff1] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#c49a55]"
              >
                Apply as an operator
              </Link>
            </div>

            <p className="mt-6 border-t border-[#e8e5de] pt-5 text-xs leading-relaxed text-[#87949d]">
              New operator accounts are reviewed and approved by the Pack&amp;Go
              team.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OperatorHome />} />
      <Route path="/operator/login" element={<OperatorLogin />} />
      <Route path="/operator/register" element={<Signup />} />
    </Routes>
  );
}