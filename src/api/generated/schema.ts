/**
 * Generated OpenAPI 3.1 TypeScript Contract Definitions for Akademia AI Backend (/api/v1)
 * Synchronized with akademia-ai-backend/openapi.json
 */

export interface ErrorDetail {
  code: string;
  message: string;
  request_id: string;
  details?: Record<string, unknown> | Array<unknown> | null;
}

export interface ErrorEnvelope {
  error: ErrorDetail;
}

export interface MembershipSummary {
  membership_id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  roles?: string[];
  role?: string;
  status: string;
}

export interface AuthProfileResponse {
  id?: string;
  user_id: string;
  email: string;
  full_name: string;
  email_verified?: boolean;
  is_platform_admin: boolean;
  active_tenant_id: string | null;
  active_membership_id?: string | null;
  active_roles?: string[];
  active_role?: string | null;
  active_permissions?: string[];
  memberships?: MembershipSummary[];
}

export interface TokenSessionResponse {
  access_token: string;
  refresh_token: string;
  csrf_token?: string;
  token_type: string;
  expires_in: number;
  user: AuthProfileResponse;
  memberships?: MembershipSummary[];
  active_tenant_id?: string | null;
  active_role?: string | null;
  verification_token_dev_hint?: string | null;
}

export interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  institution_type: 'school' | 'university' | 'training_provider' | 'corporate';
  organization_type?: string;
  status: string;
  primary_contact_email?: string | null;
  academic_integrity_policy: string;
  ai_tutor_enabled: boolean;
  ai_practice_enabled: boolean;
  branding_config: Record<string, unknown>;
  created_at: string;
}

export interface TenantProvisionResponse {
  tenant: TenantResponse;
  membership_id: string;
  assigned_roles: string[];
  access_token: string;
}

export interface MemberResponse {
  membership_id: string;
  tenant_id: string;
  user_id: string;
  email: string;
  full_name: string;
  status: string;
  title?: string | null;
  roles: string[];
  role: string;
  joined_at?: string | null;
}

export interface InvitationResponse {
  id: string;
  tenant_id: string;
  email: string;
  role_code: string;
  role?: string;
  status: string;
  expires_at: string;
  invitation_token?: string | null;
}

export interface InvitationCreateResponse {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  role_code?: string;
  status: string;
  expires_at: string;
  invitation_token: string;
}

export interface CohortResponse {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description?: string | null;
  status: string;
  created_at: string;
}

export interface ObjectiveResponse {
  id: string;
  tenant_id: string;
  course_id: string;
  code: string;
  title: string;
  description?: string | null;
  mastery_threshold: number;
  difficulty_level: number;
  created_at: string;
}

export interface LessonResponse {
  id: string;
  tenant_id: string;
  course_id: string;
  title: string;
  summary?: string | null;
  content_markdown: string;
  position: number;
  sequence_order: number;
  estimated_minutes: number;
  objective_ids: string[];
  created_at: string;
}

