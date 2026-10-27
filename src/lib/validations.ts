import { z } from "zod";

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string(),
    accept_terms: z.literal(true, {
      error: "You must accept the terms and privacy policy",
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const complaintSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be at most 200 characters"),
  category: z.enum([
    "GARBAGE_WASTE",
    "POTHOLE_ROADS",
    "STREETLIGHTS",
    "DRAINAGE_SEWAGE",
    "WATER_SUPPLY",
    "WOMEN_SAFETY",
    "PUBLIC_INFRASTRUCTURE",
    "OTHER",
  ]),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters"),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  address: z.string().max(500).nullable(),
});

export type ComplaintFormData = z.infer<typeof complaintSchema>;

export const assignmentSchema = z.object({
  employee_id: z.string().uuid("Please select an employee"),
  department_id: z.string().uuid("Please select a department"),
  ward_id: z.string().uuid("Please select a ward").nullable(),
  deadline: z.string().nullable(),
  notes: z.string().max(500).nullable(),
});

export type AssignmentFormData = z.infer<typeof assignmentSchema>;

export const resolutionSchema = z.object({
  notes: z
    .string()
    .min(10, "Please provide detailed resolution notes (at least 10 characters)")
    .max(2000),
});

export type ResolutionFormData = z.infer<typeof resolutionSchema>;

export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
