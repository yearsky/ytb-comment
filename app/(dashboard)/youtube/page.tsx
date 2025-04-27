import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { YoutubeCommentManager } from './youtube-comment-manager';
import { auth } from '@/lib/auth';

export default async function YoutubePage() {
  // Get the user session
  const session = await auth();
  
  // If user is not authenticated, redirect to login page
  if (!session || !session.user) {
    redirect('/login');
  }
  
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