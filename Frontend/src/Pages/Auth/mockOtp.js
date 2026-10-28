
// This is NOT real security: the OTP is checked in the browser.

export const MOCK_OTP = "123456"; // test code for development

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function requestOtp(email) {
  await wait(800);
  return { message: `Verification code sent to ${email}` };
}

export async function verifyOtp(email, otp) {
  await wait(800);
  if (otp !== MOCK_OTP) {
    throw new Error("Invalid code. Please try again.");
  }
  return { message: "Email verified successfully!" };
}

export async function resendOtp(email) {
  await wait(600);
  return { message: `A new code was sent to ${email}` };
}