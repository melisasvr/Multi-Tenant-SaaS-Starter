import Link from 'next/link'
import { SignUpForm } from '@/components/auth/sign-up-form'

export const metadata = { title: 'Create account' }

export default function SignUpPage() {
  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h1>
      <p className="text-sm text-gray-500 mb-6">Start your free workspace today</p>
      <SignUpForm />
      <p className="text-sm text-center text-gray-500 mt-6">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-brand-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
