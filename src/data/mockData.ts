/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskTypeInfo, PracticeItem, Course, Lesson, Flashcard, MockTest, TestAttempt, Submission } from '../types';

export const PTE_TASK_TYPES: TaskTypeInfo[] = [
  // Speaking
  {
    code: 'RA',
    name: 'Read Aloud',
    section: 'Speaking',
    description: 'Read a short passage aloud into your microphone. Tests pronunciation and fluency.',
    prepTime: 40,
    attemptTime: 40,
  },
  {
    code: 'RS',
    name: 'Repeat Sentence',
    section: 'Speaking',
    description: 'Listen to a short sentence and repeat it exactly as you heard it. Tests listening and speaking.',
    prepTime: 3,
    attemptTime: 15,
  },
  {
    code: 'DI',
    name: 'Describe Image',
    section: 'Speaking',
    description: 'Analyze an image (chart, map, diagram, or table) and explain it in detail. Tests oral organization.',
    prepTime: 25,
    attemptTime: 40,
  },
  {
    code: 'RL',
    name: 'Retell Lecture',
    section: 'Speaking',
    description: 'Listen to an academic lecture and retell it in your own words. Tests listening, oral delivery.',
    prepTime: 10,
    attemptTime: 40,
  },
  {
    code: 'ASQ',
    name: 'Answer Short Question',
    section: 'Speaking',
    description: 'Listen to a simple question and provide a single or multi-word answer. Tests lexical retrieval.',
    prepTime: 3,
    attemptTime: 10,
  },
  {
    code: 'SGD',
    name: 'Summarize Group Discussion',
    section: 'Speaking',
    description: 'Listen to a group discussion and explain the key findings, arguments and agreements.',
    prepTime: 10,
    attemptTime: 40,
  },
  {
    code: 'RTS',
    name: 'Respond to a Situation',
    section: 'Speaking',
    description: 'Read a scenario and describe the action or verbal response you would take in that situation.',
    prepTime: 20,
    attemptTime: 40,
  },

  // Writing
  {
    code: 'SWT',
    name: 'Summarize Written Text',
    section: 'Writing',
    description: 'Read a passage and write a one-sentence summary of 5-75 words. Tests reading comprehension and sentence structure.',
    prepTime: 0,
    attemptTime: 600, // 10 minutes
  },
  {
    code: 'WE',
    name: 'Write Essay',
    section: 'Writing',
    description: 'Write a persuasive academic essay of 200-300 words on a given topic. Tests structure, grammar, and range.',
    prepTime: 0,
    attemptTime: 1200, // 20 minutes
  },

  // Reading
  {
    code: 'MCS',
    name: 'Multiple-choice, Choose Single Answer',
    section: 'Reading',
    description: 'Read a short text and answer a single-choice question based on content or tone.',
    prepTime: 0,
    attemptTime: 120,
  },
  {
    code: 'MCM',
    name: 'Multiple-choice, Choose Multiple Answers',
    section: 'Reading',
    description: 'Read a text and select all correct statements from a checklist. Multi-selection.',
    prepTime: 0,
    attemptTime: 180,
  },
  {
    code: 'ROP',
    name: 'Re-order Paragraphs',
    section: 'Reading',
    description: 'Drag and drop scrambled text paragraphs into the correct logical order.',
    prepTime: 0,
    attemptTime: 240,
  },
  {
    code: 'FIBR',
    name: 'Reading: Fill in the Blanks',
    section: 'Reading',
    description: 'Drag words from a pool at the bottom to fill empty boxes in the text passage.',
    prepTime: 0,
    attemptTime: 180,
  },
  {
    code: 'FIBRW',
    name: 'Reading & Writing: Fill in the Blanks',
    section: 'Reading',
    description: 'Select the best fit word for each drop-down menu inside the sentence context.',
    prepTime: 0,
    attemptTime: 180,
  },

  // Listening
  {
    code: 'SST',
    name: 'Summarize Spoken Text',
    section: 'Listening',
    description: 'Listen to an audio recording and write a summary of 50-70 words. Tests listening and writing spelling.',
    prepTime: 12,
    attemptTime: 600, // 10 minutes
  },
  {
    code: 'MCMSL',
    name: 'Multiple-choice, Choose Multiple Answers (L)',
    section: 'Listening',
    description: 'Listen to a clip and select multiple correct answers based on the recording.',
    prepTime: 10,
    attemptTime: 180,
  },
  {
    code: 'FIBL',
    name: 'Listening: Fill in the Blanks',
    section: 'Listening',
    description: 'Type missing words into empty text boxes while listening to a continuous audio playback.',
    prepTime: 10,
    attemptTime: 180,
  },
  {
    code: 'HCS',
    name: 'Highlight Correct Summary',
    section: 'Listening',
    description: 'Listen to a recording and select the option that best summarizes the recording.',
    prepTime: 10,
    attemptTime: 180,
  },
  {
    code: 'MCSSL',
    name: 'Multiple-choice, Choose Single Answer (L)',
    section: 'Listening',
    description: 'Listen and answer a single multiple-choice question on main idea or details.',
    prepTime: 10,
    attemptTime: 120,
  },
  {
    code: 'SMW',
    name: 'Select Missing Word',
    section: 'Listening',
    description: 'Listen to a clip where the final word/phrase is replaced by a beep. Choose the correct completion.',
    prepTime: 10,
    attemptTime: 120,
  },
  {
    code: 'HIW',
    name: 'Highlight Incorrect Words',
    section: 'Listening',
    description: 'Read transcript while listening. Click/tap words that differ from the spoken audio.',
    prepTime: 10,
    attemptTime: 120,
  },
  {
    code: 'WFD',
    name: 'Write from Dictation',
    section: 'Listening',
    description: 'Listen to a short sentence and type it exactly as spoken. Highly weighted task type.',
    prepTime: 10,
    attemptTime: 45,
  },
];

