Pod::Spec.new do |s|
  s.name           = 'ExpoFastSeek'
  s.version        = '1.0.0'
  s.summary        = 'Fast keyframe-scrub helper for expo-video (iOS no-op).'
  s.description    = 'Companion to features/scrubber. iOS implementation is intentionally a no-op since AVPlayer scrubs smoothly via currentTime assignment.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '15.1', :tvos => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
