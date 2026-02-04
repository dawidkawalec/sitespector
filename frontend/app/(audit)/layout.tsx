/**
 * Audit Route Group Layout
 * 
 * This layout wraps all audit-related pages (/audits/*).
 * It does NOT include the global sidebar - audit pages have their own navigation.
 */

export default function AuditRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
