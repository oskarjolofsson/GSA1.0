package expo.modules.fastseek

import android.view.View
import android.view.ViewGroup
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Reflection-based bridge to the androidx.media3.ui.PlayerView that expo-video mounts
// inside its VideoView. We avoid compile-time media3 deps to dodge version conflicts
// with expo-video's bundled media3 release; reflection looks up the player and SeekParameters
// at runtime against whatever classloader the host app has.
class FastSeekModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FastSeek")

    Function("seekKeyframe") { viewTag: Int, posMs: Double ->
      seek(viewTag, posMs.toLong(), keyframe = true)
    }

    Function("seekPrecise") { viewTag: Int, posMs: Double ->
      seek(viewTag, posMs.toLong(), keyframe = false)
    }
  }

  private fun seek(viewTag: Int, posMs: Long, keyframe: Boolean) {
    val root = appContext.findView<View>(viewTag) ?: return
    val player = findPlayer(root) ?: return
    runCatching {
      // SeekParameters lives at androidx.media3.exoplayer.SeekParameters in modern media3.
      val seekParamsClass = Class.forName("androidx.media3.exoplayer.SeekParameters")
      val fieldName = if (keyframe) "PREVIOUS_SYNC" else "EXACT"
      val seekParams = seekParamsClass.getField(fieldName).get(null)
      player.javaClass.getMethod("setSeekParameters", seekParamsClass).invoke(player, seekParams)
    }
    // seekTo is on Player (interface) — Long signature is stable across recent media3 releases.
    runCatching {
      player.javaClass.getMethod("seekTo", Long::class.javaPrimitiveType).invoke(player, posMs)
    }
  }

  // Depth-first walk for an androidx.media3.ui.PlayerView, then pull its `getPlayer()` (an ExoPlayer instance).
  private fun findPlayer(v: View): Any? {
    if (v.javaClass.name.endsWith(".PlayerView")) {
      return runCatching { v.javaClass.getMethod("getPlayer").invoke(v) }.getOrNull()
    }
    if (v is ViewGroup) {
      for (i in 0 until v.childCount) {
        val found = findPlayer(v.getChildAt(i))
        if (found != null) return found
      }
    }
    return null
  }
}