export interface CourseResponse {
  id: string;
  tenant_id: string;
  code: string;
  title: string;
  description?: string | null;
  status: string;
  current_version_number: number;
  published_version_number?: number;
  published_version_id?: string | null;
  academic_integrity_policy: string;
  created_by_membership_id: string;
  objectives: ObjectiveResponse[];
  lessons_count: number;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentResponse {
  id: string;
  tenant_id: string;
  course_id: string;
  course_title: string;
  course_code: string;
  course_version_id: string;
  membership_id: string;
  cohort_id?: string | null;
  status: string;
  completion_percentage: number;
  lessons_completed_count: number;
  total_lessons_count: number;
  created_at: string;
}

export interface QuestionViewResponse {
  id: string;
  question_type: string;
  prompt: string;
  options: Array<{ key: string; text: string }>;
  points: number;
  difficulty: string;
  objective_ids: string[];
  correct_answer?: string | null;
  explanation?: string | null;
}

export interface AssessmentResponse {
  id: string;
  tenant_id: string;
  course_id: string;
  title: string;
  description?: string | null;
  assessment_type: string;
  passing_score_percentage: number;
  passing_score_percent: number;
  time_limit_minutes?: number | null;
  max_attempts: number;
  status: string;
  current_version_number: number;
  published_version_id?: string | null;
  questions: QuestionViewResponse[];
  created_at: string;
}

export interface AssessmentPublishResponse {
  id: string;
  status: string;
  published_version_id: string;
  published_version_number: number;
}

export interface AttemptDetailResponse {
  id: string;
  tenant_id: string;
  assessment_id: string;
  assessment_version_id: string;
  enrollment_id: string;
  learner_membership_id: string;
  attempt_number: number;
  status: string;
  started_at: string;
  submitted_at?: string | null;
  questions: QuestionViewResponse[];
  responses: Array<{
    question_id: string;
    selected_answer: string;
    is_correct?: boolean | null;
    awarded_points: number;
  }>;
}

export interface GradingResultResponse {
  id: string;
  tenant_id: string;
  attempt_id: string;
  assessment_id: string;
  assessment_version_id: string;
  earned_points: number;
  total_points: number;
  score_percentage: number;
  passed: boolean;
  grading_method: string;
  objective_breakdown: Array<{
    objective_id: string;
    objective_code: string;
    objective_title: string;
    earned_points: number;
    total_points: number;
    score_percentage: number;
  }>;
  responses: Array<{
    question_id: string;
    selected_answer: string;
    is_correct?: boolean | null;
    awarded_points: number;
  }>;
  reviews: Array<{
    id: string;
    reviewer_membership_id: string;
    previous_score_percentage: number;
    adjusted_score_percentage: number;
    feedback: string;
    reviewed_at: string;
  }>;
  graded_at: string;
}

export interface DocumentResponse {
  id: string;
  tenant_id: string;
  course_id: string;
  title: string;
  filename: string;
  original_filename: string;
  content_type: string;
  mime_type: string;
  status: string;
  processing_status: string;
  current_version_number: number;
  checksum_sha256: string;
  size_bytes: number;
  file_size_bytes: number;
  uploaded_by_membership_id: string;
  failure_reason?: string | null;
  chunks_count: number;
  chunk_count: number;
  latest_job?: {
    id: string;
    status: string;
    attempt_count: number;
    max_retries: number;
    error_message?: string | null;
  } | null;
  created_at: string;
}

export interface CitationReference {
  chunk_id: string;
  document_id: string;
  document_title: string;
  document_version_number: number;
  page_number: number;
  section_title?: string | null;
  excerpt: string;
  relevance_score: number;
}

export interface TutorMessageResponse {
  id: string;
  tenant_id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  grounding_status: string;
  citations: CitationReference[];
  prompt_version: string;
  model_id: string;
  token_usage: Record<string, unknown>;
  created_at: string;
}

export interface TutorConversationResponse {
  id: string;
  tenant_id: string;
  course_id: string;
  membership_id: string;
  title: string;
  complexity_level: string;
  status: string;
  messages: TutorMessageResponse[];
  created_at: string;
}

export interface PracticeDraftResponse {
  id: string;
  review_id?: string;
  question_id?: string;
  course_id: string;
  prompt: string;
  options: Array<{ label: string; option_text: string }>;
  correct_option_label: string;
  explanation: string;
  difficulty_level: number;
  review_status: string;
  source_chunk_ids: string[];
}

export interface PracticeDraftReviewResponse {
  review_id: string;
  ai_job_id: string;
  question_id: string;
  course_id: string;
  prompt: string;
  options: Array<{ key: string; text: string }>;
  correct_answer: string;
  explanation?: string | null;
  difficulty: string;
  question_status: string;
  review_status: string;
  prompt_version: string;
  model_id: string;
  source_references: Array<{
    chunk_id: string;
    document_id: string;
    document_title: string;
    page_number: number;
    excerpt: string;
  }>;
  validation_outcome: Record<string, unknown>;
  reviewer_notes?: string | null;
  reviewed_at?: string | null;
}

export interface ObjectiveMasteryResponse {
  id: string;
  tenant_id: string;
  course_id: string;
  learner_membership_id: string;
  objective_id: string;
  objective_code: string;
  objective_title: string;
  mastery_threshold: number;
  mastery_score: number;
  mastery_status: 'gap_detected' | 'developing' | 'mastered';
  attempts_count: number;
  incorrect_streak: number;
  prior_score?: number | null;
  score_delta?: number | null;
  calculation_version: string;
  evidence_refs: Array<Record<string, unknown>>;
  last_evaluated_at: string;
}

export interface RecommendationResponse {
  id: string;
  tenant_id: string;
  course_id: string;
  learner_membership_id: string;
  objective_id: string;
  objective_code: string;
  objective_title: string;
  recommendation_type: string;
  title: string;
  reason_explanation: string;
  calculation_version: string;
  evidence_refs: Array<Record<string, unknown>>;
  status: string;
  learner_feedback?: string | null;
  feedback_comment?: string | null;
  created_at: string;
}

export interface LearnerProgressSummaryResponse {
  learner_membership_id: string;
  enrolled_courses_count: number;
  average_completion_percentage: number;
  average_assessment_score?: number | null;
  mastered_objectives_count: number;
  gap_objectives_count: number;
  active_recommendations_count: number;
  course_progress: Array<Record<string, unknown>>;
  recent_attempts: Array<Record<string, unknown>>;
}

export interface CourseAnalyticsResponse {
  course_id: string;
  course_title: string;
  enrolled_learners_count: number;
  active_enrollment_count: number;
  average_completion_percentage: number;
  submitted_attempts_count: number;
  graded_attempt_count: number;
  average_assessment_score?: number | null;
  average_assessment_score_percent: number;
  objective_analytics: Array<Record<string, unknown>>;
  objective_breakdown: Array<{
    objective_id: string;
    objective_code: string;
    objective_title: string;
    average_score_percent: number;
    average_confidence: number;
    learner_count: number;
    at_risk_count: number;
    mastered_count: number;
  }>;
  learner_summaries: Array<Record<string, unknown>>;
}

export interface SubscriptionSummaryResponse {
  tenant_id: string;
  plan_code: string;
  plan_name: string;
  status: string;
  monthly_ai_token_quota: number;
  used_ai_tokens: number;
  remaining_ai_tokens: number;
  seat_limit: number;
  storage_limit_mb: number;
}

export interface BillingPlanResponse {
  subscription_id: string;
  tenant_id: string;
  plan_code: string;
  plan_name: string;
  status: string;
  monthly_price_usd: number;
  max_active_users: number;
  max_published_courses: number;
  max_ai_requests_per_month: number;
  max_storage_bytes: number;
  max_monthly_tokens: number;
  current_period_start: string;
  current_period_end: string;
}

export interface BillingUsageResponse {
  tenant_id: string;
  period_month: string;
  active_users_count: number;
  published_courses_count: number;
  ai_requests_count: number;
  storage_bytes_used: number;
  monthly_tokens_used: number;
  estimated_ai_cost_usd: number;
  recent_ai_operations: Array<Record<string, unknown>>;
}

export interface AuditEventView {
  id: string;
  tenant_id: string;
  actor_user_id?: string | null;
  actor_membership_id?: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address?: string | null;
  request_id?: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface AuditEventResponse {
  id: string;
  tenant_id: string;
  actor_user_id?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PlatformTenantSummary {
  id: string;
  name: string;
  slug: string;
  organization_type: string;
  status: string;
  created_at?: string;
}

export interface AIEvaluationRunResponse {
  id?: string;
  suite_name: string;
  passed_quality_gate: boolean;
  retrieval_recall_at_5: number;
  citation_authorization_rate: number;
  groundedness_rate: number;
  answer_relevance_score: number;
  unauthorized_leak_count: number;
  structured_output_validity_rate: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
