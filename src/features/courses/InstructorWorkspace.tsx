import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { AlertBanner, Badge, Button, Card, EmptyState, Input, Select, Textarea } from "../../components/ui/Primitives";
import type {
  AssessmentPublishResponse,
  AssessmentResponse,
  CourseResponse,
  DocumentResponse,
  ObjectiveResponse,
  PracticeDraftResponse,
} from "../../api/generated/schema";

export const InstructorWorkspace: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeSubtab, setActiveSubtab] = useState<
    "curriculum" | "materials" | "assessments" | "practice_ai" | "analytics"
  >("curriculum");
  const [feedbackMessage, setFeedbackMessage] = useState<{
    variant: "info" | "success" | "warning" | "error";
    text: string;
  } | null>(null);

  // Course Creation State
  const [courseCode, setCourseCode] = useState("CS-301");
  const [courseTitle, setCourseTitle] = useState("Distributed Systems & Fault Tolerance");
  const [courseDesc, setCourseDesc] = useState(
    "Rigorous engineering course covering consensus, replication, vector clocks, and fault-tolerant systems."
  );

  // Objective Creation State
  const [objCode, setObjCode] = useState("OBJ-RAFT-1");
  const [objTitle, setObjTitle] = useState("Raft Leader Election & Log Replication");
  const [objDesc, setObjDesc] = useState(
    "Understand randomized election timeouts, split votes, quorum requirements, and log consistency checks."
  );
  const [objDifficulty, setObjDifficulty] = useState(3);

  // Lesson Creation State
  const [lessonTitle, setLessonTitle] = useState("Module 1: Consensus & Raft Fundamentals");
  const [lessonSummary, setLessonSummary] = useState("Core invariants of Raft state machines and quorum intersection.");
  const [lessonMarkdown, setLessonMarkdown] = useState(
    "## Raft Consensus Overview\n\nRaft achieves consensus via an elected leader. Every server is in one of three states: **Leader**, **Follower**, or **Candidate**. Randomized election timeouts (e.g., 150ms-300ms) prevent split votes.\n\n### Safety Invariants\n- **Election Safety**: At most one leader can be elected in a given term.\n- **Log Matching**: If two logs contain an entry with the same index and term, then the logs are identical in all entries up through the given index."
  );
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<string[]>([]);

  // Document Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Assessment Creation State
  const [assessmentTitle, setAssessmentTitle] = useState("Midterm Competency Check: Consensus");
  const [assessmentType, setAssessmentType] = useState<"quiz" | "diagnostic" | "practice" | "exam">("quiz");
  const [passingScore, setPassingScore] = useState(70);
  const [questionPrompt, setQuestionPrompt] = useState(
    "Which mechanism in Raft directly minimizes split votes during leader election?"
  );
  const [questionObjectiveId, setQuestionObjectiveId] = useState<string>("");
  const [optionAText, setOptionAText] = useState("Randomized election timeouts across nodes");
  const [optionBText, setOptionBText] = useState("Static MAC-address priority ordering");
  const [optionCText, setOptionCText] = useState("Proof-of-Work cryptographic hashing");
  const [questionExplanation, setQuestionExplanation] = useState(
    "Randomized timeouts ensure one candidate typically times out and requests votes before peers start competing elections."
  );

  // AI Practice Generation State
  const [practiceObjectiveId, setPracticeObjectiveId] = useState<string>("");
  const [practiceCount, setPracticeCount] = useState(2);
  const [practiceDifficulty, setPracticeDifficulty] = useState(3);

  // Queries
  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: () => apiClient.listCourses(),
  });

  const activeCourse: CourseResponse | undefined =
    coursesQuery.data?.find((c) => c.id === selectedCourseId) ?? coursesQuery.data?.[0];

  const activeCourseId = activeCourse?.id ?? null;

  const objectivesQuery = useQuery({
    queryKey: ["course-objectives", activeCourseId],
    queryFn: () => apiClient.listObjectives(activeCourseId!),
    enabled: Boolean(activeCourseId),
  });

  const lessonsQuery = useQuery({
    queryKey: ["course-lessons", activeCourseId],
    queryFn: () => apiClient.listLessons(activeCourseId!),
    enabled: Boolean(activeCourseId),
  });

  const documentsQuery = useQuery({
    queryKey: ["course-documents", activeCourseId],
    queryFn: () => apiClient.listDocuments(activeCourseId!),
    enabled: Boolean(activeCourseId),
  });

  const assessmentsQuery = useQuery({
    queryKey: ["course-assessments", activeCourseId],
    queryFn: () => apiClient.listAssessments(activeCourseId!),
    enabled: Boolean(activeCourseId),
  });

  const practiceDraftsQuery = useQuery({
    queryKey: ["practice-drafts", activeCourseId],
    queryFn: () => apiClient.listPracticeDrafts(activeCourseId!),
    enabled: Boolean(activeCourseId),
  });

  const courseAnalyticsQuery = useQuery({
    queryKey: ["course-analytics", activeCourseId],
    queryFn: () => apiClient.getInstructorCourseAnalytics(activeCourseId!),
    enabled: Boolean(activeCourseId && activeSubtab === "analytics"),
  });

  // Mutations
  const createCourseMutation = useMutation({
    mutationFn: () =>
      apiClient.createCourse({
        code: courseCode.trim(),
        title: courseTitle.trim(),
        description: courseDesc.trim(),
      }),
    onSuccess: (created) => {
      setSelectedCourseId(created.id);
      setFeedbackMessage({ variant: "success", text: `Created course "${created.title}" (${created.code}).` });
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (err: Error) => {
      setFeedbackMessage({ variant: "error", text: err.message });
    },
  });

  const createObjectiveMutation = useMutation({
    mutationFn: () =>
      apiClient.createObjective(activeCourseId!, {
        code: objCode.trim(),
        title: objTitle.trim(),
        description: objDesc.trim(),
        difficulty_level: objDifficulty,
      }),
    onSuccess: (created) => {
      setFeedbackMessage({ variant: "success", text: `Added learning objective ${created.code}: ${created.title}` });
      void queryClient.invalidateQueries({ queryKey: ["course-objectives", activeCourseId] });
    },
    onError: (err: Error) => setFeedbackMessage({ variant: "error", text: err.message }),
  });

  const createLessonMutation = useMutation({
    mutationFn: () =>
      apiClient.createLesson(activeCourseId!, {
        title: lessonTitle.trim(),
        summary: lessonSummary.trim(),
        content_markdown: lessonMarkdown,
        sequence_order: (lessonsQuery.data?.length ?? 0) + 1,
        estimated_minutes: 25,
        objective_ids:
          selectedObjectiveIds.length > 0
            ? selectedObjectiveIds
            : (objectivesQuery.data ?? []).map((o) => o.id),
      }),
    onSuccess: (created) => {
      setFeedbackMessage({ variant: "success", text: `Added lesson "${created.title}" mapped to learning objectives.` });
      void queryClient.invalidateQueries({ queryKey: ["course-lessons", activeCourseId] });
    },
    onError: (err: Error) => setFeedbackMessage({ variant: "error", text: err.message }),
  });

  const publishCourseMutation = useMutation({
    mutationFn: (summary: string) => apiClient.publishCourse(activeCourseId!, summary),
    onSuccess: (res) => {
      setFeedbackMessage({
        variant: "success",
        text: `Course published at immutable Version #${res.published_version_number} (${res.status}).`,
      });
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (err: Error) => setFeedbackMessage({ variant: "error", text: err.message }),
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: (file: File) => apiClient.uploadCourseDocument(activeCourseId!, file),
    onSuccess: (doc) => {
      setUploadFile(null);
      setFeedbackMessage({
        variant: "success",
        text: `Uploaded "${doc.original_filename}" (${doc.processing_status}) — ${doc.chunk_count} retrievable chunks indexed in pgvector.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["course-documents", activeCourseId] });
    },
    onError: (err: Error) => setFeedbackMessage({ variant: "error", text: err.message }),
  });

  const reprocessDocumentMutation = useMutation({
    mutationFn: (documentId: string) => apiClient.reprocessDocument(documentId),
    onSuccess: (doc) => {
      setFeedbackMessage({
        variant: "info",
        text: `Reprocessed "${doc.original_filename}" — ${doc.chunk_count} chunks ready.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["course-documents", activeCourseId] });
    },
  });

  const createAssessmentMutation = useMutation({
    mutationFn: () => {
      const targetObjId = questionObjectiveId || objectivesQuery.data?.[0]?.id || null;
      return apiClient.createAssessment({
        course_id: activeCourseId!,
        title: assessmentTitle.trim(),
        description: "Deterministic objective-aligned competency check.",
        assessment_type: assessmentType,
        passing_score_percent: passingScore,
        max_attempts: 5,
        time_limit_minutes: 30,
        block_ai_tutor_during_attempt: assessmentType === "exam",
        questions: [
          {
            objective_id: targetObjId,
            question_type: "multiple_choice",
            prompt: questionPrompt.trim(),
            explanation: questionExplanation.trim(),
            points: 10,
            sequence_order: 1,
            options: [
              { label: "A", option_text: optionAText.trim(), is_correct: true },
              { label: "B", option_text: optionBText.trim(), is_correct: false },
              { label: "C", option_text: optionCText.trim(), is_correct: false },
            ],
          },
        ],
      });
    },
    onSuccess: (created) => {
      setFeedbackMessage({
        variant: "success",
        text: `Created assessment "${created.title}" with ${created.questions.length} objective-mapped question(s).`,
      });
      void queryClient.invalidateQueries({ queryKey: ["course-assessments", activeCourseId] });
    },
    onError: (err: Error) => setFeedbackMessage({ variant: "error", text: err.message }),
  });

  const publishAssessmentMutation = useMutation({
    mutationFn: (assessmentId: string) => apiClient.publishAssessment(assessmentId),
    onSuccess: (res: AssessmentPublishResponse) => {
      setFeedbackMessage({
        variant: "success",
        text: `Assessment published at Version #${res.published_version_number}. Learners can now start attempts.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["course-assessments", activeCourseId] });
    },
    onError: (err: Error) => setFeedbackMessage({ variant: "error", text: err.message }),
  });

  const generatePracticeMutation = useMutation({
    mutationFn: () =>
      apiClient.generatePracticeQuestions({
        course_id: activeCourseId!,
        objective_id: practiceObjectiveId || objectivesQuery.data?.[0]?.id || null,
        question_count: practiceCount,
        difficulty_level: practiceDifficulty,
      }),
    onSuccess: (drafts) => {
      setFeedbackMessage({
        variant: "success",
        text: `Generated ${drafts.length} grounded AI practice question draft(s). Review and approve below.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["practice-drafts", activeCourseId] });
    },
    onError: (err: Error) => setFeedbackMessage({ variant: "error", text: err.message }),
  });

  const reviewDraftMutation = useMutation({
    mutationFn: ({ draftId, action }: { draftId: string; action: "approve" | "reject" }) =>
      apiClient.reviewPracticeDraft(draftId, action),
    onSuccess: (updated) => {
      setFeedbackMessage({
        variant: "info",
        text: `Practice draft marked as "${updated.review_status}".`,
      });
      void queryClient.invalidateQueries({ queryKey: ["practice-drafts", activeCourseId] });
    },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {feedbackMessage && (
        <AlertBanner variant={feedbackMessage.variant} title="Instructor Action">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{feedbackMessage.text}</span>
            <Button size="sm" variant="ghost" onClick={() => setFeedbackMessage(null)}>
              Dismiss
            </Button>
          </div>
        </AlertBanner>
      )}

      {/* Top Row: Course Selector & Create Course */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.25rem" }}>
        <Card
          title="Instructor Course Studio"
          subtitle="Author curriculum, map learning objectives, upload RAG source documents, and publish immutable versions."
          actions={
            activeCourse && (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <Badge variant={activeCourse.status === "published" ? "success" : "warning"}>
                  {activeCourse.status.toUpperCase()} (v{activeCourse.current_version_number})
                </Badge>
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={publishCourseMutation.isPending}
                  onClick={() => publishCourseMutation.mutate("Instructor published curriculum snapshot")}
                  data-testid="publish-course-btn"
                >
                  Publish Course Snapshot
                </Button>
              </div>
            )
          }
        >
          {(coursesQuery.data ?? []).length === 0 ? (
            <EmptyState
              title="No courses in this tenant yet"
              description="Create your first course on the right to start adding objectives, lessons, and assessments."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Select
                label="Select Active Course to Manage"
                value={activeCourse?.id ?? ""}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                options={(coursesQuery.data ?? []).map((c) => ({
                  value: c.id,
                  label: `${c.code} — ${c.title} (${c.status})`,
                }))}
              />
              {activeCourse && (
                <div
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "var(--bg-muted)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.875rem",
                  }}
                >
                  <strong>{activeCourse.title}</strong>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--text-secondary)" }}>
                    {activeCourse.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card title="Create New Course" subtitle="Initialize a new draft course for your institution">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createCourseMutation.mutate();
            }}
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
              <Input
                label="Course Code"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                required
                data-testid="instructor-course-code"
              />
              <Input
                label="Course Title"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                required
                data-testid="instructor-course-title"
              />
            </div>
            <Textarea
              label="Course Description"
              rows={2}
              value={courseDesc}
              onChange={(e) => setCourseDesc(e.target.value)}
            />
            <Button
              type="submit"
              variant="secondary"
              isLoading={createCourseMutation.isPending}
              data-testid="create-course-submit"
            >
              + Create Draft Course
            </Button>
          </form>
        </Card>
      </div>

      {/* Sub-navigation for the active course */}
      {activeCourse && (
        <>
          <div
            role="tablist"
            aria-label="Course Authoring Sections"
            style={{
              display: "flex",
              gap: "0.5rem",
              borderBottom: "1px solid var(--border-subtle)",
              paddingBottom: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            {(
              [
                { id: "curriculum", label: "1. Objectives & Lessons" },
                { id: "materials", label: `2. Approved RAG Materials (${documentsQuery.data?.length ?? 0})` },
                { id: "assessments", label: `3. Assessments & Grading (${assessmentsQuery.data?.length ?? 0})` },
                { id: "practice_ai", label: `4. AI Practice Generator (${practiceDraftsQuery.data?.length ?? 0})` },
                { id: "analytics", label: "5. Cohort Mastery & Evidence Analytics" },
              ] as const
            ).map((tab) => (
              <Button
                key={tab.id}
                role="tab"
                aria-selected={activeSubtab === tab.id}
                variant={activeSubtab === tab.id ? "primary" : "secondary"}
                size="sm"
                onClick={() => setActiveSubtab(tab.id)}
                data-testid={`instructor-subtab-${tab.id}`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* SUBTAB 1: CURRICULUM (OBJECTIVES & LESSONS) */}
          {activeSubtab === "curriculum" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <Card
                title="Learning Objectives"
                subtitle="Competency targets tracked by the Learning Intelligence Engine"
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createObjectiveMutation.mutate();
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 90px", gap: "0.5rem" }}>
                    <Input
                      label="Code"
                      value={objCode}
                      onChange={(e) => setObjCode(e.target.value)}
                      required
                      data-testid="objective-code-input"
                    />
                    <Input
                      label="Objective Title"
                      value={objTitle}
                      onChange={(e) => setObjTitle(e.target.value)}
                      required
                      data-testid="objective-title-input"
                    />
                    <Input
                      label="Diff (1-5)"
                      type="number"
                      min={1}
                      max={5}
                      value={objDifficulty}
                      onChange={(e) => setObjDifficulty(Number(e.target.value))}
                    />
                  </div>
                  <Textarea
                    label="Competency Description"
                    rows={2}
                    value={objDesc}
                    onChange={(e) => setObjDesc(e.target.value)}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={createObjectiveMutation.isPending}
                    data-testid="add-objective-btn"
                  >
                    + Add Learning Objective
                  </Button>
                </form>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {(objectivesQuery.data ?? []).map((obj: ObjectiveResponse) => (
                    <div
                      key={obj.id}
                      style={{
                        padding: "0.75rem",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <Badge variant="info">{obj.code}</Badge>
                          <strong style={{ fontSize: "0.875rem" }}>{obj.title}</strong>
                        </div>
                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                          {obj.description}
                        </p>
                      </div>
                      <Badge variant="neutral">L{obj.difficulty_level}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card
                title="Course Lessons & Objective Mapping"
                subtitle="Author structured study units linked to one or more learning objectives"
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createLessonMutation.mutate();
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}
                >
                  <Input
                    label="Lesson Title"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    required
                    data-testid="lesson-title-input"
                  />
                  <Input
                    label="Summary"
                    value={lessonSummary}
                    onChange={(e) => setLessonSummary(e.target.value)}
                  />
                  <Textarea
                    label="Lesson Content (Markdown)"
                    rows={4}
                    value={lessonMarkdown}
                    onChange={(e) => setLessonMarkdown(e.target.value)}
                    required
                  />
                  {(objectivesQuery.data ?? []).length > 0 && (
                    <div>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>
                        Mapped Learning Objectives (defaults to all if none checked):
                      </span>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {(objectivesQuery.data ?? []).map((obj) => {
                          const checked = selectedObjectiveIds.includes(obj.id);
                          return (
                            <label
                              key={obj.id}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                fontSize: "0.8125rem",
                                padding: "0.25rem 0.5rem",
                                border: "1px solid var(--border-subtle)",
                                borderRadius: "var(--radius-sm)",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedObjectiveIds((prev) => [...prev, obj.id]);
                                  } else {
                                    setSelectedObjectiveIds((prev) => prev.filter((id) => id !== obj.id));
                                  }
                                }}
                              />
                              {obj.code}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={createLessonMutation.isPending}
                    data-testid="add-lesson-btn"
                  >
                    + Add Lesson Mapped to Objectives
                  </Button>
                </form>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {(lessonsQuery.data ?? []).map((lesson) => (
                    <div
                      key={lesson.id}
                      style={{
                        padding: "0.75rem",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong style={{ fontSize: "0.875rem" }}>
                          #{lesson.sequence_order}. {lesson.title}
                        </strong>
                        <Badge variant="neutral">{lesson.estimated_minutes} min</Badge>
                      </div>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                        {lesson.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* SUBTAB 2: APPROVED RAG MATERIALS */}
          {activeSubtab === "materials" && (
            <Card
              title="Approved Course Materials & Vector Ingestion Pipeline"
              subtitle="Upload TXT, Markdown, PDF, or DOCX files. Documents are validated, SHA-256 deduplicated, chunked with section/page metadata, and indexed in PostgreSQL pgvector."
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (uploadFile) {
                    uploadDocumentMutation.mutate(uploadFile);
                  }
                }}
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-end",
                  padding: "1rem",
                  backgroundColor: "var(--bg-muted)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor="rag-doc-upload"
                    style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.35rem" }}
                  >
                    Select Approved Course Document (.txt, .md, .pdf, .docx)
                  </label>
                  <input
                    id="rag-doc-upload"
                    type="file"
                    accept=".txt,.md,.pdf,.docx"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    data-testid="document-file-input"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!uploadFile}
                  isLoading={uploadDocumentMutation.isPending}
                  data-testid="upload-document-btn"
                >
                  Upload & Index for AI Grounding
                </Button>
              </form>

              {(documentsQuery.data ?? []).length === 0 ? (
                <EmptyState
                  title="No course documents uploaded yet"
                  description="Upload a course syllabus, textbook chapter, or lecture guide to enable cited AI Tutor responses and grounded practice generation."
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {(documentsQuery.data ?? []).map((doc: DocumentResponse) => (
                    <div
                      key={doc.id}
                      style={{
                        padding: "0.875rem",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <strong>{doc.original_filename}</strong>
                          <Badge variant={doc.processing_status === "ready" ? "success" : "warning"}>
                            {doc.processing_status.toUpperCase()}
                          </Badge>
                          <Badge variant="info">{doc.chunk_count} chunks indexed</Badge>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                          MIME: {doc.mime_type} | Size: {doc.file_size_bytes} bytes | SHA-256:{" "}
                          <code>{doc.checksum_sha256.slice(0, 16)}...</code>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        isLoading={reprocessDocumentMutation.isPending}
                        onClick={() => reprocessDocumentMutation.mutate(doc.id)}
                      >
                        Re-Chunk & Re-Embed
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* SUBTAB 3: ASSESSMENTS & GRADING */}
          {activeSubtab === "assessments" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <Card
                title="Author Objective-Mapped Assessment"
                subtitle="Create deterministic quizzes, diagnostics, or exams that feed the Learning Intelligence Engine"
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createAssessmentMutation.mutate();
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
                >
                  <Input
                    label="Assessment Title"
                    value={assessmentTitle}
                    onChange={(e) => setAssessmentTitle(e.target.value)}
                    required
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <Select
                      label="Assessment Type"
                      value={assessmentType}
                      onChange={(e) =>
                        setAssessmentType(e.target.value as "quiz" | "diagnostic" | "practice" | "exam")
                      }
                      options={[
                        { value: "quiz", label: "Quiz" },
                        { value: "diagnostic", label: "Diagnostic Baseline" },
                        { value: "practice", label: "Remediation Practice" },
                        { value: "exam", label: "Summative Exam (Blocks AI Direct Answers)" },
                      ]}
                    />
                    <Input
                      label="Passing Score (%)"
                      type="number"
                      min={1}
                      max={100}
                      value={passingScore}
                      onChange={(e) => setPassingScore(Number(e.target.value))}
                    />
                  </div>
                  <Select
                    label="Target Learning Objective for Question #1"
                    value={questionObjectiveId || objectivesQuery.data?.[0]?.id || ""}
                    onChange={(e) => setQuestionObjectiveId(e.target.value)}
                    options={(objectivesQuery.data ?? []).map((o) => ({
                      value: o.id,
                      label: `${o.code} — ${o.title}`,
                    }))}
                  />
                  <Textarea
                    label="Question Prompt"
                    rows={2}
                    value={questionPrompt}
                    onChange={(e) => setQuestionPrompt(e.target.value)}
                    required
                  />
                  <Input
                    label="Option A (Correct Answer)"
                    value={optionAText}
                    onChange={(e) => setOptionAText(e.target.value)}
                    required
                  />
                  <Input
                    label="Option B (Distractor)"
                    value={optionBText}
                    onChange={(e) => setOptionBText(e.target.value)}
                    required
                  />
                  <Input
                    label="Option C (Distractor)"
                    value={optionCText}
                    onChange={(e) => setOptionCText(e.target.value)}
                    required
                  />
                  <Input
                    label="Post-Grading Explanation"
                    value={questionExplanation}
                    onChange={(e) => setQuestionExplanation(e.target.value)}
                  />
                  <Button
                    type="submit"
                    isLoading={createAssessmentMutation.isPending}
                    data-testid="create-assessment-btn"
                  >
                    + Create Assessment
                  </Button>
                </form>
              </Card>

              <Card
                title="Course Assessments"
                subtitle="Publish assessments so learners can submit attempts and compute mastery"
              >
                {(assessmentsQuery.data ?? []).length === 0 ? (
                  <EmptyState
                    title="No assessments created yet"
                    description="Author an assessment on the left to evaluate learner mastery of course objectives."
                  />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {(assessmentsQuery.data ?? []).map((asm: AssessmentResponse) => (
                      <div
                        key={asm.id}
                        style={{
                          padding: "0.875rem",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong>{asm.title}</strong>
                            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.25rem" }}>
                              <Badge variant={asm.status === "published" ? "success" : "warning"}>
                                {asm.status.toUpperCase()} (v{asm.current_version_number})
                              </Badge>
                              <Badge variant="info">{asm.assessment_type}</Badge>
                              <Badge variant="neutral">Pass: {asm.passing_score_percent}%</Badge>
                            </div>
                          </div>
                          {asm.status !== "published" && (
                            <Button
                              size="sm"
                              variant="primary"
                              isLoading={publishAssessmentMutation.isPending}
                              onClick={() => publishAssessmentMutation.mutate(asm.id)}
                              data-testid={`publish-assessment-${asm.id}`}
                            >
                              Publish Assessment
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* SUBTAB 4: AI PRACTICE GENERATOR */}
          {activeSubtab === "practice_ai" && (
            <Card
              title="Course-Grounded AI Practice Question Generator"
              subtitle="Generate structured practice questions with citations to approved course chunks. Instructors review and approve drafts before publishing."
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  generatePracticeMutation.mutate();
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr auto",
                  gap: "0.75rem",
                  alignItems: "flex-end",
                  padding: "1rem",
                  backgroundColor: "var(--bg-muted)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "1.25rem",
                }}
              >
                <Select
                  label="Target Learning Objective"
                  value={practiceObjectiveId || objectivesQuery.data?.[0]?.id || ""}
                  onChange={(e) => setPracticeObjectiveId(e.target.value)}
                  options={(objectivesQuery.data ?? []).map((o) => ({
                    value: o.id,
                    label: `${o.code} — ${o.title}`,
                  }))}
                />
                <Input
                  label="Question Count (1-5)"
                  type="number"
                  min={1}
                  max={5}
                  value={practiceCount}
                  onChange={(e) => setPracticeCount(Number(e.target.value))}
                />
                <Input
                  label="Difficulty (1-5)"
                  type="number"
                  min={1}
                  max={5}
                  value={practiceDifficulty}
                  onChange={(e) => setPracticeDifficulty(Number(e.target.value))}
                />
                <Button
                  type="submit"
                  isLoading={generatePracticeMutation.isPending}
                  data-testid="generate-practice-btn"
                >
                  Generate Grounded Drafts
                </Button>
              </form>

              {(practiceDraftsQuery.data ?? []).length === 0 ? (
                <EmptyState
                  title="No AI practice question drafts yet"
                  description="Upload course materials and click 'Generate Grounded Drafts' to synthesize practice questions."
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {(practiceDraftsQuery.data ?? []).map((draft: PracticeDraftResponse) => (
                    <div
                      key={draft.id}
                      style={{
                        padding: "1rem",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <Badge
                              variant={
                                draft.review_status === "approved"
                                  ? "success"
                                  : draft.review_status === "rejected"
                                  ? "danger"
                                  : "warning"
                              }
                            >
                              {draft.review_status.toUpperCase()}
                            </Badge>
                            <Badge variant="neutral">Difficulty L{draft.difficulty_level}</Badge>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              Grounded in {draft.source_chunk_ids.length} source chunk(s)
                            </span>
                          </div>
                          <p style={{ fontWeight: 600, margin: "0.5rem 0" }}>{draft.prompt}</p>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={draft.review_status === "approved"}
                            onClick={() => reviewDraftMutation.mutate({ draftId: draft.id, action: "approve" })}
                            data-testid={`approve-draft-${draft.id}`}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={draft.review_status === "rejected"}
                            onClick={() => reviewDraftMutation.mutate({ draftId: draft.id, action: "reject" })}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                      <ul style={{ margin: "0.5rem 0", paddingLeft: "1.25rem", fontSize: "0.875rem" }}>
                        {draft.options.map((opt) => (
                          <li
                            key={opt.label}
                            style={{
                              fontWeight: opt.label === draft.correct_option_label ? 700 : 400,
                              color:
                                opt.label === draft.correct_option_label
                                  ? "var(--color-success)"
                                  : "var(--text-primary)",
                            }}
                          >
                            [{opt.label}] {opt.option_text}{" "}
                            {opt.label === draft.correct_option_label ? "(Correct)" : ""}
                          </li>
                        ))}
                      </ul>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                        <strong>Rationale:</strong> {draft.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* SUBTAB 5: COHORT MASTERY & EVIDENCE ANALYTICS */}
          {activeSubtab === "analytics" && (
            <Card
              title="Instructor Cohort Analytics & Objective Mastery Evidence"
              subtitle="Real-time aggregation of enrolled learners, assessment attempts, and objective-level mastery breakdowns"
            >
              {courseAnalyticsQuery.isLoading ? (
                <p>Loading persisted course analytics...</p>
              ) : courseAnalyticsQuery.data ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                    <div
                      style={{
                        padding: "1rem",
                        backgroundColor: "var(--bg-muted)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Active Enrollments</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                        {courseAnalyticsQuery.data.active_enrollment_count}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "1rem",
                        backgroundColor: "var(--bg-muted)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Graded Attempts</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                        {courseAnalyticsQuery.data.graded_attempt_count}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "1rem",
                        backgroundColor: "var(--bg-muted)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Average Assessment Score</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                        {courseAnalyticsQuery.data.average_assessment_score_percent.toFixed(1)}%
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "1rem",
                        backgroundColor: "var(--bg-muted)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tracked Objectives</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                        {courseAnalyticsQuery.data.objective_breakdown.length}
                      </div>
                    </div>
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-subtle)", textAlign: "left" }}>
                        <th style={{ padding: "0.65rem" }}>Objective</th>
                        <th style={{ padding: "0.65rem" }}>Avg Score</th>
                        <th style={{ padding: "0.65rem" }}>Avg Confidence</th>
                        <th style={{ padding: "0.65rem" }}>Learners Evaluated</th>
                        <th style={{ padding: "0.65rem" }}>At-Risk Count</th>
                        <th style={{ padding: "0.65rem" }}>Proficient / Mastered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseAnalyticsQuery.data.objective_breakdown.map((row) => (
                        <tr key={row.objective_id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td style={{ padding: "0.65rem" }}>
                            <strong>{row.objective_code}</strong> — {row.objective_title}
                          </td>
                          <td style={{ padding: "0.65rem" }}>{row.average_score_percent.toFixed(1)}%</td>
                          <td style={{ padding: "0.65rem" }}>{(row.average_confidence * 100).toFixed(0)}%</td>
                          <td style={{ padding: "0.65rem" }}>{row.learner_count}</td>
                          <td style={{ padding: "0.65rem" }}>
                            <Badge variant={row.at_risk_count > 0 ? "danger" : "neutral"}>
                              {row.at_risk_count} at risk
                            </Badge>
                          </td>
                          <td style={{ padding: "0.65rem" }}>
                            <Badge variant="success">{row.mastered_count} proficient+</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </Card>
          )}
        </>
      )}
    </div>
  );
};