export const PRACTICE_ITEMS: Record<string, PracticeItem> = {
  RA: {
    id: 'RA-001',
    code: 'RA',
    title: 'The Great Barrier Reef',
    instruction: 'Look at the text below. In 40 seconds, you must read this text aloud as naturally and clearly as possible. You have 40 seconds to read aloud.',
    promptText: 'The Great Barrier Reef is the world\'s largest coral reef system composed of over 2,900 individual reefs and 900 islands stretching for over 2,300 kilometres over an area of approximately 344,400 square kilometres. The reef is located in the Coral Sea, off the coast of Queensland, Australia.',
    modelAnswer: 'A high-scoring answer requires standard phrasing, clear pronunciation of numerals like \'two-thousand nine-hundred\' and \'three-hundred and forty-four thousand four-hundred\', with appropriate pauses at punctuation marks.',
    tips: [
      'Speak at a moderate, natural pace. Do not rush or speak too slowly.',
      'Group words into meaningful phrases to improve your oral fluency.',
      'Sustain your voice clearly until the final full stop.'
    ],
    vocabulary: [
      { phrase: 'Composed of', meaning: 'Made up of or formed from distinct parts' },
      { phrase: 'Approximately', meaning: 'Used to show that something is almost, but not completely, accurate' }
    ],
  },
  RS: {
    id: 'RS-001',
    code: 'RS',
    title: 'Lecture Relocation',
    instruction: 'You will hear a sentence. Please repeat the sentence exactly as you hear it.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Standard test mock audio
    promptText: '[AUDIO PLAYBACK: "The chemistry lecture scheduled for Tuesday afternoon has been moved to the main science auditorium."]',
    modelAnswer: 'The chemistry lecture scheduled for Tuesday afternoon has been moved to the main science auditorium.',
    tips: [
      'Focus on the meaning of the sentence rather than just memorizing individual words.',
      'Copy the speaker\'s intonation and stress points closely.',
      'If you miss a word, do not hesitate; keep moving and preserve the sentence structure.'
    ],
    vocabulary: [
      { phrase: 'Scheduled for', meaning: 'Planned to happen at a particular time' },
      { phrase: 'Auditorium', meaning: 'A large building or hall used for public gatherings or lectures' }
    ],
  },
  DI: {
    id: 'DI-001',
    code: 'DI',
    title: 'Global Energy Sources 2026',
    instruction: 'Look at the chart below. In 25 seconds, please speak into the microphone and describe in detail what the chart is showing. You will have 40 seconds to give your response.',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80', // Solar panels
    promptText: 'A pie chart illustrating global energy shares: Fossil Fuels (72%), Hydropower (12%), Nuclear power (8%), Wind (5%), and Solar Energy (3%). Solar energy has a minor share but represents the fastest growing sector with a 24% year-on-year increase.',
    modelAnswer: 'This pie chart presents the distribution of global energy sources for the year 2026. The dominant share is held by Fossil Fuels at seventy-two percent, followed by Hydropower at twelve percent and Nuclear Power at eight percent. Wind and Solar represent the smallest shares at five and three percent respectively. In conclusion, while fossil fuels remain the primary global energy source, renewable sources such as wind and solar are beginning to emerge with significant momentum.',
    tips: [
      'Include the title and overall structure in your first sentence.',
      'Mention the highest and lowest values to show a clear contrast.',
      'Never pause for more than 2 seconds; keep the flow going even if you make a mistake.'
    ],
    vocabulary: [
      { phrase: 'Dominant share', meaning: 'The largest or most influential portion of a distributed whole' },
      { phrase: 'Emerging momentum', meaning: 'Developing power or progress that is becoming visible' }
    ],
  },
  RL: {
    id: 'RL-001',
    code: 'RL',
    title: 'Cognitive Plasticity',
    instruction: 'You will hear a lecture. After listening to the lecture, in 10 seconds, please speak into the microphone and retell what you have just heard from the lecture in your own words. You will have 40 seconds to give your response.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    promptText: '[AUDIO PLAYBACK: Lecture discussing cognitive plasticity, explaining how the adult brain reorganizes neural pathways, adapts to trauma, and continues to grow synapses when exposed to demanding learning environments.]',
    modelAnswer: 'The speaker in this lecture discussed cognitive plasticity and the capabilities of the adult brain. He highlighted that the brain is not a static organ, but rather dynamic, reorganizing neural pathways and developing new synapses when stimulated. Furthermore, the lecture emphasized brain resilience and its capacity to recover and adapt after trauma, especially in intellectually demanding environments. Ultimately, cognitive plasticity supports lifelong learning and neurological health.',
    tips: [
      'Take quick notes of key phrases and nouns during the playback.',
      'Use a structured template: "The speaker discussed...", "Firstly, she pointed out...", "In addition..."',
      'Speak smoothly without self-correction.'
    ],
    vocabulary: [
      { phrase: 'Neural pathways', meaning: 'A series of connected nerves along which electrical impulses travel' },
      { phrase: 'Static organ', meaning: 'An organ that does not change or grow (contrasted with plastic/dynamic)' }
    ],
  },
  ASQ: {
    id: 'ASQ-001',
    code: 'ASQ',
    title: 'Astronomical Instruments',
    instruction: 'You will hear a question. Please give a simple and short answer. Often just one or a few words is enough.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    promptText: '[AUDIO PLAYBACK: "What instrument is used by astronomers to view distant stars and galaxies?"]',
    modelAnswer: 'Telescope',
    tips: [
      'Listen closely to the question\'s interrogative words (Who, What, Where, Which).',
      'Provide a direct, single-word or short phrase response immediately.',
      'Do not give a long sentence as it is not required.'
    ],
    vocabulary: [
      { phrase: 'Astronomer', meaning: 'An expert in or student of astronomy and celestial bodies' }
    ],
  },
  SGD: {
    id: 'SGD-001',
    code: 'SGD',
    title: 'Remote Work Productivity',
    instruction: 'Listen to a group discussion among students and professionals about remote work productivity. You will then have to summarize the consensus and points of disagreement.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    promptText: '[AUDIO PLAYBACK: Group of three panel members discussing remote work. Speaker A argues that productivity increased because of reduced commute times, Speaker B points out psychological isolation, and Speaker C proposes hybrid models as a solution.]',
    modelAnswer: 'This discussion centered on the complex impacts of remote work productivity. While there was absolute consensus that eliminating daily commutes saves significant time and boosts task completion, the speakers disagreed on social consequences, noting that psychological isolation could degrade collaboration. In conclusion, the group agreed that a balanced hybrid model offers the optimal synthesis of flexibility and interpersonal connection.',
    tips: [
      'Identify the main argument of each individual speaker in the conversation.',
      'Focus heavily on where the speakers find common ground or compromise.',
      'Structure your explanation with clear transitions between points of view.'
    ],
    vocabulary: [
      { phrase: 'Commute times', meaning: 'The duration spent travelling to and from a place of work' },
      { phrase: 'Optimal synthesis', meaning: 'The most favorable combination of different elements' }
    ],
  },
  RTS: {
    id: 'RTS-001',
    code: 'RTS',
    title: 'Double-booked Meeting Room',
    instruction: 'Read the situation described below. After 20 seconds, you will be asked to explain what action you would take or what you would say in this scenario.',
    promptText: 'Scenario: You have booked a meeting room for an important client presentation. However, when you arrive, a colleague and their team are already in the room, claiming they have also booked it for their weekly sprint update. Your client is arriving in 5 minutes.',
    modelAnswer: 'In this situation, I would first check our calendar bookings on my phone to verify my reservation. I would then calmly explain to my colleague that my client is arriving in five minutes for a critical presentation. I would suggest helping them find another empty space or offering to swap rooms, emphasizing the external client priority, while maintaining a professional and collaborative tone.',
    tips: [
      'Address both the practical solution and the social etiquette required.',
      'Speak in the first person ("I would approach...") or simulated direct speech.',
      'Keep your speech calm, organized, and confident.'
    ],
    vocabulary: [
      { phrase: 'Double-booked', meaning: 'Reservations made for two different parties at the same time' },
      { phrase: 'Sprint update', meaning: 'A short meeting in agile project management to review recent progress' }
    ],
  },
  SWT: {
    id: 'SWT-001',
    code: 'SWT',
    title: 'The History of Paper',
    instruction: 'Read the passage below and summarize it in one sentence using between 5 and 75 words. You have 10 minutes to finish this task.',
    promptText: 'Paper has played a critical role in human civilization, serving as the primary medium for recording thoughts, transmitting knowledge, and conducting administrative affairs. Although invented in China around 105 AD by Cai Lun, paper production methods took centuries to reach the Western world. When it finally arrived in Europe via Islamic Spain in the 11th century, it revolutionized bookmaking, which was previously reliant on expensive parchment made of animal skins. The affordability of paper subsequently catalyzed the development of printing presses and fueled the spread of literacy and scientific enquiry during the Renaissance.',
    modelAnswer: 'Although invented in China around 105 AD, the centuries-long journey of paper to Europe revolutionized book production, eventually catalyzing the printing press and fueling the rapid spread of literacy and scientific enquiry.',
    tips: [
      'Ensure your summary is exactly ONE sentence. More than one sentence gets a zero score.',
      'Start with a capital letter and end with exactly one full stop.',
      'Keep your word count strictly between 5 and 75 words.'
    ],
    vocabulary: [
      { phrase: 'Catalyzed', meaning: 'Accelerated or brought about an event or change' },
      { phrase: 'Enquiry', meaning: 'An act of asking for information or investigating a matter' }
    ],
  },
  WE: {
    id: 'WE-001',
    code: 'WE',
    title: 'Automation and Employment',
    instruction: 'You will have 20 minutes to plan, write and revise an essay about the topic below. Your essay should be between 200 and 300 words.',
    promptText: 'Artificial Intelligence and advanced automation are predicted to replace a massive percentage of manual and cognitive jobs. Will this technological shift result in widespread structural unemployment, or will it create entirely new sectors of superior employment? Discuss both sides and give your own perspective.',
    modelAnswer: 'In the contemporary era, the rapid acceleration of artificial intelligence and robotics has initiated a rigorous debate regarding the future of work. While skeptics argue that automation will cause devastating structural unemployment, proponents contend that this evolution will liberate workers from repetitive tasks and foster new economic sectors. In my view, technology acts as an economic rejuvenator that ultimately generates superior employment opportunities.\n\nOn the one hand, critics are justified in their anxiety regarding short-term disruptions. For instance, autonomous vehicles threaten the livelihoods of millions of transport workers worldwide. Similarly, basic administrative roles are rapidly being replaced by efficient software algorithms. If governments fail to initiate robust retraining programs, these displaced workers face severe financial instability, leading to widening economic inequality.\n\nOn the other hand, history demonstrates that industrial shifts always generate novel occupations. When agriculture was mechanized, workers migrated to manufacturing and service sectors. AI will likewise require engineers, content curators, and ethical supervisors. Furthermore, by delegating mundane calculations to machines, human employees can focus on empathy-driven, creative, and strategic tasks that computers cannot replicate.\n\nIn conclusion, although the transition period presents tangible social challenges, advanced automation is not a harbinger of permanent job loss. Instead, it serves as a catalyst for human skill elevation, creating highly sophisticated, meaningful jobs that enrich society.',
    tips: [
      'Adhere strictly to the word limit (200 - 300 words).',
      'Use a clear structure: Introduction, Body Paragraph 1 (Counter-argument), Body Paragraph 2 (Your argument), Conclusion.',
      'Incorporate academic transition words such as "Furthermore", "In contrast", "Consequently".'
    ],
    vocabulary: [
      { phrase: 'Structural unemployment', meaning: 'Unemployment resulting from industrial reorganization, typically due to technological change' },
      { phrase: 'Harbinger of', meaning: 'A sign or indicator that foreshadows a future event' }
    ],
  },
  MCS: {
    id: 'MCS-001',
    code: 'MCS',
    title: 'The Nitrogen Cycle',
    instruction: 'Read the text and answer the multiple-choice question by selecting only one correct option.',
    promptText: 'Nitrogen is essential for all living organisms because it is a fundamental component of amino acids, proteins, and nucleic acids. Although nitrogen gas makes up approximately 78% of Earth\'s atmosphere, most organisms cannot utilize atmospheric nitrogen directly. It must first be converted into reactive nitrogen species, such as ammonium or nitrate, through chemical or biological processes known as nitrogen fixation. Most biological fixation is performed by specialized bacteria, which form symbiotic relationships with the root nodules of legumes, converting the inert gas into usable nutrients for the host plants.',
    options: [
      'Most living organisms can absorb nitrogen gas directly from the surrounding air.',
      'Nitrogen fixation is predominantly carried out by specialized bacteria cooperating with legumes.',
      'Chemical processes are the sole mechanism responsible for transforming inert nitrogen gas.',
      'Legumes convert nitrogen gas independently of any symbiotic microbial relationships.'
    ],
    correctAnswer: 'Nitrogen fixation is predominantly carried out by specialized bacteria cooperating with legumes.',
    modelAnswer: 'Option B is correct because the passage explicitly states: "Most biological fixation is performed by specialized bacteria, which form symbiotic relationships with the root nodules of legumes."',
    tips: [
      'Identify key terms in the question and scan the passage for those specific synonyms.',
      'Eliminate options containing extreme words like "sole", "always", "every" unless specifically stated in the text.'
    ],
    vocabulary: [
      { phrase: 'Symbiotic relationships', meaning: 'Interspecies interactions where both organisms derive mutual benefit' },
      { phrase: 'Inert gas', meaning: 'A gas that does not readily undergo chemical reactions' }
    ],
  },
  MCM: {
    id: 'MCM-001',
    code: 'MCM',
    title: 'The Rise of Gutenberg\'s Press',
    instruction: 'Read the text and answer the question by selecting all the correct responses. More than one option may be correct.',
    promptText: 'Johannes Gutenberg\'s development of the movable type printing press in mid-15th century Germany is widely considered one of the most influential events in human history. Prior to Gutenberg, books were laboriously hand-copied by scribes or printed using fixed wooden blocks, making them rare, expensive luxury items accessible only to the elite. Gutenberg\'s press utilized an alloy of lead, tin, and antimony that melted quickly and resisted wear, combined with oil-based ink that adhered to metal type better than water-based alternatives. This technological convergence reduced book production costs by over 99%, triggering an explosion in literature availability, standardizing dialects, and laying the intellectual foundations for the scientific revolution.',
    options: [
      'Gutenberg\'s press decreased book production expenses dramatically.',
      'Gutenberg relied solely on pre-existing water-based inks for his printing metal type.',
      'The alloy developed by Gutenberg resisted decay and could be reused repeatedly.',
      'Books before Gutenberg were common items owned by standard households.'
    ],
    correctAnswer: [
      'Gutenberg\'s press decreased book production expenses dramatically.',
      'The alloy developed by Gutenberg resisted decay and could be reused repeatedly.'
    ],
    modelAnswer: 'Options A and C are correct. The text notes cost reductions of over 99% (Option A) and that the metal alloy "resisted wear" allowing it to be used repeatedly (Option C). Option B and D are contradictory to the text.',
    tips: [
      'Be careful: PTE penalizes incorrect selections in this task type with negative points.',
      'Do not guess; only select options you are 100% certain are supported by the passage.'
    ],
    vocabulary: [
      { phrase: 'Movable type', meaning: 'System of printing using independent metal pieces for letters and symbols' },
      { phrase: 'Technological convergence', meaning: 'The coming together of different technologies to form a superior system' }
    ],
  },
  ROP: {
    id: 'ROP-001',
    code: 'ROP',
    title: 'The Lifecycle of Stars',
    instruction: 'The text boxes in the left panel have been scrambled. Drag and drop them into the correct logical order in the right panel.',
    options: [
      'Eventually, the hydrogen fuel in the core runs low, causing the star to expand into a red giant.',
      'This dense cloud collapses under gravity, igniting nuclear fusion and birthing a stable main-sequence star.',
      'Stars begin their lives within massive interstellar clouds of gas and dust known as nebulae.',
      'Finally, after shedding its outer layers, the remnant core cools to become a dense, silent white dwarf.'
    ],
    correctAnswer: [
      'Stars begin their lives within massive interstellar clouds of gas and dust known as nebulae.',
      'This dense cloud collapses under gravity, igniting nuclear fusion and birthing a stable main-sequence star.',
      'Eventually, the hydrogen fuel in the core runs low, causing the star to expand into a red giant.',
      'Finally, after shedding its outer layers, the remnant core cools to become a dense, silent white dwarf.'
    ],
    modelAnswer: 'The correct order is C, B, A, D. First we introduce the origin (clouds), then the collapse and ignition (birth), then the subsequent exhaustion of hydrogen (expansion), and finally the remaining core (death).',
    tips: [
      'Look for the topic sentence that can stand completely alone (no pronouns or transitional words like "Finally" or "This").',
      'Look for pronoun links: "This dense cloud" links directly to "nebulae/clouds of gas and dust" in the previous box.'
    ],
    vocabulary: [
      { phrase: 'Interstellar', meaning: 'Occurring or situated between stars' },
      { phrase: 'Remnant core', meaning: 'The small, highly compressed center left behind after a star collapses' }
    ],
  },
  FIBR: {
    id: 'FIBR-001',
    code: 'FIBR',
    title: 'Glacial Dynamics',
    instruction: 'In the text below, some words are missing. Drag words from the pool to the correct boxes.',
    promptText: 'Glaciers are massive rivers of ice that move very slowly under the force of [1]. They are formed in areas where the [2] of snow exceeds its ablation over many years. As new snow falls, it compresses older layers into dense glacial ice, forming a natural [3] of climate history.',
    options: ['gravity', 'accumulation', 'archive', 'speed', 'temperature', 'melting'],
    correctAnswer: ['gravity', 'accumulation', 'archive'],
    modelAnswer: '[1] gravity, [2] accumulation, [3] archive',
    tips: [
      'Analyze the part of speech needed. For instance, "force of..." requires a noun.',
      'Use collocation knowledge: "accumulation of snow" and "natural archive of climate history" are strong academic combinations.'
    ],
    vocabulary: [
      { phrase: 'Ablation', meaning: 'The removal of snow or ice from a glacier, primarily through melting or sublimation' }
    ],
  },
  FIBRW: {
    id: 'FIBRW-001',
    code: 'FIBRW',
    title: 'The Economics of Tariffs',
    instruction: 'Below is a text with several blanks. For each blank, select the best fitting word from the drop-down menu.',
    promptText: 'Tariffs are taxes imposed on imported goods. While they are often used to [1] domestic industries from foreign competition, they can also lead to higher [2] for consumers. Many economists argue that widespread tariffs disrupt international trade and reduce overall economic [3].',
    options: [
      'shield, endanger, ignore, expose',
      'prices, rewards, taxes, speeds',
      'efficiency, stability, inflation, debt'
    ],
    correctAnswer: ['shield', 'prices', 'efficiency'],
    modelAnswer: '[1] shield, [2] prices, [3] efficiency',
    tips: [
      'Read the entire sentence to understand the context and tone before making a choice.',
      'Pay close attention to grammar and prepositions immediately preceding or following the blank.'
    ],
    vocabulary: [
      { phrase: 'Imposed on', meaning: 'Forced or established as a compulsory rule or tax' }
    ],
  },
  SST: {
    id: 'SST-001',
    code: 'SST',
    title: 'Urban Heat Islands',
    instruction: 'You will hear a short lecture. Write a summary of 50-70 words based on what you heard. You have 10 minutes to complete this task.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    promptText: '[AUDIO PLAYBACK: Lecture detailing the Urban Heat Island effect. Explains how dark concrete surfaces, lack of vegetation, and waste heat from air conditioning units make cities significantly warmer than surrounding rural areas, leading to increased power demands and pollution.]',
    modelAnswer: 'The lecture explained the Urban Heat Island effect, which causes metropolitan regions to be significantly hotter than surrounding rural fields. This temperature elevation is primarily driven by dark concrete structures, sparse vegetation cover, and artificial heat emissions from appliances. Ultimately, this thermal imbalance increases energy demands for air cooling and accelerates atmospheric pollution, demanding smart urban architecture.',
    tips: [
      'Your summary must be between 50 and 70 words.',
      'Double-check spelling, grammar, and punctuation. Every error reduces your score.',
      'Include keywords like concrete, vegetation, energy, and temperatures.'
    ],
    vocabulary: [
      { phrase: 'Thermal imbalance', meaning: 'A state where heat generation or absorption is unequal, creating temperature extremes' }
    ],
  },
  MCMSL: {
    id: 'MCMSL-001',
    code: 'MCMSL',
    title: 'Bioluminescent Organisms',
    instruction: 'Listen to the recording and answer the question by selecting all correct responses. More than one option may be correct.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    promptText: '[AUDIO PLAYBACK: Audio description of bioluminescence in deep-sea creatures, describing how animals produce light through chemical reactions involving luciferin and luciferase, using it to attract prey, deter predators, and communicate with potential mates.]',
    options: [
      'Bioluminescence relies on external ambient light sources to function.',
      'It is generated through biological chemical interactions inside the creature.',
      'Deep-sea species use light to deter enemies and avoid capture.',
      'Light production is used exclusively for locating nutrition and prey.'
    ],
    correctAnswer: [
      'It is generated through biological chemical interactions inside the creature.',
      'Deep-sea species use light to deter enemies and avoid capture.'
    ],
    modelAnswer: 'Options B and C are correct based on the audio description of chemical reactions and defense mechanisms against predators.',
    tips: [
      'Take notes of active verbs and nouns during the listening phase.',
      'Eliminate absolute statements such as "exclusively" or "only" unless explicitly stated.'
    ],
    vocabulary: [
      { phrase: 'Bioluminescence', meaning: 'The biochemical emission of light by living organisms' }
    ],
  },
  FIBL: {
    id: 'FIBL-001',
    code: 'FIBL',
    title: 'Microplastic Accumulation',
    instruction: 'You will hear a recording. Type the missing words in the empty boxes based on what you hear.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    promptText: 'Microplastics have now been detected in the most remote areas of our oceans. These tiny synthetic particles are ingested by marine life, where they can accumulate in tissues and enter the human [1] chain. Researchers are struggling to trace the [2] term health consequences of this invisible [3].',
    options: ['food', 'long', 'pollution'],
    correctAnswer: ['food', 'long', 'pollution'],
    modelAnswer: '[1] food, [2] long, [3] pollution',
    tips: [
      'Keep your eyes on the screen and your cursor ready to type immediately as the speaker passes the blank.',
      'If you are unsure of the spelling, write down a phonetic guess and refine it during review.'
    ],
    vocabulary: [
      { phrase: 'Ingested by', meaning: 'Taken into the body through swallowing or absorbing' }
    ],
  },
  HCS: {
    id: 'HCS-001',
    code: 'HCS',
    title: 'The Gold Standard',
    instruction: 'You will hear a recording. Click the radio button next to the paragraph that best summarizes the recording.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    promptText: '[AUDIO PLAYBACK: Lecture discussing the historical gold standard. Explains how currencies were pegged to actual physical gold, limiting inflation, but restricting governments from injecting capital during economic downturns, which eventually led to its abandonment in the 20th century.]',
    options: [
      'The gold standard was abandoned because gold became too abundant and lost its intrinsic value in global markets.',
      'The gold standard successfully prevented inflation but was abandoned because its rigidity prevented financial relief during recessions.',
      'Most modern governments are returning to the gold standard to stabilize volatile international exchange rates.',
      'The gold standard was a system developed to ensure that commercial banks had physical safe deposits for clients.'
    ],
    correctAnswer: 'The gold standard successfully prevented inflation but was abandoned because its rigidity prevented financial relief during recessions.',
    modelAnswer: 'Option B is correct because it covers both the primary benefit (inflation control) and the critical flaw (inability to handle recessions) mentioned in the recording.',
    tips: [
      'Avoid options that focus on minor details rather than the main concept of the passage.',
      'Read the options quickly before the audio begins to anticipate key themes.'
    ],
    vocabulary: [
      { phrase: 'Pegged to', meaning: 'Fixed or linked in value to another standard asset' }
    ],
  },
  MCSSL: {
    id: 'MCSSL-001',
    code: 'MCSSL',
    title: 'Renewable Storage Solutions',
    instruction: 'Listen to the recording and select the single correct option to answer the question.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    promptText: '[AUDIO PLAYBACK: Talk discussing thermal and gravity batteries. The speaker highlights that while chemical lithium-ion batteries are popular, thermal and gravity storage offer longer operational lifetimes and rely on cheap materials like concrete or hot sand.]',
    options: [
      'Why chemical batteries are completely superior to thermal storage options.',
      'The potential benefits of non-chemical energy storage alternatives.',
      'The rapid decline of public investment in gravity battery technology.',
      'The environmental dangers associated with mining silica for hot sand batteries.'
    ],
    correctAnswer: 'The potential benefits of non-chemical energy storage alternatives.',
    modelAnswer: 'Option B is the correct answer. The speaker highlights the advantages of non-chemical batteries (thermal and gravity) such as operational lifetimes and cheaper materials.',
    tips: [
      'Focus on the speaker\'s primary objective or core point of view.',
      'Ignore distracting details that only appear briefly as examples.'
    ],
    vocabulary: [
      { phrase: 'Lithium-ion', meaning: 'A type of rechargeable battery commonly used in portable electronics and electric vehicles' }
    ],
  },
  SMW: {
    id: 'SMW-001',
    code: 'SMW',
    title: 'The Gutenberg Disruption',
    instruction: 'You will hear a recording about historical communications. At the end of the recording, the last word or group of words has been replaced by a beep. Select the correct option to complete the recording.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    promptText: '[AUDIO PLAYBACK: "Before the printing press, oral tradition and hand-written manuscripts were the primary means of communication. The introduction of moveable type allowed ideas to spread at a speed never seen before, which ultimately shook the foundations of political and religious... [BEEP]"]',
    options: [
      'institutions',
      'agriculture',
      'oceanography',
      'recreations'
    ],
    correctAnswer: 'institutions',
    modelAnswer: 'Option A is correct. The context of political and religious forces strongly collocates with "institutions".',
    tips: [
      'Pay close attention to the grammar of the final sentence and predict the word type (noun, adjective, verb).',
      'Follow the logical progression of the speech up to the final second.'
    ],
    vocabulary: [
      { phrase: 'Foundations', meaning: 'The solid underlying base or principles of an organization or system' }
    ],
  },
  HIW: {
    id: 'HIW-001',
    code: 'HIW',
    title: 'The Great Depression',
    instruction: 'You will hear a recording. Below is a transcript of the recording. Some words in the transcript do not match what the speaker said. Click on the words that are different.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    promptText: 'The Great Depression was a severe global economic [crisis] (speaker said: downturn) that started in the late twenties. It originated in the United States after a major stock market crash, disrupting international [networks] (speaker said: trade) and leading to widespread poverty.',
    options: ['economic', 'crisis', 'started', 'major', 'networks', 'poverty'],
    correctAnswer: ['crisis', 'networks'],
    modelAnswer: 'The speaker said "downturn" instead of "crisis", and "trade" instead of "networks". Clicking those two words yields a full score.',
    tips: [
      'Move your cursor along with the speaker\'s voice word-by-word. Do not let your eyes wander.',
      'Click immediately if you spot a discrepancy. Do not pause or analyze, as the speaker will keep going.'
    ],
    vocabulary: [
      { phrase: 'Stock market crash', meaning: 'A sudden, dramatic decline of stock prices across a significant section of the market' }
    ],
  },
  WFD: {
    id: 'WFD-001',
    code: 'WFD',
    title: 'Academic Resources',
    instruction: 'You will hear a sentence. Please type the sentence exactly as you hear it. Check your spelling.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    promptText: '[AUDIO PLAYBACK: "The library offers quiet study spaces and digital resources for student research."]',
    modelAnswer: 'The library offers quiet study spaces and digital resources for student research.',
    tips: [
      'Type as many words as you can remember. You get one mark for every correct word spelled correctly.',
      'Check for plural forms and capitalization. Ensure your sentence ends with a full stop.'
    ],
    vocabulary: [
      { phrase: 'Digital resources', meaning: 'Materials in electronic format such as databases, journals, and ebooks' }
    ],
  }
};

