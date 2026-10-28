import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import authStyles from "./Auth.module.css";
import styles from "./OtpVerification.module.css";
import axios from "axios";


const OTP_LENGTH = 6;
const fieldNames = Array.from({ length: OTP_LENGTH }, (_, i) => `digit${i}`);
const emptyValues = Object.fromEntries(fieldNames.map((name) => [name, ""]));

export default function OtpVerification({ email, onVerified,  onChangeEmail }) {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: emptyValues });

  useEffect(() => {
    setFocus("digit0");
  }, [setFocus]);

  const clearBoxes = () => {
    fieldNames.forEach((name) => setValue(name, ""));
    setFocus("digit0");
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !getValues(fieldNames[index]) && index > 0) {
      setValue(fieldNames[index - 1], "");
      setFocus(fieldNames[index - 1]);
    }
    if (event.key === "ArrowLeft" && index > 0) {
      setFocus(fieldNames[index - 1]);
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      setFocus(fieldNames[index + 1]);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    // TOAST 1: pasted text had no digits at all
    if (pasted.length === 0) {
      toast.error("No digits found in what you pasted.", { id: "paste-toast" });
      return;
    }

    fieldNames.forEach((name, index) => {
      setValue(name, pasted[index] || "", { shouldValidate: true });
    });

    // TOAST 2: pasted only part of the code
    if (pasted.length < OTP_LENGTH) {
      toast(`Only ${pasted.length} digits pasted. Enter the rest.`, {
        id: "paste-toast",
      });
    }

    setFocus(fieldNames[Math.min(pasted.length, OTP_LENGTH - 1)]);
  };

 const onSubmit = async (values) => {
  const otp = fieldNames.map((name) => values[name]).join("");

  let verificationToken;

  try {
    const response = await axios.post(
      "http://localhost:8080/otp/verify",
      { email, otp }
    );

    verificationToken = response.data.verificationToken;

    if (!verificationToken) {
      throw new Error("Verification token was not returned.");
    }

    toast.success(
      response.data.message || "Email verified successfully.",
      { id: "otp-toast" }
    );
  } catch (error) {
    const serverMessage = error.response?.data?.message;

    toast.error(
      serverMessage ||
        error.message ||
        "Unable to verify OTP.",
      { id: "otp-toast" }
    );

    if (/expired|too many|not found/i.test(serverMessage || "")) {
      clearBoxes();
    }

    return;
  }

  try {
    await onVerified({ email, verificationToken });
  } catch (error) {
    console.error("onVerified failed:", error);

    toast.error(
      error.response?.data?.message ||
        error.message ||
        "Email verified, but something went wrong."
    );
  }
};

  // TOAST 7: form validation failed (empty boxes, non-numbers)
  const onInvalid = (formErrors) => {
    const firstError = Object.values(formErrors)[0];
    toast.error(firstError?.message || "Enter all 6 digits", {
      id: "validation-toast",
    });
  };

  const otpError = fieldNames.map((name) => errors[name]).find(Boolean);

  return (
    <>
      <h1 className={authStyles.title}>Verify Your Email</h1>

      <p className={authStyles.sub}>
        Enter the 6-digit code we sent to{" "}
        <span className={styles.email}>{email}</span>
      </p>

      <form
        className={authStyles.form}
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        noValidate
      >
        <div
          className={styles.boxes}
          role="group"
          aria-label="One-time verification code"
          onPaste={handlePaste}
        >
          {fieldNames.map((name, index) => {
  const field = register(name, {
    required: "Enter all 6 digits",
    pattern: {
      value: /^\d$/,
      message: "Use numbers only",
    },
  });

  return (
    <input
      key={name}
      {...field}
      className={styles.box}
      type="text"
      inputMode="numeric"
      autoComplete={index === 0 ? "one-time-code" : "off"}
      maxLength={1}
      aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
      aria-invalid={errors[name] ? "true" : "false"}
      onChange={(event) => {
        const digit = event.target.value.replace(/\D/g, "").slice(-1);
        setValue(name, digit, { shouldValidate: true });

        if (digit && index < OTP_LENGTH - 1) {
          setFocus(fieldNames[index + 1]);
        }
      }}
      onKeyDown={(event) => handleKeyDown(index, event)}
      onFocus={(event) => event.target.select()}
    />
  );
})}
        </div>

        {otpError && (
          <small className={authStyles.termsErr} role="alert">
            {otpError.message}
          </small>
        )}

        <button className={authStyles.button} disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Verify"}
        </button>
      </form>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.link}
          onClick={onChangeEmail}
          disabled={isSubmitting}
        >
          Wrong email? Go back
        </button>
      </div>
    </>
  );
}