import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

export const PLATFORM_FEE_PERCENT = 0.15

export function calculatePlatformFee(contractValue: number): number {
  return Math.round(contractValue * PLATFORM_FEE_PERCENT * 100) / 100
}

export function calculateCancellationFee(
  weeklyRate: number,
  hoursBeforeStart: number
): number {
  if (hoursBeforeStart >= 168) return 0           // 7+ days
  if (hoursBeforeStart >= 72) return weeklyRate * 0.25  // 3-6 days
  if (hoursBeforeStart >= 24) return weeklyRate * 0.5   // 24-72 hours
  return weeklyRate                                 // under 24 hours
}
