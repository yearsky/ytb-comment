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
  const [videoUrl, setVideoUrl] = useState('');
  const [channelId, setChannelId] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('judol');
  const [activeTab, setActiveTab] = useState('videos'); // Tambah state untuk tab aktif

  // Ambil Channel ID otomatis saat komponen dimuat
  useEffect(() => {
    const fetchChannelId = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/youtube/channel');
        if (!response.ok) {
          const errorData = await response.json();
          alert(
            errorData.error === 'No YouTube channel found for this account'
              ? 'No YouTube channel is associated with your Google account. Please create a channel first.'
              : `Error: ${errorData.error || 'Failed to fetch channel ID'}`
          );
          setLoading(false);
          return;
        }
        const data = await response.json();
        setChannelId(data.channelId);
      } catch (error) {
        console.error('Error fetching channel ID:', error);
        alert('Failed to fetch channel ID. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChannelId();
  }, []);

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
      
      // Calculate spam probability for each video
      const videosWithAnalytics = await Promise.all(data.videos.map(async (video: any) => {
        const commentsResponse = await fetch(`/api/youtube/comments?videoId=${video.id}`);
        const commentsData = await commentsResponse.json();
        
        const spamComments = commentsData.comments.filter((comment: Comment) => 
          comment.text.toLowerCase().includes(keyword.toLowerCase())
        );
        
        const spamProbability = commentsData.comments.length > 0 
          ? (spamComments.length / commentsData.comments.length) * 100 
          : 0;
        
        console.log(`Video ${video.id}:`, { spamComments, commentCount: commentsData.comments.length });
        
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
      // Update video spam probability
      setVideos(videos.map(video => ({
        ...video,
        spamComments: video.spamComments?.filter(comment => comment.id !== commentId) || [],
        spamProbability: video.spamComments?.length > 0 
          ? ((video.spamComments.length - 1) / video.commentCount) * 100 
          : 0
      })));
      
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
    console.log('Updating comments:', newComments);
    setComments(newComments);
    setActiveTab('spam'); // Pindah ke tab Potential Spam
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-md font-medium">Your YouTube Channel</h3>
        <p className="text-sm text-muted-foreground">
          {channelId ? `Channel ID: ${channelId}` : 'Fetching channel ID...'}
        </p>
        <Button onClick={fetchChannelVideos} disabled={loading || !channelId}>
          {loading ? 'Loading...' : 'Fetch Videos'}
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
          {/* <TabsTrigger value="all">All Comments</TabsTrigger> */}
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
        {/* <TabsContent value="all">
          <CommentTable
            comments={comments}
            onDelete={deleteComment}
          />
        </TabsContent> */}
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
                  {new Date(video.publishedAt).toLocaleDateString()}
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
                    onClick={() => {
                      console.log('View Spam clicked, comments:', video.spamComments);
                      onCommentSelect(video.spamComments || []);
                    }}
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
                  {new Date(comment.publishedAt).toLocaleDateString()}
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