import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
  } from '@/components/ui/card';
  import { YoutubeCommentManager } from './youtube-comment-manager';
  
  export default function YoutubePage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>YouTube Comments Manager</CardTitle>
          <CardDescription>Manage and delete unwanted comments from your YouTube videos.</CardDescription>
        </CardHeader>
        <CardContent>
          <YoutubeCommentManager />
        </CardContent>
      </Card>
    );
  }