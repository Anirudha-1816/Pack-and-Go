
 function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-inherit">
      <div className="text-center">
        {/* Icon */}
        <div className="flex items-center justify-center w-[52px] h-[52px] mx-auto mb-6 rounded-[14px] bg-[#e8f4ff] text-[#168fe0] text-2xl">
          ✈
        </div>

        {/* Heading */}
        <h2 className="mb-2 text-xl font-semibold text-[#163653]">
          Checking Operator Authenticity
        </h2>

        {/* Description */}
        <p className="text-sm leading-relaxed text-slate-500">
          Please wait while we verify your account.
        </p>

        {/* Spinner */}
        <div className="w-[26px] h-[26px] mx-auto mt-6 rounded-full border-[3px] border-[#dbeafe] border-t-[#168fe0] animate-spin motion-reduce:animate-none" />
      </div>
    </div>
  );
}

export default AuthLoading;