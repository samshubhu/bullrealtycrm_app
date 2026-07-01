# BullSales Suite UI/UX Audit

Date: 2026-07-01
Scope: Login, dashboard, leads list, lead detail, pipeline, reports, and mobile dashboard.
Mode: Combined UX, visual design, alignment, placement, and screenshot-based accessibility review.

## Captured Steps

1. Login screen
   Screenshot: `screenshots/01-login.png`
   Health: Good
   Notes: The split layout is clear and polished. The login form is easy to find, fields are aligned, and demo credentials are visible. The left marketing panel takes exactly half the screen, which makes the actual sign-in task feel slightly secondary on desktop. The decorative circles are acceptable here but visually heavy compared with the quiet CRM product surfaces.

2. Dashboard
   Screenshot: `screenshots/02-dashboard.png`
   Health: Needs improvement
   Notes: The dashboard has useful KPI and report content, but layout density is uneven. KPI cards have too much empty vertical space, while chart cards below are dense. The bottom report tabs overlay the content and hide lower cards. The dashboard tab row, subheader, widget grid, and bottom tabs compete for attention.

3. Leads list
   Screenshot: `screenshots/03-leads-list.png`
   Health: Good with polish issues
   Notes: The table is useful and information-rich. Rows, badges, avatars, and inline actions work well for CRM scanning. The filter/view/bulk-action controls are split into multiple horizontal bands, which pushes content downward. The global sidebar bottom area clips or crowds the "API & Webhooks" item near the viewport edge.

4. Lead detail
   Screenshot: `screenshots/04-lead-detail.png`
   Health: Mixed
   Notes: The lead record has strong action affordances: email, call, WhatsApp, note, task, meeting, site visit, and add deal are visible. The page uses too many navigation layers at once: global sidebar, narrow icon rail, breadcrumb/top detail header, status strip, and action row. This creates a squeezed center column and makes placement feel busy.

5. Pipeline
   Screenshot: `screenshots/05-pipeline.png`
   Health: Needs improvement
   Notes: The kanban metaphor is appropriate, but the board is horizontally clipped. The rightmost column and dates are cut off, with no visible horizontal scroll cue or sticky edge affordance. Empty columns are very tall and low-information, which makes the page feel sparse.

6. Reports
   Screenshot: `screenshots/06-reports.png`
   Health: Good
   Notes: This is one of the cleanest screens. The header, KPI cards, and chart grid align well. Chart card widths are balanced, spacing is predictable, and the page feels easier to scan than the dashboard. Some chart labels are still small/faint.

7. Mobile dashboard
   Screenshot: `screenshots/07-mobile-dashboard.png`
   Health: Needs improvement
   Notes: The mobile layout stacks content, which is good, but the dashboard controls wrap awkwardly. Export and Edit split into separate rows, the tab labels truncate heavily, widget action icons consume too much space, and the bottom tabs cover content. The search control becomes icon-only, which saves space but reduces discoverability.

## Strengths

- The app already has a consistent SaaS visual language: light surfaces, blue primary color, neutral ink palette, small-radius cards, Lucide icons, and compact controls.
- Sidebar grouping is understandable: CRM, Activities, Growth, Admin.
- Data tables are practical for CRM work and support scanning with avatars, badges, owner/project fields, and inline actions.
- Reports screen shows the best layout discipline: clear title, summary KPIs, and a balanced chart grid.
- Core CRM actions are visible on detail pages, which supports fast sales workflows.

## UX Risks

1. Dashboard content is partially hidden by sticky bottom tabs.
   Evidence: Step 2 and Step 7.
   Recommendation: Reserve bottom padding equal to the bottom-tab height, or make the bottom tabs part of the scroll container instead of overlaying cards.

2. Dashboard card sizing is inconsistent.
   Evidence: Step 2.
   Recommendation: KPI cards should use a shorter fixed height, around 140-160px desktop, while chart cards keep larger heights. Avoid forcing all widgets into the same row height when content types differ.

