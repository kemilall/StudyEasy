import { NativeModules, Platform } from 'react-native';

const { RecordingLiveActivityModule } = NativeModules as {
  RecordingLiveActivityModule?: {
    start: (lessonName: string, subject: string, colorHex: string) => Promise<boolean>;
    update: (elapsedSeconds: number, isPaused: boolean) => Promise<boolean>;
    stop: () => Promise<boolean>;
  };
};

export const LiveActivityService = {
  async start(lessonName: string, subject: string, colorHex: string) {
    if (Platform.OS !== 'ios' || !RecordingLiveActivityModule) return false;
    try {
      return await RecordingLiveActivityModule.start(lessonName, subject, colorHex);
    } catch {
      return false;
    }
  },
  async update(elapsedSeconds: number, isPaused: boolean) {
    if (Platform.OS !== 'ios' || !RecordingLiveActivityModule) return false;
    try {
      return await RecordingLiveActivityModule.update(elapsedSeconds, isPaused);
    } catch {
      return false;
    }
  },
  async stop() {
    if (Platform.OS !== 'ios' || !RecordingLiveActivityModule) return false;
    try {
      return await RecordingLiveActivityModule.stop();
    } catch {
      return false;
    }
  },
};


