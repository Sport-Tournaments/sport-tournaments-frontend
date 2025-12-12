# Tailwind Plus Theme Files Reference

This document catalogs all available Tailwind Plus UI components with their styles.
Use this as a checklist when updating project components.

---

## Responsive Design Checklist

All components in this project are designed to be responsive across all device sizes.
Breakpoints used: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)

### Project Files - Responsive Status

| File | Mobile | Tablet | Desktop | Notes |
|------|--------|--------|---------|-------|
| **UI Components** |||||
| `Button.tsx` | ✅ | ✅ | ✅ | Scales with size props (xs-lg), full-width option |
| `Input.tsx` | ✅ | ✅ | ✅ | Full-width by default, sm:text-sm responsive text |
| `Select.tsx` | ✅ | ✅ | ✅ | Full-width, responsive text sizing |
| `Card.tsx` | ✅ | ✅ | ✅ | Responsive padding (px-4 sm:px-6) |
| `Badge.tsx` | ✅ | ✅ | ✅ | Inline-flex, scales naturally |
| `Alert.tsx` | ✅ | ✅ | ✅ | Flexible layout, stacks on mobile |
| `Modal.tsx` | ✅ | ✅ | ✅ | Full-screen mobile, centered desktop (sm:max-w-lg) |
| `Table.tsx` | ✅ | ✅ | ✅ | Horizontal scroll on mobile (-mx-4 sm:mx-0) |
| `Tabs.tsx` | ✅ | ✅ | ✅ | Dropdown on mobile, tabs on sm+ |
| `Pagination.tsx` | ✅ | ✅ | ✅ | Simplified mobile view (page x/y), full on sm+ |
| `Avatar.tsx` | ✅ | ✅ | ✅ | Fixed sizes, scales with container |
| `Dropdown.tsx` | ✅ | ✅ | ✅ | Position-aware, width options |
| `Toast.tsx` | ✅ | ✅ | ✅ | Full-width mobile, fixed-width desktop |
| **Layout Components** |||||
| `Header.tsx` | ✅ | ✅ | ✅ | Hamburger menu mobile, full nav desktop |
| `Sidebar.tsx` | ✅ | ✅ | ✅ | Drawer on mobile (w-72), static on lg+ |
| `Footer.tsx` | ✅ | ✅ | ✅ | Stacked mobile, grid desktop |
| `MainLayout.tsx` | ✅ | ✅ | ✅ | Fluid container with max-width |
| `DashboardLayout.tsx` | ✅ | ✅ | ✅ | Sidebar drawer mobile, fixed desktop |
| `AuthLayout.tsx` | ✅ | ✅ | ✅ | Centered card, responsive padding |

---

## Key Style Patterns (Tailwind Plus v4)

### Color Scheme
- **Primary**: `indigo-600` (light) / `indigo-500` (dark)
- **Text**: `gray-900` (light) / `white` (dark)
- **Muted Text**: `gray-500` (light) / `gray-400` (dark)
- **Background**: `white` (light) / `gray-800` or `white/5` (dark)
- **Border**: `gray-300` (light) / `white/10` (dark)

### Responsive Patterns
```css
/* Mobile-first responsive text */
text-base sm:text-sm

/* Responsive padding */
px-4 sm:px-6 lg:px-8

/* Responsive visibility */
hidden sm:block        /* Hidden on mobile, visible on sm+ */
sm:hidden              /* Visible on mobile only */

/* Responsive layout */
flex flex-col sm:flex-row

/* Responsive max-width (modals) */
sm:max-w-lg sm:w-full
```

### Dark Mode Pattern
All components use `dark:` prefix with specific patterns:
- Cards: `dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10`
- Inputs: `dark:bg-white/5 dark:text-white dark:outline-white/10`
- Buttons: `dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400`

---

## Application UI Components

### Elements

#### Buttons
- [x] `primary_buttons.jsx` - Primary button sizes (xs to lg) ✅ Applied to Button.tsx
  - Style: `rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`
  - Dark: `dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500`