export const COURSES: Course[] = [
  {
    id: 'C-01',
    title: 'PTE Speaking Mastery',
    description: 'Master oral fluency, native pronunciation, and standard layouts for Describe Image, Read Aloud, and Retell Lecture.',
    lessonsCount: 12,
    progress: 75,
    image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=300&q=80',
    level: 'Intermediate',
  },
  {
    id: 'C-02',
    title: 'High-Scoring Writing Templates',
    description: 'Learn robust structure models for Essays and Summaries to guarantee full marks in grammar, range, and format spelling.',
    lessonsCount: 8,
    progress: 40,
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=300&q=80',
    level: 'Target 79+',
  },
  {
    id: 'C-03',
    title: 'PTE Foundation Grammar & Vocab',
    description: 'Build core academic vocabulary and master passive voice, complex clauses, and parallel structures for Reading blanks.',
    lessonsCount: 15,
    progress: 10,
    image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=300&q=80',
    level: 'Foundation',
  }
];

export const LESSONS: Lesson[] = [
  {
    id: 'L-01',
    courseId: 'C-01',
    title: 'Introduction to Read Aloud',
    duration: '15 mins',
    completed: true,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    content: 'Read Aloud is the very first task in the PTE Academic exam. It heavily contributes scores to both your Speaking and Reading sections. To score a perfect 90/90, you must demonstrate strong Oral Fluency and Pronunciation.\n\n### Core Rules:\n1. **Do not hesitate**: Keep going even if you mispronounce a word.\n2. **Phrasing**: Break the passage into chunk-sized meaning units.\n3. **Tone**: Speak in a calm, confident, natural volume.',
    grammarRules: ['Noun-verb agreement', 'Correct pausing at commas and periods']
  },
  {
    id: 'L-02',
    courseId: 'C-01',
    title: 'Chunking & Phrasing Secrets',
    duration: '22 mins',
    completed: true,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    content: 'Chunking is the art of pausing slightly at logical semantic breaks rather than random intervals. This helps the AI grading algorithm recognize your speech flow easily.',
    grammarRules: ['Intonation clusters', 'Content word stress vs structure word reduction']
  },
  {
    id: 'L-03',
    courseId: 'C-01',
    title: 'Describe Image: Pie Chart Tactics',
    duration: '18 mins',
    completed: false,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    content: 'Pie charts are easy to describe when you follow a set structure: Introduction (Title) -> Highest slice -> Lowest slice -> Clear trend comparison -> Elegant conclusion.',
    grammarRules: ['Comparative structures (more than, significantly higher)', 'Numerical descriptions']
  }
];

