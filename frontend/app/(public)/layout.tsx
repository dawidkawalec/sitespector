import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { PublicFooter } from '@/components/layout/PublicFooter'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="relative flex-1 bg-gradient-to-br from-[#fff9f5] to-[#f5f5f5] dark:from-[#141822] dark:to-[#0b363d]">
        {/* Decorative background shapes */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative">{children}</div>
      </main>
      <PublicFooter />
    </div>
  )
}
