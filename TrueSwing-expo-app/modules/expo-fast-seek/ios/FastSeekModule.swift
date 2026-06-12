import ExpoModulesCore

// AVPlayer (used internally by expo-video on iOS) already handles ~25Hz scrubbing
// without stutter when assigning `currentTime`, so the iOS side here is a deliberate no-op.
// The module exists so the JS layer can resolve `requireOptionalNativeModule('FastSeek')`
// on both platforms without branching.
public class FastSeekModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FastSeek")

    Function("seekKeyframe") { (_ viewTag: Int, _ posMs: Double) in
      // no-op on iOS
    }

    Function("seekPrecise") { (_ viewTag: Int, _ posMs: Double) in
      // no-op on iOS
    }
  }
}
