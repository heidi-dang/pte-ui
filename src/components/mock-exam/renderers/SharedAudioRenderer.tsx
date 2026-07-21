import { AudioTaskFrame } from './AudioTaskFrame';
import { type MockTaskRendererProps } from './index';
import { WaveformVisualizer } from '../../../practice/components/WaveformVisualizer';

interface AudioRendererState {
  recordedAudioUrl?: string | null;
  isRecording?: boolean;
  statusText?: string;
  simulatedLevels?: number[];
}

export function SharedAudioRenderer(
  props: MockTaskRendererProps,
  state: AudioRendererState,
  extra?: { showPassage?: boolean; showImage?: boolean; customImageNode?: React.ReactNode }
) {
  const { question, response, status, timers } = props;
  const decoded = typeof response === 'object' && response !== null ? response : {};

  return (
    <AudioTaskFrame
      title={question.title}
      instruction={question.instruction}
      promptText={question.promptText}
      passageText={extra?.showPassage ? question.passageText : undefined}
      imageUrl={extra?.showImage ? question.imageUrl : null}
      customImageNode={extra?.customImageNode}
      audioUrl={question.audioUrl}
      isAudioPlaying={false}
      audioPlaybackUrl={(decoded as any).audioUrl}
      status={status}
      theme="dark"
      timerDisplay={
        <div className="text-center">
          <span className="text-[10px] font-mono text-gray-500">
            {status === 'preparing' ? `Prep: ${timers.prepSeconds}s` : `Response: ${timers.responseSeconds}s`}
          </span>
        </div>
      }
      recordingSection={
        <div className="space-y-3">
          <div className="flex flex-col items-center justify-center gap-4">
            {status === 'recording' && (
              <>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400">{state.statusText || 'RECORDING...'}</span>
                </div>
                <WaveformVisualizer isRecording={true} simulatedLevels={props.simulatedLevels || []} />
              </>
            )}
          </div>
          {state.recordedAudioUrl && (
            <div className="flex justify-center">
              <audio controls src={state.recordedAudioUrl} className="h-8" />
            </div>
          )}
        </div>
      }
      onPlay={() => {}}
      onPause={() => {}}
      onEnded={() => {}}
    />
  );
}