export const FLASHCARDS: Flashcard[] = [
  { id: 'FC-01', front: 'Concomitant', back: 'Naturally accompanying or associated; happening at the same time.', category: 'Vocabulary', mastered: false },
  { id: 'FC-02', front: 'Adhere to', back: 'To stick firmly to; or follow rules/principles strictly (Collocation).', category: 'Collocations', mastered: true },
  { id: 'FC-03', front: 'Anomalous', back: 'Deviating from what is standard, normal, or expected.', category: 'Vocabulary', mastered: false },
  { id: 'FC-04', front: 'Play a key role', back: 'To have a highly significant effect or influence in something.', category: 'Collocations', mastered: false },
  { id: 'FC-05', front: 'Equivocal', back: 'Open to more than one interpretation; ambiguous or uncertain.', category: 'Vocabulary', mastered: false }
];

export const MOCK_TESTS: MockTest[] = [
  { id: 'MT-01', title: 'PTE Academic Mini Booster', type: 'mini', duration: 30, questionsCount: 10, section: 'All Sections Mixed', difficulty: 'Medium' },
  { id: 'MT-02', title: 'Speaking & Writing Section Blast', type: 'section', duration: 54, questionsCount: 18, section: 'Speaking & Writing Only', difficulty: 'Hard' },
  { id: 'MT-03', title: 'Full Exam Real-Sim #1', type: 'full', duration: 130, questionsCount: 52, section: 'Complete Exam', difficulty: 'Medium' },
];

