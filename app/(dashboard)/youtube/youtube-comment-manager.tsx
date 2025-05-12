'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

// Import Gradio client properly
// Make sure you've installed @gradio/client package: npm install @gradio/client
import { Client } from '@gradio/client';

interface Comment {
  id: string;
  author: string;
  text: string;
  videoId: string;
  publishedAt: string;
  isSpam?: boolean;
  spamScore?: number;
  riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  processingTime?: number;
}

interface Video {
  id: string;
  title: string;
  publishedAt: string;
  commentCount: number;
  spamProbability: number;
  spamComments: Comment[];
  isAnalyzed?: boolean;
  isAnalyzing?: boolean;
}

export function YoutubeCommentManager() {
  const [isMounted, setIsMounted] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [channelId, setChannelId] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('judol');
  const [activeTab, setActiveTab] = useState('videos');
  const [useAI, setUseAI] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  // Add error state for better error handling
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchChannelIdAndVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const channelResponse = await fetch('/api/youtube/channel');
        if (!channelResponse.ok) {
          const errorData = await channelResponse.json();
          alert(
            errorData.error === 'No YouTube channel found for this account'
              ? 'No YouTube channel is associated with your Google account. Please create a channel first.'
              : `Error: ${errorData.error || 'Failed to fetch channel ID'}`
          );
          setLoading(false);
          return;
        }
        const channelData = await channelResponse.json();
        const newChannelId = channelData.channelId;
        setChannelId(newChannelId);

        const videosResponse = await fetch(
          `/api/youtube/videos?channelId=${encodeURIComponent(newChannelId)}`
        );
        if (!videosResponse.ok) {
          const errorData = await videosResponse.json();
          alert(`Error: ${errorData.error || 'Failed to fetch videos'}`);
          setLoading(false);
          return;
        }

        const videosData = await videosResponse.json();
        const initialVideos = videosData.videos.map((video: any) => ({
          ...video,
          commentCount: 0,
          spamProbability: 0,
          spamComments: [],
          isAnalyzed: false
        }));

        setVideos(initialVideos);
      } catch (error) {
        console.error('Error fetching channel ID or videos:', error);
        setError('Failed to fetch channel ID or videos. Please try again.');
        alert('Failed to fetch channel ID or videos. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchChannelIdAndVideos();
  }, [isMounted]);

  const fetchChannelVideos = async () => {
    if (!channelId) {
      alert('No channel ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/youtube/videos?channelId=${encodeURIComponent(channelId)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to fetch videos'}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const initialVideos = data.videos.map((video: any) => ({
        ...video,
        commentCount: 0,
        spamProbability: 0,
        spamComments: [],
        isAnalyzed: false
      }));

      setVideos(initialVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Failed to fetch videos. Please try again.');
      alert('Failed to fetch videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeVideoComments = async (videoId: string) => {
    // Mark this video as currently analyzing
    setVideos((prevVideos) =>
      prevVideos.map((v) =>
        v.id === videoId ? { ...v, isAnalyzing: true } : v
      )
    );
    setError(null);

    try {
      // Fetch comments for this video
      const commentsResponse = await fetch(
        `/api/youtube/comments?videoId=${videoId}`
      );
      if (!commentsResponse.ok) {
        throw new Error('Failed to fetch comments');
      }

      const commentsData = await commentsResponse.json();
      const videoComments = commentsData.comments;

      let spamComments: Comment[] = [];

      if (useAI && videoComments.length > 0) {
        try {
          console.log('Sending comments for AI processing...');

          // Process comments one by one
          const predictions = await Promise.all(
            videoComments.map(async (comment: Comment) => {
              const response = await fetch('/api/youtube/comments/analyze-single-comment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comment: comment.text })
              });

              if (!response.ok) {
                throw new Error('Failed to process comment');
              }

              const data = await response.json();
              const predictionText = data.prediction[0]; // Ambil string pertama dari array
              
              // Ekstrak informasi dari string respons
              const probabilityMatch = predictionText.match(/Probability of being judol: ([\d.]+)/);
              const processingTimeMatch = predictionText.match(/Processing time: ([\d.]+) seconds/);
              const riskLevelMatch = predictionText.match(/Judol Risk Level: (HIGH|MEDIUM|LOW)/);

              return {
                probability: probabilityMatch ? parseFloat(probabilityMatch[1]) : 0,
                riskLevel: riskLevelMatch ? riskLevelMatch[1] : 'LOW',
                processingTime: processingTimeMatch ? parseFloat(processingTimeMatch[1]) : 0
              };
            })
          );

          console.log('Received AI predictions:', predictions);

          // Map predictions to comments
          spamComments = videoComments.filter(
            (comment: Comment, index: number) => {
              const prediction = predictions[index];
              if (!prediction) return false;

              comment.spamScore = prediction.probability;
              comment.riskLevel = prediction.riskLevel;
              comment.processingTime = prediction.processingTime;
              
              // Komentar dianggap spam jika probabilitas > 0.5 dan risk level HIGH atau MEDIUM
              comment.isSpam = prediction.probability > 0.5 && 
                             (prediction.riskLevel === 'HIGH' || prediction.riskLevel === 'MEDIUM');
              
              return comment.isSpam || comment.text.toLowerCase().includes(keyword.toLowerCase());
            }
          );
        } catch (aiError) {
          console.error('AI processing error:', aiError);
          setError(
            `AI processing error: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`
          );
          // Fallback to keyword filtering if AI fails
          console.log('Falling back to keyword filtering');
          spamComments = videoComments.filter((comment: Comment) =>
            comment.text.toLowerCase().includes(keyword.toLowerCase())
          );
        }
      } else {
        // Use only keyword filtering
        spamComments = videoComments.filter((comment: Comment) =>
          comment.text.toLowerCase().includes(keyword.toLowerCase())
        );
      }

      // Calculate spam probability
      const spamProbability =
        videoComments.length > 0
          ? (spamComments.length / videoComments.length) * 100
          : 0;

      // Update video with analysis results
      setVideos((prevVideos) =>
        prevVideos.map((v) =>
          v.id === videoId
            ? {
                ...v,
                commentCount: videoComments.length,
                spamComments,
                spamProbability,
                isAnalyzed: true,
                isAnalyzing: false
              }
            : v
        )
      );

      return spamComments;
    } catch (error) {
      console.error(`Error analyzing video ${videoId}:`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(`Error analyzing video: ${errorMessage}`);

      // Update video to show analysis failed
      setVideos((prevVideos) =>
        prevVideos.map((v) =>
          v.id === videoId ? { ...v, isAnalyzing: false } : v
        )
      );

      return [];
    }
  };

  const analyzeAllVideos = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      for (const video of videos) {
        if (!video.isAnalyzed) {
          await analyzeVideoComments(video.id);
        }
      }
    } catch (error) {
      console.error('Error analyzing videos:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(`Error analyzing videos: ${errorMessage}`);
      alert('Some videos could not be analyzed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const response = await fetch('/api/youtube/comments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commentId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to delete comment'}`);
        return;
      }

      setComments(comments.filter((comment) => comment.id !== commentId));
      setVideos(
        videos.map((video) => {
          const updatedSpamComments =
            video.spamComments?.filter((comment) => comment.id !== commentId) ||
            [];
          return {
            ...video,
            spamComments: updatedSpamComments,
            spamProbability:
              video.commentCount > 0
                ? (updatedSpamComments.length / video.commentCount) * 100
                : 0
          };
        })
      );

      alert(`Comment deleted successfully!`);
    } catch (error) {
      console.error('Error deleting comment:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(`Error deleting comment: ${errorMessage}`);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const handleCommentSelect = (newComments: Comment[]) => {
    setComments(newComments);
    setActiveTab('spam');
  };

  // Don't render anything on the server-side
  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-md font-medium">Your YouTube Channel</h3>
        <p className="text-sm text-muted-foreground">
          {channelId ? `Channel ID: ${channelId}` : 'Fetching channel ID...'}
        </p>
        <div className="flex items-center gap-4">
          <Button onClick={fetchChannelVideos} disabled={loading || !channelId}>
            {loading ? 'Loading...' : 'Refresh Videos'}
          </Button>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="useAI"
              checked={useAI}
              onCheckedChange={(checked) => setUseAI(checked === true)}
            />
            <label
              htmlFor="useAI"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Use AI detection
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-md font-medium">Filter Spam Keywords</h3>
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter keywords to filter (e.g., judol)"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="videos">Video Analytics</TabsTrigger>
          <TabsTrigger value="spam">Potential Spam</TabsTrigger>
        </TabsList>
        <TabsContent value="videos">
          <div className="mb-4">
            <Button
              onClick={analyzeAllVideos}
              disabled={analyzing || videos.length === 0}
              className="mb-4"
            >
              {analyzing ? 'Analyzing All Videos...' : 'Analyze All Videos'}
            </Button>
          </div>
          <VideoTable
            videos={videos}
            onCommentSelect={handleCommentSelect}
            onAnalyze={analyzeVideoComments}
          />
        </TabsContent>
        <TabsContent value="spam">
          <CommentTable comments={comments} onDelete={deleteComment} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VideoTable({
  videos,
  onCommentSelect,
  onAnalyze
}: {
  videos: Video[];
  onCommentSelect: (comments: Comment[]) => void;
  onAnalyze: (videoId: string) => Promise<Comment[]>;
}) {
  // Client-side date formatting function
  const formatDate = (dateString: string) => {
    if (typeof window === 'undefined') return ''; // Return empty string during SSR
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Published</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead>Spam Probability</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No videos found
              </TableCell>
            </TableRow>
          ) : (
            videos.map((video) => (
              <TableRow key={video.id}>
                <TableCell className="font-medium">{video.title}</TableCell>
                <TableCell>{formatDate(video.publishedAt)}</TableCell>
                <TableCell>{video.commentCount || '—'}</TableCell>
                <TableCell>
                  {video.isAnalyzed ? (
                    <div className="flex items-center gap-2">
                      <Progress
                        value={video.spamProbability}
                        className="w-[100px]"
                      />
                      <span>{video.spamProbability.toFixed(1)}%</span>
                    </div>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  {video.isAnalyzing ? (
                    <Badge variant="outline" className="bg-yellow-100">
                      Analyzing...
                    </Badge>
                  ) : video.isAnalyzed ? (
                    <Badge variant="outline" className="bg-green-100">
                      Analyzed
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Analyzed</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onAnalyze(video.id).then((spamComments) => {
                          if (spamComments.length > 0) {
                            onCommentSelect(spamComments);
                          }
                        })
                      }
                      disabled={video.isAnalyzing}
                    >
                      {video.isAnalyzing
                        ? 'Analyzing...'
                        : video.isAnalyzed
                          ? 'Re-analyze'
                          : 'Analyze'}
                    </Button>
                    {video.isAnalyzed && video.spamComments.length > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          onCommentSelect(video.spamComments || [])
                        }
                      >
                        View Spam ({video.spamComments.length})
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function CommentTable({
  comments,
  onDelete
}: {
  comments: Comment[];
  onDelete: (id: string) => void;
}) {
  // Client-side date formatting function
  const formatDate = (dateString: string) => {
    if (typeof window === 'undefined') return ''; // Return empty string during SSR
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Author</TableHead>
            <TableHead className="w-[45%]">Comment</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Risk Level</TableHead>
            <TableHead>Spam Score</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No comments found
              </TableCell>
            </TableRow>
          ) : (
            comments.map((comment) => (
              <TableRow key={comment.id}>
                <TableCell className="font-medium">{comment.author}</TableCell>
                <TableCell>{comment.text}</TableCell>
                <TableCell>{formatDate(comment.publishedAt)}</TableCell>
                <TableCell>
                  {comment.riskLevel ? (
                    <Badge 
                      variant="outline" 
                      className={`${
                        comment.riskLevel === 'HIGH' 
                          ? 'bg-red-100 text-red-700' 
                          : comment.riskLevel === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {comment.riskLevel}
                    </Badge>
                  ) : (
                    'Keyword match'
                  )}
                </TableCell>
                <TableCell>
                  {comment.spamScore !== undefined ? (
                    <div className="flex items-center gap-2">
                      <Progress
                        value={comment.spamScore * 100}
                        className={`w-[60px] ${
                          comment.spamScore > 0.7 
                            ? 'bg-red-500' 
                            : comment.spamScore > 0.4 
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                      />
                      <span>{(comment.spamScore * 100).toFixed(0)}%</span>
                    </div>
                  ) : (
                    'Keyword match'
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(comment.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
