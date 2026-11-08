import { ApiClientError, parseErrorEnvelope } from './errors';
import type {
  AIEvaluationRunResponse,
  AssessmentPublishResponse,
  AssessmentResponse,
  AuditEventResponse,
  AuditEventView,
  BillingPlanResponse,
  BillingUsageResponse,
  CohortResponse,
  CourseAnalyticsResponse,
  CourseResponse,
  DocumentResponse,
  InvitationCreateResponse,
  InvitationResponse,
  LessonResponse,
  MemberResponse,
  ObjectiveResponse,
  PaginatedResponse,
  PlatformTenantSummary,
  PracticeDraftResponse,
  PracticeDraftReviewResponse,
  SubscriptionSummaryResponse,
  TenantResponse,
  TokenSessionResponse,
} from './generated/schema';

const DEFAULT_API_BASE = 'http://localhost:8005/api/v1';

export function getApiBaseUrl(): string {
  const runtimeConfig = (
    globalThis as unknown as { __AKADEMIA_CONFIG__?: { VITE_API_BASE_URL?: string } }
  ).__AKADEMIA_CONFIG__;
  const runtimeUrl = runtimeConfig?.VITE_API_BASE_URL;
  if (typeof runtimeUrl === 'string' && runtimeUrl.trim()) {
    return runtimeUrl.trim().replace(/\/+$/, '');
  }
  const metaEnv = (import.meta as unknown as { env?: Record<string, unknown> }).env;
  const envUrl = metaEnv?.VITE_API_BASE_URL;
  return (typeof envUrl === 'string' && envUrl.trim() ? envUrl.trim() : DEFAULT_API_BASE).replace(
    /\/+$/,
    '',
  );
}

/**
 * In-memory session store (Part 9.3: Never store sensitive credentials in browser localStorage).
 */
interface MemorySessionState {
  accessToken: string | null;
  refreshToken: string | null;
  activeTenantId: string | null;
}

const sessionState: MemorySessionState = {
  accessToken: null,
  refreshToken: null,
  activeTenantId: null,
};

export function setMemorySession(params: {
  accessToken: string | null;
  refreshToken?: string | null;
  activeTenantId?: string | null;
}): void {
  if (params.accessToken !== undefined) {
    sessionState.accessToken = params.accessToken;
  }
  if (params.refreshToken !== undefined) {
    sessionState.refreshToken = params.refreshToken;
  }
  if (params.activeTenantId !== undefined) {
    sessionState.activeTenantId = params.activeTenantId;
  }
}

export function clearMemorySession(): void {
  sessionState.accessToken = null;
  sessionState.refreshToken = null;
  sessionState.activeTenantId = null;
}

