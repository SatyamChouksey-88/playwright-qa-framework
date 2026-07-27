# Exploratory Testing Charters

| Charter | Areas | Time-box | Notes & Findings |
|---------|-------|----------|------------------|
| EC-001: Cart overlay UX | Add multiple products quickly | 30 min | Cart drawer auto-opens and blocks subsequent "Add to cart" clicks unless closed — documented workaround in POM |
| EC-002: Size filter edge cases | XS vs X mismatch in API | 20 min | API uses `"X"` while filter UI shows `"XS"` — some products won't match XS filter |
| EC-003: Price display format | Catalog vs cart formatting | 15 min | Cart displays `$ 10.90` with space; catalog shows `$10.90` without space — parsers must normalize |
| EC-004: Rapid filter toggling | Network + UI sync | 20 min | Each toggle re-fetches full JSON; rapid clicks may flash "0 products" briefly during fetch |
| EC-005: Keyboard navigation | tabindex on product cards | 15 min | Cards have tabindex=1; Enter/Space adds to cart per source code |
