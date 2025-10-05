import ActivityKit
import WidgetKit
import SwiftUI

struct RecordingLiveActivityView: View {
    let context: ActivityViewContext<RecordingAttributes>

    var body: some View {
        HStack(spacing: 10) {
            Circle()
                .fill(context.state.isPaused ? Color.orange : Color.red)
                .frame(width: 10, height: 10)
            VStack(alignment: .leading, spacing: 2) {
                Text(context.attributes.lessonName)
                    .font(.caption)
                    .bold()
                Text("\(context.state.elapsedSeconds / 60):\(String(format: "%02d", context.state.elapsedSeconds % 60))")
                    .font(.caption2)
            }
            Spacer()
        }
        .padding(8)
    }
}

struct RecordingLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RecordingAttributes.self) { context in
            RecordingLiveActivityView(context: context)
                .activityBackgroundTint(.black.opacity(0.1))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Circle()
                        .fill(context.state.isPaused ? Color.orange : Color.red)
                        .frame(width: 12, height: 12)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.attributes.lessonName)
                        .font(.caption)
                        .bold()
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(context.state.elapsedSeconds / 60):\(String(format: "%02d", context.state.elapsedSeconds % 60))")
                        .font(.caption2)
                }
            } compactLeading: {
                Circle()
                    .fill(context.state.isPaused ? Color.orange : Color.red)
                    .frame(width: 10, height: 10)
            } compactTrailing: {
                Text("\(context.state.elapsedSeconds / 60):\(String(format: "%02d", context.state.elapsedSeconds % 60))")
                    .font(.caption2)
            } minimal: {
                Circle()
                    .fill(context.state.isPaused ? Color.orange : Color.red)
                    .frame(width: 10, height: 10)
            }
        }
    }
}

import ActivityKit
import WidgetKit
import SwiftUI

@main
struct RecordingLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RecordingAttributes.self) { context in
            // Lock screen/banner UI
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(context.attributes.subjectName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(context.attributes.lessonName)
                        .font(.headline)
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                HStack(spacing: 12) {
                    Image(systemName: context.state.isPaused ? "pause.circle.fill" : "record.circle")
                        .font(.title2)
                        .foregroundColor(context.state.isPaused ? .orange : .red)
                    
                    Text(context.state.duration)
                        .font(.title3.monospacedDigit())
                        .foregroundColor(.primary)
                }
            }
            .padding()
            .background(Color(hex: context.attributes.subjectColor).opacity(0.1))
            .activityBackgroundTint(Color.clear)
            
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI
                DynamicIslandExpandedRegion(.leading) {
                    HStack {
                        Image(systemName: context.state.isPaused ? "pause.circle.fill" : "record.circle")
                            .font(.title2)
                            .foregroundColor(context.state.isPaused ? .orange : .red)
                    }
                }
                
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 4) {
                        Text(context.attributes.subjectName)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(context.attributes.lessonName)
                            .font(.headline)
                        Text(context.state.duration)
                            .font(.title2.monospacedDigit())
                            .foregroundColor(context.state.isPaused ? .orange : .primary)
                    }
                }
                
                DynamicIslandExpandedRegion(.trailing) {
                    Image(systemName: "waveform")
                        .font(.title2)
                        .foregroundColor(Color(hex: context.attributes.subjectColor))
                }
                
            } compactLeading: {
                Image(systemName: context.state.isPaused ? "pause.circle.fill" : "record.circle")
                    .font(.caption)
                    .foregroundColor(context.state.isPaused ? .orange : .red)
            } compactTrailing: {
                Text(context.state.duration)
                    .font(.caption.monospacedDigit())
                    .foregroundColor(.primary)
            } minimal: {
                Image(systemName: "record.circle")
                    .font(.caption2)
                    .foregroundColor(.red)
            }
            .keylineTint(Color(hex: context.attributes.subjectColor))
        }
    }
}

// Helper extension for hex colors
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
