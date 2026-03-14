# Modern Design Best Practices

## Philosophy

Create unique, memorable experiences while maintaining consistency through modern design principles. Every project should feel distinct yet professional, innovative yet intuitive.

---

## Landing Pages & Marketing Sites

### Hero Sections
**Go beyond static backgrounds:**
- Animated gradients with subtle movement
- Particle systems or geometric shapes floating
- Interactive canvas backgrounds (Three.js, WebGL)
- Video backgrounds with proper fallbacks
- Parallax scrolling effects
- Gradient mesh animations
- Morphing blob animations


### Layout Patterns
**Use modern grid systems:**
- Bento grids (asymmetric card layouts)
- Masonry layouts for varied content
- Feature sections with diagonal cuts or curves
- Overlapping elements with proper z-index
- Split-screen designs with scroll-triggered reveals

**Avoid:** Traditional 3-column equal grids

### Scroll Animations
**Engage users as they scroll:**
- Fade-in and slide-up animations for sections
- Scroll-triggered parallax effects
- Progress indicators for long pages
- Sticky elements that transform on scroll
- Horizontal scroll sections for portfolios
- Text reveal animations (word by word, letter by letter)
- Number counters animating into view

**Avoid:** Static pages with no scroll interaction

### Call-to-Action Areas
**Make CTAs impossible to miss:**
- Gradient buttons with hover effects
- Floating action buttons with micro-interactions
- Animated borders or glowing effects
- Scale/lift on hover
- Interactive elements that respond to mouse position
- Pulsing indicators for primary actions

---

## Dashboard Applications

### Layout Structure
**Always use collapsible side navigation:**
- Sidebar that can collapse to icons only
- Smooth transition animations between states
- Persistent navigation state (remember user preference)
- Mobile: drawer that slides in/out
- Desktop: sidebar with expand/collapse toggle
- Icons visible even when collapsed

**Structure:**
```
/dashboard (layout wrapper with sidebar)
  /dashboard/overview
  /dashboard/analytics
  /dashboard/settings
  /dashboard/users
  /dashboard/projects
```

All dashboard pages should be nested inside the dashboard layout, not separate routes.

### Data Tables
**Modern table design:**
- Sticky headers on scroll
- Row hover states with subtle elevation
- Sortable columns with clear indicators
- Pagination with items-per-page control
- Search/filter with instant feedback
- Selection checkboxes with bulk actions
- Responsive: cards on mobile, table on desktop
- Loading skeletons, not spinners
- Empty states with illustrations or helpful text

**Use modern table libraries:**
- TanStack Table (React Table v8)
- AG Grid for complex data
- Data Grid from MUI (if using MUI)

### Charts & Visualizations
**Use the latest charting libraries:**
- Recharts (for React, simple charts)
- Chart.js v4 (versatile, well-maintained)
- Apache ECharts (advanced, interactive)
- D3.js (custom, complex visualizations)
- Tremor (for dashboards, built on Recharts)

**Chart best practices:**
- Animated transitions when data changes
- Interactive tooltips with detailed info
- Responsive sizing
- Color scheme matching design system
- Legend placement that doesn't obstruct data
- Loading states while fetching data

### Dashboard Cards
**Metric cards should stand out:**
- Gradient backgrounds or colored accents
- Trend indicators (↑ ↓ with color coding)
- Sparkline charts for historical data
- Hover effects revealing more detail
- Icon representing the metric
- Comparison to previous period

---

## Color & Visual Design

### Color Palettes
**Create depth with gradients:**
- Primary gradient (not just solid primary color)
- Subtle background gradients
- Gradient text for headings
- Gradient borders on cards
- Elevated surfaces for depth

**Color usage:**
- 60-30-10 rule (dominant, secondary, accent)
- Consistent semantic colors (success, warning, error)
- Accessible contrast ratios (WCAG AA minimum)

### Typography
**Create hierarchy through contrast:**
- Large, bold headings (48-72px for heroes)
- Clear size differences between levels
- Variable font weights (300, 400, 600, 700)
- Letter spacing for small caps
- Line height 1.5-1.7 for body text
- Inter, Poppins, or DM Sans for modern feel

### Shadows & Depth
**Layer UI elements:**
- Multi-layer shadows for realistic depth
- Colored shadows matching element color
- Elevated states on hover
- Neumorphism for special elements (sparingly)

---

## Interactions & Micro-animations

