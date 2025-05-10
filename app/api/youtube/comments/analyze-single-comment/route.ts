import { Client } from '@gradio/client';
import { NextResponse } from 'next/server';

const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000; // 30 seconds

async function connectWithRetry(spaceId: string, retries = MAX_RETRIES): Promise<Client> {
  try {
    const client = await Promise.race([
      Client.connect(spaceId),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), TIMEOUT_MS)
      )
    ]) as Client;
    return client;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return connectWithRetry(spaceId, retries - 1);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { comment } = await request.json();

    if (!comment || typeof comment !== 'string') {
      return NextResponse.json({ error: 'Invalid comment data' }, { status: 400 });
    }

    console.log('Processing single comment...');
    const client = await connectWithRetry('yekaii/ytb-comment-judol-indonesia');

    console.log('Connected. Sending comment for processing...');
    const result = await Promise.race([
      client.predict('/process_single_input', {
        comment_text: comment
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Prediction timeout')), TIMEOUT_MS)
      )
    ]) as { data: number };

    console.log('Received prediction response');
    return NextResponse.json({ prediction: result.data });
  } catch (gradioError) {
    console.error('Gradio processing error:', gradioError);
    return NextResponse.json(
      {
        error: 'Gradio processing failed',
        details: gradioError instanceof Error ? gradioError.message : String(gradioError),
      },
      { status: 500 }
    );
  }
} 