- [x] `secondary_buttons.jsx` - Secondary/outline buttons ✅ Applied to Button.tsx
  - Style: `rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50`
  - Dark: `dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20`
- [x] `soft_buttons.jsx` - Soft/ghost buttons ✅ Applied to Button.tsx
- [ ] `rounded_primary_buttons.jsx` - Pill-shaped primary
- [ ] `rounded_secondary_buttons.jsx` - Pill-shaped secondary
- [ ] `circular_buttons.jsx` - Icon-only circular
- [ ] `buttons_with_leading_icon.jsx` - Buttons with left icon
- [ ] `buttons_with_trailing_icon.jsx` - Buttons with right icon

#### Badges
- [x] `flat_pill.jsx` - Flat pill badges (all colors) ✅ Applied to Badge.tsx
  - Gray: `bg-gray-100 text-gray-600 dark:bg-gray-400/10 dark:text-gray-400`
  - Red: `bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-400`
  - Yellow: `bg-yellow-100 text-yellow-800 dark:bg-yellow-400/10 dark:text-yellow-300`
  - Green: `bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400`
  - Blue: `bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400`
  - Indigo: `bg-indigo-100 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-400`
- [x] `flat.jsx` - Flat badges (square corners) ✅ Applied to Badge.tsx
- [x] `with_border.jsx` - Bordered badges ✅ Applied to Badge.tsx
- [x] `with_dot.jsx` - Badges with status dot ✅ Added dot prop to Badge.tsx
- [ ] `with_remove_button.jsx` - Removable badges

#### Avatars
- [ ] `avatar_group_stacked.jsx`
- [ ] `circular_avatars.jsx`
- [ ] `rounded_avatars.jsx`
- [ ] `with_placeholder_icon.jsx`
- [ ] `with_placeholder_initials.jsx`
- [ ] `with_notification.jsx`

#### Dropdowns
- [ ] `simple.jsx` - Basic dropdown menu
- [ ] `with_dividers.jsx`
- [ ] `with_icons.jsx`
- [ ] `with_minimal_menu_icon.jsx`

---

### Forms

#### Input Groups
- [x] `input_with_label.jsx` - Standard labeled input ✅ Applied to Input.tsx
  - Label: `block text-sm/6 font-medium text-gray-900 dark:text-white`
  - Input: `block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6`
  - Dark Input: `dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500`
- [x] `input_with_label_and_help_text.jsx` ✅ Applied to Input.tsx
- [x] `input_with_validation_error.jsx` - Error state styling ✅ Applied to Input.tsx
- [ ] `input_with_leading_icon.jsx`
- [ ] `input_with_trailing_icon.jsx`
- [ ] `input_with_add_on.jsx`
- [ ] `input_with_inline_add_on.jsx`
- [ ] `input_with_inset_label.jsx`
- [ ] `input_with_corner_hint.jsx`
- [x] `input_with_disabled_state.jsx` ✅ Applied to Input.tsx
- [ ] `input_with_keyboard_shortcut.jsx`

#### Select Menus
- [x] `simple_native.jsx` - Native select with custom arrow ✅ Applied to Select.tsx
  - Style: `w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300`
  - Dark: `dark:bg-white/5 dark:text-white dark:outline-white/10 dark:*:bg-gray-800`
- [ ] `custom.jsx` - Headless UI select
- [ ] `with_avatar.jsx`
- [ ] `with_secondary_text.jsx`
- [ ] `with_status_indicator.jsx`

#### Textareas
- [ ] `simple.jsx` - Basic textarea
- [ ] `with_avatar_and_actions.jsx`
- [ ] `with_preview_button.jsx`
- [ ] `with_title_and_pill_actions.jsx`
- [ ] `with_underline_and_actions.jsx`

#### Checkboxes
- [ ] `simple_description.jsx`
- [ ] `simple_list.jsx`
- [ ] `with_inline_description.jsx`
- [ ] `with_border.jsx`

