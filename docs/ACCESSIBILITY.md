# Akademia AI — Accessibility Standards (`ACCESSIBILITY.md`)

## 1. Semantic HTML & Landmarks
- Views use semantic landmarks (`<header>`, `<nav aria-label="...">`, `<main>`, `<section aria-label="...">`).
- Interactive tab bars use `role="tablist"` and `role="tab"` with explicit `aria-selected` state attributes.

## 2. Form Labels & Live Regions
- Every `<input>`, `<select>`, and `<textarea>` is programmatically associated with a `<label htmlFor="...">` or `aria-label`.
- Error banners (`ErrorAlert` and `AlertBanner variant="error"`) use `role="alert"` and `aria-live="assertive"` so screen readers announce validation and API failures immediately.
- Status updates and loading gates use `role="status"` and `aria-live="polite"`.
