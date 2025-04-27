import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get videoId from query parameters
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    
    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId parameter' }, { status: 400 });
    }
    
    // In a real implementation, you would use the access token from the session to call the YouTube API
    const accessToken = (session as any).accessToken;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }
    
    // Example of fetching comments from YouTube API (simplified)
    // In a real implementation, you would use the Google API client library
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData }, { status: response.status });
    }
    
    const data = await response.json();
    
    // Transform the response to a simpler format
    const comments = data.items.map((item: any) => {
      const snippet = item.snippet.topLevelComment.snippet;
      return {
        id: item.id,
        author: snippet.authorDisplayName,
        text: snippet.textDisplay,
        videoId: snippet.videoId,
        publishedAt: snippet.publishedAt
      };
    });
    
    return NextResponse.json({ comments });
    
  } catch (error) {
    console.error('Error fetching YouTube comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get comment ID from request body
    const body = await request.json();
    const { commentId } = body;
    
    if (!commentId) {
      return NextResponse.json({ error: 'Missing commentId' }, { status: 400 });
    }
    
    // In a real implementation, you would use the access token from the session
    const accessToken = (session as any).accessToken;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }
    
    // Delete comment using YouTube API
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/comments?id=${commentId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData }, { status: response.status });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting YouTube comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}