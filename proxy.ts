import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Auth routes — redirect to dashboard if already logged in
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    if (user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return supabaseResponse
  }

  // Protected routes — redirect to sign-in if not logged in
  const isProtected =
    !pathname.startsWith('/sign-in') &&
    !pathname.startsWith('/sign-up') &&
    !pathname.startsWith('/invite') &&
    !pathname.startsWith('/onboarding') &&
    pathname !== '/'

  if (isProtected && !user) {
    const redirectUrl = new URL('/sign-in', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Org-scoped routes — verify membership
  const orgSlugMatch = pathname.match(/^\/([^/]+)/)
  const reservedSlugs = ['sign-in', 'sign-up', 'invite', 'onboarding', 'api', '_next', 'favicon.ico']

  if (user && orgSlugMatch && !reservedSlugs.includes(orgSlugMatch[1])) {
    const slug = orgSlugMatch[1]

    const { data: membership } = await supabase
      .from('memberships')
      .select('id, role, organizations!inner(slug)')
      .eq('user_id', user.id)
      .eq('organizations.slug', slug)
      .single()

    if (!membership) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}