### Button Interactions
**Every button should react:**
- Scale slightly on hover (1.02-1.05)
- Lift with shadow on hover
- Ripple effect on click
- Loading state with spinner or progress
- Disabled state clearly visible
- Success state with checkmark animation

### Card Interactions
**Make cards feel alive:**
- Lift on hover with increased shadow
- Subtle border glow on hover
- Tilt effect following mouse (3D transform)
- Smooth transitions (200-300ms)
- Click feedback for interactive cards

### Form Interactions
**Guide users through forms:**
- Input focus states with border color change
- Floating labels that animate up
- Real-time validation with inline messages
- Success checkmarks for valid inputs
- Error states with shake animation
- Password strength indicators
- Character count for text areas

### Page Transitions
**Smooth between views:**
- Fade + slide for page changes
- Skeleton loaders during data fetch
- Optimistic UI updates
- Stagger animations for lists
- Route transition animations

---

## Mobile Responsiveness

### Mobile-First Approach
**Design for mobile, enhance for desktop:**
- Touch targets minimum 44x44px
- Generous padding and spacing
- Sticky bottom navigation on mobile
- Collapsible sections for long content
- Swipeable cards and galleries
- Pull-to-refresh where appropriate

### Responsive Patterns
**Adapt layouts intelligently:**
- Hamburger menu → full nav bar
- Card grid → stack on mobile
- Sidebar → drawer
- Multi-column → single column
- Data tables → card list
- Hide/show elements based on viewport

---

## Loading & Empty States

### Loading States
**Never leave users wondering:**
- Skeleton screens matching content layout
- Progress bars for known durations
- Animated placeholders
- Spinners only for short waits (<3s)
- Stagger loading for multiple elements
- Shimmer effects on skeletons

### Empty States
**Make empty states helpful:**
- Illustrations or icons
- Helpful copy explaining why it's empty
- Clear CTA to add first item
- Examples or suggestions
- No "no data" text alone

---

## Unique Elements to Stand Out

### Distinctive Features
**Add personality:**
- Custom cursor effects on landing pages
- Animated page numbers or section indicators
- Unusual hover effects (magnification, distortion)
- Custom scrollbars
- Glassmorphism for overlays
- Animated SVG icons
- Typewriter effects for hero text
- Confetti or celebration animations for actions

### Interactive Elements
**Engage users:**
- Drag-and-drop interfaces
- Sliders and range controls
- Toggle switches with animations
- Progress steps with animations
- Expandable/collapsible sections
- Tabs with slide indicators
- Image comparison sliders
- Interactive demos or playgrounds

---

## Consistency Rules

### Maintain Consistency
**What should stay consistent:**
- Spacing scale (4px, 8px, 16px, 24px, 32px, 48px, 64px)
- Border radius values
- Animation timing (200ms, 300ms, 500ms)
- Color system (primary, secondary, accent, neutrals)
- Typography scale
- Icon style (outline vs filled)
- Button styles across the app
- Form element styles

### What Can Vary
**Project-specific customization:**
- Color palette (different colors, same system)
- Layout creativity (grids, asymmetry)
- Illustration style
- Animation personality
- Feature-specific interactions
- Hero section design
- Card styling variations
- Background patterns or textures

---

## Technical Excellence

### Performance
- Optimize images (WebP, lazy loading)
- Code splitting for faster loads
- Debounce search inputs
- Virtualize long lists
- Minimize re-renders
- Use proper memoization

### Accessibility
- Keyboard navigation throughout
- ARIA labels where needed
- Focus indicators visible
- Screen reader friendly
- Sufficient color contrast
- Respect reduced motion preferences

---

## Key Principles

1. **Be Bold** - Don't be afraid to try unique layouts and interactions
2. **Be Consistent** - Use the same patterns for similar functions
3. **Be Responsive** - Design works beautifully on all devices
4. **Be Fast** - Animations are smooth, loading is quick
5. **Be Accessible** - Everyone can use what you build
6. **Be Modern** - Use current design trends and technologies
7. **Be Unique** - Each project should have its own personality
8. **Be Intuitive** - Users shouldn't need instructions


---

# Project-Specific Customizations

**IMPORTANT: This section contains the specific design requirements for THIS project. The guidelines above are universal best practices - these customizations below take precedence for project-specific decisions.**

## User Design Requirements

# QuestHabit - Development Blueprint