3. Too many dashboard navigation layers compete.
   Evidence: Step 2.
   Recommendation: Merge the top dashboard tabs and bottom report tabs into one clearer hierarchy. For example: top-level dashboard tabs, then a compact segmented control inside the dashboard body.

4. Pipeline board clips horizontally.
   Evidence: Step 5.
   Recommendation: Add a visible horizontal scroll area, sticky first/last fade indicators, and ensure each column has a minimum width but the board exposes overflow intentionally.

5. Lead detail has too many simultaneous action/navigation zones.
   Evidence: Step 4.
   Recommendation: Keep the global sidebar and top actions, but either collapse the narrow icon rail behind a "sections" menu or label it when expanded. The current icon-only rail is ambiguous.

6. Toolbar stacking reduces table efficiency.
   Evidence: Step 3.
   Recommendation: Combine view switcher, filter, bulk actions, and customize table into a single compact toolbar row. Keep search and primary "New Lead" action on the row above.

7. Mobile dashboard controls wrap awkwardly.
   Evidence: Step 7.
   Recommendation: On mobile, make dashboard actions an overflow menu. Keep only the page title and one primary action visible. Put Export, Edit, Favorite, and Help inside a menu.

## Alignment And Placement Improvements

- Align page content to one consistent left edge after the sidebar. Reports does this well; dashboard has extra nested offsets from tabs and widget padding.
- Use one header rhythm across screens: page title at 20px, subtitle below, actions right-aligned. Dashboard currently has multiple header rows with different alignments.
- Keep card title/action rows at a consistent height. Dashboard widget title rows vary because action icons appear on hover and mobile.
- Increase right padding in horizontally scrollable boards so the last column/card is never clipped flush against the viewport edge.
- Move the sidebar collapse control above the viewport bottom or make the sidebar footer sticky with enough reserved space. It currently crowds the last nav item.
- On mobile, avoid persistent bottom tabs unless content has bottom safe-area padding and the active content starts above the tab bar.

## Accessibility Risks

- Icon-only controls need visible labels or reliable accessible names. This is especially important for dashboard widget icons, lead-detail rail icons, and mobile search.
- Some chart text and labels appear low contrast or too small, especially funnel labels and chart axis labels.
- Mobile target density is tight in dashboard tabs and widget controls. Several touch targets appear close to the 44px recommended minimum.
- The visual order on dashboard mobile may not match a simple reading order because page title, tabs, subheader actions, widgets, and bottom tabs interleave.
- Screenshot review cannot verify keyboard order, focus states, screen reader labels, or chart semantics. Those need DOM and keyboard testing.

## Recommendations

1. Fix dashboard bottom-tab overlap first.
   This is the most visible layout bug and affects both desktop and mobile.

2. Rework dashboard widget sizing.
   Use compact KPI cards and larger charts. Avoid large empty cards for single numbers.

3. Simplify dashboard navigation.
   Keep top tabs for dashboard selection. Move Summary/Deals/Contacts/Sales activities/Revenue breakdown into a segmented control under the dashboard title, not a sticky bottom bar.

4. Make the pipeline board intentionally scrollable.
   Add `overflow-x-auto`, column min widths, scroll shadows, and right padding.

5. Consolidate lead-detail navigation.
   Replace the narrow icon rail with labeled section tabs, or keep it collapsible with tooltips and active labels.

6. Improve mobile action placement.
   Use an overflow menu for secondary actions. Keep the main page action visible and move the rest into a menu.

7. Add a real lint/design QA gate.
   The repo currently uses TypeScript as `lint`. Add ESLint plus accessibility rules such as `jsx-a11y` when the project is ready.

## Evidence Limits

- This audit used screenshots from a seeded local environment.
- It did not test keyboard navigation, screen reader output, zoom at 200%, color contrast with a contrast checker, or actual drag/drop behavior.
- It did not compare against a Figma source or brand guideline because no saved Product Design context exists yet.
