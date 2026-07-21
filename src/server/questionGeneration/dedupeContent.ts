import { TaskCode } from '../../shared/questionTaskRegistry';

export function extractDeduplicationContent(candidate: any, taskCode: TaskCode): string {
  const payload = candidate?.taskPayload || {};
  const chart = payload.chartSpecification || {};

  const parts: unknown[] = [
    candidate?.title,
    candidate?.promptText,
    candidate?.passageText,
  ];

  switch (taskCode) {
    case 'RS':
      parts.push(payload.sentence, payload.referenceTranscript, payload.ttsScript);
      break;

    case 'RL':
    case 'SST':
      parts.push(payload.lectureScript, ...(payload.keyPoints || []));
      break;

    case 'DI':
      parts.push(
        chart.title,
        chart.chartType,
        chart.units,
        ...(chart.labels || []),
        ...((chart.series || []).flatMap((s: any) => [s.name, ...(s.values || [])])),
        ...(chart.keyObservations || []),
        ...(payload.referencePoints || []),
      );
      break;

    case 'ASQ':
      parts.push(payload.question, ...(payload.acceptedShortAnswers || []));
      break;

    case 'SGD':
      parts.push(payload.discussionScript, ...(payload.keyPoints || []));
      break;

    case 'RTS':
      parts.push(payload.situationScript, ...(payload.responseCriteria || []));
      break;

    case 'WFD':
      parts.push(payload.dictationSentence, payload.canonicalTranscript);
      break;

    case 'MCMSL':
    case 'MCSSL':
    case 'SMW':
    case 'FIBL':
    case 'HCS':
      parts.push(
        payload.audioScript,
        ...(payload.options || []),
        ...(payload.summaryOptions || []),
        payload.correctAnswer,
        payload.correctSummary,
        ...(payload.correctAnswers || []),
        payload.displayedBlanks,
        JSON.stringify(payload.answerMap || {}),
      );
      break;

    case 'HIW':
      parts.push(
        payload.correctTranscript,
        payload.alteredDisplayTranscript,
        ...(payload.mismatchIndexes || []),
      );
      break;

    default:
      parts.push(JSON.stringify(payload));
  }

  return parts
    .flat()
    .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
    .map((v) => String(v).trim())
    .join(' ');
}
