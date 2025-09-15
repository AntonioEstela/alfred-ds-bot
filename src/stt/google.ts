import dotenv from 'dotenv';
import { SpeechClient, protos } from '@google-cloud/speech';

dotenv.config();

type SpeechClientConfig = ConstructorParameters<typeof SpeechClient>[0];

export type GoogleStreamingOptions = {
  sampleRate?: number;
  languageCode?: string;
  interimResults?: boolean;
  enableAutomaticPunctuation?: boolean;
  profanityFilter?: boolean;
  singleUtterance?: boolean;
  speechContexts?: protos.google.cloud.speech.v1.ISpeechContext[];
  model?: string;
  useEnhanced?: boolean;
  clientOptions?: SpeechClientConfig;
};

type SttStream = {
  write: (buf: Buffer) => void;
  end: () => void;
  isClosed: () => boolean;
};

export function startRealTimeGoogleSTT(
  onResult: (text: string, isFinal: boolean) => void,
  {
    sampleRate = 48000,
    languageCode = 'es-ES',
    interimResults = true,
    enableAutomaticPunctuation = true,
    profanityFilter,
    singleUtterance = false,
    speechContexts,
    model,
    useEnhanced,
    clientOptions,
  }: GoogleStreamingOptions = {}
): SttStream {
  const client = new SpeechClient(clientOptions);

  let closed = false;
  let clientClosed = false;

  const closeClient = () => {
    if (clientClosed) return;
    clientClosed = true;
    void client.close().catch(() => {
      /* ignore */
    });
  };

  const recognizeStream = client.streamingRecognize({
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: sampleRate,
      languageCode,
      enableAutomaticPunctuation,
      profanityFilter,
      audioChannelCount: 1,
      speechContexts,
      model,
      useEnhanced,
    },
    interimResults,
    singleUtterance,
  });

  recognizeStream.on('data', data => {
    if (!data?.results?.length) return;
    for (const result of data.results) {
      const transcript = result.alternatives?.[0]?.transcript;
      if (!transcript) continue;
      onResult(transcript, !!result.isFinal);
    }
  });

  recognizeStream.on('error', err => {
    if (!closed) {
      closed = true;
      console.error('Google STT error:', err);
    }
    closeClient();
  });

  recognizeStream.on('close', () => {
    closed = true;
    closeClient();
  });

  recognizeStream.on('end', () => {
    closed = true;
    closeClient();
  });

  const write = (buf: Buffer) => {
    if (closed || !buf?.length) return;
    try {
      recognizeStream.write(buf);
    } catch (err) {
      closed = true;
      console.error('Google STT write error:', err);
      closeClient();
    }
  };

  const end = () => {
    if (closed) return;
    closed = true;
    try {
      recognizeStream.end();
    } catch (err) {
      console.error('Google STT end error:', err);
    } finally {
      closeClient();
    }
  };

  const isClosed = () => closed;

  return { write, end, isClosed };
}