#### Radio Groups
- [ ] `cards.jsx` - Card-style radio
- [ ] `list_with_descriptions.jsx`
- [ ] `simple_inline.jsx`
- [ ] `simple_list.jsx`
- [ ] `small_cards.jsx`
- [ ] `stacked_cards.jsx`

#### Toggles
- [ ] `short_toggle.jsx`
- [ ] `simple_toggle.jsx`
- [ ] `with_icon.jsx`
- [ ] `with_left_label_and_description.jsx`
- [ ] `with_right_label.jsx`

#### Sign-in Forms
- [ ] `simple.jsx`
- [ ] `simple_card.jsx` - Card-wrapped login form
- [ ] `simple_no_labels.jsx`
- [ ] `split_screen.jsx`

#### Form Layouts
- [ ] `stacked.jsx`
- [ ] `two_column.jsx`
- [ ] `two_column_with_cards.jsx`
- [ ] `labels_on_left.jsx`

---

### Layout

#### Cards
- [x] `basic_card.jsx` ✅ Applied to Card.tsx
  - Style: `overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10`
  - Content: `px-4 py-5 sm:p-6`
- [x] `card_with_header.jsx` ✅ Applied to Card.tsx (CardHeader)
- [x] `card_with_footer.jsx` ✅ Applied to Card.tsx (CardFooter)
- [x] `card_with_header_and_footer.jsx` ✅ Applied to Card.tsx
- [ ] `card_with_gray_body.jsx`
- [x] `card_with_gray_footer.jsx` ✅ Applied to Card.tsx (CardFooter)
- [ ] `well.jsx` - Inset card/well
- [ ] `card__edge_to_edge_on_mobile.jsx`

#### Containers
- [ ] `breakpoint_padded.jsx`
- [ ] `constrained_padded.jsx`
- [ ] `full_width_padded.jsx`
- [ ] `narrow_constrained_padded.jsx`

#### Dividers
- [ ] `with_title.jsx`
- [ ] `with_title_on_left.jsx`
- [ ] `with_button.jsx`
- [ ] `with_icon.jsx`

---

### Navigation

#### Navbars
- [ ] `simple.jsx` - Standard navbar with user menu
  - Container: `bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:after:h-px dark:after:bg-white/10`
  - Active link: `border-b-2 border-indigo-600 text-gray-900 dark:border-indigo-500 dark:text-white`
  - Inactive link: `border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white`
- [ ] `simple_dark.jsx` - Dark background navbar
- [ ] `with_search.jsx`
- [ ] `with_quick_action.jsx`
- [ ] `dark_with_search.jsx`
- [ ] `with_centered_search_and_secondary_links.jsx`

#### Sidebar Navigation
- [ ] `light.jsx` - Light sidebar
- [ ] `dark.jsx` - Dark sidebar
  - Container: `bg-gray-900 dark:before:border-r dark:before:border-white/10 dark:before:bg-black/10`
  - Active: `bg-white/5 text-white`
  - Inactive: `text-gray-400 hover:bg-white/5 hover:text-white`
  - Section title: `text-xs/6 font-semibold text-gray-400`
- [ ] `brand.jsx` - Brand-colored sidebar
- [ ] `with_expandable_sections.jsx`
- [ ] `with_secondary_navigation.jsx`

#### Tabs
- [ ] `bar_with_underline.jsx`
- [ ] `full_width_underline.jsx`
- [ ] `pills.jsx`
- [ ] `pills_on_gray.jsx`
- [ ] `underline.jsx`
- [ ] `with_badges.jsx`

#### Pagination
- [ ] `card_footer.jsx`
- [ ] `centered.jsx`
- [ ] `simple_card_footer.jsx`

#### Breadcrumbs
- [ ] `contained.jsx`
- [ ] `full_width.jsx`
- [ ] `simple_with_chevrons.jsx`
- [ ] `simple_with_slashes.jsx`

