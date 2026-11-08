import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClientError, apiRequest } from '../../api/client';
import type {
  AssessmentResponse,
  AttemptDetailResponse,
  CourseResponse,
  EnrollmentResponse,
  GradingResultResponse,
  LearnerProgressSummaryResponse,
  LessonResponse,
  ObjectiveMasteryResponse,
  RecommendationResponse,
  TutorConversationResponse,
  TutorMessageResponse,
} from '../../api/generated/schema';
import { Badge, EmptyState, ErrorAlert } from '../../components/ui/Primitives';

export function LearnerWorkspace() {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<AttemptDetailResponse | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [latestGradingResult, setLatestGradingResult] = useState<GradingResultResponse | null>(
    null,
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [tutorQuestion, setTutorQuestion] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const catalogQuery = useQuery({
    queryKey: ['courses', 'catalog'],
    queryFn: () => apiRequest<CourseResponse[]>('/courses'),
  });

  const enrollmentsQuery = useQuery({
    queryKey: ['learner', 'enrollments'],
    queryFn: () => apiRequest<EnrollmentResponse[]>('/learners/me/courses'),
  });

  const progressQuery = useQuery({
    queryKey: ['learner', 'progress'],
    queryFn: () => apiRequest<LearnerProgressSummaryResponse>('/learners/me/progress'),
  });

  const masteryQuery = useQuery({
    queryKey: ['learner', 'mastery', selectedCourseId],
    queryFn: () =>
      apiRequest<ObjectiveMasteryResponse[]>(
        selectedCourseId
          ? `/learners/me/mastery?course_id=${selectedCourseId}`
          : '/learners/me/mastery',
      ),
  });

  const recommendationsQuery = useQuery({
    queryKey: ['learner', 'recommendations', selectedCourseId],
    queryFn: () =>
      apiRequest<RecommendationResponse[]>(
        selectedCourseId
          ? `/learners/me/recommendations?course_id=${selectedCourseId}`
          : '/learners/me/recommendations',
      ),
  });

  const lessonsQuery = useQuery({
    queryKey: ['course', selectedCourseId, 'lessons'],
    queryFn: () => apiRequest<LessonResponse[]>(`/courses/${selectedCourseId}/lessons`),
    enabled: Boolean(selectedCourseId),
  });

  const assessmentsQuery = useQuery({
    queryKey: ['course', selectedCourseId, 'assessments'],
    queryFn: () => apiRequest<AssessmentResponse[]>(`/courses/${selectedCourseId}/assessments`),
    enabled: Boolean(selectedCourseId),
  });

  const conversationQuery = useQuery({
    queryKey: ['tutor', 'conversation', activeConversationId],
    queryFn: () =>
      apiRequest<TutorConversationResponse>(`/tutor/conversations/${activeConversationId}`),
    enabled: Boolean(activeConversationId),
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) =>
      apiRequest<EnrollmentResponse>(`/courses/${courseId}/enrollments`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: (enr) => {
      setSelectedCourseId(enr.course_id);
      queryClient.invalidateQueries({ queryKey: ['learner'] });
    },
    onError: (err) =>
      setErrorMsg(err instanceof ApiClientError ? err.userFacingMessage : 'Enrollment failed.'),
  });

  const completeLessonMutation = useMutation({
    mutationFn: (lessonId: string) =>
      apiRequest<EnrollmentResponse>(`/lessons/${lessonId}/complete`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learner'] });
    },
  });

  const startAttemptMutation = useMutation({
    mutationFn: (assessmentId: string) =>
      apiRequest<AttemptDetailResponse>(`/assessments/${assessmentId}/attempts`, {
        method: 'POST',
      }),
    onSuccess: (attempt) => {
      setActiveAttempt(attempt);
      setSelectedAnswers({});
      setLatestGradingResult(null);
    },
    onError: (err) =>
      setErrorMsg(err instanceof ApiClientError ? err.userFacingMessage : 'Could not start attempt.'),
  });

  const submitAttemptMutation = useMutation({
    mutationFn: async (attempt: AttemptDetailResponse) => {
      for (const q of attempt.questions) {
        const ans = selectedAnswers[q.id];
        if (ans) {
          await apiRequest(`/attempts/${attempt.id}/responses/${q.id}`, {
            method: 'PUT',
            body: JSON.stringify({ selected_answer: ans }),
          });
        }
      }
      return apiRequest<GradingResultResponse>(`/attempts/${attempt.id}/submit`, {
        method: 'POST',
      });
    },
    onSuccess: (grading) => {
      setLatestGradingResult(grading);
      setActiveAttempt(null);
      queryClient.invalidateQueries({ queryKey: ['learner'] });
    },
    onError: (err) =>
      setErrorMsg(err instanceof ApiClientError ? err.userFacingMessage : 'Submission failed.'),
  });

  const askTutorMutation = useMutation({
    mutationFn: async (question: string) => {
      if (!selectedCourseId) throw new Error('Select a course first');
      let convId = activeConversationId;
      if (!convId) {
        const created = await apiRequest<TutorConversationResponse>(
          `/courses/${selectedCourseId}/tutor/conversations`,
          {
            method: 'POST',
            body: JSON.stringify({ title: 'Course Study Session', complexity_level: 'standard' }),
          },
        );
        convId = created.id;
        setActiveConversationId(convId);
      }
      return apiRequest<TutorMessageResponse>(`/tutor/conversations/${convId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: question }),
      });
    },
    onSuccess: (msg) => {
      setTutorQuestion('');
      queryClient.invalidateQueries({ queryKey: ['tutor', 'conversation', msg.conversation_id] });
    },
    onError: (err) =>
      setErrorMsg(err instanceof ApiClientError ? err.userFacingMessage : 'Tutor query failed.'),
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ recId, feedback }: { recId: string; feedback: string }) =>
      apiRequest(`/recommendations/${recId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learner', 'recommendations'] });
    },
  });

  const enrolledCourseIds = new Set((enrollmentsQuery.data || []).map((e) => e.course_id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header>
        <h2 style={{ margin: '0 0 0.25rem 0' }}>Learner Workspace & Intelligence Hub</h2>
        <p style={{ margin: 0, color: '#475569' }}>
          Study authorized courses, complete assessments, ask the course-grounded AI Tutor, and track
          objective-level mastery.
        </p>
      </header>

      <ErrorAlert message={errorMsg} />

      {/* Progress Summary Cards */}
      {progressQuery.data && (
        <section className="grid-4" aria-label="Learner Progress Metrics">
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: '#475569' }}>Enrolled Courses</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
              {progressQuery.data.enrolled_courses_count}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: '#475569' }}>Avg Lesson Completion</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
              {progressQuery.data.average_completion_percentage}%
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: '#475569' }}>Mastered Objectives</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#15803d' }}>
              {progressQuery.data.mastered_objectives_count}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: '#475569' }}>Knowledge Gaps Detected</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#b91c1c' }}>
              {progressQuery.data.gap_objectives_count}
            </div>
          </div>
        </section>
      )}

      {/* Course Catalog & Enrolled Courses */}
      <section className="card">
        <h3 style={{ marginTop: 0 }}>Authorized Course Catalog & My Enrollments</h3>
        {(catalogQuery.data || []).length === 0 ? (
          <EmptyState
            title="No published courses available yet"
            description="Once an instructor publishes a course in this tenant, you can enroll and begin studying."
          />
        ) : (
          <div className="grid-2">
            {(catalogQuery.data || []).map((course) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              const isSelected = selectedCourseId === course.id;
              return (
                <div
                  key={course.id}
                  className="card"
                  style={{
                    borderColor: isSelected ? '#1d4ed8' : '#e2e8f0',
                    background: isSelected ? '#f8fafc' : '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <strong>
                      [{course.code}] {course.title}
                    </strong>
                    <Badge variant={isEnrolled ? 'success' : 'neutral'}>
                      {isEnrolled ? 'Enrolled' : `v${course.current_version_number}`}
                    </Badge>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#475569' }}>{course.description}</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!isEnrolled ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => enrollMutation.mutate(course.id)}
                      >
                        Enroll in Course
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setActiveConversationId(null);
                        }}
                      >
                        {isSelected ? 'Viewing Course' : 'Open Course Workspace'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Active Course Study, Assessment, and AI Tutor */}
      {selectedCourseId && (
        <div className="grid-2">
          {/* Lessons & Assessments */}
          <section className="card">
            <h3 style={{ marginTop: 0 }}>Course Lessons & Assessments</h3>
            <h4>Lessons</h4>
            {(lessonsQuery.data || []).length === 0 ? (
              <p style={{ color: '#475569', fontSize: '0.9rem' }}>No lessons found.</p>
            ) : (
              (lessonsQuery.data || []).map((lsn) => (
                <div
                  key={lsn.id}
                  style={{
                    padding: '0.85rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>
                      {lsn.position}. {lsn.title}
                    </strong>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => completeLessonMutation.mutate(lsn.id)}
                    >
                      Mark Lesson Complete
                    </button>
                  </div>
                  <div style={{ fontSize: '0.9rem', marginTop: '0.4rem', whiteSpace: 'pre-wrap' }}>
                    {lsn.content_markdown}
                  </div>
                </div>
              ))
            )}

            <h4>Published Assessments</h4>
            {(assessmentsQuery.data || []).map((asmt) => (
              <div
                key={asmt.id}
                style={{
                  padding: '0.85rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{asmt.title}</strong> ({asmt.assessment_type})
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                      Pass threshold: {asmt.passing_score_percentage}%
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => startAttemptMutation.mutate(asmt.id)}
                  >
                    Start Attempt
                  </button>
                </div>
              </div>
            ))}

            {activeAttempt && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#eff6ff',
                  borderRadius: '0.5rem',
                  border: '1px solid #bfdbfe',
                }}
              >
                <h4 style={{ marginTop: 0 }}>
                  Active Assessment Attempt #{activeAttempt.attempt_number}
                </h4>
                {activeAttempt.questions.map((q, idx) => (
                  <div key={q.id} style={{ marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.35rem' }}>
                      Q{idx + 1} ({q.points} pts): {q.prompt}
                    </div>
                    {q.options.map((opt) => (
                      <label
                        key={opt.key}
                        style={{ display: 'block', marginBottom: '0.25rem', cursor: 'pointer' }}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={opt.key}
                          checked={selectedAnswers[q.id] === opt.key}
                          onChange={() =>
                            setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt.key }))
                          }
                        />{' '}
                        <strong>{opt.key}:</strong> {opt.text}
                      </label>
                    ))}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => submitAttemptMutation.mutate(activeAttempt)}
                >
                  Submit Attempt for Authoritative Grading
                </button>
              </div>
            )}

            {latestGradingResult && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: latestGradingResult.passed ? '#f0fdf4' : '#fef2f2',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.5rem',
                }}
              >
                <strong>
                  Authoritative Score: {latestGradingResult.score_percentage}% (
                  {latestGradingResult.earned_points}/{latestGradingResult.total_points} pts) —{' '}
                  {latestGradingResult.passed ? 'PASSED' : 'NEEDS REMEDIATION'}
                </strong>
              </div>
            )}
          </section>

          {/* Course-Grounded AI Tutor */}
          <section className="card">
            <h3 style={{ marginTop: 0 }}>Course-Grounded AI Tutor (RAG with Verifiable Citations)</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (tutorQuestion.trim()) {
                  askTutorMutation.mutate(tutorQuestion.trim());
                }
              }}
              style={{ marginBottom: '1rem' }}
            >
              <div className="field">
                <label htmlFor="tutor-question-input">
                  Ask a question grounded in authorized course materials
                </label>
                <textarea
                  id="tutor-question-input"
                  rows={3}
                  value={tutorQuestion}
                  onChange={(e) => setTutorQuestion(e.target.value)}
                  placeholder="e.g., How does PostgreSQL Row-Level Security isolate tenant data?"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={askTutorMutation.isPending}
              >
                {askTutorMutation.isPending ? 'Retrieving & Generating...' : 'Ask AI Tutor'}
              </button>
            </form>

            <div>
              {(conversationQuery.data?.messages || []).map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '0.5rem',
                    marginBottom: '0.75rem',
                    background: msg.role === 'user' ? '#f1f5f9' : '#eff6ff',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <strong>{msg.role === 'user' ? 'You' : 'Akademia AI Tutor'}</strong>
                    {msg.role === 'assistant' && (
                      <Badge
                        variant={msg.grounding_status === 'grounded' ? 'success' : 'warning'}
                      >
                        {msg.grounding_status}
                      </Badge>
                    )}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{msg.content}</div>
                  {msg.citations && msg.citations.length > 0 && (
                    <div
                      style={{
                        marginTop: '0.6rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid #cbd5e1',
                        fontSize: '0.8rem',
                      }}
                    >
                      <strong>Verified Source Citations:</strong>
                      {msg.citations.map((cit) => (
                        <div key={cit.chunk_id} style={{ marginTop: '0.25rem' }}>
                          • {cit.document_title} (v{cit.document_version_number}, p.{cit.page_number}
                          ) — Relevance: {cit.relevance_score}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Objective Mastery & Targeted Recommendations */}
      <div className="grid-2">
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Objective-Level Mastery & Evidence</h3>
          {(masteryQuery.data || []).length === 0 ? (
            <EmptyState
              title="No mastery records yet"
              description="Complete a diagnostic or formative assessment to generate objective-level mastery evidence."
            />
          ) : (
            (masteryQuery.data || []).map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '0.75rem',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>
                    [{m.objective_code}] {m.objective_title}
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Attempts: {m.attempts_count} | Score: {m.mastery_score}% (Threshold:{' '}
                    {m.mastery_threshold}%)
                    {m.score_delta !== null && m.score_delta !== undefined
                      ? ` | Delta: ${m.score_delta >= 0 ? '+' : ''}${m.score_delta}%`
                      : ''}
                  </div>
                </div>
                <Badge
                  variant={
                    m.mastery_status === 'mastered'
                      ? 'success'
                      : m.mastery_status === 'gap_detected'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {m.mastery_status}
                </Badge>
              </div>
            ))
          )}
        </section>

        <section className="card">
          <h3 style={{ marginTop: 0 }}>Evidence-Based Learning Recommendations</h3>
          {(recommendationsQuery.data || []).length === 0 ? (
            <EmptyState
              title="No active remediation recommendations"
              description="When an assessment reveals a learning gap, targeted practice recommendations appear here."
            />
          ) : (
            (recommendationsQuery.data || []).map((rec) => (
              <div
                key={rec.id}
                style={{
                  padding: '0.85rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{rec.title}</strong>
                  <Badge variant={rec.status === 'completed' ? 'success' : 'warning'}>
                    {rec.status}
                  </Badge>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#475569', margin: '0.4rem 0' }}>
                  {rec.reason_explanation}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      feedbackMutation.mutate({ recId: rec.id, feedback: 'helpful' })
                    }
                  >
                    Mark Helpful
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
