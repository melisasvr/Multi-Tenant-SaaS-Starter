export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-semibold text-xl tracking-tight">SaaS Starter</span>
        </div>
        {children}
      </div>
    </div>
  )
}