---

### Feedback

#### Alerts
- [x] `with_accent_border.jsx` - Left border accent ✅ Applied to Alert.tsx (accentBorder prop)
  - Warning: `border-l-4 border-yellow-400 bg-yellow-50 dark:border-yellow-500 dark:bg-yellow-500/10`
  - Text: `text-yellow-700 dark:text-yellow-300`
- [x] `with_description.jsx` ✅ Applied to Alert.tsx
- [x] `with_dismiss_button.jsx` ✅ Applied to Alert.tsx (onClose prop)
- [ ] `with_link.jsx`
- [ ] `with_actions.jsx`
- [ ] `with_list.jsx`

#### Empty States
- [ ] `simple.jsx`
- [ ] `with_dashed_border.jsx`
- [ ] `with_recommendations.jsx`
- [ ] `with_starting_points.jsx`

---

### Data Display

#### Tables
- [ ] `simple.jsx` - Basic table
  - Header: `text-sm font-semibold text-gray-900 dark:text-white`
  - Body divider: `divide-y divide-gray-200 dark:divide-white/10`
  - Cell: `text-sm text-gray-500 dark:text-gray-400`
  - Link: `text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300`
- [ ] `with_striped_rows.jsx`
- [ ] `with_sticky_header.jsx`
- [ ] `with_vertical_lines.jsx`
- [ ] `with_checkboxes.jsx`
- [ ] `with_sortable_headings.jsx`
- [ ] `with_summary_rows.jsx`
- [ ] `with_condensed_content.jsx`
- [ ] `full_width.jsx`

#### Stats
- [ ] `simple.jsx`
- [ ] `simple_on_dark.jsx`
- [ ] `with_brand_icon.jsx`
- [ ] `with_shared_borders.jsx`
- [ ] `with_trending.jsx`

#### Description Lists
- [ ] `left_aligned.jsx`
- [ ] `left_aligned_in_card.jsx`
- [ ] `left_aligned_striped.jsx`
- [ ] `two_column.jsx`

---

### Overlays

#### Modal Dialogs
- [x] `simple_alert.jsx` ✅ Applied to Modal.tsx (icon + iconColor props)
- [x] `simple_with_gray_footer.jsx` ✅ Applied to Modal.tsx (footer prop)
  - Panel: `rounded-lg bg-white shadow-xl dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10`
  - Footer: `bg-gray-50 dark:bg-gray-700/25`
- [ ] `centered_with_single_action.jsx`
- [ ] `centered_with_wide_buttons.jsx`
- [x] `simple_with_dismiss_button.jsx` ✅ Applied to Modal.tsx (showCloseButton prop)

#### Notifications
- [ ] `simple.jsx`
- [ ] `with_actions.jsx`
- [ ] `with_avatar.jsx`
- [ ] `with_split_buttons.jsx`
- [ ] `condensed.jsx`

#### Drawers
- [ ] `empty.jsx`
- [ ] `wide_create_project.jsx`
- [ ] `wide_with_form.jsx`
- [ ] `with_branded_header.jsx`
- [ ] `with_close_button_on_outside.jsx`

---

### Headings

#### Page Headings
- [ ] `with_actions.jsx`
- [ ] `with_avatar.jsx`
- [ ] `with_banner_image.jsx`
- [ ] `with_meta_and_actions.jsx`
- [ ] `with_meta_breadcrumbs_and_actions.jsx`

#### Section Headings
- [ ] `simple.jsx`
- [ ] `with_action.jsx`
- [ ] `with_actions.jsx`
- [ ] `with_badge.jsx`
- [ ] `with_description.jsx`
- [ ] `with_inline_tabs.jsx`
- [ ] `with_tabs.jsx`

#### Card Headings
- [ ] `simple.jsx`
- [ ] `with_action.jsx`
- [ ] `with_avatar_and_action.jsx`
- [ ] `with_description.jsx`

---

### Lists

