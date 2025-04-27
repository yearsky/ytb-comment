import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const accessToken = session.accessToken;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }
    
    // Ambil Channel ID dari akun yang login menggunakan mine=true
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&mine=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API error:', JSON.stringify(errorData, null, 2));
      return NextResponse.json({ error: errorData }, { status: response.status });
    }
    
    const data = await response.json();
    const channelId = data.items?.[0]?.id;
    
    if (!channelId) {
      return NextResponse.json({ error: 'No YouTube channel found for this account' }, { status: 404 });
    }
    
    return NextResponse.json({ channelId });
    
  } catch (error) {
    console.error('Error fetching channel ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channel ID' },
      { status: 500 }
    );
  }
}