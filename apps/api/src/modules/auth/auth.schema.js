import { z } from 'zod';
import {
  emailSchema,
  loginSchema as sharedLoginSchema,
  passwordSchema,
  registerSchema as sharedRegisterSchema,
} from '@duo-las/shared';

export const registerSchema = sharedRegisterSchema;
export const loginSchema = sharedLoginSchema;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: passwordSchema,
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'El token es requerido'),
    password: passwordSchema,
  })
  .strict();

const fieldLabels = {
  username: 'Nombre de usuario',
  email: 'Email',
  password: 'Contraseña',
  ageConfirmed: 'Mayoría de edad',
  termsAccepted: 'Términos y privacidad',
  captchaToken: 'Captcha',
  identifier: 'Email o nombre de usuario',
  currentPassword: 'Contraseña actual',
  newPassword: 'Nueva contraseña',
  token: 'Token',
};

const formatErrors = (error) =>
  error.errors.map((issue) => {
    const field = issue.path[0];
    return `${fieldLabels[field] || field}: ${issue.message}`;
  });

export function validateRegister(data) {
  const result = registerSchema.safeParse(data);
  if (!result.success) {
    return { hasError: true, errorMessages: formatErrors(result.error), data: null };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

export function validateLogin(data) {
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    return { hasError: true, errorMessages: formatErrors(result.error), data: null };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

export function validateChangePassword(data) {
  const result = changePasswordSchema.safeParse(data);
  if (!result.success) {
    return { hasError: true, errorMessages: formatErrors(result.error), data: null };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

export function validateForgotPassword(data) {
  const result = forgotPasswordSchema.safeParse(data);
  if (!result.success) {
    return { hasError: true, errorMessages: formatErrors(result.error), data: null };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

export function validateResetPassword(data) {
  const result = resetPasswordSchema.safeParse(data);
  if (!result.success) {
    return { hasError: true, errorMessages: formatErrors(result.error), data: null };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}
