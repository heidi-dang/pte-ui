import React, { RefObject } from 'react';
import { PTETaskCode, PracticeItem } from '../../types';
import { PTE_TASK_TYPES } from '../../data/mockData';
import {
  Mic, Star, Search, AlertTriangle, Square, Play, CheckCircle,
  ChevronLeft, ChevronRight, CheckCircle as CheckCircleIcon,
} from 'lucide-react';

const PROMPT_HIDDEN_TASKS = new Set<PTETaskCode>(['RS', 'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD']);
const ONE_PLAY_TASKS = new Set<PTETaskCode>(['RS', 'RL', 'ASQ', 'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD']);

export interface PracticeTaskFormProps {
  activeCode: PTETaskCode;
  status: 'preparing' | 'recording' | 'answering' | 'completed';
  theme: 'dark' | 'light';
  activeItem: PracticeItem;
  prepTimer: number;
  timer: number;
  userTypedText: string;
  onUserTypedTextChange: (v: string) => void;
  userSelectedOption: string;
  onUserSelectedOptionChange: (v: string) => void;
  userSelectedMultiple: string[];
  onToggleMultiple: (opt: string) => void;
  reorderedList: string[];
  onMoveItem: (index: number, direction: 'up' | 'down') => void;
  selectedBlanks: Record<number, string>;
  onSelectedBlanksChange: (blanks: Record<number, string>) => void;
  highlightedIncorrect: string[];
  onHighlightedIncorrectChange: (words: string[]) => void;
  isRecordingRealMic: boolean;
  simulatedVoiceLevels: number[];
  isAudioPlaying: boolean;
  audioPlayed: boolean;
  audioPlaybackProgress: number;
  onPlayAudio: () => void;
  promptAudioRef: RefObject<HTMLAudioElement | null>;
  filteredCodeItems: PracticeItem[];
  codeItems: PracticeItem[];
  bookmarkedQuestions: string[];
  qSearchQuery: string;
  onQSearchQueryChange: (v: string) => void;
  onSelectQuestion: (item: PracticeItem) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export const PracticeTaskForm: React.FC<PracticeTaskFormProps> = ({
  activeCode, status, theme, activeItem,
  prepTimer, timer,
  userTypedText, onUserTypedTextChange,
  userSelectedOption, onUserSelectedOptionChange,
  userSelectedMultiple, onToggleMultiple,
  reorderedList, onMoveItem,
  selectedBlanks, onSelectedBlanksChange,
  highlightedIncorrect, onHighlightedIncorrectChange,
  isRecordingRealMic, simulatedVoiceLevels,
  isAudioPlaying, audioPlayed, audioPlaybackProgress, onPlayAudio, promptAudioRef,
  filteredCodeItems, codeItems, bookmarkedQuestions,
  qSearchQuery, onQSearchQueryChange,
  onSelectQuestion, isBookmarked, onToggleBookmark,
}) => {
  return (
    <>
      {/* Header indicators */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-850 pb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold">
              {PTE_TASK_TYPES.find((t) => t.code === activeCode)?.section} Section Task
            </span>
            <span className="text-[10px] font-mono text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full">
              ID: {activeItem.id}
            </span>
            <button
              onClick={onToggleBookmark}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${isBookmarked ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'border-gray-850 text-gray-500 hover:text-white'}`}
              title="Bookmark this Question"
            >
              <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
          <h2 className="text-xl font-bold tracking-tight mt-2">{activeItem.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {status === 'preparing' ? (
            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3.5 py-1.5 rounded-xl text-orange-400 text-xs font-mono font-bold animate-pulse">
              Preparation Countdown: {prepTimer}s
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-emerald-400 text-xs font-mono font-bold">
              Answering Timer: {timer}s
            </div>
          )}
        </div>
      </div>

      {/* Question Search / Filter */}
      <div className={`p-4 rounded-2xl border mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Select Question of this Task Type:</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {filteredCodeItems.map((item, idx) => {
              const isSel = activeItem.id === item.id;
              const isBook = bookmarkedQuestions.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectQuestion(item)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono tracking-tight transition-all border cursor-pointer flex items-center gap-1 ${
                    isSel
                      ? 'bg-emerald-500 border-emerald-500 text-white font-bold shadow'
                      : theme === 'dark' ? 'border-gray-800 bg-gray-900/30 text-gray-400 hover:bg-gray-900' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Q{idx + 1}
                  {isBook && <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 flex-shrink-0" />}
                </button>
              );
            })}
            {filteredCodeItems.length === 0 && (
              <span className="text-[10px] text-gray-500 italic">No questions match your search.</span>
            )}
          </div>
        </div>
        <div className="relative w-full md:w-48">
          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search className="h-3 w-3 text-gray-500" />
          </span>
          <input
            type="text"
            placeholder="Search questions..."
            value={qSearchQuery}
            onChange={(e) => onQSearchQueryChange(e.target.value)}
            className={`w-full pl-7 pr-3 py-1.5 rounded-lg text-[10px] border focus:outline-none ${theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-300 text-gray-950'}`}
          />
        </div>
      </div>

      {/* Instructions panel */}
      <div className={`p-4 rounded-xl mb-6 flex gap-3 items-start border text-xs leading-relaxed ${theme === 'dark' ? 'bg-gray-950/40 border-gray-850 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
        <AlertTriangle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-1">Instructions:</p>
          <p>{activeItem.instruction}</p>
        </div>
      </div>

      {/* Practice material section */}
      <div className="space-y-6 mb-8">
        {activeItem.imageUrl && (
          <div className="flex justify-center border border-gray-800/40 rounded-2xl overflow-hidden max-w-md mx-auto">
            <img referrerPolicy="no-referrer" src={activeItem.imageUrl} alt={activeItem.title} className="max-h-64 object-contain" />
          </div>
        )}

        {activeItem.audioUrl && (
          <audio ref={promptAudioRef} src={activeItem.audioUrl} className="hidden" />
        )}

        {activeItem.audioUrl && (
          <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-gray-400">LECTURE RECORDING</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">{isAudioPlaying ? 'PLAYING' : audioPlayed ? 'COMPLETED' : 'IDLE'}</span>
                {ONE_PLAY_TASKS.has(activeCode) && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${audioPlayed ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {audioPlayed ? 'PLAYED — 1 PLAY ONLY' : '1 PLAY ALLOWED'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onPlayAudio}
                disabled={ONE_PLAY_TASKS.has(activeCode) && audioPlayed}
                title={ONE_PLAY_TASKS.has(activeCode) && audioPlayed ? 'Audio can only be played once per question' : 'Play audio'}
                className={`w-10 h-10 rounded-full text-white flex items-center justify-center transition-all ${
                  ONE_PLAY_TASKS.has(activeCode) && audioPlayed
                    ? 'bg-gray-600 opacity-40 cursor-not-allowed'
                    : 'bg-emerald-500 hover:scale-105 cursor-pointer'
                }`}
              >
                {isAudioPlaying ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>
              <div className="flex-1 bg-gray-800 h-2 rounded-full overflow-hidden relative">
                <div className="bg-emerald-500 h-full transition-all duration-200" style={{ width: `${audioPlaybackProgress}%` }} />
              </div>
            </div>
          </div>
        )}

        {activeItem.promptText && !PROMPT_HIDDEN_TASKS.has(activeCode) && (
          <div className={`p-6 rounded-2xl border text-sm leading-relaxed whitespace-pre-line ${theme === 'dark' ? 'bg-gray-950/30 border-gray-850 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
            {activeItem.promptText}
          </div>
        )}
      </div>

      {/* USER INTERACTION PANELS */}
      <div className="mb-8">
        {/* CATEGORY A: Speaking */}
        {['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS'].includes(activeCode) && (
          <div className={`p-6 rounded-2xl border text-center ${status === 'recording' ? 'border-red-500/40 bg-red-500/5' : theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex justify-center mb-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${status === 'recording' ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500/10 text-emerald-400'}`}>
                <Mic className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs font-mono font-bold tracking-widest uppercase mb-4">
              {status === 'preparing' && 'MIC STATUS: STANDBY'}
              {status === 'recording' && `MIC STATUS: RECORDING... ${isRecordingRealMic ? '(REAL MICROPHONE ACTIVE)' : '(SIMULATED ACOUSTIC)'}`}
              {status === 'completed' && 'MIC STATUS: CAPTURED'}
            </p>
            {status === 'recording' && (
              <div className="h-10 flex items-center justify-center gap-1 mb-4">
                {simulatedVoiceLevels.map((lvl, index) => (
                  <span key={index} style={{ height: `${lvl}%` }} className="w-1 bg-red-400 rounded-full transition-all duration-100" />
                ))}
              </div>
            )}
            <span className="text-[10px] text-gray-500 font-mono">
              {status === 'preparing' && `Recording begins in ${prepTimer} seconds`}
              {status === 'recording' && 'Speak clearly into your microphone now'}
              {status === 'completed' && 'Voice response stored. Click submit.'}
            </span>
          </div>
        )}

        {/* CATEGORY B: Writing */}
        {['SWT', 'WE', 'SST'].includes(activeCode) && (
          <div className="space-y-2">
            <textarea
              rows={10}
              value={userTypedText}
              onChange={(e) => onUserTypedTextChange(e.target.value)}
              placeholder="Type your academic response here..."
              className={`w-full p-4 rounded-2xl text-xs border focus:outline-none focus:ring-1 focus:border-emerald-500 focus:ring-emerald-500 ${theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
            <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
              <span>Words: {userTypedText ? userTypedText.trim().split(/\s+/).length : 0} | Characters: {userTypedText.length}</span>
              <span>Constraint: {activeCode === 'SWT' ? '5 - 75 words' : activeCode === 'SST' ? '50 - 70 words' : '200 - 300 words'}</span>
            </div>
          </div>
        )}

        {/* CATEGORY C: Reading MCQs */}
        {['MCS', 'MCM', 'MCMSL', 'MCSSL', 'HCS', 'SMW'].includes(activeCode) && activeItem.options && (
          <div className="space-y-3">
            {activeItem.options.map((opt, idx) => {
              const isSelected = activeCode === 'MCM' || activeCode === 'MCMSL'
                ? userSelectedMultiple.includes(opt)
                : userSelectedOption === opt;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (activeCode === 'MCM' || activeCode === 'MCMSL') {
                      onToggleMultiple(opt);
                    } else {
                      onUserSelectedOptionChange(opt);
                    }
                  }}
                  className={`w-full text-left p-4 rounded-xl text-xs font-semibold border flex justify-between items-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : theme === 'dark'
                      ? 'bg-gray-950/40 border-gray-850 hover:bg-gray-900 text-gray-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>{opt}</span>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-700'}`}>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* CATEGORY D: Reorder Paragraphs */}
        {activeCode === 'ROP' && reorderedList.length > 0 && (
          <div className="space-y-3">
            {reorderedList.map((item, index) => (
              <div key={index} className={`p-4 rounded-xl border flex justify-between items-center text-xs leading-relaxed ${theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
                <span className="flex-1 pr-4">{item}</span>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button disabled={index === 0} onClick={() => onMoveItem(index, 'up')} className="px-2 py-1 text-[10px] bg-gray-800 text-gray-300 hover:bg-emerald-500 rounded disabled:opacity-30 cursor-pointer">▲ Move Up</button>
                  <button disabled={index === reorderedList.length - 1} onClick={() => onMoveItem(index, 'down')} className="px-2 py-1 text-[10px] bg-gray-800 text-gray-300 hover:bg-emerald-500 rounded disabled:opacity-30 cursor-pointer">▼ Move Down</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CATEGORY E: Fill in the Blanks */}
        {['FIBR', 'FIBRW', 'FIBL'].includes(activeCode) && activeItem.options && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border leading-relaxed text-xs leading-loose ${theme === 'dark' ? 'bg-gray-950/40 border-gray-850 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
              {activeItem.promptText?.split(/\[\d+\]/).map((part, idx, arr) => {
                if (idx === arr.length - 1) return <span key={idx}>{part}</span>;
                return (
                  <React.Fragment key={idx}>
                    <span>{part}</span>
                    <select
                      value={selectedBlanks[idx] || ''}
                      onChange={(e) => onSelectedBlanksChange({ ...selectedBlanks, [idx]: e.target.value })}
                      className="mx-2 px-2 py-1 rounded border bg-gray-950 text-emerald-400 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">Select Option</option>
                      {activeItem.options?.[idx]?.split(', ').map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      )) || activeItem.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* CATEGORY F: Highlight Incorrect Words */}
        {activeCode === 'HIW' && activeItem.options && (
          <div className={`p-6 rounded-2xl border text-xs leading-loose ${theme === 'dark' ? 'bg-gray-950/40 border-gray-850 text-gray-300' : 'bg-white border-gray-200'}`}>
            {activeItem.promptText?.split(' ').map((word, idx) => {
              const cleanWord = word.replace(/[().,;[\]]/g, '');
              const isHighlighted = highlightedIncorrect.includes(cleanWord);
              return (
                <span
                  key={idx}
                  onClick={() => {
                    onHighlightedIncorrectChange(
                      isHighlighted
                        ? highlightedIncorrect.filter((w) => w !== cleanWord)
                        : [...highlightedIncorrect, cleanWord]
                    );
                  }}
                  className={`mx-1 px-1 rounded cursor-pointer transition-colors ${isHighlighted ? 'bg-emerald-500/25 text-emerald-400 font-bold' : 'hover:bg-white/10'}`}
                >
                  {word}
                </span>
              );
            })}
          </div>
        )}

        {/* CATEGORY G: Write from Dictation */}
        {activeCode === 'WFD' && (
          <div className="space-y-2">
            <input
              required type="text"
              value={userTypedText}
              onChange={(e) => onUserTypedTextChange(e.target.value)}
              placeholder="Type the exact sentence you heard here..."
              className={`w-full p-4 rounded-2xl text-xs border focus:outline-none focus:ring-1 focus:border-emerald-500 focus:ring-emerald-500 ${theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
            <span className="text-[10px] text-gray-500 font-mono">Use standard capitalizations and punctuation (e.g. period).</span>
          </div>
        )}
      </div>
    </>
  );
};
