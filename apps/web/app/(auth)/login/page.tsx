import Image from 'next/image';
import { LoginForm } from '@/components/auth/login-form';

const SLIDES = [
  '/images/login/slide-1.webp',
  '/images/login/slide-2.webp',
  '/images/login/slide-3.webp',
] as const;

const LOGIN_LOGO_SRC = '/images/login/logo_icono.png';

/**
 * Pantalla de inicio de sesión (Server Component) — layout Stitch desktop-first.
 *
 * @returns Página de login con slideshow, panel brand y formulario.
 */
export default function LoginPage() {
  return (
    <div className="relative flex h-dvh items-center justify-center overflow-hidden bg-brand p-8 font-sans max-lg:min-h-dvh max-lg:overflow-y-auto max-lg:p-6 max-lg:items-center max-md:items-start max-md:bg-transparent max-md:px-3 max-md:pb-6 max-md:pt-12">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        {SLIDES.map((src) => (
          <div
            key={src}
            className="login-slideshow-item absolute inset-0 bg-cover bg-center opacity-0"
            style={{ backgroundImage: `url('${src}')` }}
          />
        ))}
        <div className="absolute inset-0 bg-brand-overlay mix-blend-multiply" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/images/login/overlay.png')" }}
        />
      </div>

      <main className="login-panel login-panel-shine relative z-10 my-auto flex w-full max-w-[960px] max-h-[calc(100dvh-4rem)] flex-row items-stretch overflow-hidden rounded-2xl border border-brand-border border-t-brand-border-strong max-lg:max-w-[540px] max-lg:max-h-none max-lg:flex-col max-md:my-0 max-md:max-w-none max-md:rounded-none max-md:border-0">
        <section className="relative z-10 flex min-h-0 w-full flex-1 flex-col justify-between p-10 max-md:hidden max-lg:shrink-0 max-lg:items-center max-lg:p-6 max-lg:pb-2 max-lg:text-center">
          <header className="flex items-center gap-3 max-lg:justify-center">
            <div className="login-logo-backdrop flex h-16 w-16 shrink-0 items-center justify-center rounded-full p-2 max-lg:h-14 max-lg:w-14">
              <Image
                src={LOGIN_LOGO_SRC}
                alt="Hospital Clínica Salud"
                width={48}
                height={48}
                className="h-12 w-12 object-contain max-lg:h-10 max-lg:w-10"
                priority
              />
            </div>
          </header>

          <div className="mb-auto mt-6 flex flex-1 flex-col justify-center max-lg:mt-4 max-lg:flex-none">
            <div className="mb-4 h-0.5 w-10 bg-brand-subtle/30 max-lg:mx-auto" />
            <h1 className="mb-3 font-heading text-5xl font-extrabold leading-tight tracking-tighter text-brand-foreground max-lg:mb-2 max-lg:text-3xl">
              GESTIÓN DE TURNOS
            </h1>
            <h2 className="mb-4 font-heading text-sm font-semibold uppercase tracking-widest text-accent max-lg:mb-0 max-lg:text-xs">
              HOSPITAL CLÍNICA SALUD
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-brand-muted max-lg:hidden">
              Módulo de gestión de turnos para recepcionistas y staff médico del
              Hospital Clínica Salud.
            </p>
          </div>

          <footer className="mt-6 shrink-0 text-xs text-brand-muted/60 max-lg:hidden">
            © {new Date().getFullYear()} Hospital Clínica Salud. Todos los
            derechos reservados.
          </footer>
        </section>

        <section className="relative z-10 flex w-[380px] shrink-0 items-center justify-center p-8 max-lg:w-full max-lg:shrink-0 max-lg:p-5 max-md:p-0">
          <div className="login-form-container w-full max-w-sm rounded-2xl p-6 max-lg:max-w-none max-md:rounded-xl max-md:p-4">
            <div className="mb-6 hidden justify-center max-md:flex">
              <div className="login-logo-backdrop flex h-14 w-14 shrink-0 items-center justify-center rounded-full p-2">
                <Image
                  src={LOGIN_LOGO_SRC}
                  alt="Hospital Clínica Salud"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  priority
                />
              </div>
            </div>
            <div className="mb-6">
              <h2 className="mb-2 font-heading text-2xl font-bold text-on-elevated">
                Iniciar sesión
              </h2>
              <p className="text-sm text-muted-foreground">
                Ingresa tus credenciales para acceder al sistema.
              </p>
            </div>
            <LoginForm />
          </div>
        </section>
      </main>
    </div>
  );
}
