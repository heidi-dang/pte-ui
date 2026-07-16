/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskTypeInfo, PracticeItem, Course, Lesson, Flashcard, MockTest, TestAttempt, Submission, PTETaskCode } from '../types';

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

export const PRACTICE_ITEMS_LIST: PracticeItem[] = [];

// Helper array containing 5 topics to populate 5 distinct questions per task type
const ACADEMIC_TOPICS = [
  { name: 'Ecology & Environment', tag: 'Ecology' },
  { name: 'History & Civilization', tag: 'History' },
  { name: 'Technology & AI', tag: 'Technology' },
  { name: 'Astrophysics & Space', tag: 'Space' },
  { name: 'Public Health & Neurobiology', tag: 'Neurobiology' }
];

// Helper definition of template parameters for all 22 task types across the 5 topics
const RA_TEMPLATES = [
  {
    title: 'The Great Barrier Reef',
    prompt: 'The Great Barrier Reef is the world\'s largest coral reef system composed of over 2,900 individual reefs and 900 islands stretching for over 2,300 kilometres over an area of approximately 344,400 square kilometres. The reef is located in the Coral Sea, off the coast of Queensland, Australia.',
    vocab: [{ phrase: 'Composed of', meaning: 'Made up of or formed from distinct parts' }]
  },
  {
    title: 'Ancient Roman Engineering',
    prompt: 'Ancient Roman roads were renowned for their durable engineering, stretching across the vast empire to facilitate rapid military deployments and trade. Built with layered gravel, stone, and mortar, many of these durable highways remain intact today, showcasing their architectural brilliance.',
    vocab: [{ phrase: 'Renowned for', meaning: 'Famous or respected for a particular skill' }]
  },
  {
    title: 'Autonomous Driving Systems',
    prompt: 'Autonomous driving systems rely heavily on deep neural networks to process visual feeds from cameras and lidars in real-time. By detecting lane boundaries, pedestrian movements, and traffic signals, the vehicle\'s onboard computer calculates safe trajectories and executes controls instantly.',
    vocab: [{ phrase: 'Rely heavily on', meaning: 'Depend significantly on something for operation' }]
  },
  {
    title: 'Mars Exploration Rovers',
    prompt: 'The Mars exploration rovers have revolutionized our understanding of the red planet\'s geological history. Equipped with advanced spectrometer arms and panoramic camera arrays, these solar-powered laboratories analyzed soil compositions and discovered ancient signs of liquid water.',
    vocab: [{ phrase: 'Revolutionized', meaning: 'Completely changed the way something is done or thought about' }]
  },
  {
    title: 'Brain Neuroplasticity',
    prompt: 'Neuroplasticity is the brain\'s remarkable capacity to reorganize neural pathways and adapt to new learning experiences throughout life. When we practice a complex task, synaptic connections strengthen, allowing us to acquire new motor skills and recover from traumatic neurological injuries.',
    vocab: [{ phrase: 'Neuroplasticity', meaning: 'The ability of the brain to form and reorganize synaptic connections' }]
  }
];

const RS_TEMPLATES = [
  { title: 'Lecture Relocation', prompt: '[AUDIO PLAYBACK: "The chemistry lecture scheduled for Tuesday afternoon has been moved to the main science auditorium."]' },
  { title: 'Literature Review Submission', prompt: '[AUDIO PLAYBACK: "Please ensure you submit your literature review before the final deadline on Friday."]' },
  { title: 'Academic Archives', prompt: '[AUDIO PLAYBACK: "The university library provides quiet study spaces and digital archives for academic research."]' },
  { title: 'Precision Agriculture', prompt: '[AUDIO PLAYBACK: "Modern agriculture relies on satellite data to monitor soil moisture and optimize crop yields."]' },
  { title: 'Cognitive Health', prompt: '[AUDIO PLAYBACK: "Our cognitive abilities can be enhanced through regular physical exercise and balanced nutrition."]' }
];

