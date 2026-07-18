import { prisma } from './db';
import { logger } from './logger';
import { config } from './config';

const SAMPLE_QUESTIONS = [
  {
    taskCode: 'RA',
    section: 'Speaking',
    title: 'The Northern Lights Observatory',
    instruction: 'Read the passage aloud with clear pronunciation, appropriate pace, and natural intonation.',
    promptText:
      'The establishment of the Northern Lights Observatory in the remote Arctic region of Svalbard has provided scientists with unprecedented access to auroral phenomena. Researchers from twelve countries collaborate at the facility, studying the interaction between solar particles and the Earth\'s magnetic field. The data collected has advanced our understanding of space weather and its potential impact on global communication systems.',
    promptHtml: '<p>The establishment of the <strong>Northern Lights Observatory</strong> in the remote Arctic region of Svalbard has provided scientists with unprecedented access to auroral phenomena. Researchers from twelve countries collaborate at the facility, studying the interaction between solar particles and the Earth\'s magnetic field. The data collected has advanced our understanding of space weather and its potential impact on global communication systems.</p>',
    difficulty: 'medium',
    tagsJson: JSON.stringify(['astronomy', 'science', 'research']),
    source: 'original_sample',
    explanation: 'Focus on clear enunciation of scientific terminology like "auroral" and "magnetic field." Maintain a steady pace, pausing briefly after commas and periods. The passage contains compound sentences — ensure your intonation rises slightly at commas and falls at periods.',
  },
  {
    taskCode: 'WE',
    section: 'Writing',
    title: 'Urban Vertical Farming and Food Security',
    instruction: 'Write an essay of 200-300 words on the given topic, presenting a clear argument with supporting examples and a logical conclusion.',
    promptText:
      'As global urban populations continue to grow, traditional agricultural supply chains face increasing pressure. Vertical farming — the practice of growing crops in stacked indoor environments using controlled conditions — has emerged as a potential solution. Discuss the benefits and limitations of vertical farming for achieving urban food security. Provide specific examples to support your argument.',
    difficulty: 'hard',
    tagsJson: JSON.stringify(['agriculture', 'urban planning', 'sustainability']),
    source: 'original_sample',
    sampleAnswer:
      'Vertical farming represents a promising innovation in the quest for urban food security, offering significant benefits in land efficiency and resource conservation. By cultivating crops in vertically stacked layers within climate-controlled warehouses, these facilities can produce yields up to 100 times greater per square metre than traditional farms. Moreover, the closed-loop hydroponic systems use approximately 95% less water and eliminate the need for chemical pesticides, reducing environmental impact.\n\nHowever, vertical farming faces substantial limitations that must be addressed before widespread adoption is feasible. The initial capital investment for LED lighting arrays, automated climate controls, and structural modifications is prohibitively high, making the produce more expensive than conventionally grown alternatives. Additionally, the substantial electricity requirements — primarily for artificial lighting — mean that unless powered by renewable energy sources, vertical farms may have a larger carbon footprint than field agriculture.\n\nDespite these challenges, targeted applications of vertical farming show considerable promise. Cities such as Singapore and Tokyo have successfully integrated vertical farms into their food strategies, using them to supplement imported produce with fresh leafy greens and herbs. These implementations demonstrate that while vertical farming may not replace conventional agriculture, it can enhance urban food resilience, particularly for perishable crops with short shelf lives.',
    explanation:
      'Strong essays should address both sides of the argument. Key points include land efficiency and water conservation (benefits), and high energy costs and capital requirements (limitations). The conclusion should acknowledge that vertical farming complements rather than replaces traditional agriculture. Use the Singapore/Tokyo examples to illustrate real-world application.',
  },
  {
    taskCode: 'ROP',
    section: 'Reading',
    title: 'The Development of Digital Communication Protocols',
    instruction: 'Reorder the given text boxes into a coherent paragraph by dragging them into the correct sequence.',
    promptText:
      'Arrange the following sentences in the correct order to form a logical paragraph about the development of digital communication protocols.',
    optionsJson: JSON.stringify([
      'These early systems, however, were proprietary — each manufacturer used its own set of rules, making communication between different systems nearly impossible.',
      'The standardisation of protocols fundamentally transformed how information flows across global networks.',
      'In the 1970s, researchers at the Advanced Research Projects Agency developed a unified communication framework that any computer system could adopt.',
      'This breakthrough — known as the TCP/IP protocol suite — became the foundation upon which the modern internet was constructed.',
      'Before the 1960s, computers communicated through dedicated point-to-point connections using manufacturer-specific signalling methods.',
    ]),
    answerKeyJson: JSON.stringify({
      correctOrder: [4, 0, 2, 3, 1],
      explanation:
        'The passage follows a chronological structure: pre-1960s background, limitations of proprietary systems, the ARPA breakthrough in the 1970s, the TCP/IP protocol, and the transformative impact.',
    }),
    difficulty: 'medium',
    tagsJson: JSON.stringify(['technology', 'history', 'computing']),
    source: 'original_sample',
    explanation:
      'The correct order follows a chronological narrative: (1) pre-1960s situation, (2) problem with proprietary systems, (3) ARPA\'s solution in the 1970s, (4) TCP/IP as the result, (5) the lasting impact. Look for time markers ("Before the 1960s", "In the 1970s") and logical progression from problem to solution to impact.',
  },
  {
    taskCode: 'FIBL',
    section: 'Listening',
    title: 'Marine Ecosystem Restoration',
    instruction: 'Listen to the audio recording and fill in each blank with the correct word or phrase you hear.',
    promptText:
      'Marine ecosystem restoration has emerged as one of the most urgent environmental priorities of the ______ century. Coral reef degradation, driven by ocean warming and ______ pollution, affects approximately 25% of all marine species that depend on these habitats. Restoration projects in the Great Barrier Reef and the Caribbean have demonstrated that healthy coral populations can be ______ through careful transplantation and habitat management.',
    optionsJson: JSON.stringify({
      blanks: ['twenty-first', 'agricultural', 'regenerated'],
      distractors: {
        blank1: ['twentieth', 'nineteenth', 'eighteenth'],
        blank2: ['industrial', 'atmospheric', 'thermal'],
        blank3: ['restored', 'rehabilitated', 'reestablished'],
      },
    }),
    answerKeyJson: JSON.stringify({
      answers: [
        { position: 1, correct: 'twenty-first' },
        { position: 2, correct: 'agricultural' },
        { position: 3, correct: 'regenerated' },
      ],
    }),
    difficulty: 'easy',
    tagsJson: JSON.stringify(['environment', 'marine biology', 'conservation']),
    source: 'original_sample',
    audioUrl: null,
    explanation:
      'The first blank requires a century reference — "twenty-first" fits the context of contemporary environmental priorities. The second blank narrows the type of pollution affecting coral reefs; "agricultural" runoff is the primary terrestrial pollutant reaching marine ecosystems. The third blank uses "regenerated" as it specifically refers to biological regrowth of coral organisms.',
  },
];

export async function seedSampleQuestions(): Promise<void> {
  if (config.isProduction) {
    logger.info('Skipping question bank seed in production');
    return;
  }

  try {
    const existingCount = await prisma.questionBankItem.count();
    if (existingCount > 0) {
      logger.info(`Question bank already has ${existingCount} items, skipping seed`);
      return;
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    for (const q of SAMPLE_QUESTIONS) {
      await prisma.questionBankItem.create({
        data: {
          ...q,
          status: 'published',
          createdByUserId: adminUser?.id || null,
        } as any,
      });
    }

    logger.info(`Seeded ${SAMPLE_QUESTIONS.length} original sample question bank items`);
  } catch (err: any) {
    logger.error('Question bank seed error', { error: err.message });
  }
}