export const TEST_ATTEMPTS: TestAttempt[] = [
  { id: 'A-01', testId: 'MT-01', title: 'PTE Academic Mini Booster', type: 'mini', date: '2026-07-12', overallScore: 74, speakingScore: 78, writingScore: 72, readingScore: 69, listeningScore: 75, status: 'Completed' },
  { id: 'A-02', testId: 'MT-03', title: 'Full Exam Real-Sim #1', type: 'full', date: '2026-06-28', overallScore: 68, speakingScore: 62, writingScore: 71, readingScore: 67, listeningScore: 70, status: 'Completed' },
];

export const SUBMISSIONS: Submission[] = [
  { id: 'S-01', studentName: 'Alex Mercer', taskTitle: 'The Great Barrier Reef (RA)', section: 'Speaking', code: 'RA', submittedAt: '2026-07-15 14:32', status: 'pending', answerText: 'The Great Barrier Reef is the world... composed of over two thousand reefs...' },
  { id: 'S-02', studentName: 'Sarah Connor', taskTitle: 'Automation and Employment (WE)', section: 'Writing', code: 'WE', submittedAt: '2026-07-14 09:15', status: 'graded', answerText: 'In the modern world, the rise of artificial intelligence has created massive controversy...', score: 79, feedback: 'Excellent structural control. Complex sentences are highly accurate. Try expanding your vocabulary range in body paragraph 2.', grammarIssues: 1, pronunciationScore: 0, fluencyScore: 0 },
  { id: 'S-03', studentName: 'Alex Mercer', taskTitle: 'Urban Heat Islands (SST)', section: 'Listening', code: 'SST', submittedAt: '2026-07-13 18:44', status: 'graded', answerText: 'The speaker discussed the urban heat island effect that is happening in cities due to concrete buildings and high air conditioning uses. This causes the metropolitan area to be very warm compared to countryside.', score: 65, feedback: 'Good summary of main themes, but your word count was 42 words, which is under the 50-70 limit. Please watch the length limits!', grammarIssues: 2 },
];

