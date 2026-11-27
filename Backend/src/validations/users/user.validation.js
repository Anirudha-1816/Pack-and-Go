
import { z } from "zod";

export const userRegisterSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),

  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(20, "Full name cannot exceed 20 characters"),

  gender: z.enum(["Male", "Female", "Other"], {
    error: "Please select a valid gender"
  }),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  city: z
    .string()
    .trim()
    .min(2, "City is required"),

  terms: z.literal(true, {
    error: "You must accept the terms and conditions"
  }),

  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits")
});
