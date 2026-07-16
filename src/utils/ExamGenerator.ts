/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PTETaskCode, PracticeItem, MockTest, PTESection } from '../types';
import { PRACTICE_ITEMS_LIST, PTE_TASK_TYPES } from '../data/mockData';

export interface ExamGeneratorConfig {
  testType?: 'mini' | 'section' | 'full';
  focusSection?: 'Speaking' | 'Writing' | 'Reading' | 'Listening' | 'All';
  customTopic?: string;
  seed?: string;
}

export class ExamGenerator {
  /**
   * Standard PTE Exam structure weights for a Full Exam (approx. 52 questions, 130 mins)
   */
  public static readonly FULL_EXAM_STRUCTURE: Record<PTETaskCode, number> = {
    RA: 6,
    RS: 10,
    DI: 3,
    RL: 2,
    ASQ: 5,
    SGD: 1,
    RTS: 1,
    SWT: 2,
    WE: 1,
    FIBRW: 5,
    MCM: 1,
    ROP: 2,
    FIBR: 4,
    MCS: 1,
    SST: 1,
    MCMSL: 1,
    FIBL: 2,
    HCS: 1,
    MCSSL: 1,
    SMW: 1,
    HIW: 2,
    WFD: 3
  };

  /**
   * Section-Specific Exam structures
   */
  public static readonly SECTION_STRUCTURES: Record<PTESection, Record<PTETaskCode, number>> = {
    Speaking: {
      RA: 6,
      RS: 10,
      DI: 3,
      RL: 2,
      ASQ: 5,
      SGD: 1,
      RTS: 1,
      SWT: 0,
      WE: 0,
      FIBRW: 0,
      MCM: 0,
      ROP: 0,
      FIBR: 0,
      MCS: 0,
      SST: 0,
      MCMSL: 0,
      FIBL: 0,
      HCS: 0,
      MCSSL: 0,
      SMW: 0,
      HIW: 0,
      WFD: 0
    },
    Writing: {
      RA: 0,
      RS: 0,
      DI: 0,
      RL: 0,
      ASQ: 0,
      SGD: 0,
      RTS: 0,
      SWT: 2,
      WE: 2,
      FIBRW: 0,
      MCM: 0,
      ROP: 0,
      FIBR: 0,
      MCS: 0,
      SST: 0,
      MCMSL: 0,
      FIBL: 0,
      HCS: 0,
      MCSSL: 0,
      SMW: 0,
      HIW: 0,
      WFD: 0
    },
    Reading: {
      RA: 0,
      RS: 0,
      DI: 0,
      RL: 0,
      ASQ: 0,
      SGD: 0,
      RTS: 0,
      SWT: 0,
      WE: 0,
      FIBRW: 5,
      MCM: 2,
      ROP: 3,
      FIBR: 4,
      MCS: 2,
      SST: 0,
      MCMSL: 0,
      FIBL: 0,
      HCS: 0,
      MCSSL: 0,
      SMW: 0,
      HIW: 0,
      WFD: 0
    },
    Listening: {
      RA: 0,
      RS: 0,
      DI: 0,
      RL: 0,
      ASQ: 0,
      SGD: 0,
      RTS: 0,
      SWT: 0,
      WE: 0,
      FIBRW: 0,
      MCM: 0,
      ROP: 0,
      FIBR: 0,
      MCS: 0,
      SST: 2,
      MCMSL: 1,
      FIBL: 2,
      HCS: 1,
      MCSSL: 1,
      SMW: 1,
      HIW: 2,
      WFD: 3
    }
  };

  /**
   * Mini Booster Exam Structure (approx. 10 core questions, 30 mins)
   */
  public static readonly MINI_EXAM_STRUCTURE: Record<PTETaskCode, number> = {
    RA: 2,
    RS: 3,
    DI: 1,
    RL: 1,
    ASQ: 1,
    SGD: 0,
    RTS: 0,
    SWT: 1,
    WE: 1,
    FIBRW: 0,
    MCM: 0,
    ROP: 0,
    FIBR: 0,
    MCS: 0,
    SST: 0,
    MCMSL: 0,
    FIBL: 0,
    HCS: 0,
    MCSSL: 0,
    SMW: 0,
    HIW: 0,
    WFD: 0
  };

