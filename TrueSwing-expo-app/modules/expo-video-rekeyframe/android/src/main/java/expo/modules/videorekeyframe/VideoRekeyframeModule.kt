package expo.modules.videorekeyframe

import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.media.MediaMuxer
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.nio.ByteBuffer

// Re-encodes a video file so that keyframes appear every `gopFrames` frames.
// With a dense GOP, ExoPlayer's "seek to previous sync sample" effectively snaps to any
// frame, so live scrubbing on Android becomes instant (see plan + expo/expo#39831).
//
// Pipeline: MediaExtractor -> MediaCodec decoder -> Surface -> MediaCodec encoder -> MediaMuxer.
// Audio track is muxed through untouched.
class VideoRekeyframeModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("VideoRekeyframe")

    AsyncFunction("transcode") { inputPath: String, outputPath: String, gopFrames: Int ->
      transcode(stripFileScheme(inputPath), stripFileScheme(outputPath), gopFrames.coerceAtLeast(1))
    }
  }

  private fun stripFileScheme(p: String): String =
    if (p.startsWith("file://")) p.removePrefix("file://") else p

  private fun transcode(
    inputPath: String,
    outputPath: String,
    gopFrames: Int,
  ): Map<String, Any> {
    val inputFile = File(inputPath)
    require(inputFile.exists()) { "Input file does not exist: $inputPath" }

    File(outputPath).parentFile?.mkdirs()
    File(outputPath).takeIf { it.exists() }?.delete()

    val extractor = MediaExtractor().apply { setDataSource(inputPath) }
    val videoTrack = findTrack(extractor, "video/") ?: run {
      extractor.release()
      throw IllegalStateException("No video track found in $inputPath")
    }
    val audioTrack = findTrack(extractor, "audio/")

    val srcFormat = extractor.getTrackFormat(videoTrack)
    val width = srcFormat.getInteger(MediaFormat.KEY_WIDTH)
    val height = srcFormat.getInteger(MediaFormat.KEY_HEIGHT)
    val frameRate = if (srcFormat.containsKey(MediaFormat.KEY_FRAME_RATE))
      srcFormat.getInteger(MediaFormat.KEY_FRAME_RATE) else 30
    val rotation = readRotation(inputPath)
    val bitRate = chooseBitrate(inputPath, width, height)

    val durationUs = if (srcFormat.containsKey(MediaFormat.KEY_DURATION))
      srcFormat.getLong(MediaFormat.KEY_DURATION) else 0L

    val encoderFormat = MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, width, height).apply {
      setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
      setInteger(MediaFormat.KEY_BIT_RATE, bitRate)
      setInteger(MediaFormat.KEY_FRAME_RATE, frameRate)
      // KEY_I_FRAME_INTERVAL is seconds-between-keyframes. API 25+ accepts a float.
      val ivSec = gopFrames.toFloat() / frameRate.toFloat()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1) {
        setFloat(MediaFormat.KEY_I_FRAME_INTERVAL, ivSec)
      } else {
        setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 0)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        setInteger(MediaFormat.KEY_PRIORITY, 1)
      }
    }

    val encoder = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC)
    encoder.configure(encoderFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
    val inputSurface = encoder.createInputSurface()
    encoder.start()

    val decoderMime = srcFormat.getString(MediaFormat.KEY_MIME)!!
    val decoder = MediaCodec.createDecoderByType(decoderMime)
    decoder.configure(srcFormat, inputSurface, null, 0)
    decoder.start()

    extractor.selectTrack(videoTrack)

    val muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
    if (rotation != 0) muxer.setOrientationHint(rotation)
    var videoMuxerTrack = -1
    var audioMuxerTrack = -1
    var muxerStarted = false

    try {
      driveVideo(
        extractor = extractor,
        decoder = decoder,
        encoder = encoder,
        onEncoderFormat = { fmt ->
          videoMuxerTrack = muxer.addTrack(fmt)
          if (audioTrack == null) {
            muxer.start()
            muxerStarted = true
          }
        },
        onEncodedSample = { buf, info ->
          if (!muxerStarted && audioTrack != null) {
            // Need to add audio track before starting the muxer.
            val audioFormat = extractor.getTrackFormat(audioTrack)
            audioMuxerTrack = muxer.addTrack(audioFormat)
            muxer.start()
            muxerStarted = true
          }
          if (muxerStarted && videoMuxerTrack >= 0) {
            muxer.writeSampleData(videoMuxerTrack, buf, info)
          }
        }
      )

      // Audio passthrough: write all audio samples after video is fully encoded so
      // the muxer is guaranteed to be started and both tracks registered.
      if (audioTrack != null) {
        if (!muxerStarted) {
          // Edge case: video produced no output format change. Add audio + start muxer now.
          val audioFormat = extractor.getTrackFormat(audioTrack)
          audioMuxerTrack = muxer.addTrack(audioFormat)
          muxer.start()
          muxerStarted = true
        }
        copyAudio(inputPath, audioTrack, audioMuxerTrack, muxer)
      }
    } finally {
      runCatching { decoder.stop() }
      runCatching { decoder.release() }
      runCatching { encoder.stop() }
      runCatching { encoder.release() }
      runCatching { inputSurface.release() }
      runCatching { extractor.release() }
      if (muxerStarted) runCatching { muxer.stop() }
      runCatching { muxer.release() }
    }

    return mapOf(
      "outputPath" to outputPath,
      "durationMs" to (durationUs / 1000L),
    )
  }

  private fun driveVideo(
    extractor: MediaExtractor,
    decoder: MediaCodec,
    encoder: MediaCodec,
    onEncoderFormat: (MediaFormat) -> Unit,
    onEncodedSample: (ByteBuffer, MediaCodec.BufferInfo) -> Unit,
  ) {
    val timeoutUs = 10_000L
    val bufferInfo = MediaCodec.BufferInfo()
    var inputDone = false
    var decoderDone = false
    var encoderDone = false
    var encoderFormatEmitted = false

    while (!encoderDone) {
      // Feed extractor -> decoder.
      if (!inputDone) {
        val inIx = decoder.dequeueInputBuffer(timeoutUs)
        if (inIx >= 0) {
          val buf = decoder.getInputBuffer(inIx)!!
          val size = extractor.readSampleData(buf, 0)
          if (size < 0) {
            decoder.queueInputBuffer(inIx, 0, 0, 0L, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
            inputDone = true
          } else {
            decoder.queueInputBuffer(inIx, 0, size, extractor.sampleTime, 0)
            extractor.advance()
          }
        }
      }

      // Pull decoded frames -> render to encoder input Surface.
      if (!decoderDone) {
        val outIx = decoder.dequeueOutputBuffer(bufferInfo, timeoutUs)
        when {
          outIx >= 0 -> {
            val render = bufferInfo.size > 0
            decoder.releaseOutputBuffer(outIx, render)
            if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) {
              decoderDone = true
              encoder.signalEndOfInputStream()
            }
          }
          outIx == MediaCodec.INFO_TRY_AGAIN_LATER -> { /* spin */ }
          outIx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> { /* no-op for Surface output */ }
        }
      }

      // Drain encoder -> muxer.
      while (true) {
        val outIx = encoder.dequeueOutputBuffer(bufferInfo, 0)
        if (outIx == MediaCodec.INFO_TRY_AGAIN_LATER) break
        if (outIx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
          if (encoderFormatEmitted) error("Encoder format changed twice")
          encoderFormatEmitted = true
          onEncoderFormat(encoder.outputFormat)
          continue
        }
        if (outIx < 0) continue
        val outBuf = encoder.getOutputBuffer(outIx)!!
        if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG != 0) {
          // CSD already inside the output format; skip.
          bufferInfo.size = 0
        }
        if (bufferInfo.size > 0) {
          outBuf.position(bufferInfo.offset)
          outBuf.limit(bufferInfo.offset + bufferInfo.size)
          onEncodedSample(outBuf, bufferInfo)
        }
        encoder.releaseOutputBuffer(outIx, false)
        if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) {
          encoderDone = true
          break
        }
      }
    }
  }

  private fun copyAudio(inputPath: String, audioTrack: Int, audioMuxerTrack: Int, muxer: MediaMuxer) {
    val audioExtractor = MediaExtractor().apply { setDataSource(inputPath) }
    try {
      audioExtractor.selectTrack(audioTrack)
      val maxSize = audioExtractor.getTrackFormat(audioTrack)
        .takeIf { it.containsKey(MediaFormat.KEY_MAX_INPUT_SIZE) }
        ?.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE)
        ?: (256 * 1024)
      val buffer = ByteBuffer.allocate(maxSize)
      val info = MediaCodec.BufferInfo()
      while (true) {
        buffer.clear()
        val size = audioExtractor.readSampleData(buffer, 0)
        if (size < 0) break
        info.offset = 0
        info.size = size
        info.presentationTimeUs = audioExtractor.sampleTime
        info.flags = audioExtractor.sampleFlags
        muxer.writeSampleData(audioMuxerTrack, buffer, info)
        audioExtractor.advance()
      }
    } finally {
      audioExtractor.release()
    }
  }

  private fun findTrack(extractor: MediaExtractor, mimePrefix: String): Int? {
    for (i in 0 until extractor.trackCount) {
      val mime = extractor.getTrackFormat(i).getString(MediaFormat.KEY_MIME) ?: continue
      if (mime.startsWith(mimePrefix)) return i
    }
    return null
  }

  private fun readRotation(path: String): Int {
    val retriever = MediaMetadataRetriever()
    return try {
      retriever.setDataSource(path)
      retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toIntOrNull() ?: 0
    } catch (_: Throwable) {
      0
    } finally {
      runCatching { retriever.release() }
    }
  }

  private fun chooseBitrate(path: String, width: Int, height: Int): Int {
    val retriever = MediaMetadataRetriever()
    val sourceBitrate = try {
      retriever.setDataSource(path)
      retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_BITRATE)?.toIntOrNull() ?: 0
    } catch (_: Throwable) {
      0
    } finally {
      runCatching { retriever.release() }
    }
    // Dense GOP roughly doubles the bits needed for equivalent quality. Bump above source,
    // clamp to a sane ceiling for the resolution.
    val ceiling = when {
      width * height >= 1920 * 1080 -> 16_000_000
      width * height >= 1280 * 720 -> 10_000_000
      else -> 6_000_000
    }
    val target = if (sourceBitrate > 0) (sourceBitrate * 2).coerceAtMost(ceiling) else ceiling / 2
    return target.coerceAtLeast(2_000_000)
  }
}
