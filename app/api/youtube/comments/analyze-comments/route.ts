// app/api/youtube/comments/analyze-comments/route.ts
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
    const { comments } = await request.json();

    if (!comments || !Array.isArray(comments)) {
      return NextResponse.json({ error: 'Invalid comments data' }, { status: 400 });
    }

    console.log('API received comments:', comments.length);

    // Create CSV content
    const csvContent = 'text\n' + comments.map(comment => `"${comment.replace(/"/g, '""')}"`).join('\n');
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    console.log("csv blob",csvBlob)
    console.log('Connecting to Gradio client...');
    const client = await connectWithRetry('yekaii/ytb-comment-judol-indonesia');

    console.log('Connected. Sending comments for processing...');
    const result = await Promise.race([
      client.predict('/process_file_input', {
        file: csvBlob
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Prediction timeout')), TIMEOUT_MS)
      )
    ]) as { data: string | number[] };

    console.log('Received prediction response');
    const predictions = result.data;

    let predictionArray: number[] = [];
    if (typeof predictions === 'string') {
      predictionArray = predictions
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((score) => parseFloat(score));
    } else if (Array.isArray(predictions)) {
      predictionArray = predictions.map((score) =>
        typeof score === 'string' ? parseFloat(score) : score
      );
    }

    console.log(`Processed ${predictionArray.length} predictions`);
    return NextResponse.json({ predictions: predictionArray });
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