export const STUDENT_LIST = [
  { id: 'ST-01', name: 'Alex Mercer', email: 'alex@example.com', targetScore: 79, currentAvg: 71, lastActive: '2 hours ago', status: 'Active', subscription: 'Premium Academic' },
  { id: 'ST-02', name: 'Sarah Connor', email: 'sarah@example.com', targetScore: 84, currentAvg: 78, lastActive: '1 day ago', status: 'Active', subscription: 'VIP 1-on-1' },
  { id: 'ST-03', name: 'John Doe', email: 'john@example.com', targetScore: 65, currentAvg: 61, lastActive: '3 days ago', status: 'Inactive', subscription: 'Standard Basic' }
];

export const BLOG_POSTS = [
  { id: 'B-01', title: '5 Secret Tips to Ace PTE Read Aloud', summary: 'Discover how chunking and word-stress patterns can increase your score on the speaking algorithm.', date: 'July 10, 2026', author: 'Dr. Evelyn Carter', readTime: '5 mins' },
  { id: 'B-02', title: 'PTE Academic vs IELTS: Which is Easier?', summary: 'A comprehensive comparative guide analyzing computerized grading, timelines, and formats.', date: 'June 25, 2026', author: 'Markus Vance', readTime: '8 mins' },
  { id: 'B-03', title: 'How to Write a 90/90 PTE Essay Every Time', summary: 'Get our premium downloadable template that ticks all the boxes for vocabulary, grammar, and coherence.', date: 'June 18, 2026', author: 'Prof. Helen Smith', readTime: '6 mins' }
];

