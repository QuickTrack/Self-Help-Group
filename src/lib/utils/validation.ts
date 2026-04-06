import { z } from 'zod';

export const memberSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  idNumber: z.string().min(1, 'ID number is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  location: z.enum(['Githirioni', 'Lari', 'Kiambu', 'Other']).optional(),
  nextOfKinName: z.string().min(1, 'Next of kin name is required'),
  nextOfKinPhone: z.string().min(1, 'Next of kin phone is required'),
  photo: z.string().optional(),
});

export const contributionSchema = z.object({
  member: z.string().min(1, 'Member is required'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().optional(),
  paymentMethod: z.enum(['Cash', 'M-Pesa', 'Bank', 'Other']).optional(),
  contributionType: z.enum(['Monthly', 'Weekly', 'Special', 'Other']).optional(),
  isRecurring: z.boolean().optional(),
  notes: z.string().optional(),
});

export const loanSchema = z.object({
  member: z.string().min(1, 'Member is required'),
  principalAmount: z.number().positive('Amount must be positive'),
  interestRate: z.number().min(0).max(100, 'Rate must be 0-100').optional(),
  repaymentPeriod: z.number().positive('Period must be positive'),
  startDate: z.string().optional(),
  guarantor1: z.string().optional(),
  guarantor2: z.string().optional(),
});

export const savingsSchema = z.object({
  member: z.string().min(1, 'Member is required'),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['deposit', 'withdrawal', 'share-purchase']).optional(),
  notes: z.string().optional(),
});

export const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(1, 'Location is required'),
  agenda: z.string().optional(),
});

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map(i => i.message).join(', ');
  return { success: false, error: errors };
}
