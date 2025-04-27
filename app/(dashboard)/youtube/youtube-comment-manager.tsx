'use client';

import { useState } from 'react';
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

// Mock data - this would be replaced with actual API calls
const MOCK_COMMENTS = [
  {
    id: '1',
    author: 'User1',
    text: 'This seems like spam comment',
    videoId: 'abc123',
    publishedAt: '2023-01-01T12:00:00Z'
  },
  {
    id: '2',
    author: 'Suspicious User',
    text: 'Click here to win free stuff judol',
    videoId: 'abc123',
    publishedAt: '2023-01-02T14:30:00Z'
  },
  {
    id: '3',
    author: 'Another User',
    text: 'Great video content!',
    videoId: 'abc123',
    publishedAt: '2023-01-03T09:15:00Z'
  }
];

export function YoutubeCommentManager() {
  const [videoUrl, setVideoUrl] = useState('');
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('judol');

  const fetchComments = async () => {
    // Extract video ID from URL
    // This is a simplified example - you'd need proper regex for YouTube URLs
    const videoId = videoUrl.split('v=')[1]?.split('&')[0];
    
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }
    
    setLoading(true);
    
    // In a real implementation, you would fetch comments from the YouTube API
    // using the session token for authentication
    
    // Simulate API call with timeout
    setTimeout(() => {
      setLoading(false);
      // Using mock data for now
      setComments(MOCK_COMMENTS);
    }, 1000);
  };

  const deleteComment = async (commentId: string) => {
    // In a real implementation, you would call the YouTube API to delete the comment
    setComments(comments.filter(comment => comment.id !== commentId));
    
    // Show success message or handle errors
    alert(`Comment ${commentId} deleted successfully!`);
  };

  const filterSpamComments = () => {
    // This would be more sophisticated in a real implementation
    return comments.filter(comment => 
      comment.text.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-md font-medium">Enter YouTube Video URL</h3>
        <div className="flex gap-2">
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1"
          />
          <Button onClick={fetchComments} disabled={loading}>
            {loading ? 'Loading...' : 'Fetch Comments'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-md font-medium">Filter Spam Keywords</h3>
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter keywords to filter (e.g., judol)"
        />
      </div>

      <Tabs defaultValue="spam">
        <TabsList>
          <TabsTrigger value="spam">Potential Spam</TabsTrigger>
          <TabsTrigger value="all">All Comments</TabsTrigger>
        </TabsList>
        <TabsContent value="spam">
          <CommentTable
            comments={filterSpamComments()}
            onDelete={deleteComment}
          />
        </TabsContent>
        <TabsContent value="all">
          <CommentTable
            comments={comments}
            onDelete={deleteComment}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CommentTable({ 
  comments, 
  onDelete 
}: { 
  comments: any[];
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