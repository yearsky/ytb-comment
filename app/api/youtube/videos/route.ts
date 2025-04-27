import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get channelId from query parameters
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    
    if (!channelId || !/^UC[a-zA-Z0-9_-]{22}$/.test(channelId)) {
      return NextResponse.json({ error: 'Invalid channelId format' }, { status: 400 });
    }
    
    const accessToken = session.accessToken;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }
    
    // Encode channelId to prevent injection
    const encodedChannelId = encodeURIComponent(channelId);
    
    // Fetch videos from YouTube API
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodedChannelId}&maxResults=50&type=video`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API error:', JSON.stringify(errorData, null, 2));
      return NextResponse.json({ error: errorData }, { status: response.status });
    }
    
    const data = await response.json();
    
    // Transform the response to a simpler format
    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      publishedAt: item.snippet.publishedAt,
    }));
    
    return NextResponse.json({ videos });
    
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}