#### Stacked Lists
- [ ] `avatars_with_actions.jsx`
- [ ] `full_width_avatars_with_actions.jsx`
- [ ] `narrow_with_actions.jsx`
- [ ] `narrow_with_small_avatars.jsx`
- [ ] `narrow_with_truncated_content.jsx`
- [ ] `simple_on_dark.jsx`
- [ ] `with_links.jsx`

#### Grid Lists
- [ ] `actions_with_shared_borders.jsx`
- [ ] `images_with_details.jsx`
- [ ] `logos.jsx`
- [ ] `simple_cards.jsx`

---

### Application Shells

#### Sidebar Layouts
- [ ] `brand_sidebar.jsx`
- [ ] `brand_sidebar_with_header.jsx`
- [ ] `constrained_multi_column.jsx`
- [ ] `dark_sidebar.jsx`
- [ ] `dark_sidebar_with_header.jsx`
- [ ] `light_sidebar.jsx`
- [ ] `light_sidebar_with_header.jsx`

#### Stacked Layouts
- [ ] `branded_nav.jsx`
- [ ] `dark_nav.jsx`
- [ ] `light_nav_on_gray.jsx`
- [ ] `light_nav_with_page_header.jsx`

---

## Project Components to Update

### Current Project Files → Tailwind Plus Style Mapping

| Project Component | Target Tailwind Plus Style | Status |
|-------------------|---------------------------|--------|
| `Button.tsx` | `primary_buttons.jsx`, `secondary_buttons.jsx` | [x] ✅ |
| `Input.tsx` | `input_with_label.jsx`, `input_with_validation_error.jsx` | [x] ✅ |
| `Select.tsx` | `simple_native.jsx` | [x] ✅ |
| `Card.tsx` | `basic_card.jsx`, `card_with_header.jsx` | [x] ✅ |
| `Badge.tsx` | `flat_pill.jsx` | [x] ✅ |
| `Alert.tsx` | `with_accent_border.jsx`, `with_description.jsx` | [x] ✅ |
| `Modal.tsx` | `simple_with_gray_footer.jsx` | [x] ✅ |
| `Table.tsx` | `simple.jsx`, `with_sortable_headings.jsx` | [x] ✅ |
| `Tabs.tsx` | `underline.jsx`, `pills.jsx` | [x] ✅ |
| `Pagination.tsx` | `card_footer.jsx` | [x] ✅ |
| `Avatar.tsx` | `circular_avatars.jsx`, `with_placeholder_initials.jsx` | [x] ✅ |
| `Dropdown.tsx` | `simple.jsx`, `with_icons.jsx` | [x] ✅ |
| `Toast.tsx` | Notifications `simple.jsx` | [x] ✅ |
| `Loading.tsx` | Custom spinner styles | [ ] |
| `Header.tsx` | `simple.jsx` navbar | [x] ✅ |
| `Sidebar.tsx` | `dark.jsx` sidebar navigation | [x] ✅ |
| `DashboardLayout.tsx` | `dark_sidebar_with_header.jsx` | [ ] |
| `MainLayout.tsx` | `light_nav_on_gray.jsx` | [ ] |
| `AuthLayout.tsx` | `simple_card.jsx` sign-in form | [ ] |

---

## Implementation Notes

### Focus States (New Pattern)
```css
/* Old: ring-based */
focus:ring-2 focus:ring-indigo-500

/* New: outline-based */
focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600
```

### Border Pattern (New)
```css
/* Old: border utilities */
border border-gray-300

/* New: outline utilities */
outline-1 -outline-offset-1 outline-gray-300

/* Dark mode borders */
dark:outline-white/10
```

### Shadow Pattern
```css
/* Light: shadow-sm or shadow-xs */
shadow-sm

/* Dark: remove shadow, add outline */
dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10
```

### Inset Ring (for secondary buttons)
```css
/* Light */
inset-ring inset-ring-gray-300

/* Dark */
dark:inset-ring-white/5
```
