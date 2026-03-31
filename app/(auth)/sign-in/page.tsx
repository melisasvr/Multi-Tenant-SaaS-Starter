import Link from 'next/link'
import { SignInForm } from '@/components/auth/sign-in-form'

export const metadata = { title: 'Sign in' }

export default function SignInPage() {
  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
      <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>
      <SignInForm />
      <p className="text-sm text-center text-gray-500 mt-6">
        No account?{' '}
        <Link href="/sign-up" className="text-brand-600 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