## Project Concept
QuestHabit is a lightweight, gamified habit-tracking application that converts daily routines into engaging quests. Its purpose is to help users form and maintain habits through fast setup, immediate micro-rewards (XP, levels, streaks, badges), and a minimal social layer (leaderboards, challenges). The vision is a playful, low-friction product that encourages consistent behavior with delight (micro-animations, sounds) while preserving privacy and low data footprint.

AI app description: QuestHabit uses lightweight server-side gamification logic to compute XP, streaks, and badge awarding. It integrates managed authentication, push/email notifications, payment/subscription handling, and analytics. Offline-first sync and atomic completion events ensure reliability across devices.

## Problem Statement
- Core problems:
  - Low habit adoption due to friction in setup and weak feedback loops.
  - Declining retention because habit trackers feel dry or punitive.
  - Users lose progress across devices or during offline use.
  - Privacy concerns and feature bloat in social habit apps.

- Who experiences these problems:
  - Individuals (18–45) seeking habit formation (students, professionals, wellness users).
  - Coaches/mentors needing read-only client overviews.
  - Admin/operators managing product, analytics, and moderation.

- Why these problems matter:
  - Habit formation drives long-term user value; poor onboarding and feedback reduce activation and retention.
  - Privacy-sensitive users avoid social-heavy apps.
  - Cross-device sync and offline reliability are critical for daily habit completion.

- Current state/gaps without this solution:
  - Users either use complex productivity suites or minimal trackers lacking motivation mechanics.
  - Many apps require lengthy setup or provide insufficient reward feedback to keep users engaged.

## Solution
- How application addresses problems:
  - Ultra-fast habit creation wizard (target: 30s) and a single-tap completion flow to reduce friction.
  - Emotion-forward gamification: XP, levels, streaks, badges, celebratory micro-interactions to reward micro-wins and boost stickiness.
  - Local-first storage with background sync and conflict resolution for offline reliability.
  - Privacy-first controls: minimal PII, opt-in social features, export/delete data tools.
  - Lightweight social features: leaderboards and short-term challenges to encourage friendly competition without heavy social feed complexity.

- Approach & methodology:
  - Modular backend services: auth, habit CRUD, gamification engine, notifications, payments.
  - Client-first UX: mobile-focused single-column layout, quick-add FAB, visible progress cards.
  - Configuration-driven gamification rules to adapt XP and badge criteria.
  - Use managed third-party services for auth, email, push, payments, and analytics to accelerate development and increase reliability.

- Key differentiators:
  - Rapid habit creation and immediate first-reward loop.
  - Playful visual design and micro-interactions tuned for emotional engagement.
  - Offline-first sync combined with server-side atomic event handling to avoid fraud and maintain consistency.
  - Privacy-centered defaults and simple social mechanics.

- Value creation:
  - Higher activation and retention via reduced friction and rewarding feedback.
  - Better monetization through premium features that augment backup, analytics, and social limits without blocking core value.
  - Low barrier for coaches/admins to support clients with read-only dashboards.

## Requirements

### 1. Pages (UI Screens)
Each page lists purpose, key sections/components, and contribution to solving the problem.

- Landing Page
  - Purpose: Convert visitors to signups; explain product value.
  - Key sections: Hero (headline, 1-line value prop, CTAs), Feature highlights, Screenshots/carousel, Pricing teaser, Footer.
  - Contribution: Lowers acquisition friction and communicates quick setup + reward value.

- Login / Signup
  - Purpose: Authenticate users; start onboarding.
  - Key sections: Email/password form, OAuth buttons (Google/Apple), progressive onboarding modal (select template, set reminder).
  - Contribution: Fast signup and immediate habit creation increases activation.

- Password Reset
  - Purpose: Recover access securely.
  - Key sections: Email input, submit, success states, guidance.
  - Contribution: Maintains retention via secure recovery.

- Email Verification
  - Purpose: Verify identity for account safety.
  - Key sections: Instructions, resend button with cooldown, change email, polling continue button.
  - Contribution: Prevents fake accounts and secures transactions.

- About & Help
  - Purpose: Provide product info and support.
  - Key sections: About blurb, FAQ, contact form, guides.
  - Contribution: Reduces support load and aids onboarding.

- Privacy Policy / Terms / Cookie Policy
  - Purpose: Legal compliance & trust.
  - Key sections: Full texts, toggles for cookies.
  - Contribution: Communicates privacy-first stance, mitigating user concern.

