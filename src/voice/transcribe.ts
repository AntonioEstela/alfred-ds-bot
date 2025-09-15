import { EndBehaviorType, VoiceConnection } from '@discordjs/voice';
import prism from 'prism-media';
import { Transform } from 'stream';
import { startRealTimeGoogleSTT } from '../stt/google';

type GoogleOptions = NonNullable<Parameters<typeof startRealTimeGoogleSTT>[1]>;

type ListenOptions = {
  google?: GoogleOptions;
};

class StereoToMono extends Transform {
  _transform(chunk: Buffer, _enc: BufferEncoding, cb: Function) {
    const out = Buffer.alloc((chunk.length / 4) * 2);
    let o = 0;
    for (let i = 0; i + 3 < chunk.length; i += 4) {
      const L = chunk.readInt16LE(i);
      const R = chunk.readInt16LE(i + 2);
      out.writeInt16LE((L + R) >> 1, o);
      o += 2;
    }
    cb(null, out);
  }
}

export function listenAndTranscribe(
  conn: VoiceConnection,
  userId: string,
  onTranscript: (text: string, isFinal: boolean) => void,
  options: ListenOptions = {}
) {
  const SAMPLE_RATE = 48000; // we’re sending 48k
  const BYTES_PER_MS = (SAMPLE_RATE * 2) / 1000; // 96 bytes/ms
  const TARGET_MS = 100; // send 100 ms frames
  const FRAME_BYTES = BYTES_PER_MS * TARGET_MS; // 9600 bytes
  const MIN_MS = 50; // v3 minimum
  const MIN_BYTES = BYTES_PER_MS * MIN_MS; // 4800 bytes

  const googleConfig: GoogleOptions = {
    sampleRate: SAMPLE_RATE,
    ...(options.google ?? {}),
  };

  const stt = startRealTimeGoogleSTT(onTranscript, googleConfig);

  const opus = conn.receiver.subscribe(userId, {
    end: { behavior: EndBehaviorType.AfterSilence, duration: 5000 },
  });

  const decode = new prism.opus.Decoder({
    rate: 48000,
    channels: 2,
    frameSize: 960,
  });
  const toMono = new StereoToMono();

  const pcm48Mono = opus.pipe(decode).pipe(toMono);

  // ---- Chunker: accumulate to 100 ms and emit exact-sized frames ----
  let carry = Buffer.alloc(0);
  const sendFrame = (buf: Buffer) => {
    if (!stt.isClosed() && buf.length) stt.write(buf);
  };

  const flushCarryIfNeeded = (pad = false) => {
    if (carry.length >= FRAME_BYTES) {
      while (carry.length >= FRAME_BYTES) {
        sendFrame(carry.subarray(0, FRAME_BYTES));
        carry = carry.subarray(FRAME_BYTES);
      }
    }
    // On end/idle, either pad to >=50ms or drop tiny tail
    if (pad && carry.length > 0) {
      if (carry.length >= MIN_BYTES) {
        sendFrame(carry); // already >=50ms; OK to send shorter than 100ms but >=50ms
      } else {
        // pad with silence up to MIN_BYTES
        const padLen = MIN_BYTES - carry.length;
        sendFrame(Buffer.concat([carry, Buffer.alloc(padLen)]));
      }
      carry = Buffer.alloc(0);
    }
  };

  // Debug + idle watchdog
  let pcmChunks = 0,
    pcmBytes = 0;
  const IDLE_MS = 8000;
  let idleTimer: NodeJS.Timeout | null = null;
  const bumpIdle = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      console.log(`🕒 No PCM for ${IDLE_MS}ms → ending STT`);
      flushCarryIfNeeded(true);
      stt.end();
    }, IDLE_MS);
  };

  pcm48Mono.on('data', (buf: Buffer) => {
    pcmBytes += buf.length;
    if (++pcmChunks % 20 === 0) {
      console.log(`🎵 PCM48k mono: ${pcmChunks} chunks, ${pcmBytes} bytes`);
    }
    bumpIdle();

    // accumulate and emit 100 ms frames
    carry = Buffer.concat([carry, buf]);
    flushCarryIfNeeded(false);
  });

  pcm48Mono.once('end', () => {
    console.log(
      'ℹ️ PCM stream ended (decoder). Flushing tail and waiting idle to close STT…'
    );
    flushCarryIfNeeded(true); // send leftover (>=50ms or padded to 50ms)
    bumpIdle();
  });

  pcm48Mono.on('error', e => {
    console.error('❗ PCM pipeline error:', e);
    stt.end();
  });

  // Optional: early keepalive (exactly 100ms of silence)
  setTimeout(() => {
    if (pcmChunks === 0 && !stt.isClosed()) {
      console.log('No PCM yet — sending 100ms silence keepalive');
      sendFrame(Buffer.alloc(FRAME_BYTES)); // 100ms silence @48k
      bumpIdle();
    }
  }, 700);

  return {
    cleanup: () => {
      try {
        pcm48Mono.removeAllListeners();
      } catch {}
      try {
        decode.destroy();
      } catch {}
      try {
        opus.destroy();
      } catch {}
      stt.end();
    },
  };
}