const DI_TEMPLATES = [
  { title: 'Global Energy Shares 2026', prompt: 'A pie chart illustrating global energy shares: Fossil Fuels (72%), Hydropower (12%), Nuclear power (8%), Wind (5%), and Solar Energy (3%). Solar energy has a minor share but represents the fastest growing sector with a 24% year-on-year increase.', img: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80' },
  { title: 'Medieval Trade Route Map', prompt: 'An archaeological map showing key Roman trade routes crossing the Mediterranean Sea, connecting Rome, Alexandria, and Carthage. The thickest lines represent wheat and olive oil transportation paths, which were crucial for feeding the Roman urban population.', img: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80' },
  { title: 'Neural Networks Deep Flow', prompt: 'A flowchart illustrating the layered structure of a deep neural network, comprising an Input layer with 12 features, three Hidden layers performing non-linear convolutions, and an Output layer yielding classification probabilities.', img: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=600&q=80' },
  { title: 'Solar System Mass Chart', prompt: 'A bar chart comparing the masses of the terrestrial planets in our solar system, with Earth and Venus being the heaviest, followed by Mars and Mercury. Earth has almost ten times the mass of Mars, showing a stark difference in evolutionary scales.', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80' },
  { title: 'Brain Cortical Region Layout', prompt: 'An anatomical diagram mapping key cortical lobes of the human brain: Frontal lobe (decision making), Parietal lobe (sensory processing), Occipital lobe (vision), and Temporal lobe (auditory memory and facial recognition).', img: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80' }
];

const RL_TEMPLATES = [
  { title: 'Cognitive Plasticity Lecture', prompt: '[AUDIO PLAYBACK: Lecture discussing cognitive plasticity, explaining how the adult brain reorganizes neural pathways, adapts to trauma, and continues to grow synapses when exposed to demanding learning environments.]' },
  { title: 'The Rise of Gutenberg Press', prompt: '[AUDIO PLAYBACK: Lecture covering the historical impact of Johannes Gutenberg\'s movable printing press, detailing the shift from handwritten scripts to mass production in 15th-century Germany.]' },
  { title: 'The Nitrogen Cycle Process', prompt: '[AUDIO PLAYBACK: Lecture explaining the biochemical nitrogen cycle, illustrating how bacteria convert atmospheric nitrogen into bio-available ammonia for plant roots.]' },
  { title: 'Glacial Drift Dynamics', prompt: '[AUDIO PLAYBACK: Lecture detailing glacial drift dynamics, demonstrating how massive sheets of ice move under gravity to create geological moraines.]' },
  { title: 'Bioluminescent Organisms', prompt: '[AUDIO PLAYBACK: Lecture describing bioluminescence, detailing how deep-sea fish combine luciferin and luciferase to emit light for defense and mating.]' }
];

const ASQ_TEMPLATES = [
  { title: 'Astronomical Instruments', prompt: '[AUDIO PLAYBACK: "What instrument is used by astronomers to view distant stars and galaxies?"]', answer: 'Telescope' },
  { title: 'Historical Document Medium', prompt: '[AUDIO PLAYBACK: "What material made of dried animal skins was used for books before paper?"]', answer: 'Parchment' },
  { title: 'Artificial Brain Modeling', prompt: '[AUDIO PLAYBACK: "What is the name of the software algorithm inspired by biological brain connections?"]', answer: 'Neural network' },
  { title: 'Atmospheric Layering', prompt: '[AUDIO PLAYBACK: "Which gas is the most abundant in the Earth\'s atmosphere?"]', answer: 'Nitrogen' },
  { title: 'Anatomical Organs', prompt: '[AUDIO PLAYBACK: "Which internal organ is responsible for pumping blood throughout the human body?"]', answer: 'Heart' }
];

const SGD_TEMPLATES = [
  { title: 'Remote Work Productivity', prompt: '[AUDIO PLAYBACK: Group of three panel members discussing remote work. Speaker A argues that productivity increased because of reduced commute times, Speaker B points out psychological isolation, and Speaker C proposes hybrid models as a solution.]' },
  { title: 'Ancient Library Archiving', prompt: '[AUDIO PLAYBACK: Panel discussing how the Great Library of Alexandria indexed knowledge, noting consensus on its cultural impact but debate on its final destruction timeline.]' },
  { title: 'Ethical AI Controls', prompt: '[AUDIO PLAYBACK: Discussion on AI boundaries. Panelists agree on the necessity of copyright safeguards but disagree on the strictness of source data filtering.]' },
  { title: 'Mars Colonization Cost', prompt: '[AUDIO PLAYBACK: Panel debating the economics of Mars missions, with consensus on technological benefits but intense debate on public vs private funding distribution.]' },
  { title: 'Sleep Cycle Benefits', prompt: '[AUDIO PLAYBACK: Discussion on circadian biology, emphasizing consensus on REM sleep duration for memory consolidation.]' }
];

const RTS_TEMPLATES = [
  { title: 'Double-booked Meeting Room', prompt: 'Scenario: You have booked a meeting room for an important client presentation. However, when you arrive, a colleague and their team are already in the room, claiming they have also booked it for their weekly sprint update. Your client is arriving in 5 minutes.' },
  { title: 'Historical Manuscript Theft', prompt: 'Scenario: You are a museum curator and notice an antique manuscript displayed in a cabinet has been replaced with a high-quality photocopy. The security guard is at lunch and visitors are still in the room.' },
  { title: 'Software Crash Before Release', prompt: 'Scenario: Your team is scheduled to deploy a major software release in 10 minutes. A critical security bug is discovered in the authentication module during final sanity tests.' },
  { title: 'Satellite Signal Loss', prompt: 'Scenario: You are directing a weather balloon project and suddenly lose the GPS tracking telemetry signal. The local air traffic controller is calling for status updates.' },
  { title: 'Patient Emergency Priority', prompt: 'Scenario: You are a head nurse in an outpatient clinic. Two patients arrive simultaneously: one has severe chest pains and another has a deep, heavily bleeding arm laceration.' }
];

const SWT_TEMPLATES = [
  { title: 'The History of Paper', prompt: 'Paper has played a critical role in human civilization, serving as the primary medium for recording thoughts, transmitting knowledge, and conducting administrative affairs. Although invented in China around 105 AD by Cai Lun, paper production methods took centuries to reach the Western world. When it finally arrived in Europe via Islamic Spain in the 11th century, it revolutionized bookmaking, which was previously reliant on expensive parchment made of animal skins. The affordability of paper subsequently catalyzed the development of printing presses and fueled the spread of literacy and scientific enquiry during the Renaissance.' },
  { title: 'The Fall of Rome', prompt: 'The decline of the Western Roman Empire was a complex process stretching over several centuries. While popular history often attributes the collapse solely to barbarian invasions, modern historians emphasize internal economic decay, political corruption, and systemic hyperinflation. The excessive cost of garrisoning sprawling borders combined with agricultural stagnation left the empire weak. By the time of the final deposition of Romulus Augustulus in 476 AD, the administrative framework was already in ruins.' },
  { title: 'Cybersecurity in Banking', prompt: 'Modern banking institutions depend fully on public-key encryption to secure electronic transactions. As hacker syndicates employ automated credential stuffing, banks must deploy multi-factor security barriers. The rise of quantum computing poses a future threat, forcing computer scientists to research post-quantum algorithms.' },
  { title: 'The Asteroid Belt Resources', prompt: 'The asteroid belt contains trillions of dollars in platinum group metals and industrial iron. Mining these objects requires autonomous retrieval ships and orbital refining arrays. While startup costs are exceptionally high, the abundance of minerals could trigger an extraterrestrial industrial boom.' },
  { title: 'The Lymphatic System Function', prompt: 'The lymphatic system plays a dual role in human health by maintaining fluid homeostasis and hosting immune cells. Lymph nodes act as biological filters, intercepting pathogens before returning fluid to the bloodstream. If lymphatic channels are blocked, severe localized swelling can occur.' }
];

const WE_TEMPLATES = [
  { title: 'Automation and Employment', prompt: 'Artificial Intelligence and advanced automation are predicted to replace a massive percentage of manual and cognitive jobs. Will this technological shift result in widespread structural unemployment, or will it create entirely new sectors of superior employment? Discuss both sides and give your own perspective.' },
  { title: 'Classical Architecture Preservation', prompt: 'Modern cities are growing rapidly, resulting in the demolition of century-old historic buildings to make space for concrete skyscrapers. Should national governments spend tax revenues to preserve traditional architecture, or is physical expansion more vital? Give your view.' },
  { title: 'Universal Basic Income', prompt: 'Some economists advocate for a universal basic income (UBI), where every citizen receives a monthly financial stipend regardless of employment status. Critics argue this would eliminate work incentives and fuel hyperinflation. Evaluate the economic viability of UBI.' },
  { title: 'Commercial Space Flight', prompt: 'Private aerospace companies are actively selling tickets for orbital sub-flights to ultra-wealthy tourists. Opponents claim this industry causes extreme atmospheric carbon pollution for minimal public benefit, while advocates argue it accelerates aerospace research. Discuss.' },
  { title: 'Genetic Engineering Ethics', prompt: 'CRISPR gene editing technologies allow parents to potentially select cosmetic traits or cognitive abilities for unborn children. Some argue this leads to an unequal genetic class system, while others focus on disease eradication. Present both arguments.' }
];

const MCS_TEMPLATES = [
  { title: 'The Nitrogen Cycle', prompt: 'Nitrogen is essential for all living organisms because it is a fundamental component of amino acids, proteins, and nucleic acids. Although nitrogen gas makes up approximately 78% of Earth\'s atmosphere, most organisms cannot utilize atmospheric nitrogen directly. It must first be converted into reactive nitrogen species, such as ammonium or nitrate, through chemical or biological processes known as nitrogen fixation. Most biological fixation is performed by specialized bacteria, which form symbiotic relationships with the root nodules of legumes, converting the inert gas into usable nutrients for the host plants.', options: ['Most living organisms can absorb nitrogen gas directly.', 'Nitrogen fixation is predominantly carried out by specialized bacteria cooperating with legumes.', 'Chemical processes are the sole mechanism responsible.', 'Legumes convert nitrogen gas independently of any symbiotic microbial relationships.'], answer: 'Nitrogen fixation is predominantly carried out by specialized bacteria cooperating with legumes.' },
  { title: 'The Rosetta Stone', prompt: 'Discovered in 1799 by French soldiers, the Rosetta Stone provided the key to deciphering Egyptian hieroglyphs. It featured a single decree written in three scripts: Hieroglyphic, Demotic, and Ancient Greek. Because Greek was well known, scholars like Jean-François Champollion could cross-reference the royal names, unlocking the secrets of Egyptian history.', options: ['Hieroglyphs were deciphered solely using demotic translations.', 'Greek text allowed scholars to cross-reference and decipher hieroglyphic characters.', 'The stone was carved by French soldiers in the late 18th century.', 'Scholars already fully understood hieroglyphs before the stone was unearthed.'], answer: 'Greek text allowed scholars to cross-reference and decipher hieroglyphic characters.' },
  { title: 'Quantum Encryption Keys', prompt: 'Quantum key distribution (QKD) leverages the fundamental laws of physics to guarantee secure communication. If an eavesdropper attempts to measure quantum states during transmission, the delicate wavefunctions collapse, immediately introducing detectable errors.', options: ['Eavesdroppers can copy quantum keys without altering their physical states.', 'Measuring quantum states during transit alters them, alerting the communicators.', 'QKD is less secure than standard mathematical algorithms.', 'Quantum key transmission does not rely on physical media.'], answer: 'Measuring quantum states during transit alters them, alerting the communicators.' },
  { title: 'The Oort Cloud Boundaries', prompt: 'The Oort Cloud is a theoretical spherical shell of icy planetesimals surrounding our solar system, extending up to 3.2 light-years from the Sun. It serves as the reservoir for long-period comets that enter the inner planetary orbits.', options: ['The Oort Cloud is comprised primarily of hot rocky asteroids.', 'It is the origin point for long-period comets entering the inner solar system.', 'The cloud has been physically mapped and photographed extensively by probes.', 'It lies entirely within the orbit of Neptune.'], answer: 'It is the origin point for long-period comets entering the inner solar system.' },
  { title: 'Vagus Nerve Functions', prompt: 'The vagus nerve is the longest cranial nerve in the body, serving as the main highway for the parasympathetic nervous system. It oversees heart rate reduction, gastrointestinal motility, and transmits immune signals directly to the brain.', options: ['The vagus nerve is a short spinal nerve controlling limb movement.', 'It acts as the primary driver for parasympathetic regulation, including heart rate suppression.', 'It operates independently of the brain.', 'The vagus nerve only carries signals away from the digestive tract.'], answer: 'It acts as the primary driver for parasympathetic regulation, including heart rate suppression.' }
];

const MCM_TEMPLATES = [
  { title: 'The Rise of Gutenberg\'s Press', prompt: 'Johannes Gutenberg\'s development of the movable type printing press in mid-15th century Germany is widely considered one of the most influential events in human history. Gutenberg\'s press utilized an alloy of lead, tin, and antimony that melted quickly and resisted wear, combined with oil-based ink that adhered to metal type better than water-based alternatives. This technological convergence reduced book production costs by over 99%, triggering an explosion in literature availability.', options: ['Gutenberg\'s press decreased book production expenses dramatically.', 'Gutenberg relied solely on pre-existing water-based inks.', 'The alloy developed resisted decay and could be reused.', 'Books before Gutenberg were common items owned by standard households.'], answer: ['Gutenberg\'s press decreased book production expenses dramatically.', 'The alloy developed resisted decay and could be reused.'] },
  { title: 'Roman Aqueduct Systems', prompt: 'Roman aqueducts were monumental civil engineering achievements. They relied entirely on gravity, channeling water along a precise, gradual downward slope over tens of miles. Builders used hydraulic cement that hardened underwater, combined with arched stone bridges to span deep valleys without interrupting flow.', options: ['The systems depended on massive mechanical pumps to raise water.', 'Roman engineers utilized gravity and precise downhill grading.', 'Arch bridges were deployed to cross valleys smoothly.', 'The construction strictly avoided the use of hydraulic cements.'], answer: ['Roman engineers utilized gravity and precise downhill grading.', 'Arch bridges were deployed to cross valleys smoothly.'] },
  { title: 'Deep Learning Architectures', prompt: 'Deep neural networks excel at extracting hierarchical features from unstructured data. Early layers detect basic edges and textures, intermediate layers synthesize these into geometric shapes, and final dense layers output classification targets. Training requires backpropagation of error signals via gradient descent.', options: ['Early layers capture complex objects like faces directly.', 'Intermediate layers synthesize basic edges into geometric shapes.', 'Deep networks require backpropagation for synaptic weights adjustment.', 'Gradient descent is strictly avoided due to computational errors.'], answer: ['Intermediate layers synthesize basic edges into geometric shapes.', 'Deep networks require backpropagation for synaptic weights adjustment.'] },
  { title: 'Water on Mars Proofs', prompt: 'NASA\'s orbiters have mapped recurring slope lineae on Martian crater walls. These dark streaks expand during warm seasons and fade in winter, indicating seasonal flows of briny liquid water. Additionally, ground-penetrating radar has detected subterranean ice sheets.', options: ['Martian crater streaks represent dry dust avalanches only.', 'Seasonal streaks indicate flows of briny liquid water during warm months.', 'Subterranean ice deposits have been identified via radar mapping.', 'Liquid oceans currently exist openly on the surface of Mars.'], answer: ['Seasonal streaks indicate flows of briny liquid water during warm months.', 'Subterranean ice deposits have been identified via radar mapping.'] },
  { title: 'Synaptic Pruning Mechanisms', prompt: 'During adolescence, the brain undergoes major synaptic pruning. Microglial cells selectively engulf less active synapses, leaving stronger, highly insulated pathways intact. This optimizes neural efficiency and speeds up cognitive processing.', options: ['Pruning is carried out primarily by microglial cells.', 'Adolescence is characterized by the random creation of uninsulated pathways.', 'The process optimizes cognitive processing speed and neural efficiency.', 'Pruning increases the total volume of brain tissue indefinitely.'], answer: ['Pruning is carried out primarily by microglial cells.', 'The process optimizes cognitive processing speed and neural efficiency.'] }
];

const ROP_TEMPLATES = [
  { title: 'The Lifecycle of Stars', prompt: 'Scrambled elements of stellar lifecycle.', options: ['Eventually, the hydrogen fuel in the core runs low, causing the star to expand into a red giant.', 'This dense cloud collapses under gravity, igniting nuclear fusion and birthing a stable main-sequence star.', 'Stars begin their lives within massive interstellar clouds of gas and dust known as nebulae.', 'Finally, after shedding its outer layers, the remnant core cools to become a dense, silent white dwarf.'], answer: ['Stars begin their lives within massive interstellar clouds of gas and dust known as nebulae.', 'This dense cloud collapses under gravity, igniting nuclear fusion and birthing a stable main-sequence star.', 'Eventually, the hydrogen fuel in the core runs low, causing the star to expand into a red giant.', 'Finally, after shedding its outer layers, the remnant core cools to become a dense, silent white dwarf.'] },
  { title: 'The Library of Alexandria', prompt: 'Scrambled history of Alexandria.', options: ['Ptolemy I Soter established the institution to gather all known global texts.', 'At its peak, the library housed hundreds of thousands of papyrus scrolls.', 'This immense catalog of literature established Alexandria as the intellectual capital of the ancient world.', 'Eventually, a series of fires and military conquests led to its irreversible destruction.'], answer: ['Ptolemy I Soter established the institution to gather all known global texts.', 'At its peak, the library housed hundreds of thousands of papyrus scrolls.', 'This immense catalog of literature established Alexandria as the intellectual capital of the ancient world.', 'Eventually, a series of fires and military conquests led to its irreversible destruction.'] },
  { title: 'Building Machine Learning Models', prompt: 'Scrambled steps for model building.', options: ['First, engineers collect and label millions of high-quality sample data points.', 'Next, these data arrays are fed into a model architecture to perform forward passes.', 'Errors are then calculated and sent backward to adjust connection weights.', 'Finally, the completed model is validated against unseen test datasets to confirm accuracy.'], answer: ['First, engineers collect and label millions of high-quality sample data points.', 'Next, these data arrays are fed into a model architecture to perform forward passes.', 'Errors are then calculated and sent backward to adjust connection weights.', 'Finally, the completed model is validated against unseen test datasets to confirm accuracy.'] },
  { title: 'Mars Rover Landing Sequence', prompt: 'Scrambled Mars landing steps.', options: ['The spacecraft enters the thin Martian atmosphere protected by a carbon heat shield.', 'As velocity drops, a massive supersonic parachute deploys to stabilize the craft.', 'Next, retro-rockets ignite to slow the lander down to a gentle hover.', 'Finally, a tethered sky-crane lowers the delicate rover safely to the crater floor.'], answer: ['The spacecraft enters the thin Martian atmosphere protected by a carbon heat shield.', 'As velocity drops, a massive supersonic parachute deploys to stabilize the craft.', 'Next, retro-rockets ignite to slow the lander down to a gentle hover.', 'Finally, a tethered sky-crane lowers the delicate rover safely to the crater floor.'] },
  { title: 'Memory Consolidation Stages', prompt: 'Scrambled memory steps.', options: ['Incoming sensory cues are initially captured within the temporary hippocampus.', 'During deep slow-wave sleep, these neural patterns are replayed repeatedly.', 'This active replay transfers the information to the permanent neocortex.', 'Ultimately, the memories are consolidated as structurally stable physical synapses.'], answer: ['Incoming sensory cues are initially captured within the temporary hippocampus.', 'During deep slow-wave sleep, these neural patterns are replayed repeatedly.', 'This active replay transfers the information to the permanent neocortex.', 'Ultimately, the memories are consolidated as structurally stable physical synapses.'] }
];

const FIBR_TEMPLATES = [
  { title: 'Glacial Dynamics', prompt: 'Glaciers are massive rivers of ice that move very slowly under the force of [1]. They are formed in areas where the [2] of snow exceeds its ablation over many years. As new snow falls, it compresses older layers into dense glacial ice, forming a natural [3] of climate history.', options: ['gravity', 'accumulation', 'archive', 'speed', 'temperature', 'melting'], answer: ['gravity', 'accumulation', 'archive'] },
  { title: 'Decline of Roman Trade', prompt: 'The stability of Roman commerce was severely disrupted by systemic [1] during the late third century. As emperors debased the currency, merchants refused to accept copper coins, demanding physical gold instead. This fiscal crisis caused international trade to [2] and pushed rural villas toward self-sufficient agricultural [3].', options: ['inflation', 'collapse', 'production', 'armies', 'stability', 'law'], answer: ['inflation', 'collapse', 'production'] },
  { title: 'Algorithmic Sorting', prompt: 'In computer science, sorting is a fundamental task that arranges items in a specific [1]. While simple algorithms like bubble sort are easy to implement, they are highly [2] for large datasets. Modern databases rely on quicksort or heapsort to perform queries at rapid [3].', options: ['order', 'inefficient', 'speeds', 'numbers', 'useful', 'spaces'], answer: ['order', 'inefficient', 'speeds'] },
  { title: 'The Kuiper Belt', prompt: 'The Kuiper Belt is an outer ring of icy bodies that [1] Pluto and thousands of dwarf planets. It contains massive reservoirs of primordial [2] left over from the formation of our solar system. Studying these pristine objects helps astronomers understand how planetary cores [3] billions of years ago.', options: ['encircles', 'materials', 'coalesced', 'escaped', 'heats', 'shined'], answer: ['encircles', 'materials', 'coalesced'] },
  { title: 'Antibiotic Resistance', prompt: 'The rise of antibiotic resistance represents a severe crisis for global [1]. When patients fail to complete prescribed courses, surviving bacteria mutate and pass resistant [2] to subsequent generations. This evolutionary adaptation threatens to render standard clinical therapies completely [3].', options: ['medicine', 'genes', 'ineffective', 'food', 'cells', 'successful'], answer: ['medicine', 'genes', 'ineffective'] }
];

const FIBRW_TEMPLATES = [
  { title: 'The Economics of Tariffs', prompt: 'Tariffs are taxes imposed on imported goods. While they are often used to [1] domestic industries from foreign competition, they can also lead to higher [2] for consumers. Many economists argue that widespread tariffs disrupt international trade and reduce overall economic [3].', options: ['shield, endanger, ignore, expose', 'prices, rewards, taxes, speeds', 'efficiency, stability, inflation, debt'], answer: ['shield', 'prices', 'efficiency'] },
  { title: 'Scribes of Ancient Egypt', prompt: 'Scribes occupied a highly respected position in Egyptian society. They were responsible for [1] tax tallies, drafting letters, and writing administrative decrees. Since only a tiny fraction of the population was [2], scribes held immense administrative power and were often exempt from physical [3].', options: ['recording, fighting, trading, painting', 'literate, healthy, royal, armed', 'labor, taxation, warfare, worship'], answer: ['recording', 'literate', 'labor'] },
  { title: 'Large Language Models', prompt: 'Large language models operate by predicting the next token in a sequence. By [1] on billions of text documents, they learn statistical patterns of human grammar. However, they lack genuine semantic [2] and occasionally generate plausible-sounding but completely factual [3].', options: ['training, speaking, searching, writing', 'understanding, speed, memory, capacity', 'errors, truths, patterns, models'], answer: ['training', 'understanding, speed, memory, capacity', 'errors'] }, // Adjust options if needed
  { title: 'Cosmic Microwave Background', prompt: 'The Cosmic Microwave Background is the electromagnetic [1] left over from the early stage of the universe. It represents the oldest light in existence, emitted roughly 380,000 years after the Big [2]. This faint glow provides absolute evidence supporting the expanding universe [3].', options: ['radiation, cloud, vacuum, gravity', 'Bang, Crunch, Freeze, Tear', 'model, theory, dream, law'], answer: ['radiation', 'Bang', 'model'] },
  { title: 'Endocrine Hormones', prompt: 'Endocrine glands secrete hormones directly into the bloodstream to coordinate vital body [1]. These biochemical messengers travel to target cells, binding to specific [2] to alter cellular activity. This network acts in synergy with the nervous system to maintain dynamic [3].', options: ['processes, limbs, structures, layers', 'receptors, walls, barriers, engines', 'homeostasis, inflation, stress, movement'], answer: ['processes', 'receptors', 'homeostasis'] }
];

const SST_TEMPLATES = [
  { title: 'Urban Heat Islands', prompt: '[AUDIO PLAYBACK: Lecture detailing the Urban Heat Island effect. Explains how dark concrete surfaces, lack of vegetation, and waste heat from air conditioning units make cities significantly warmer than surrounding rural areas, leading to increased power demands and pollution.]' },
  { title: 'The Bronze Age Collapse', prompt: '[AUDIO PLAYBACK: Lecture covering the Bronze Age Collapse around 1200 BC, detailing the sudden fall of the Mycenaean and Hittite empires due to a combination of sea-peoples invasions, severe droughts, and disrupted trade routes.]' },
  { title: 'Cloud Computing Paradigms', prompt: '[AUDIO PLAYBACK: Lecture discussing cloud computing shifts, explaining how server virtualization allows companies to rent computing nodes on demand, drastically lowering capital expenses but increasing reliance on server networks.]' },
  { title: 'The James Webb Telescope', prompt: '[AUDIO PLAYBACK: Lecture on the James Webb Space Telescope, explaining its primary infrared mirrors designed to capture redshifted light from the earliest stars formed after the Big Bang.]' },
  { title: 'Insulin Resistance Physiology', prompt: '[AUDIO PLAYBACK: Lecture detailing insulin resistance, explaining how high-sugar diets lead to chronic blood glucose surges, causing cell receptors to desensitize and forcing the pancreas to overproduce insulin.]' }
];

const MCMSL_TEMPLATES = [
  { title: 'Bioluminescent Organisms', prompt: '[AUDIO PLAYBACK: Audio description of bioluminescence in deep-sea creatures, describing how animals produce light through chemical reactions involving luciferin and luciferase, using it to attract prey, deter predators, and communicate with potential mates.]', options: ['Bioluminescence relies on external ambient light sources to function.', 'It is generated through biological chemical interactions inside the creature.', 'Deep-sea species use light to deter enemies and avoid capture.', 'Light production is used exclusively for locating nutrition and prey.'], answer: ['It is generated through biological chemical interactions inside the creature.', 'Deep-sea species use light to deter enemies and avoid capture.'] },
  { title: 'The Silk Road Network', prompt: '[AUDIO PLAYBACK: Audio explaining the Silk Road routes, highlighting that they carried not only silk and spices, but also served as vectors for religious ideologies, technologies, and devastating plagues.]', options: ['The routes were strictly limited to merchant caravans carrying silk.', 'They acted as significant vectors for spreading religious beliefs.', 'Technologies like papermaking were exchanged along these pathways.', 'The trade network was entirely safe and free of biological hazards.'], answer: ['They acted as significant vectors for spreading religious beliefs.', 'Technologies like papermaking were exchanged along these pathways.'] },
  { title: 'Explainable AI Models', prompt: '[AUDIO PLAYBACK: Talk on explainable artificial intelligence (XAI). The speaker emphasizes that neural networks are black boxes, making explainability vital for medical diagnosis, legal sentencing, and loan evaluations.]', options: ['Explainability is crucial for high-stakes decisions like medical diagnosis.', 'Neural networks are inherently open and easy for humans to interpret directly.', 'Legal sentencing algorithms benefit heavily from explainable models.', 'Commercial entertainment is the primary domain requiring strict XAI.'], answer: ['Explainability is crucial for high-stakes decisions like medical diagnosis.', 'Legal sentencing algorithms benefit heavily from explainable models.'] },
  { title: 'The Rings of Saturn', prompt: '[AUDIO PLAYBACK: Audio description of Saturn\'s ring system. Explains that the rings are not solid sheets, but are composed of billions of water-ice particles ranging from tiny dust grains to house-sized boulders, maintained by Saturn\'s gravitational tides.]', options: ['Saturn\'s rings are solid sheets of iron and silicate rock.', 'The rings consist primarily of water-ice particles.', 'Individual ring particles vary in size from dust grains to boulders.', 'The structure is completely independent of Saturn\'s gravitational forces.'], answer: ['The rings consist primarily of water-ice particles.', 'Individual ring particles vary in size from dust grains to boulders.'] },
  { title: 'Alzheimer\'s Pathology Keys', prompt: '[AUDIO PLAYBACK: Lecture outlining Alzheimer\'s disease. Explains that pathology is characterized by extracellular beta-amyloid plaques and intracellular tau tangles, which disrupt neural communication and cause cell death.]', options: ['Beta-amyloid plaques build up outside the brain cells.', 'Tau tangles accumulate inside the neurons, blocking signal flow.', 'The pathology leaves neural communication completely unimpeded.', 'Amyloid plaque accumulation is a purely positive adaptation.'], answer: ['Beta-amyloid plaques build up outside the brain cells.', 'Tau tangles accumulate inside the neurons, blocking signal flow.'] }
];

const FIBL_TEMPLATES = [
  { title: 'Microplastic Accumulation', prompt: 'Microplastics have now been detected in the most remote areas of our oceans. These tiny synthetic particles are ingested by marine life, where they can accumulate in tissues and enter the human [1] chain. Researchers are struggling to trace the [2] term health consequences of this invisible [3].', options: ['food', 'long', 'pollution'], answer: ['food', 'long', 'pollution'] },
  { title: 'The Colosseum Architecture', prompt: 'The Roman Colosseum was completed under Titus in 80 AD. To manage the exit of fifty thousand [1], architects designed eighty arched entryways. This highly efficient circular layout allowed the entire stadium to empty in less than [2] minutes, a design duplicated in modern sports [3].', options: ['spectators', 'fifteen', 'arenas'], answer: ['spectators', 'fifteen', 'arenas'] },
  { title: 'Quantum Bit Superposition', prompt: 'Quantum computing represents a massive leap forward. Unlike a standard silicon transistor that represents a zero or a [1], a quantum bit can exist in a state of [2]. This capability allows processors to evaluate millions of computations [3].', options: ['one', 'superposition', 'simultaneously'], answer: ['one', 'superposition', 'simultaneously'] },
  { title: 'The Solar Wind Effects', prompt: 'The Sun continuously emits a stream of charged particles known as the solar wind. When these particles collide with Earth\'s magnetic [1], they are funneled toward the poles, exciting gas atoms in our atmosphere. This atomic excitement produces the beautiful glowing [2] commonly known as the [3] lights.', options: ['field', 'auroras', 'northern'], answer: ['field', 'auroras', 'northern'] },
  { title: 'Adrenaline Surge Effects', prompt: 'During a sudden emergency, the adrenal glands release adrenaline into the bloodstream. This hormone accelerates the heart rate to supply extra [1] to skeletal muscles. Simultaneously, it dilates air passages to maximize [2] absorption, preparing the body for fight or [3].', options: ['oxygen', 'respiration', 'flight'], answer: ['oxygen', 'respiration', 'flight'] }
];

const HCS_TEMPLATES = [
  { title: 'The Gold Standard', prompt: '[AUDIO PLAYBACK: Lecture discussing the historical gold standard. Explains how currencies were pegged to actual physical gold, limiting inflation, but restricting governments from injecting capital during economic downturns, which eventually led to its abandonment in the 20th century.]', options: ['The gold standard was abandoned because gold became too abundant and lost its value.', 'The gold standard successfully prevented inflation but was abandoned because its rigidity prevented financial relief during recessions.', 'Most modern governments are returning to the gold standard to stabilize exchange rates.', 'The gold standard was a system developed to ensure that commercial banks had physical deposits.'], answer: 'The gold standard successfully prevented inflation but was abandoned because its rigidity prevented financial relief during recessions.' },
  { title: 'Byzantine Empire Bureaucracy', prompt: '[AUDIO PLAYBACK: Lecture on Byzantine administrative structures. Discusses how a massive, highly centralized civil service in Constantinople maintained tax revenues and legal order for a thousand years, outlasting Rome despite relentless military threats.]', options: ['The Byzantine Empire collapsed rapidly due to a lack of organized tax structures.', 'Byzantium survived for a millennium largely due to its highly organized, centralized administrative bureaucracy in Constantinople.', 'Byzantine leaders relied exclusively on barbarian mercenaries to run their tax offices.', 'Constantinople was an administrative failure that divided the empire.'], answer: 'Byzantium survived for a millennium largely due to its highly organized, centralized administrative bureaucracy in Constantinople.' },
  { title: 'The Internet of Things', prompt: '[AUDIO PLAYBACK: Talk discussing the security implications of smart home appliances. The speaker warns that cheap microprocessors inside connected smart fridges and baby monitors lack basic security protocols, making them easy targets for botnets.]', options: ['Smart fridges are highly secure because of advanced encryption processors.', 'Connected home devices represent a massive security threat because cheap microprocessors lack basic security protocols.', 'Industrial botnets are incapable of infecting low-power home appliances.', 'Consumers are abandoning smart home systems due to excessive power consumption.'], answer: 'Connected home devices represent a massive security threat because cheap microprocessors lack basic security protocols.' },
  { title: 'Pluto\'s Planetary Demotion', prompt: '[AUDIO PLAYBACK: Lecture explaining the 2006 IAU decision to classify Pluto as a dwarf planet. The speaker highlights that Pluto fails to clear its orbit of other debris, which is a key criteria for full planethood.]', options: ['Pluto was demoted because its mass decreased rapidly over the last century.', 'The IAU reclassified Pluto as a dwarf planet because it fails to clear its orbital path of surrounding space debris.', 'Dwarf planets are larger than terrestrial planets but lack atmospheres.', 'The demotion of Pluto was reversed in 2012 following probe data.'], answer: 'The IAU reclassified Pluto as a dwarf planet because it fails to clear its orbital path of surrounding space debris.' },
  { title: 'The Circadian Clock Genes', prompt: '[AUDIO PLAYBACK: Talk on the molecular clock. Explains that the CLOCK and BMAL1 genes produce proteins that regulate physiological rhythms, with mutations leading to chronic sleep disorders and metabolic dysfunction.]', options: ['Circadian genes operate independently of any cellular protein synthesis.', 'The molecular clock, guided by key genes, regulates physiological rhythms, and its disruption is linked to sleep and metabolic disorders.', 'Sleep cycles are regulated solely by external atmospheric temperatures.', 'Metabolic dysfunction causes genetic mutations that synthesize sleep hormones.'], answer: 'The molecular clock, guided by key genes, regulates physiological rhythms, and its disruption is linked to sleep and metabolic disorders.' }
];

const MCSSL_TEMPLATES = [
  { title: 'Renewable Storage Solutions', prompt: '[AUDIO PLAYBACK: Talk discussing thermal and gravity batteries. The speaker highlights that while chemical lithium-ion batteries are popular, thermal and gravity storage offer longer operational lifetimes and rely on cheap materials like concrete or hot sand.]', options: ['Why chemical batteries are completely superior.', 'The potential benefits of non-chemical energy storage alternatives.', 'The rapid decline of public investment in gravity battery technology.', 'The environmental dangers associated with mining silica for hot sand batteries.'], answer: 'The potential benefits of non-chemical energy storage alternatives.' },
  { title: 'The Printing Revolution', prompt: '[AUDIO PLAYBACK: Talk covering the impact of printing on dialects. The speaker notes that mass book production forced printers to choose specific regional dialects, which standardized national languages like English and German.]', options: ['Printers avoided standardizing languages to preserve regional identities.', 'The rise of mass printing directly contributed to the standardization of national languages.', 'Dialects became more fragmented following the introduction of printing presses.', 'English and German print shops imported Italian dialects exclusively.'], answer: 'The rise of mass printing directly contributed to the standardization of national languages.' },
  { title: 'Virtual Reality in Medicine', prompt: '[AUDIO PLAYBACK: Medical talk discussing virtual surgical training. The speaker explains that VR simulators allow surgical residents to practice intricate cardiovascular incisions without risking patient safety, drastically reducing operating room errors.]', options: ['VR systems are unsafe for medical trainees due to visual strain.', 'Virtual reality simulations enable surgical residents to safely practice complex procedures, lowering clinical errors.', 'Cardiac surgeons reject VR systems in favor of animal model training.', 'The operating room errors have increased due to virtual reality dependency.'], answer: 'Virtual reality simulations enable surgical residents to safely practice complex procedures, lowering clinical errors.' },
  { title: 'Exoplanet Detection Systems', prompt: '[AUDIO PLAYBACK: Astronomy talk explaining the transit method. The speaker notes that astronomers detect planets orbiting distant stars by measuring the minute dip in stellar brightness as the planet passes in front of the star.]', options: ['Astronomers capture direct visual photos of exoplanets using infrared cameras.', 'The transit method identifies exoplanets by measuring periodic dips in a star\'s brightness.', 'Distant stars dim because of cosmic dust clouds, not planet crossings.', 'The method is only capable of mapping hot gas giants close to Earth.'], answer: 'The transit method identifies exoplanets by measuring periodic dips in a star\'s brightness.' },
  { title: 'Dopamine Reward Circuits', prompt: '[AUDIO PLAYBACK: Neuroscience talk on dopamine. The speaker clarifies that dopamine is not the molecule of pleasure itself, but rather a signal for anticipation, novelty, and reward prediction error.]', options: ['Dopamine is the primary physical chemical that produces subjective pleasure.', 'Dopamine acts primarily as a chemical signal for anticipation, novelty, and reward prediction.', 'Neurological novelty reduces dopamine output across the striatum.', 'Dopamine circuits are inactive during anticipation phases.'], answer: 'Dopamine acts primarily as a chemical signal for anticipation, novelty, and reward prediction.' }
];

const SMW_TEMPLATES = [
  { title: 'The Gutenberg Disruption', prompt: '[AUDIO PLAYBACK: "Before the printing press, oral tradition and hand-written manuscripts were the primary means of communication. The introduction of moveable type allowed ideas to spread at a speed never seen before, which ultimately shook the foundations of political and religious... [BEEP]"]', options: ['institutions', 'agriculture', 'oceanography', 'recreations'], answer: 'institutions' },
  { title: 'Aqueduct Construction', prompt: '[AUDIO PLAYBACK: "Roman municipal planners prioritised clean water supplies for public health. They constructed immense aqueducts that bypassed mountains and traversed valleys to deliver clean mountain spring water directly into the city\'s public... [BEEP]"]', options: ['fountains', 'cemeteries', 'granaries', 'garrisons'], answer: 'fountains' },
  { title: 'Encryption Standards', prompt: '[AUDIO PLAYBACK: "With the continuous expansion of electronic commerce, corporate networks face relentless attacks. Cybersecurity specialists must implement military-grade cryptography to shield sensitive financial... [BEEP]"]', options: ['transactions', 'pastures', 'forests', 'orchards'], answer: 'transactions' },
  { title: 'Dark Matter Detection', prompt: '[AUDIO PLAYBACK: "Astronomers observe that galaxies rotate far faster than their visible stellar mass should allow. To explain this gravitational anomaly, scientists hypothesize the presence of an invisible, non-baryonic substance known as... [BEEP]"]', options: ['dark matter', 'solar wind', 'cosmic dust', 'plasma gas'], answer: 'dark matter' },
  { title: 'Stress Response Triggers', prompt: '[AUDIO PLAYBACK: "When the hypothalamus detects a sensory threat, it initiates the sympathetic nervous pathway. This neural trigger stimulates the adrenal medulla to flood the vascular system with... [BEEP]"]', options: ['hormones', 'enzymes', 'nutrients', 'antibodies'], answer: 'hormones' }
];

const HIW_TEMPLATES = [
  { title: 'The Great Depression', prompt: 'The Great Depression was a severe global economic [crisis] (speaker said: downturn) that started in the late twenties. It originated in the United States after a major stock market crash, disrupting international [networks] (speaker said: trade) and leading to widespread poverty.', options: ['economic', 'crisis', 'started', 'major', 'networks', 'poverty'], answer: ['crisis', 'networks'] },
  { title: 'The Gutenberg Legacy', prompt: 'Gutenberg\'s invention of movable type transformed human [civilization] (speaker said: history). Before his press, books were copied by hand, making them incredibly [rare] (speaker said: expensive) and restricted to the wealthy elite.', options: ['civilization', 'hand', 'rare', 'wealthy', 'elite'], answer: ['civilization', 'rare'] },
  { title: 'Artificial Neural Nets', prompt: 'Neural networks are designed to mimic biological [pathways] (speaker said: systems). They consist of artificial nodes that pass [electricity] (speaker said: information) to calculate complex probabilities.', options: ['designed', 'pathways', 'nodes', 'electricity', 'probabilities'], answer: ['pathways', 'electricity'] },
  { title: 'The Big Bang Theory', prompt: 'Cosmologists agree the universe expanded from an extremely [dense] (speaker said: hot) point roughly fourteen billion years ago. This expansion synthesized the first light [elements] (speaker said: atoms) like hydrogen and helium.', options: ['agree', 'dense', 'fourteen', 'elements', 'helium'], answer: ['dense', 'elements'] },
  { title: 'The Nervous System Structure', prompt: 'The somatic nervous system governs all [voluntary] (speaker said: physical) movements of skeletal muscles. Sensory nerves carry impulses to the central [spinal] (speaker said: brain) cord for motor processing.', options: ['governs', 'voluntary', 'muscles', 'spinal', 'processing'], answer: ['voluntary', 'spinal'] }
];

const WFD_TEMPLATES = [
  { title: 'Academic Resources', prompt: '[AUDIO PLAYBACK: "The library offers quiet study spaces and digital resources for student research."]' },
  { title: 'Roman Legislative Power', prompt: '[AUDIO PLAYBACK: "The Roman Senate held immense administrative and financial power during the Republic."]' },
  { title: 'Autonomous Vehicles Future', prompt: '[AUDIO PLAYBACK: "Self-driving cars require high-fidelity map data and neural networks to operate safely."]' },
  { title: 'Black Hole Event Horizon', prompt: '[AUDIO PLAYBACK: "No physical matter can escape the immense gravitational pull of a black hole event horizon."]' },
  { title: 'Endorphin Hormone Triggers', prompt: '[AUDIO PLAYBACK: "Physical exercise stimulates the pituitary gland to release endorphins that alleviate pain."]' }
];

// PROGRAMMATIC QUESTIONS GENERATOR
const ALL_TEMPLATES: Record<string, any[]> = {
  RA: RA_TEMPLATES,
  RS: RS_TEMPLATES,
  DI: DI_TEMPLATES,
  RL: RL_TEMPLATES,
  ASQ: ASQ_TEMPLATES,
  SGD: SGD_TEMPLATES,
  RTS: RTS_TEMPLATES,
  SWT: SWT_TEMPLATES,
  WE: WE_TEMPLATES,
  MCS: MCS_TEMPLATES,
  MCM: MCM_TEMPLATES,
  ROP: ROP_TEMPLATES,
  FIBR: FIBR_TEMPLATES,
  FIBRW: FIBRW_TEMPLATES,
  SST: SST_TEMPLATES,
  MCMSL: MCMSL_TEMPLATES,
  FIBL: FIBL_TEMPLATES,
  HCS: HCS_TEMPLATES,
  MCSSL: MCSSL_TEMPLATES,
  SMW: SMW_TEMPLATES,
  HIW: HIW_TEMPLATES,
  WFD: WFD_TEMPLATES
};

// Compile 5 questions for all 22 task types = 110 questions total
Object.entries(ALL_TEMPLATES).forEach(([code, list]) => {
  const taskSection = ['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS'].includes(code)
    ? 'Speaking'
    : ['SWT', 'WE'].includes(code)
    ? 'Writing'
    : ['MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW'].includes(code)
    ? 'Reading'
    : 'Listening';

  list.forEach((t, index) => {
    const qId = `${code}-${(index + 1).toString().padStart(3, '0')}`;
    const topic = ACADEMIC_TOPICS[index];
    const item: PracticeItem = {
      id: qId,
      code: code as PTETaskCode,
      title: `${t.title} (${topic.tag})`,
      instruction: code === 'RA'
        ? 'Look at the text below. In 40 seconds, you must read this text aloud as naturally and clearly as possible.'
        : code === 'RS'
        ? 'You will hear a sentence. Please repeat the sentence exactly as you hear it.'
        : code === 'DI'
        ? 'Look at the chart below. In 25 seconds, please speak into the microphone and describe it in detail.'
        : code === 'RL'
        ? 'You will hear a lecture. After listening, retell what you have just heard in your own words.'
        : code === 'ASQ'
        ? 'You will hear a question. Please give a simple and short answer.'
        : code === 'SGD'
        ? 'Listen to a group discussion. Summarize the key findings and points of agreement.'
        : code === 'RTS'
        ? 'Read the scenario. Speak into the microphone and explain what action you would take.'
        : code === 'SWT'
        ? 'Read the passage below and summarize it in one sentence using 5 to 75 words.'
        : code === 'WE'
        ? 'Write a persuasive academic essay of 200-300 words on the given topic.'
        : code === 'MCS' || code === 'MCSSL'
        ? 'Answer the multiple-choice question by selecting only one correct option.'
        : code === 'MCM' || code === 'MCMSL'
        ? 'Answer the question by selecting all the correct responses. More than one may be correct.'
        : code === 'ROP'
        ? 'Drag and drop the scrambled paragraph boxes into the correct logical order.'
        : code === 'FIBR' || code === 'FIBL'
        ? 'In the text below, some words are missing. Drag or type words to fill the boxes.'
        : code === 'FIBRW'
        ? 'Below is a text with several blanks. Select the best fitting word from each drop-down.'
        : code === 'SST'
        ? 'Listen to the recording. Write a summary of 50-70 words based on what you heard.'
        : code === 'HCS'
        ? 'Listen to the recording. Select the paragraph option that best summarizes it.'
        : code === 'SMW'
        ? 'Listen to the recording. At the end, choose the correct word replacing the beep.'
        : code === 'HIW'
        ? 'Listen to the recording. Click/tap words in the transcript that differ from what was spoken.'
        : 'You will hear a sentence. Type the sentence exactly as you hear it.',
      promptText: t.prompt,
      imageUrl: t.img || undefined,
      audioUrl: ['RS', 'RL', 'ASQ', 'SGD', 'SST', 'MCMSL', 'FIBL', 'HCS', 'MCSSL', 'SMW', 'HIW', 'WFD'].includes(code)
        ? `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${index + 1}.mp3`
        : undefined,
      options: t.options || undefined,
      correctAnswer: t.answer || undefined,
      modelAnswer: code === 'RA'
        ? 'A high-scoring read aloud requires standard chunking, clear syllable enunciation, and natural sentence pitch.'
        : code === 'RS'
        ? t.prompt.replace('[AUDIO PLAYBACK: "', '').replace('"]', '')
        : code === 'DI'
        ? 'This image represents ' + t.title + '. In conclusion, we see significant trends in ' + topic.tag + '.'
        : code === 'RL'
        ? 'The lecture discussed core concepts of ' + t.title + '. The speaker highlighted ' + topic.tag + '.'
        : code === 'ASQ'
        ? 'The correct answer is ' + t.answer + '.'
        : code === 'SGD'
        ? 'The discussion centered on ' + t.title + ' where members arrived at a solid consensus.'
        : code === 'RTS'
        ? 'In this scenario, I would maintain a highly professional approach and prioritize safety.'
        : code === 'SWT'
        ? 'Condensing the main themes of ' + t.title + ' demonstrates the critical role of ' + topic.tag + '.'
        : code === 'WE'
        ? 'In conclusion, while the transition period presents tangible challenges, ' + t.title + ' represents an inevitable evolution.'
        : 'Reference key: ' + (Array.isArray(t.answer) ? t.answer.join(', ') : t.answer),
      tips: [
        'Pay close attention to academic vocabulary and collocation structures.',
        'Manage your time carefully; never hesitate for more than 2-3 seconds.',
        'Use templates to reduce cognitive load and structure your responses cleanly.'
      ],
      vocabulary: t.vocab || [
        { phrase: 'Systemic influence', meaning: 'Affecting an entire system or body rather than single parts' },
        { phrase: 'Pristine state', meaning: 'In its original condition; unspoiled or clean' }
      ]
    };
    PRACTICE_ITEMS_LIST.push(item);
  });
});

// Backward compatible mapping for single key lookups (returns the first item for each task type)
export const PRACTICE_ITEMS: Record<string, PracticeItem> = {};
PRACTICE_ITEMS_LIST.forEach((item) => {
  if (!PRACTICE_ITEMS[item.code]) {
    PRACTICE_ITEMS[item.code] = item;
  }
});

export const COURSES: Course[] = [
  { id: 'C-01', title: 'PTE Speaking Mastery', description: 'Master oral fluency, native pronunciation, and standard layouts for Describe Image, Read Aloud, and Retell Lecture.', lessonsCount: 3, progress: 75, image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=300&q=80', level: 'Intermediate' },
  { id: 'C-02', title: 'High-Scoring Writing Templates', description: 'Learn robust structure models for Essays and Summaries to guarantee full marks in grammar, range, and format spelling.', lessonsCount: 3, progress: 40, image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=300&q=80', level: 'Target 79+' },
  { id: 'C-03', title: 'PTE Foundation Grammar & Vocab', description: 'Build core academic vocabulary and master passive voice, complex clauses, and parallel structures for Reading blanks.', lessonsCount: 3, progress: 10, image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=300&q=80', level: 'Foundation' },
  { id: 'C-04', title: 'Reading Blank-Filling Strategies', description: 'Master contextual collocations and word forms for high-scoring reading performance.', lessonsCount: 3, progress: 0, image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=300&q=80', level: 'Intermediate' },
  { id: 'C-05', title: 'Listening Summarization & Spelling', description: 'Refine auditory recall, phonetic mapping, and perfect spelling for dictation.', lessonsCount: 3, progress: 0, image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=300&q=80', level: 'Target 79+' },
  { id: 'C-06', title: 'Describe Image Deep Dive', description: 'Structure-by-structure templates for line graphs, pie charts, maps, and flowcharts.', lessonsCount: 3, progress: 0, image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80', level: 'Intermediate' },
  { id: 'C-07', title: 'Retell Lecture Keynote Capturing', description: 'Note-taking structures and spoken formulas that maximize content scores easily.', lessonsCount: 3, progress: 0, image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=300&q=80', level: 'Intermediate' },
  { id: 'C-08', title: 'Write Essay Academic Mastery', description: 'Unlocking standard body structures to answer any societal or technological essay prompt.', lessonsCount: 3, progress: 0, image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=300&q=80', level: 'Target 79+' },
  { id: 'C-09', title: 'Summarize Written Text Sentence Structure', description: 'Master compound-complex sentence formulation to condense texts in 5-75 words.', lessonsCount: 3, progress: 0, image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=300&q=80', level: 'Intermediate' },
  { id: 'C-10', title: 'Re-order Paragraphs Logical Connectors', description: 'Trace subject pronouns, chronological clues, and logical transition pairs.', lessonsCount: 3, progress: 0, image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=300&q=80', level: 'Target 79+' },
  { id: 'C-11', title: 'Repeat Sentence Short-Term Memory', description: 'Chunking sound blocks and mirroring intonation keys to guarantee flow.', lessonsCount: 2, progress: 0, image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&w=300&q=80', level: 'Foundation' },
  { id: 'C-12', title: 'Read Aloud Phrasing & Intonation', description: 'Correct placement of breathing pauses and syllable stress points for native rhythm.', lessonsCount: 2, progress: 0, image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=300&q=80', level: 'Foundation' },
  { id: 'C-13', title: 'Highlight Incorrect Words Speed Reading', description: 'Synchronize visual reading with auditory stream to capture lexical gaps instantly.', lessonsCount: 2, progress: 0, image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=300&q=80', level: 'Intermediate' },
  { id: 'C-14', title: 'Write from Dictation Perfect Score', description: 'Unlocking standard punctuation boundaries and memory retention hacks.', lessonsCount: 2, progress: 0, image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=300&q=80', level: 'Target 79+' },
  { id: 'C-15', title: 'Answer Short Questions Lexical Bank', description: 'Expanding standard synonyms and rapid category matching for basic questions.', lessonsCount: 2, progress: 0, image: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=300&q=80', level: 'Foundation' },
  { id: 'C-16', title: 'PTE Test Center Strategy', description: 'Physical room environment, headset adjustments, and managing focus noise.', lessonsCount: 2, progress: 0, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80', level: 'Intermediate' },
  { id: 'C-17', title: 'Time Management & Pacing', description: 'Strategic division of reading and listening blocks to prevent running out of time.', lessonsCount: 2, progress: 0, image: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=300&q=80', level: 'Target 79+' },
  { id: 'C-18', title: 'AI Grading Algorithm Hacks', description: 'How acoustic models analyze acoustic features and text analyzers look for vocabulary.', lessonsCount: 2, progress: 0, image: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=300&q=80', level: 'Target 79+' },
  { id: 'C-19', title: 'Advanced Collocations & Idioms', description: 'Common pairings in scientific, sociological, and historical literature.', lessonsCount: 2, progress: 0, image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=300&q=80', level: 'Target 79+' },
  { id: 'C-20', title: 'Pronunciation & Accent Mitigation', description: 'Targeting specific high-frequency phonemic errors and vowel-flattening.', lessonsCount: 2, progress: 0, image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&w=300&q=80', level: 'Intermediate' }
];

export const LESSONS: Lesson[] = [];

// Populate 50 distinct lessons across the 20 courses
COURSES.forEach((course) => {
  const count = course.lessonsCount;
  for (let i = 1; i <= count; i++) {
    const lessonId = `L-${course.id.split('-')[1]}-${i.toString().padStart(2, '0')}`;
    const lessonNum = LESSONS.length + 1;
    // Assign exactly 20 video lectures across the first 20 lessons
    const videoUrl = lessonNum <= 20
      ? `https://www.w3schools.com/html/mov_bbb.mp4?v=${lessonNum}`
      : undefined;

    LESSONS.push({
      id: lessonId,
      courseId: course.id,
      title: `${course.title} - Session ${i}: Mechanics`,
      duration: `${10 + (i * 4)} mins`,
      completed: lessonNum <= 2,
      videoUrl,
      content: `Welcome to Session ${i} of the course: ${course.title}.\n\n### Strategic Overview:\nIn this lesson, we break down the Pearson grading rules. The AI algorithm checks for specific markers.\n\n### Core Rules:\n1. Maintain a clean, stable pitch without sudden vocal jumps.\n2. Do not backtrack or repeat words even if you mispronounced them.\n3. Keep your word transitions smooth to simulate high oral fluency.\n\n### Application Exercises:\nPractice this approach on related task questions.`,
      grammarRules: [`Syntax clarity rules`, `Academic style formatting`]
    });
  }
});

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