- Loading & Success States
  - Purpose: Reusable UX for async operations.
  - Components: Spinner, success card, error card.
  - Contribution: Improves perceived performance and trust.

- 404 Not Found / 500 Server Error
  - Purpose: Friendly error handling and retry paths.
  - Contribution: Keeps users engaged and provides support paths.

- Dashboard (Main)
  - Purpose: Daily workspace to mark habits and view progress.
  - Key sections: Today’s habits (compact cards), XP & Level card, Streak tracker, Quick Add, Navigation.
  - Contribution: Low-friction daily interactions and visible rewards.

- Habit List / Library
  - Purpose: Manage and browse habits and templates.
  - Key sections: Search bar, filters, habit cards, create button, empty state.
  - Contribution: Makes habit management fast and discoverable.

- Habit Detail
  - Purpose: Deep view for a single habit.
  - Key sections: Header, completion timeline (heatmap), stats, schedule & reminders, actions (edit/delete/export).
  - Contribution: Supports long-term habit refinement and accountability.

- Create Habit (Wizard)
  - Purpose: Guided quick habit creation within 30s.
  - Steps: Title & icon, frequency & schedule, gamification options (XP, visibility), preview & save.
  - Contribution: Fast onboarding and instant reward configuration.

- Edit Habit
  - Purpose: Update habit attributes with previews.
  - Key sections: Editable fields, save/cancel, impact preview.
  - Contribution: Keeps habits aligned with users’ evolving needs.

- User Profile
  - Purpose: Account and export controls.
  - Key sections: Profile card, account info, subscription, data tools (export/delete).
  - Contribution: Privacy controls and billing transparency.

- Settings & Preferences
  - Purpose: Configure notifications, theme, sync, privacy.
  - Contribution: Reduce habit fatigue and respect user preferences.

- Rewards / Store
  - Purpose: Spend points on cosmetics or boosts.
  - Key sections: Catalog, owned badges grid, purchase flow.
  - Contribution: Provides meaningful spend paths for engagement.

- Leaderboard
  - Purpose: Friendly competition.
  - Key sections: Top ranks, filters, invite button, your rank.
  - Contribution: Social motivation without heavy social feed.

- Challenges
  - Purpose: Time-limited challenges to boost habit engagement.
  - Key sections: Active list, create challenge flow, participant leaderboard.
  - Contribution: Drives short-term bursts of engagement and retention.

- Notifications Center
  - Purpose: In-app inbox for reminders and updates.
  - Key sections: Notification list, unread indicators, actions (snooze, open), settings link.
  - Contribution: Centralizes communication and reduces missed reminders.

- Checkout / Payment
  - Purpose: Subscribe or buy cosmetic items.
  - Key sections: Plan selector, payment method, summary, success receipt.
  - Contribution: Monetization and transparent billing.

- Order / Transaction History
  - Purpose: Show invoices and receipts.
  - Contribution: Billing transparency and trust.

- Subscription Management
  - Purpose: Manage plan and billing methods.
  - Key sections: Current plan card, change plan modal, billing methods.
  - Contribution: Reduces churn friction and supports reactivation.

- Admin Dashboard
  - Purpose: Operational analytics and moderation.
  - Key sections: KPI cards, recent events, quick actions.
  - Contribution: Enables product and safety monitoring.

- Admin — User Management
  - Purpose: Manage users (suspend, export).
  - Key sections: User table, detail modal, actions.
  - Contribution: Support and moderation capability.

- Admin — Analytics & Reports
  - Purpose: Advanced product analytics.
  - Key sections: Cohorts, funnels, report builder, scheduled reports.
  - Contribution: Data-driven product decisions and growth.

- Admin — Content Moderation
  - Purpose: Handle reports and disputes.
  - Key sections: Reports queue, moderation actions, audit log.
  - Contribution: Keeps community-safe and accountable.

### 2. Features
List core features with technical details and implementation notes.

- User Authentication
  - Tech: Firebase Auth or Auth0; JWT for API; refresh tokens.
  - Notes: Enforce password rules, rate-limit auth endpoints, audit logs, social OAuth optional.
  - Contribution: Secure identity and easy integration.

- Password Management
  - Tech: Provider-managed or bcrypt hashing; short TTL single-use reset tokens via SendGrid.
  - Notes: Rate limit resets; require current password for changes.
  - Contribution: Account security and safe recovery.

- Session Management
  - Tech: Short-lived access tokens (15m) + refresh tokens; session listing UI.
  - Notes: Revoke refresh tokens, secure cookie or encrypted mobile storage.
  - Contribution: Security and cross-device control.

