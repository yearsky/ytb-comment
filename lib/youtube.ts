export async function fetchChannelVideos(channelId: string) {
  const response = await fetch(
    `/api/youtube/videos?channelId=${encodeURIComponent(channelId)}`
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch videos');
  }
  const data = await response.json();
  return data.videos;
}

export async function fetchComments(videoId: string) {
  const response = await fetch(`/api/youtube/comments?videoId=${videoId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }
  const data = await response.json();
  return data.comments;
}

export async function analyzeSingleComment(comment: string) {
  const response = await fetch('/api/youtube/comments/analyze-single-comment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ comment })
  });
  if (!response.ok) {
    throw new Error('Failed to process comment');
  }
  const data = await response.json();
  const predictionText = data.prediction[0];
  const probabilityMatch = predictionText.match(/Probability of being judol: ([\d.]+)/);
  const processingTimeMatch = predictionText.match(/Processing time: ([\d.]+) seconds/);
  const riskLevelMatch = predictionText.match(/Judol Risk Level: (HIGH|MEDIUM|LOW)/);
  return {
    probability: probabilityMatch ? parseFloat(probabilityMatch[1]) : 0,
    riskLevel: riskLevelMatch ? riskLevelMatch[1] : 'LOW',
    processingTime: processingTimeMatch ? parseFloat(processingTimeMatch[1]) : 0
  };
}

export async function deleteYoutubeComment(commentId: string) {
  const response = await fetch('/api/youtube/comments', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ commentId })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete comment');
  }
  return true;
} 