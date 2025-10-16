import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

export async function trimVideo(file, start, end) {
  // Load FFmpeg if it isn't already loaded
  if (!ffmpeg.loaded) {
    // IMPORTANT: You must configure `coreURL` to point to the correct
    // path of your `ffmpeg-core.js` file.
    // This example assumes it's in your public directory.
    await ffmpeg.load({
      coreURL: '/ffmpeg-core.js',
    });
  }

  // Write the input file to the FFmpeg virtual file system
  await ffmpeg.writeFile('input.mp4', await fetchFile(file));

  // Run the FFmpeg command
  await ffmpeg.exec([
    '-ss', String(start),
    '-i', 'input.mp4',
    '-t', String(end - start),
    '-c', 'copy',
    'output.mp4',
  ]);

  // Read the output file from the FFmpeg virtual file system
  // `readFile` now returns a Uint8Array.
  const data = await ffmpeg.readFile('output.mp4');

  // To create the Blob, you must pass the underlying buffer.
  // data.buffer contains the raw ArrayBuffer.
  const blob = new Blob([data.buffer], { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);

  // You can also clear the files from memory after processing
  ffmpeg.deleteFile('input.mp4');
  ffmpeg.deleteFile('output.mp4');
  
  return { blob, url };
}
