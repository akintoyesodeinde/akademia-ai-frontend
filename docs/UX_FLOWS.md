# Akademia AI — User Experience & Role Flows (`UX_FLOWS.md`)

## 1. Authentication & Institutional Onboarding (`AuthScreen.tsx` & `WorkspaceShell.tsx`)
- Users can register a new account and optionally provision their initial institutional tenant (`school`, `university`, `training_provider`, `corporate`) in a single flow, or accept a cryptographic one-time invitation token (`POST /api/v1/invitations/accept`).
- Users belonging to multiple institutions switch active tenants via the top-bar Tenant Switcher (`POST /api/v1/auth/switch-tenant`), which mints a new tenant-scoped JWT and refreshes all workspace queries.

## 2. Instructor Studio (`InstructorWorkspace.tsx`)
1. **Curriculum**: Create draft courses, define competency objectives (`code`, `title`, `mastery_threshold`), and author Markdown lessons mapped to objectives.
2. **Approved RAG Materials**: Upload `.txt`, `.md`, `.pdf`, or `.docx` documents, inspect SHA-256 checksums and chunk counts, and trigger re-chunking/re-embedding.
3. **Assessments**: Author objective-mapped assessments (`quiz`, `diagnostic`, `practice`, `exam`) and publish immutable versions.
4. **AI Practice Generator**: Generate course-grounded practice question drafts and approve or reject them before learner exposure.
5. **Cohort Analytics**: Inspect active enrollments, graded attempts, average scores, and objective-level mastery vs. at-risk counts.

## 3. Learner Hub (`LearnerWorkspace.tsx`)
1. **Catalog & Enrollment**: Browse published tenant courses and enroll with one click.
2. **Lesson Study**: Read structured Markdown lessons and record completion (`POST /api/v1/courses/{course_id}/lessons/{lesson_id}/complete`).
3. **Assessments & Grading**: Start versioned attempts, submit answers, and inspect immediate objective-by-objective grading breakdowns.
4. **Course-Grounded AI Tutor**: Ask course questions and inspect verifiable source citations (`document_title`, `page_number`, `excerpt`, `relevance_score`).
5. **Learning Intelligence Dashboard**: View objective mastery scores, `gap_detected` vs. `mastered` badges, `prior_score` and `score_delta` improvement metrics, and prioritized recommendations.

## 4. Tenant Admin & Platform Operations (`TenantAdminWorkspace.tsx` & `PlatformOperationsWorkspace.tsx`)
- **Tenant Admin**: Manage members and RBAC roles, issue invitation tokens, create cohorts, upgrade subscription tiers (`starter`, `professional`, `enterprise`), monitor monthly AI token consumption, and inspect the immutable security audit trail.
- **Platform Ops**: Suspend/reactivate tenants with mandatory audit reasons and execute the automated AI RAG & safety evaluation benchmark suite.