- Email Verification
  - Tech: SendGrid transactional emails; single-use tokens with cooldown.
  - Notes: Poll endpoint to check verification.
  - Contribution: Prevents fraud and secures accounts.

- Habit CRUD & Scheduling
  - Tech: Database schema normalized for Habit table; schedule using RFC5545-lite recurrence model.
  - Notes: Validation, max habits for free tier, pagination, timezone-aware scheduling.
  - Contribution: Core functionality for tracking.

- Gamification Engine
  - Tech: Stateless service/module to process completion events; config-driven XP/level thresholds; event logs for audit.
  - Notes: Atomic update of habit completion, XP, streaks, badges; server-side validation to prevent fraud.
  - Contribution: Reliable reward computation and consistent UX.

- Streak Tracking
  - Tech: Store current_streak, longest_streak, last_completion_date per habit; timezone-aware day boundaries.
  - Notes: Handle recovery windows and manual adjustments with audit logs.
  - Contribution: Motivational metric for users.

- Reminders & Notifications
  - Tech: FCM/APNs for push, SendGrid for email; server scheduler for dispatch; user quiet hours.
  - Notes: Retry/backoff, fallback to email, opt-in toggles.
  - Contribution: Keeps users on track without fatigue.

- Search & Filter
  - Tech: Client-side fuzzy for small lists; server-side indexed search for scale (DB indexes or Elasticsearch).
  - Notes: Debounce, result caching, sanitized inputs.
  - Contribution: Efficient habit discovery and management.

- Offline Sync & Local Cache
  - Tech: IndexedDB (web), SQLite (mobile); background sync workers; conflict resolution (LWW with manual merge).
  - Notes: Visual sync status, retry controls.
  - Contribution: Reliable daily use across intermittent connectivity.

- Data Export / Import
  - Tech: Export endpoints (CSV/JSON); import parser with validation.
  - Notes: Rate-limit exports; audit log exports.
  - Contribution: User control over data (privacy & portability).

- Payment Processing
  - Tech: Stripe Billing and Checkout; server webhooks to reconcile subscription events.
  - Notes: PCI via tokenization; handle proration, refunds, and failed payment retries.
  - Contribution: Monetization and billing reliability.

- Subscription Management
  - Tech: Expose subscription state via API; change/cancel via Stripe APIs.
  - Notes: Re-auth for billing changes; audit trail.
  - Contribution: Transparent billing and retention controls.

- Admin Controls
  - Tech: RBAC, soft-delete, impersonation (support), moderation actions; secure admin auth (MFA).
  - Notes: Audit logs for actions, ability to suspend/refund.
  - Contribution: Operational safety and governance.

- Analytics & Reporting
  - Tech: Amplitude/GA4 or Mixpanel; server-side event reconciliation.
  - Notes: Event schema enforcement, scheduled exports, PII minimization.
  - Contribution: Product growth and retention analysis.

- Micro-sounds & Animations
  - Tech: Small asset pack (Ogg/MP3), Lottie/SVG animations.
  - Notes: Configurable intensity and disable option for accessibility.
  - Contribution: Emotional reward that boosts engagement.

### 3. User Journeys
Step-by-step user flows per user type.

- New Individual User (Activation)
  1. Landing page → click Sign Up.
  2. Signup (email/password or OAuth) → email verification (optional).
  3. Progressive onboarding modal: choose habit template → set reminder/time.
  4. Create Habit wizard completes — preview and immediate "Mark first complete" CTA.
  5. Mark completion → client hits gamification endpoint → XP awarded, streak start, celebratory micro-animation.
  6. Dashboard shows XP card, streak tracker, and Quick Add for subsequent habits.

- Returning User (Daily Habit)
  1. Open app → Dashboard loads cached local data.
  2. Receive reminder (push) → tap to open specific habit.
  3. Mark habit complete → completion event sent to server or queued if offline.
  4. Gamification engine atomically updates XP/streaks → UI animates level progress and badge pop if earned.
  5. Store or Leaderboard updated based on visibility settings.

- Offline-first Flow
  1. User marks habit complete while offline → change stored in local DB with pending event.
  2. Background sync worker retries on network restore, resolves conflicts (LWW); if server rejects (e.g., duplicate), client resolves with server state and shows audit trail.
  3. User sees eventual consistency indicator during sync.