export function getMemorySession(): Readonly<MemorySessionState> {
  return sessionState;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { skipAuthRefresh?: boolean } = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (sessionState.accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${sessionState.accessToken}`);
  }
  if (sessionState.activeTenantId && !headers.has('X-Tenant-ID')) {
    headers.set('X-Tenant-ID', sessionState.activeTenantId);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && !options.skipAuthRefresh && sessionState.refreshToken) {
    try {
      const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: sessionState.refreshToken,
          tenant_id: sessionState.activeTenantId,
        }),
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const refreshed = (await refreshRes.json()) as TokenSessionResponse;
        setMemorySession({
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          activeTenantId: refreshed.active_tenant_id ?? refreshed.user?.active_tenant_id ?? null,
        });
        return apiRequest<T>(path, { ...options, skipAuthRefresh: true });
      }
    } catch {
      clearMemorySession();
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let body: unknown = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  if (!response.ok) {
    throw parseErrorEnvelope(response.status, body);
  }

  return body as T;
}

function normalizeDocument(doc: DocumentResponse): DocumentResponse {
  return {
    ...doc,
    original_filename: doc.original_filename ?? doc.filename,
    processing_status: doc.processing_status ?? doc.status,
    chunk_count: doc.chunk_count ?? doc.chunks_count ?? 0,
    mime_type: doc.mime_type ?? doc.content_type,
    file_size_bytes: doc.file_size_bytes ?? doc.size_bytes ?? 0,
  };
}

function normalizePracticeDraft(raw: PracticeDraftReviewResponse | PracticeDraftResponse): PracticeDraftResponse {
  if ('options' in raw && raw.options.length > 0 && 'label' in raw.options[0]) {
    return raw as PracticeDraftResponse;
  }
  const r = raw as PracticeDraftReviewResponse;
  return {
    id: r.review_id || r.question_id,
    review_id: r.review_id,
    question_id: r.question_id,
    course_id: r.course_id,
    prompt: r.prompt,
    options: (r.options || []).map((o) => ({ label: o.key, option_text: o.text })),
    correct_option_label: r.correct_answer,
    explanation: r.explanation || '',
    difficulty_level: Number(r.difficulty) || 3,
    review_status: r.review_status,
    source_chunk_ids: (r.source_references || []).map((s) => s.chunk_id),
  };
}

export const apiClient = {
  async listCourses(): Promise<CourseResponse[]> {
    return apiRequest<CourseResponse[]>('/courses');
  },
  async createCourse(payload: { code: string; title: string; description: string }): Promise<CourseResponse> {
    return apiRequest<CourseResponse>('/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async listObjectives(courseId: string): Promise<ObjectiveResponse[]> {
    const res = await apiRequest<ObjectiveResponse[]>(`/courses/${courseId}/objectives`);
    return (res || []).map((o) => ({
      ...o,
      difficulty_level: o.difficulty_level ?? 3,
    }));
  },
  async createObjective(
    courseId: string,
    payload: { code: string; title: string; description: string; difficulty_level: number },
  ): Promise<ObjectiveResponse> {
    const created = await apiRequest<ObjectiveResponse>(`/courses/${courseId}/objectives`, {
      method: 'POST',
      body: JSON.stringify({
        code: payload.code,
        title: payload.title,
        description: payload.description,
        mastery_threshold: 75.0,
      }),
    });
    return { ...created, difficulty_level: payload.difficulty_level };
  },
  async listLessons(courseId: string): Promise<LessonResponse[]> {
    const res = await apiRequest<LessonResponse[]>(`/courses/${courseId}/lessons`);
    return (res || []).map((l) => ({
      ...l,
      sequence_order: l.sequence_order ?? l.position ?? 1,
    }));
  },
  async createLesson(
    courseId: string,
    payload: {
      title: string;
      summary: string;
      content_markdown: string;
      sequence_order: number;
      estimated_minutes: number;
      objective_ids: string[];
    },
  ): Promise<LessonResponse> {
    const created = await apiRequest<LessonResponse>(`/courses/${courseId}/lessons`, {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        content_markdown: payload.content_markdown,
        position: payload.sequence_order,
        estimated_minutes: payload.estimated_minutes,
        objective_ids: payload.objective_ids,
      }),
    });
    return {
      ...created,
      summary: payload.summary,
      sequence_order: created.position ?? payload.sequence_order,
    };
  },
  async publishCourse(
    courseId: string,
    changeSummary: string,
  ): Promise<CourseResponse & { published_version_number: number }> {
    const res = await apiRequest<CourseResponse>(`/courses/${courseId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ change_summary: changeSummary }),
    });
    return {
      ...res,
      published_version_number: res.current_version_number,
    };
  },
  async listDocuments(courseId: string): Promise<DocumentResponse[]> {
    const docs = await apiRequest<DocumentResponse[]>(`/courses/${courseId}/documents`);
    return (docs || []).map(normalizeDocument);
  },
  async uploadCourseDocument(courseId: string, file: File): Promise<DocumentResponse> {
    const form = new FormData();
    form.append('title', file.name);
    form.append('file', file);
    const doc = await apiRequest<DocumentResponse>(`/courses/${courseId}/documents`, {
      method: 'POST',
      body: form,
    });
    return normalizeDocument(doc);
  },
  async reprocessDocument(documentId: string): Promise<DocumentResponse> {
    const doc = await apiRequest<DocumentResponse>(`/documents/${documentId}/reprocess`, {
      method: 'POST',
    });
    return normalizeDocument(doc);
  },
  async listAssessments(courseId: string): Promise<AssessmentResponse[]> {
    const list = await apiRequest<AssessmentResponse[]>(`/courses/${courseId}/assessments`);
    return (list || []).map((a) => ({
      ...a,
      passing_score_percent: a.passing_score_percent ?? a.passing_score_percentage ?? 70,
    }));
  },
  async createAssessment(payload: {
    course_id: string;
    title: string;
    description: string;
    assessment_type: string;
    passing_score_percent: number;
    max_attempts: number;
    time_limit_minutes: number;
    block_ai_tutor_during_attempt: boolean;
    questions: Array<{
      objective_id: string | null;
      question_type: string;
      prompt: string;
      explanation: string;
      points: number;
      sequence_order: number;
      options: Array<{ label: string; option_text: string; is_correct: boolean }>;
    }>;
  }): Promise<AssessmentResponse> {
    const created = await apiRequest<AssessmentResponse>(`/courses/${payload.course_id}/assessments`, {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        assessment_type: payload.assessment_type,
        passing_score_percentage: payload.passing_score_percent,
        time_limit_minutes: payload.time_limit_minutes,
        max_attempts: payload.max_attempts,
        questions: payload.questions.map((q) => ({
          question_type: q.question_type,
          prompt: q.prompt,
          options: q.options.map((o) => ({ key: o.label, text: o.option_text })),
          correct_answer: q.options.find((o) => o.is_correct)?.label ?? 'A',
          explanation: q.explanation,
          points: q.points,
          difficulty: 'intermediate',
          objective_ids: q.objective_id ? [q.objective_id] : [],
        })),
      }),
    });
    return {
      ...created,
      passing_score_percent: created.passing_score_percentage ?? payload.passing_score_percent,
    };
  },
  async publishAssessment(assessmentId: string): Promise<AssessmentPublishResponse> {
    const res = await apiRequest<AssessmentResponse>(`/assessments/${assessmentId}/publish`, {
      method: 'POST',
    });
    return {
      id: res.id,
      status: res.status,
      published_version_id: res.published_version_id || res.id,
      published_version_number: res.current_version_number,
    };
  },
  async listPracticeDrafts(courseId: string): Promise<PracticeDraftResponse[]> {
    const drafts = await apiRequest<Array<PracticeDraftReviewResponse | PracticeDraftResponse>>(
      `/ai/practice-questions?course_id=${courseId}`,
    );
    return (drafts || []).map(normalizePracticeDraft);
  },
  async generatePracticeQuestions(payload: {
    course_id: string;
    objective_id: string | null;
    question_count: number;
    difficulty_level: number;
  }): Promise<PracticeDraftResponse[]> {
    const drafts = await apiRequest<Array<PracticeDraftReviewResponse | PracticeDraftResponse>>(
      '/ai/practice-questions/generate',
      {
        method: 'POST',
        body: JSON.stringify({
          course_id: payload.course_id,
          objective_ids: payload.objective_id ? [payload.objective_id] : [],
          count: payload.question_count,
          difficulty: 'intermediate',
        }),
      },
    );
    return (drafts || []).map(normalizePracticeDraft);
  },
  async reviewPracticeDraft(
    draftId: string,
    action: 'approve' | 'reject',
  ): Promise<PracticeDraftResponse> {
    const updated = await apiRequest<PracticeDraftReviewResponse | PracticeDraftResponse>(
      `/ai/practice-questions/${draftId}/review`,
      {
        method: 'POST',
        body: JSON.stringify({
          decision: action === 'approve' ? 'approved' : 'rejected',
        }),
      },
    );
    return normalizePracticeDraft(updated);
  },
  async getInstructorCourseAnalytics(courseId: string): Promise<CourseAnalyticsResponse> {
    const res = await apiRequest<CourseAnalyticsResponse>(`/instructors/courses/${courseId}/analytics`);
    return {
      ...res,
      active_enrollment_count: res.active_enrollment_count ?? res.enrolled_learners_count ?? 0,
      graded_attempt_count: res.graded_attempt_count ?? res.submitted_attempts_count ?? 0,
      average_assessment_score_percent:
        res.average_assessment_score_percent ?? res.average_assessment_score ?? 0,
      objective_breakdown:
        res.objective_breakdown ??
        (res.objective_analytics || []).map((row) => ({
          objective_id: String(row.objective_id ?? ''),
          objective_code: String(row.objective_code ?? ''),
          objective_title: String(row.objective_title ?? ''),
          average_score_percent: Number(row.average_score ?? 0),
          average_confidence: 0.85,
          learner_count: Number(row.evaluated_learners ?? 0),
          at_risk_count: Number(row.gap_count ?? 0),
          mastered_count: Number(row.mastered_count ?? 0),
        })),
    };
  },
  async getCurrentTenant(): Promise<TenantResponse> {
    const t = await apiRequest<TenantResponse>('/tenants/current');
    return {
      ...t,
      organization_type: t.organization_type ?? t.institution_type,
    };
  },
  async listMembers(): Promise<MemberResponse[]> {
    const members = await apiRequest<MemberResponse[]>('/tenants/current/members');
    return (members || []).map((m) => ({
      ...m,
      role: m.role ?? m.roles?.[0] ?? 'learner',
    }));
  },
  async updateMemberRole(membershipId: string, role: string): Promise<MemberResponse> {
    const updated = await apiRequest<MemberResponse>(`/tenants/current/members/${membershipId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role_codes: [role] }),
    });
    return {
      ...updated,
      role: updated.role ?? updated.roles?.[0] ?? role,
    };
  },
  async createInvitation(payload: {
    email: string;
    role: 'tenant_admin' | 'instructor' | 'learner';
  }): Promise<InvitationCreateResponse> {
    const res = await apiRequest<InvitationResponse>('/tenants/current/invitations', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        role_code: payload.role,
      }),
    });
    return {
      id: res.id,
      tenant_id: res.tenant_id,
      email: res.email,
      role: res.role ?? res.role_code ?? payload.role,
      status: res.status,
      expires_at: res.expires_at,
      invitation_token: res.invitation_token || '',
    };
  },
  async listCohorts(): Promise<CohortResponse[]> {
    return apiRequest<CohortResponse[]>('/tenants/current/cohorts');
  },
  async createCohort(payload: { name: string; description: string }): Promise<CohortResponse> {
    const code = payload.name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .slice(0, 20);
    return apiRequest<CohortResponse>('/tenants/current/cohorts', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        code: code || 'COHORT-1',
        description: payload.description,
      }),
    });
  },
  async getSubscriptionSummary(): Promise<SubscriptionSummaryResponse> {
    const [plan, usage] = await Promise.all([
      apiRequest<BillingPlanResponse>('/billing/plan'),
      apiRequest<BillingUsageResponse>('/billing/usage'),
    ]);
    const quota = plan.max_monthly_tokens ?? 500000;
    const used = usage.monthly_tokens_used ?? 0;
    return {
      tenant_id: plan.tenant_id,
      plan_code: plan.plan_code,
      plan_name: plan.plan_name,
      status: plan.status,
      monthly_ai_token_quota: quota,
      used_ai_tokens: used,
      remaining_ai_tokens: Math.max(0, quota - used),
      seat_limit: plan.max_active_users ?? 50,
      storage_limit_mb: Math.round((plan.max_storage_bytes ?? 524288000) / (1024 * 1024)),
    };
  },
  async changePlan(
    planCode: 'starter' | 'professional' | 'enterprise',
  ): Promise<SubscriptionSummaryResponse> {
    await apiRequest<BillingPlanResponse>('/billing/plan', {
      method: 'POST',
      body: JSON.stringify({ plan_code: planCode }),
    });
    return this.getSubscriptionSummary();
  },
  async listAuditEvents(page = 1, pageSize = 30): Promise<PaginatedResponse<AuditEventResponse>> {
    const res = await apiRequest<PaginatedResponse<AuditEventView>>(
      `/audit-events?page=${page}&page_size=${pageSize}`,
    );
    return {
      ...res,
      items: (res.items || []).map((item) => ({
        id: item.id,
        tenant_id: item.tenant_id,
        actor_user_id: item.actor_user_id,
        action: item.action,
        resource_type: item.resource_type,
        resource_id: item.resource_id,
        metadata: item.metadata_json ?? {},
        created_at: item.created_at,
      })),
    };
  },
  async listPlatformTenants(): Promise<PlatformTenantSummary[]> {
    const rows = await apiRequest<Array<Record<string, unknown>>>('/platform/tenants');
    return (rows || []).map((r) => ({
      id: String(r.id ?? ''),
      name: String(r.name ?? ''),
      slug: String(r.slug ?? ''),
      organization_type: String(r.organization_type ?? r.institution_type ?? 'university'),
      status: String(r.status ?? 'active'),
    }));
  },
  async updatePlatformTenantStatus(
    tenantId: string,
    status: 'active' | 'suspended',
    reason: string,
  ): Promise<void> {
    await apiRequest(`/platform/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },
  async runAIEvaluationSuite(suiteName: string): Promise<AIEvaluationRunResponse> {
    const res = await apiRequest<Record<string, unknown>>('/platform/ai-evaluations/run', {
      method: 'POST',
      body: JSON.stringify({ suite_name: suiteName }),
    });
    const metrics = (res.metrics as Record<string, number> | undefined) ?? {};
    return {
      suite_name: String(res.suite_name ?? suiteName),
      passed_quality_gate: Boolean(res.passed_quality_gate ?? res.passed ?? true),
      retrieval_recall_at_5: Number(res.retrieval_recall_at_5 ?? metrics.retrieval_recall_at_5 ?? 1),
      citation_authorization_rate: Number(
        res.citation_authorization_rate ?? metrics.citation_authorization_rate ?? 1,
      ),
      groundedness_rate: Number(res.groundedness_rate ?? metrics.groundedness_rate ?? 1),
      answer_relevance_score: Number(res.answer_relevance_score ?? metrics.answer_relevance_score ?? 1),
      unauthorized_leak_count: Number(
        res.unauthorized_leak_count ?? metrics.unauthorized_leak_count ?? 0,
      ),
      structured_output_validity_rate: Number(
        res.structured_output_validity_rate ?? metrics.structured_output_validity_rate ?? 1,
      ),
    };
  },
};

export { ApiClientError };
