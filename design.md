# Intasela Design Principles & UI Guidelines

## 1. Typography Hierarchy & Usage
- **Primary Font (Admin)**: `Geist Sans`
- **Primary Font (Frontend)**: `Geist Mono`
- **Body Text**: Maintain high legibility using `text-sm` (14px) or `text-[15px]` for main content streams. Use `text-muted-foreground` for secondary information to create visual depth.
- **Identifiers & Metadata**: Space types, member counts, timestamps, and badges must use `Geist Mono` consistently, often downsized (`text-xs` or `text-[11px]`) and with `tracking-wider` to feel technical and precise.
- **Headings**: Use strong font weights (`font-bold`) and tracking adjustments (`tracking-tight` for large headings, `tracking-wider` for small caps labels).

## 2. Toasts & Notifications
**Never use `window.alert()`, `window.prompt()`, or `window.confirm()`.**

**Toast Design Specifics:**
- **Placement**: Fixed to the bottom-center or top-center of the screen, floating with adequate margin (e.g., `bottom-10`).
- **Surface & Material**: 
  - Must use glassmorphism: `bg-black/60` or `bg-zinc-900/80` coupled with `backdrop-blur-md` or `backdrop-blur-xl`.
  - Border: Subtle translucent border `border border-white/10`.
- **Shape & Padding**: Fully rounded pills (`rounded-full`) or highly rounded rectangles (`rounded-2xl`). Generous padding, e.g., `px-6 py-3`.
- **Typography inside Toasts**: `text-sm font-medium`.
- **Colors**: 
  - Success: Subtle green accents (e.g., text `#3BC492` or an icon).
  - Error: Red accents (e.g., text `red-400` or `red-500`).
- **Animation**: Must use `animate-in slide-in-from-bottom-5 fade-in duration-300` for entry, and corresponding exit animations.
- **System**: Always use the global `useToastStore` (`addToast(message, type)`).

## 3. Modal & Overlay Architecture
**Modal Design Specifics:**
- **Standard Modals**: For forms and extensive UI, use a standard dialog structure with `bg-black/80 backdrop-blur-sm`.
- **Destructive/Confirm Modals**: Use the Shadcn `AlertDialog` component (`@/components/ui/alert-dialog`) for all destructive actions (e.g., Delete, Leave, Suspend). 
  - Ensure the trigger or action button uses `variant="destructive"`.
  - Include the `AlertDialogMedia` component with a relevant `lucide-react` icon (e.g., `Trash2Icon` or `AlertTriangle`) to visually indicate the danger of the action.
- **Container Shape**: 
  - Desktop: Centered, `max-w-md` or `max-w-lg`, `rounded-3xl` or `rounded-2xl` with a subtle outer glow or shadow `shadow-2xl`.
  - Mobile: Bottom-sheet style (`rounded-t-3xl`, attached to the bottom) or edge-to-edge with safe-area padding.
- **Surface**: `bg-[#18181b]` (zinc-900) or pure black `#000000` with `border border-white/10`.
- **Header/Footer**: Distinct padded areas (`p-6`). The header should have a clear title and a subtle, rounded close button (`w-8 h-8 rounded-full bg-white/5 hover:bg-white/10`).
- **Animation**:
  - Backdrop: `animate-in fade-in duration-200`.
  - Content: `animate-in zoom-in-95 fade-in duration-200`.

## 4. Theming, Colors, & Glassmorphism
- **Backgrounds**: Deep, rich darks. Primary application background is `#000000` or `#09090b` (zinc-950).
- **Elevated Surfaces (Cards/Modals/Dropdowns)**: `#18181b` (zinc-900) or `#262626` (neutral-800).
- **Brand Accents**: 
  - Primary Green: `#3BC492`
  - Secondary/Hover: Opacity-based variants (e.g., `bg-[#3BC492]/10` for subtle active states, `hover:bg-[#3BC492]/20`).
- **Gradients**: Use subtle radial or linear gradients for empty states or covers (e.g., `bg-gradient-to-tr from-[#3BC492]/20 to-primary/10`).
- **Borders**: Avoid solid gray borders. Rely on translucent white (`border-white/5` or `border-border/50`) to blend cleanly with deep dark backgrounds.

## 5. UI Components & Inputs
- **Buttons**:
  - Primary actions: Solid brand color (`bg-[#3BC492] text-black font-bold`) or highly stylized glass pills (`bg-[#3BC492]/10 border border-[#3BC492]/20 text-[#3BC492]`).
  - Shape: Heavily rounded (`rounded-full`).
  - Interactions: `transition-all transform hover:scale-[1.02] active:scale-95`.
- **Inputs & Textareas**:
  - Background: `bg-white/5` or `bg-black/50`.
  - Border: Transparent by default, transitioning to `border-[#3BC492]/50` on focus with `ring-1 ring-[#3BC492]/50`.
  - Shape: `rounded-xl` or `rounded-2xl`.
- **Dropdowns & Selects**: 
  - Avoid native `<select>` tags.
  - Build custom, animated React dropdowns utilizing `animate-in slide-in-from-top-2 fade-in`. Use a floating surface with `shadow-xl border border-white/10 backdrop-blur-xl`.

## 6. Micro-animations & Fluidity
An interface that feels responsive and alive encourages interaction.
- Use `transition-all duration-200` on almost all interactive elements.
- Ensure hover states not only change color but might alter opacity, scale slightly, or shift borders.
- Lists and dynamic content should enter with staggered fade/slide animations to avoid harsh pop-ins.

## 7. Mobile-First Responsiveness
- **Edge Padding**: Ensure all main content streams (`<main>`) have appropriate horizontal padding (`px-4`) so text never touches the screen edge on mobile.
- **Touch Targets**: Buttons, tabs, and interactive icons must be at least `44x44px` functionally, even if the visual icon is smaller.
- **Layout Shifts**: Utilize `flex-col` for mobile and `flex-row` for desktop intelligently. Sidebar navigation converts to Bottom Navigation (`MobileBottomNav`) on screens smaller than `sm`.
