# KawaSaaS Component Inventory

This document tracks which components from KawaSaaS starter we'll adapt for SiteSpector.

**Source**: https://github.com/dawidkawalec/KawaSaaS.git

**Strategy**: Adapt (don't copy-paste) - maintain Next.js patterns, adjust for SiteSpector needs

---

## Phase 3: UI Components to Port

### Layout Components

#### 1. Sidebar Navigation
**Source**: `src/components/layout/Sidebar.tsx` (KawaSaaS)  
**Target**: `frontend/components/layout/Sidebar.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- Workspace switcher at top
- Navigation links (Dashboard, Audits, Team, Billing, Settings)
- User menu with logout at bottom
- Active route highlighting
- Icons from lucide-react

**Adaptations needed**:
- Change nav items (remove KawaSaaS-specific items)
- Add SiteSpector-specific items (Audits page)
- Update colors/branding
- Integrate with Next.js App Router (not React Router)

---

#### 2. Mobile Sidebar (Sheet)
**Source**: `src/components/layout/MobileMenu.tsx` (KawaSaaS)  
**Target**: `frontend/components/layout/MobileSidebar.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- Sheet component (slide-in from left)
- Hamburger menu trigger
- Same navigation as desktop sidebar
- Responsive (hidden on md+ breakpoints)

**Adaptations needed**:
- Ensure shadcn/ui Sheet component installed
- Update trigger button styling

---

#### 3. Header Component
**Source**: `src/components/layout/Header.tsx` (KawaSaaS)  
**Target**: `frontend/components/layout/Header.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- Mobile menu trigger (md:hidden)
- Page title
- User avatar dropdown
- Notifications bell (optional)

**Adaptations needed**:
- Simplify (remove features not needed yet)
- Add breadcrumbs (optional)

---

#### 4. Logo Component
**Source**: `src/components/shared/Logo.tsx` (KawaSaaS)  
**Target**: `frontend/components/shared/Logo.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- SVG logo or text logo
- Link to dashboard
- Responsive sizing

**Adaptations needed**:
- Replace KawaSaaS branding with SiteSpector
- Consider custom icon/logo design

---

### Settings Pages

#### 5. Profile Settings
**Source**: `src/features/settings/Profile.tsx` (KawaSaaS)  
**Target**: `frontend/app/settings/profile/page.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- Full name input
- Email display (read-only)
- Avatar upload (optional)
- Save button with loading state

**Adaptations needed**:
- Use Supabase storage for avatar (if implementing)
- Update form validation

---

#### 6. Appearance Settings
**Source**: `src/features/settings/Appearance.tsx` (KawaSaaS)  
**Target**: `frontend/app/settings/appearance/page.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- Theme toggle (Light/Dark/System)
- Preview of theme
- Uses next-themes

**Adaptations needed**:
- Minimal (should work as-is)
- Update colors if custom theme

---

#### 7. Notifications Settings
**Source**: `src/features/settings/Notifications.tsx` (KawaSaaS)  
**Target**: `frontend/app/settings/notifications/page.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- Email notification preferences
- Checkbox toggles
- Save button

**Adaptations needed**:
- SiteSpector-specific notifications:
  - Audit completed
  - Audit failed
  - Team invite received
  - Monthly usage report

---

#### 8. Settings Layout
**Source**: `src/features/settings/SettingsLayout.tsx` (KawaSaaS)  
**Target**: `frontend/app/settings/layout.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- Left sidebar with settings nav
- Active page highlighting
- Responsive layout

**Adaptations needed**:
- Update nav items for SiteSpector
- Ensure works with Next.js App Router layout

---

### Team Management

#### 9. Workspace Switcher
**Source**: `src/features/teams/TeamSwitcher.tsx` (KawaSaaS)  
**Target**: `frontend/components/WorkspaceSwitcher.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- Dropdown (Popover + Command)
- List personal and team workspaces
- Search workspaces
- Create team button
- Active workspace indicator

**Adaptations needed**:
- Use WorkspaceContext from SiteSpector
- Update styling to match sidebar

---

#### 10. Team Settings Page
**Source**: `src/features/teams/TeamSettings.tsx` (KawaSaaS)  
**Target**: `frontend/app/settings/team/page.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- Members list with avatars
- Role badges
- Invite member form
- Remove member button
- Pending invites list

**Adaptations needed**:
- Use Supabase workspace_members queries
- Update invite flow

---

#### 11. Create Team Dialog
**Source**: `src/features/teams/CreateTeamDialog.tsx` (KawaSaaS)  
**Target**: `frontend/components/teams/CreateTeamDialog.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- Modal dialog
- Team name input
- Slug generation (auto from name)
- Creates workspace + adds owner + creates subscription

**Adaptations needed**:
- Use Supabase API
- Ensure subscription created automatically

---

#### 12. Invite Member Dialog
**Source**: `src/features/teams/InviteMemberDialog.tsx` (KawaSaaS)  
**Target**: `frontend/components/teams/InviteMemberDialog.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- Email input
- Role selection (Admin/Member)
- Generate invite token
- Display invite link

**Adaptations needed**:
- Integrate with SiteSpector invite table
- Consider email sending (future)

---

### Billing Components

#### 13. Pricing Page
**Source**: `src/features/billing/PricingPage.tsx` (KawaSaaS)  
**Target**: `frontend/app/pricing/page.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- 3 pricing tiers (Free/Pro/Enterprise)
- Feature lists
- Subscribe buttons
- Highlighted recommended plan
- Responsive grid

**Adaptations needed**:
- Update SiteSpector-specific features
- Update pricing ($29/$99)
- Connect to backend checkout endpoint

---

#### 14. Billing Settings Page
**Source**: `src/features/billing/BillingSettings.tsx` (KawaSaaS)  
**Target**: `frontend/app/settings/billing/page.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- Current plan display
- Usage meter (audits this month)
- Upgrade button
- Manage subscription button (Stripe portal)
- Invoice history

**Adaptations needed**:
- Update to show audit usage
- Connect to Supabase subscriptions table

---

#### 15. Invoice History
**Source**: `src/features/billing/InvoiceHistory.tsx` (KawaSaaS)  
**Target**: `frontend/components/billing/InvoiceHistory.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- Table of past invoices
- Download invoice button
- Date, amount, status columns

**Adaptations needed**:
- Connect to Supabase invoices table
- Add download PDF link

---

### Auth Components

#### 16. OAuth Buttons
**Source**: `src/features/auth/OAuthButtons.tsx` (KawaSaaS)  
**Target**: `frontend/components/auth/OAuthButtons.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- Google login button with icon
- GitHub login button with icon
- Styled with brand colors
- Loading states

**Adaptations needed**:
- Use Supabase signInWithOAuth
- Update button styling

---

#### 17. Magic Link Form
**Source**: `src/features/auth/MagicLinkForm.tsx` (KawaSaaS)  
**Target**: `frontend/components/auth/MagicLinkForm.tsx` (SiteSpector)  
**Status**: ⏳ Pending

**Key features**:
- Email input
- Send magic link button
- Success message

**Adaptations needed**:
- Use Supabase signInWithOtp
- Update success/error messages

---

## shadcn/ui Components Needed

Check if these exist in current SiteSpector, install if missing:

- [x] Button
- [x] Card
- [x] Badge
- [x] Dialog
- [x] Alert Dialog
- [x] Input
- [x] Label
- [x] Tabs
- [x] Scroll Area
- [x] Alert
- [ ] Command (for workspace switcher search)
- [ ] Popover (for workspace switcher)
- [ ] Sheet (for mobile menu)
- [ ] Select (for role selection)
- [ ] Separator
- [ ] Avatar (for user display)
- [ ] Dropdown Menu (for user menu)
- [ ] Progress (for usage meter)

**Install missing**:
```bash
npx shadcn-ui@latest add command
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add select
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add progress
```

---

## Theme & Styling

### Color Scheme (from KawaSaaS)

KawaSaaS uses shadcn/ui default theme. Consider customizing for SiteSpector:

```css
/* tailwind.config.ts - Custom colors */
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#3b82f6', /* Blue for SiteSpector */
        foreground: '#ffffff'
      }
      /* ... other colors */
    }
  }
}
```

### Dark Mode

KawaSaaS has full dark mode support. Ensure all new components support dark mode:
- Use Tailwind `dark:` prefix
- Use CSS variables from shadcn/ui
- Test in both light and dark modes

---

## Implementation Order (Phase 3)

1. **Week 4, Day 1-2**: Sidebar + Mobile Menu
2. **Week 4, Day 3-4**: Settings Layout + Profile + Appearance pages
3. **Week 4, Day 5**: Workspace Switcher + Create Team Dialog
4. **Week 4, Day 6**: Team Settings Page (members list, invite form)
5. **Week 4, Day 7**: Final polish, responsive testing

---

## Notes

- **Don't blindly copy**: KawaSaaS uses Vite+React Router, SiteSpector uses Next.js App Router
- **Check dependencies**: Some KawaSaaS components may use libraries not in SiteSpector
- **Test thoroughly**: Ensure RLS works correctly before exposing team data
- **Document changes**: Update `.context7/frontend/COMPONENTS.md` after porting

---

**Last Updated**: 2025-02-03  
**Status**: Inventory complete, ready for Phase 3 implementation
