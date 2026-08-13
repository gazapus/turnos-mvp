import {
  AUTH_COOKIE_NAME,
  ROLE_HOME_PATHS,
  type AuthRole,
} from '@turnos/shared-types';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Prefijos protegidos (alineados a APP_PATHS en lib/navigation).
 */
const PROTECTED_PREFIXES = [
  '/usuarios',
  '/agenda',
  '/consultorios',
  '/pacientes',
  '/sala-espera',
] as const;

/**
 * Lee el rol del JWT sin verificar firma (solo para redirect UX).
 * La autorización real ocurre en el API.
 *
 * @param token - JWT de la cookie.
 * @returns Rol o null.
 */
function peekRole(token: string): AuthRole | null {
  try {
    const [, payloadPart] = token.split('.');
    if (!payloadPart) {
      return null;
    }
    const json = Buffer.from(payloadPart, 'base64url').toString('utf8');
    const payload = JSON.parse(json) as { rol?: string };
    if (
      payload.rol === 'ADMIN' ||
      payload.rol === 'RECEPCIONISTA' ||
      payload.rol === 'MEDICO'
    ) {
      return payload.rol;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Middleware de sesión: protege paneles y redirige login si ya hay cookie.
 *
 * @param request - Request Next.
 * @returns NextResponse.
 */
export function middleware(request: NextRequest): NextResponse {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  if (pathname === '/mi-agenda' || pathname.startsWith('/mi-agenda/')) {
    return NextResponse.redirect(new URL('/agenda', request.url));
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && token) {
    const rol = peekRole(token);
    const destination = rol ? ROLE_HOME_PATHS[rol] : '/usuarios';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (pathname === '/' && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/' && token) {
    const rol = peekRole(token);
    const destination = rol ? ROLE_HOME_PATHS[rol] : '/login';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/mi-agenda',
    '/mi-agenda/:path*',
    '/usuarios/:path*',
    '/agenda/:path*',
    '/consultorios/:path*',
    '/pacientes/:path*',
    '/sala-espera/:path*',
  ],
};