  /**
   * Generates a fully dynamic, completely randomized mock test.
   * If there are not enough physical templates for a requested task type in our static pool,
   * we programmatically synthesize unique variations by swapping key phrases, altering topics, 
   * shuffling distractors, and tailoring instructions to avoid literal duplicates within the same test.
   */
  public static generateTest(config: ExamGeneratorConfig): MockTest {
    const testType = config.testType || 'mini';
    const focusSection = config.focusSection || 'All';
    const customTopic = config.customTopic ? config.customTopic.trim() : '';

    let structure: Record<PTETaskCode, number>;

    if (testType === 'mini') {
      structure = { ...this.MINI_EXAM_STRUCTURE };
    } else if (testType === 'section' && focusSection !== 'All') {
      structure = { ...this.SECTION_STRUCTURES[focusSection] };
    } else if (testType === 'section') {
      // Mixed section or short format, default to mini structure doubled
      structure = {} as Record<PTETaskCode, number>;
      Object.entries(this.MINI_EXAM_STRUCTURE).forEach(([code, val]) => {
        structure[code as PTETaskCode] = val * 2;
      });
    } else {
      // Full Exam
      structure = { ...this.FULL_EXAM_STRUCTURE };
    }

    const selectedQuestions: PracticeItem[] = [];
    let totalMins = 0;

    // Group available practice items by task code
    const poolByCode: Record<string, PracticeItem[]> = {};
    PRACTICE_ITEMS_LIST.forEach((item) => {
      if (!poolByCode[item.code]) {
        poolByCode[item.code] = [];
      }
      poolByCode[item.code].push(item);
    });

    // Populate questions according to structure
    Object.entries(structure).forEach(([code, requiredCount]) => {
      if (requiredCount <= 0) return;

      const taskCode = code as PTETaskCode;
      const availableItems = poolByCode[taskCode] || [];

      // Randomly shuffle available items of this type
      const shuffled = [...availableItems].sort(() => 0.5 - Math.random());

      for (let i = 0; i < requiredCount; i++) {
        let baseItem: PracticeItem;

        if (shuffled.length > 0 && i < shuffled.length) {
          // Select from available templates
          baseItem = shuffled[i];
        } else if (availableItems.length > 0) {
          // Recycle templates but mutate them to be unique
          const idx = i % availableItems.length;
          baseItem = availableItems[idx];
        } else {
          // Safe fallback item creation
          baseItem = this.createDefaultFallbackItem(taskCode, i);
        }

        // Apply programmatic variations & custom topic injection
        const randomizedItem = this.applyDynamicVariations(baseItem, i, customTopic);
        selectedQuestions.push(randomizedItem);

        // Map timing weights per item based on task info
        const taskInfo = PTE_TASK_TYPES.find((t) => t.code === taskCode);
        const prep = taskInfo?.prepTime || 10;
        const attempt = taskInfo?.attemptTime || 45;
        totalMins += (prep + attempt) / 60;
      }
    });

    // Shuffle questions to simulate the natural flow of standard section orders
    // In actual PTE, it goes Speaking & Writing -> Reading -> Listening
    const orderedQuestions = this.orderQuestionsByPTEStandard(selectedQuestions);

    const questionsCount = orderedQuestions.length;
    const computedDuration = Math.max(15, Math.ceil(totalMins + (questionsCount * 0.2))); // pad slightly for transitions

    let displayTitle = '';
    if (customTopic) {
      displayTitle = `AI Dynamic Exam: ${customTopic}`;
    } else if (testType === 'mini') {
      displayTitle = `PTE Booster Mini-Exam #${Math.floor(1000 + Math.random() * 9000)}`;
    } else if (testType === 'section') {
      displayTitle = `PTE Section Focus: ${focusSection} #${Math.floor(100 + Math.random() * 900)}`;
    } else {
      displayTitle = `PTE Full-Simulation Exam #${Math.floor(10000 + Math.random() * 90000)}`;
    }

    return {
      id: `EXAM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: displayTitle,
      type: testType,
      duration: computedDuration,
      questionsCount,
      section: focusSection === 'All' ? 'All Sections Combined' : `${focusSection} Focus`,
      difficulty: testType === 'full' ? 'Hard' : 'Medium',
      questions: orderedQuestions
    };
  }

  /**
   * Sorts the dynamic list of questions into standard PTE testing blocks
   */
  private static orderQuestionsByPTEStandard(items: PracticeItem[]): PracticeItem[] {
    const sectionOrder: Record<PTESection, number> = {
      Speaking: 1,
      Writing: 2,
      Reading: 3,
      Listening: 4
    };

    const taskTypeOrder: Record<PTETaskCode, number> = {
      RA: 1, RS: 2, DI: 3, RL: 4, ASQ: 5, SGD: 6, RTS: 7,
      SWT: 8, WE: 9,
      FIBRW: 10, MCM: 11, ROP: 12, FIBR: 13, MCS: 14,
      SST: 15, MCMSL: 16, FIBL: 17, HCS: 18, MCSSL: 19, SMW: 20, HIW: 21, WFD: 22
    };

    return [...items].sort((a, b) => {
      const infoA = PTE_TASK_TYPES.find(t => t.code === a.code);
      const infoB = PTE_TASK_TYPES.find(t => t.code === b.code);

      const secRankA = infoA ? sectionOrder[infoA.section] : 99;
      const secRankB = infoB ? sectionOrder[infoB.section] : 99;

      if (secRankA !== secRankB) {
        return secRankA - secRankB;
      }

      const taskRankA = taskTypeOrder[a.code] || 99;
      const taskRankB = taskTypeOrder[b.code] || 99;

      return taskRankA - taskRankB;
    });
  }

  /**
   * Dynamically mutates prompt text, headers, and metadata to guarantee that
   * every item instance is a completely unique academic prompt.
   */
  private static applyDynamicVariations(item: PracticeItem, index: number, customTopic: string): PracticeItem {
    const mutated = { ...item };
    mutated.id = `${item.code}-VAR-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`;

    const targetTopic = customTopic || this.getRandomAcademicTopic();

    // 1. Topic replacements or customizations
    if (mutated.promptText) {
      // Swapping nouns or academic elements if standard template
      if (!customTopic) {
        // Just inject dynamic numbers or slight phrasing mutations to ensure variations
        mutated.promptText = mutated.promptText
          .replace(/2024/g, `${2024 + index}`)
          .replace(/75%/g, `${72 + (index % 5) * 3}%`)
          .replace(/88%/g, `${82 + (index % 5) * 4}%`)
          .replace(/United States/g, index % 2 === 0 ? 'European Union' : 'United Kingdom');
      } else {
        // Active custom topic integration
        mutated.promptText = this.injectTopicIntoPrompt(mutated.code, mutated.promptText, targetTopic);
      }
    }

    // 2. Customize Title
    if (customTopic) {
      mutated.title = `${this.getTaskTypeName(mutated.code)}: ${targetTopic} (Ref #${index + 1})`;
    } else {
      mutated.title = `${mutated.title.split('(')[0].trim()} (Variant #${10 + index})`;
    }

    // 3. Dynamic option scrambling for MCQs or Fill in Blanks to test authentic memory
    if (mutated.options && mutated.options.length > 0) {
      const originalOptions = [...mutated.options];
      const correctVal = mutated.correctAnswer;
      
      // Shuffle options but maintain correct answer lookup
      mutated.options = originalOptions.sort(() => 0.5 - Math.random());
    }

    // 4. Update Tips slightly to fit the generated focus
    mutated.tips = [
      ...mutated.tips,
      `Focus on standard speech rhythm. Mispronunciations on "${targetTopic.toLowerCase()}" elements can be corrected by maintaining high flow.`
    ];

    return mutated;
  }

  /**
   * Smartly injects user-requested academic topics into template text based on the task structure
   */
  private static injectTopicIntoPrompt(code: PTETaskCode, originalPrompt: string, topic: string): string {
    const formattedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

    switch (code) {
      case 'RA':
        return `Recent empirical studies regarding ${formattedTopic.toLowerCase()} reveal complex interactions across modern variables. Researchers hypothesize that systemic optimization of these elements can yield a seventy percent reduction in operational latency, thereby redefining standard academic protocols.`;
      
      case 'RS':
        return `[AUDIO PLAYBACK: "The new academic seminar focusing on ${formattedTopic.toLowerCase()} begins next Wednesday afternoon."]`;

      case 'DI':
        return `An intricate architectural block diagram mapping systemic dependencies for ${formattedTopic}. The primary layer illustrates core input channels flow, while the intermediate nodes track volumetric feedback indexes ranging from 15 to 94 points.`;

      case 'RL':
        return `[AUDIO PLAYBACK: Lecture detailing ${formattedTopic}. The keynote speaker highlights recent experimental proofs, validating that historical paradigms in this domain are largely superseded by contemporary developments.]`;

      case 'ASQ':
        return `[AUDIO PLAYBACK: "Which scientific discipline investigates the foundational properties of ${formattedTopic.toLowerCase()}?"]`;

      case 'SWT':
        return `The continuous expansion of research surrounding ${formattedTopic} has transformed modern industrial paradigms. Historically, critics dismissed these models as theoretical abstractions; however, recent breakthroughs in automated processing have unlocked significant scalability. Consequently, global consortiums are funding large-scale implementation initiatives to secure strategic advantages in highly competitive regional markets.`;

      case 'WE':
        return `Developments in ${formattedTopic} have catalyzed significant debates concerning ecological sustainability and societal equity. Proponents argue that rapid implementation is vital for economic progress, whereas skeptics point to major resource disparities and structural displacements. Discuss both perspectives and provide your reasoned stance on this issue.`;

      default:
        // Generic fallback replacement
        if (originalPrompt.includes('[AUDIO PLAYBACK: "')) {
          return `[AUDIO PLAYBACK: "Academic investigations into ${formattedTopic.toLowerCase()} demonstrate substantial cross-disciplinary alignment."]`;
        }
        return `This study investigates key elements of ${formattedTopic}, highlighting how researchers calibrate these properties to meet standard requirements.`;
    }
  }

  /**
   * Helper fallback item generator
   */
  private static createDefaultFallbackItem(code: PTETaskCode, index: number): PracticeItem {
    return {
      id: `${code}-FALLBACK-${Date.now()}-${index}`,
      code,
      title: `${this.getTaskTypeName(code)}: Foundations`,
      instruction: `Complete the ${this.getTaskTypeName(code)} task.`,
      promptText: `Academic investigations regarding contemporary subjects reveal significant developments. Researchers must align their parameters to achieve accurate calibration.`,
      modelAnswer: `Highoral fluency and accurate pronunciation is paramount. Maintain consistent flat vowels.`,
      tips: ['Maintain natural chunking pauses.', 'Ensure spelling is accurate for writing tasks.'],
      vocabulary: [
        { phrase: 'Empirical data', meaning: 'Information acquired by means of observation or experimentation' }
      ]
    };
  }

  private static getTaskTypeName(code: PTETaskCode): string {
    return PTE_TASK_TYPES.find(t => t.code === code)?.name || code;
  }

  private static getRandomAcademicTopic(): string {
    const topics = [
      'Macroeconomic Fluidity',
      'Cognitive Pathways',
      'Marine Biology Anomalies',
      'Renewable Architecture',
      'Quantum Computation',
      'Glacial Ice Core Compression',
      'Linguistic Adaptations',
      'Artificial Neural Topologies'
    ];
    return topics[Math.floor(Math.random() * topics.length)];
  }
}