- Coach/Mentor (Read-only)
  1. Coach receives invitation → signs up or links account.
  2. Access client overview (read-only): list of client habits, summary metrics.
  3. Optionally create group challenge for clients (if invited) or export client data (with permissions).
  4. Use Admin/Coach dashboard for client-level reporting.

- Admin Operator
  1. Admin logs into Admin Dashboard (MFA).
  2. Monitor KPIs; search users; open user profile for moderation.
  3. Suspend/unsuspend users, refund transactions, impersonate for support (read-only).
  4. Generate scheduled reports and respond to moderation queue.

- Subscription Flow
  1. User opens Subscription page → selects monthly/annual plan.
  2. Payment via Stripe Checkout or embedded Elements.
  3. Server receives webhook event → update user subscription state.
  4. Client displays subscription status; premium features unlocked (cloud backup, advanced analytics, unlimited reminders).

- Challenge Creation & Participation
  1. User creates challenge (name, goal, duration, privacy) → server creates challenge record.
  2. Invite link sent to friends or public challenge shown in Discovery.
  3. Participants complete relevant habits → challenge progress updates in real-time.
  4. On completion, winners awarded badges/points; celebratory UX shown.

## UI Guide
(Use the Design System below for all pages and components. Apply components consistently.)

Visual Style
- Color Palette: primary accent #FF9A57; complementary #7C61FF; backgrounds #FFF4EA → #F7E1C9 gradient; card background #FFF7F0; text #0F1724; secondary text #6B7280; muted #9AA0A6; dark card #11121A; supporting accents #4AB3FF, #54D8A9, #BFA7FF. Gradients: #FF9A57 → #FFD7A8 and #7C61FF → #BFA7FF. Shadows rgba(15,17,36,0.06).

Typography & Layout
- Typeface: friendly geometric sans (Poppins or Inter).
- Weights: h1 600–700, h2 600, body 400, labels 500, metrics 700.
- Sizes (mobile): title 20–24px, subhead 16–18px, body 14–15px, caption 12px.
- Spacing: 8px grid, horizontal padding 16–20px, vertical rhythm 12–20px.
- Layout: single-column vertical scroll, rounded cards, bottom nav with central FAB.