export const REVIEWS = [
  { id: 'R-01', name: 'David Kim', score: 'PTE 86', text: 'This platform saved my university visa application! The Practice UI is identical to the Pearson test center environment. The simulated AI grading gave me instant corrections on my pronunciation.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
  { id: 'R-02', name: 'Elena Rostova', score: 'PTE 79', text: 'The grammar templates and vocabulary flashcards are phenomenal. I raised my writing scores from 64 to 81 in less than three weeks of consistent study.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
  { id: 'R-03', name: 'Marcus Aurel', score: 'PTE 90', text: 'As a non-native speaker, describe image and retell lecture were nightmares. The templates and real-time wave simulator boosted my confidence. Perfect score!', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' }
];

export const FAQS = [
  { question: 'What is the PTE Academic Exam?', answer: 'The Pearson Test of English (PTE) Academic is a fully computer-based English language test accepted by universities and immigration departments globally.' },
  { question: 'How accurate is the simulated AI grading?', answer: 'Our proprietary scoring engines mimic Pearson\'s grading guidelines, analyzing speech clarity, pause structures, grammar range, and vocabulary weight to provide scoring precision within +/- 3 points of the actual exam.' },
  { question: 'Can I practice with a regular headphone microphone?', answer: 'Yes! Standard laptop microphones or mobile headsets work perfectly. Ensure your ambient surroundings are quiet when practicing Speaking tasks.' },
  { question: 'Is there a full-length mock test matching the actual exam time?', answer: 'Absolutely. We offer Full-Length Mock Exams with persistent timers, auto-next pacing, section pauses, and full report analytics.' }
];
