export const FEEDBACK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export const feedbackWindowEndsAt = (connection) => {
  const start = connection?.contactRevealedAt || connection?.createdAt;
  if (!start) return null;
  return new Date(new Date(start).getTime() + FEEDBACK_WINDOW_MS);
};

export const isFeedbackWindowOpen = (connection, now = new Date()) => {
  const endsAt = feedbackWindowEndsAt(connection);
  return Boolean(endsAt && now <= endsAt);
};

export const toFeedbackView = (feedback) => {
  if (!feedback) return null;

  return {
    id: feedback.id,
    sentiment: feedback.sentiment,
    tags: feedback.tags,
    comment: feedback.comment,
    createdAt: feedback.createdAt,
    visibleAt: feedback.visibleAt,
  };
};

export const buildFeedbackStatus = (mine, theirs) => ({
  mine: mine ? 'submitted' : 'pending',
  theirs: theirs ? 'submitted' : 'pending',
  revealed: Boolean(mine?.visibleAt || theirs?.visibleAt),
});
