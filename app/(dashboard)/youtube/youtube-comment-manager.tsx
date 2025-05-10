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

interface Comment {
  id: string;
  author: string;
  text: string;
  videoId: string;
  publishedAt: string;
}

interface Video {
  id: string;
  title: string;
  publishedAt: string;
  commentCount: number;
  spamProbability: number;
  spamComments: Comment[];
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchChannelIdAndVideos = async () => {
      setLoading(true);
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

        const videosResponse = await fetch(`/api/youtube/videos?channelId=${encodeURIComponent(newChannelId)}`);
        if (!videosResponse.ok) {
          const errorData = await videosResponse.json();
          alert(`Error: ${errorData.error || 'Failed to fetch videos'}`);
          setLoading(false);
          return;
        }

        const videosData = await videosResponse.json();

        const videosWithAnalytics = await Promise.all(videosData.videos.map(async (video: any) => {
          const commentsResponse = await fetch(`/api/youtube/comments?videoId=${video.id}`);
          const commentsData = await commentsResponse.json();

          const spamComments = commentsData.comments.filter((comment: Comment) =>
            comment.text.toLowerCase().includes(keyword.toLowerCase())
          );

          const spamProbability = commentsData.comments.length > 0
            ? (spamComments.length / commentsData.comments.length) * 100
            : 0;

          return {
            ...video,
            commentCount: commentsData.comments.length,
            spamProbability,
            spamComments
          };
        }));

        setVideos(videosWithAnalytics);
      } catch (error) {
        console.error('Error fetching channel ID or videos:', error);
        alert('Failed to fetch channel ID or videos. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchChannelIdAndVideos();
  }, [isMounted, keyword]);

  const fetchChannelVideos = async () => {
    if (!channelId) {
      alert('No channel ID available');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/youtube/videos?channelId=${encodeURIComponent(channelId)}`);
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to fetch videos'}`);
        setLoading(false);
        return;
      }

      const data = await response.json();

      const videosWithAnalytics = await Promise.all(data.videos.map(async (video: any) => {
        const commentsResponse = await fetch(`/api/youtube/comments?videoId=${video.id}`);
        const commentsData = await commentsResponse.json();

        const spamComments = commentsData.comments.filter((comment: Comment) =>
          comment.text.toLowerCase().includes(keyword.toLowerCase())
        );

        const spamProbability = commentsData.comments.length > 0
          ? (spamComments.length / commentsData.comments.length) * 100
          : 0;

        return {
          ...video,
          commentCount: commentsData.comments.length,
          spamProbability,
          spamComments
        };
      }));

      setVideos(videosWithAnalytics);
    } catch (error) {
      console.error('Error fetching videos:', error);
      alert('Failed to fetch videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const response = await fetch('/api/youtube/comments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to delete comment'}`);
        return;
      }

      setComments(comments.filter(comment => comment.id !== commentId));
      setVideos(videos.map(video => {
        const updatedSpamComments = video.spamComments?.filter(comment => comment.id !== commentId) || [];
        return {
          ...video,
          spamComments: updatedSpamComments,
          spamProbability: video.commentCount > 0
            ? (updatedSpamComments.length / video.commentCount) * 100
            : 0
        };
      }));

      alert(`Comment deleted successfully!`);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const filterSpamComments = (comments: Comment[]) => {
    return comments.filter(comment =>
      comment.text.toLowerCase().includes(keyword.toLowerCase())
    );
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
        <Button onClick={fetchChannelVideos} disabled={loading || !channelId}>
          {loading ? 'Loading...' : 'Refresh Videos'}
        </Button>
      </div>

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
          <VideoTable videos={videos} onCommentSelect={handleCommentSelect} />
        </TabsContent>
        <TabsContent value="spam">
          <CommentTable
            comments={filterSpamComments(comments)}
            onDelete={deleteComment}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VideoTable({
  videos,
  onCommentSelect
}: {
  videos: Video[];
  onCommentSelect: (comments: Comment[]) => void;
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
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                No videos found
              </TableCell>
            </TableRow>
          ) : (
            videos.map((video) => (
              <TableRow key={video.id}>
                <TableCell className="font-medium">{video.title}</TableCell>
                <TableCell>
                  {formatDate(video.publishedAt)}
                </TableCell>
                <TableCell>{video.commentCount}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={video.spamProbability} className="w-[100px]" />
                    <span>{video.spamProbability.toFixed(1)}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCommentSelect(video.spamComments || [])}
                  >
                    View Spam
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
            <TableHead className="w-[50%]">Comment</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4">
                No comments found
              </TableCell>
            </TableRow>
          ) : (
            comments.map((comment) => (
              <TableRow key={comment.id}>
                <TableCell className="font-medium">{comment.author}</TableCell>
                <TableCell>{comment.text}</TableCell>
                <TableCell>
                  {formatDate(comment.publishedAt)}
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