Key Design Elements
- Card Design: rounded (16–24px), frosted glass effect, drop shadow (0 8px 20px rgba(15,17,36,0.06)). Featured cards dark #11121A.
- Navigation: bottom rounded pill nav with central FAB for Create Habit; 4–5 items.
- Data Visualization: rounded pill-shaped bars, gradients per category, sparklines in cards.
- Interactive Elements: primary CTA pill gradient (#FF9A57 → #FFD7A8), secondary outlined pills, inputs rounded 12–16px radius, focus ring #7C61FF.

Design Philosophy
- Playful minimalism, emotion-forward reward design, clean rounded modern UI, clarity-first UX, accessibility and configurable animation/sound.

Implementation Notes
- Apply design tokens and component library consistently. Provide a Figma UI kit and SVG icon set. Include micro-sound pack and Lottie/SVG animations. Make animations and sounds user-configurable.

## Instructions to AI Development Tool
1. Refer to Project Concept, Problem Statement, and Solution to understand the "why" for features and UX decisions.
2. Ensure all features and pages directly address the problems identified (activation, retention, privacy, offline reliability).
3. Verify pages and features meet the specified UI Guide and design system before marking tasks complete.
4. Enforce visual consistency: color tokens, typography, spacing, component behavior (shadows, radii, hover/press states).
5. Map third-party integrations per API list and adhere to security/compliance notes (auth token handling, PCI tokenization, audit logging).
6. Validate gamification atomicity: completion events must update habit status, XP, streaks, and issue badges in a consistent transaction.
7. Implement offline sync with clear retry and conflict resolution UX; surface sync state to users.
8. Implement admin RBAC, audit logs, and moderation flows with secure admin auth (MFA recommended).
9. Provide export/import endpoints consistent with privacy policy and audit logging for exports.
10. Include extensive unit/integration tests for recurrence rules, timezone handling, and gamification edge cases.

API & Integration Summary (to implement)
- Auth: Firebase Auth or Auth0 (email/password, OAuth).
- Emails: SendGrid for transactional emails (verification, reset, reminders).
- Push: FCM and APNs for push notifications; Web Push optional.
- Storage: Amazon S3 (or Cloud Storage) for assets and backups.
- Payments: Stripe (Billing, Checkout, webhooks).
- Analytics: Amplitude / GA4 / Mixpanel for event tracking and cohort analysis.

Data & Security Notes
- Minimize PII; provide export/delete tools.
- Store passwords via provider or use bcrypt.
- Use short-lived tokens and secure refresh flows; revoke tokens on logout.
- Audit logs for critical actions (auth events, exports, admin moderation).
- Ensure GDPR/CCPA compliant flows and privacy documentation.

Schemas & Technical Outline (high-level)
- Core DB Tables:
  - users (id, email, display_name, avatar_url, role, created_at, last_login, subscription_id, settings_json)
  - habits (id, user_id, title, icon, schedule_json, xp_value, privacy_flag, archived, created_at, updated_at)
  - completions (id, habit_id, user_id, timestamp, source, xp_awarded, created_at)
  - user_stats (user_id, xp_total, level, current_streak, longest_streak, last_completion_date)
  - badges (id, name, criteria_json, icon_url, rarity)
  - user_badges (id, user_id, badge_id, awarded_at)
  - challenges (id, creator_id, name, rules_json, starts_at, ends_at, privacy)
  - challenge_participants (challenge_id, user_id, progress_json)
  - notifications (id, user_id, type, payload_json, read, created_at)
  - sessions (id, user_id, device_info, refresh_token_hash, last_seen)
  - admin_audit_logs (id, admin_id, action, target_id, metadata, created_at)
  - payments/invoices (Stripe integration records)
- Events & Processing:
  - completion_event -> gamification service -> transactional update: completions + user_stats + badges + notification
  - scheduled_reminder_job -> notification dispatch -> push/email fallback

Testing & QA
- Unit tests: recurrence/schedule logic, gamification rules, streak calculations, auth flows.
- Integration tests: completion event to XP pipeline, offline sync end-to-end, payment webhook reconciliation.
- E2E tests: signup -> create habit -> mark complete -> check XP and badge UI.
- Accessibility tests: color contrast, keyboard navigation, reduce motion preference respected.

Roadmap (MVP then iterations)
- MVP: Auth, core habit CRUD, create habit wizard, mark complete flow, gamification engine basic XP/streaks, dashboard, reminders (push), offline local cache, subscription checkout (Stripe), basic admin dashboard.
- Post-MVP: Leaderboards, challenges, store with cosmetic purchases, advanced analytics for premium, coach/mentor read-only views, import/export polish, expanded admin moderation tools.

Assets & Deliverables
- Figma UI kit & design tokens.
- SVG icon set and badge illustrations.
- Micro-sound pack.
- Lottie/SVG animations for celebratory moments.
- Admin UI templates and report graphics.
- App logo in horizontal/vertical/icon forms.
- Receipt/invoice PDF template.

Success Metrics & Monitoring
- Activation: % new users creating a habit within first session (target 60%+).
- Retention: 7-day (target 30%), 30-day (target 15%).
- Engagement: avg daily habit completions, avg streak length.
- Monetization: subscription conversion 3–5%, ARPU.
- Monitoring: error tracking (Sentry), performance metrics (APM), push deliverability, payment webhook failures.

End of blueprint.

## Implementation Notes

When implementing this project:

1. **Follow Universal Guidelines**: Use the design best practices documented above as your foundation
2. **Apply Project Customizations**: Implement the specific design requirements stated in the "User Design Requirements" section
3. **Priority Order**: Project-specific requirements override universal guidelines when there's a conflict
4. **Color System**: Extract and implement color values as CSS custom properties in RGB format
5. **Typography**: Define font families, sizes, and weights based on specifications
6. **Spacing**: Establish consistent spacing scale following the design system
7. **Components**: Style all Shadcn components to match the design aesthetic
8. **Animations**: Use Motion library for transitions matching the design personality
9. **Responsive Design**: Ensure mobile-first responsive implementation

## Implementation Checklist

- [ ] Review universal design guidelines above
- [ ] Extract project-specific color palette and define CSS variables
- [ ] Configure Tailwind theme with custom colors
- [ ] Set up typography system (fonts, sizes, weights)
- [ ] Define spacing and sizing scales
- [ ] Create component variants matching design
- [ ] Implement responsive breakpoints
- [ ] Add animations and transitions
- [ ] Ensure accessibility standards
- [ ] Validate against user design requirements

---

**Remember: Always reference this file for design decisions. Do not use generic or placeholder designs.**
