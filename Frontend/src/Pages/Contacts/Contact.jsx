import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { FaEnvelope, FaPhone, FaClock } from "react-icons/fa";
import styles from "./Contact.module.css";
import Navbar from "../../Components/Navbar/Navbar";

const emailRe = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

const info = [
  { icon: <FaEnvelope />, label: "Email us", text: "singhanirudha1816.com" },
  { icon: <FaPhone />, label: "Call us", text: "+91 8387017304" },
  { icon: <FaClock />, label: "We reply within", text: "24 hours" },
];

function Field({ label, error, children }) {
  return (
    <label className={`${styles.field} ${error ? styles.bad : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small role="alert">{error.message}</small>}
    </label>
  );
}

export default function Contact() {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({ mode: "onTouched" });
  const length = watch("message", "").length;

  const onSubmit = (data) => {
    console.log(data);
    toast.success("Thanks! We'll get back to you soon.");
    reset();
  };

  return (
    <>
    <Navbar/>
    <main className={styles.page}>
      {/* Left: intro */}
      <section className={styles.intro}>
        <p className={styles.kicker}>Contact us</p>
        <h1 className={styles.title}>
          Tell us about your <span>plans</span> and problems.
        </h1>
        <p className={styles.text}>
          Dreaming of a trip or stuck with a booking? Share it with us and our team will get back to you.
        </p>

        <ul className={styles.info}>
          {info.map((i) => (
            <li key={i.label}>
              <span className={styles.icon}>{i.icon}</span>
              <div>
                <small>{i.label}</small>
                <strong>{i.text}</strong>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Right: form */}
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Name" error={errors.name}>
          <input autoComplete="name" placeholder="Your name" {...register("name", {
            required: "Enter your name",
            pattern: { value: /^\p{L}[\p{L}\s.'-]+$/u, message: "Use letters only" },
          })} />
        </Field>

        <Field label="Email" error={errors.email}>
          <input type="email" autoComplete="email" placeholder="@example.com" {...register("email", {
            required: "Enter your email",
            pattern: { value: emailRe, message: "Enter a valid email address" },
            
          })} />
        </Field>

        <Field label="Contact no." error={errors.phone}>
          <input type="tel" name="phoneNumber" autoComplete="tel" placeholder='10-digit mobile number' {...register("phone", {
            required: "Enter your contact number",
            pattern: { value: /^(\+91[\s-]?)?[6-9]\d{9}$/, message: "Enter a valid 10-digit mobile number" },
          })} />
        </Field>

        <Field label="Message" error={errors.message}>
          <textarea rows={5} placeholder="Tell us about your plans or problems..." {...register("message", {
            required: "Write a short message",
            minLength: { value: 10, message: "Please write at least 10 characters" },
            maxLength: { value: 500, message: "Keep it under 500 characters" },
          })} />
          <em className={styles.count}>{length}/500</em>
        </Field>

        <button className={styles.button}>We are here to listen</button>
      </form>
      
    </main>
          </>
  );
}
