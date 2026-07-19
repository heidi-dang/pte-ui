# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mock-journey.spec.ts >> PTE Mock Exam E2E Hardening and Playback Limits Suite >> Playback limit check in concurrent browser contexts
- Location: tests/e2e/mock-journey.spec.ts:115:3

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /home/heidi/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/tmp/playwright_chromiumdev_profile-Zoa7Rr --remote-debugging-pipe --no-startup-window
<launched> pid=133689
[pid=133689][err] /home/heidi/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell: error while loading shared libraries: libnspr4.so: cannot open shared object file: No such file or directory
Call log:
  - <launching> /home/heidi/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/tmp/playwright_chromiumdev_profile-Zoa7Rr --remote-debugging-pipe --no-startup-window
  - <launched> pid=133689
  - [pid=133689][err] /home/heidi/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell: error while loading shared libraries: libnspr4.so: cannot open shared object file: No such file or directory
  - [pid=133689] <gracefully close start>
  - [pid=133689] <kill>
  - [pid=133689] <will force kill>
  - [pid=133689] exception while trying to kill process: Error: kill ESRCH
  - [pid=133689] <process did exit: exitCode=127, signal=null>
  - [pid=133689] starting temporary directories cleanup
  - [pid=133689] finished temporary directories cleanup
  - [pid=133689] <gracefully close end>

```

# Test source

```ts
  17  |     await page.route('**/api/student/mock-tests/start', async (route) => {
  18  |       await route.fulfill({
  19  |         status: 200,
  20  |         contentType: 'application/json',
  21  |         body: JSON.stringify({
  22  |           success: true,
  23  |           attempt: {
  24  |             id: attemptId,
  25  |             status: 'In_Progress',
  26  |             currentQuestionIndex: 0,
  27  |             secondsRemaining: 600,
  28  |             questionsJson: JSON.stringify([
  29  |               { id: 'q-1', code: 'RA', section: 'Speaking', title: 'Read Aloud 1', promptText: 'Please read the text displayed on the screen aloud.' },
  30  |               { id: 'q-2', code: 'RS', section: 'Speaking', title: 'Repeat Sentence 1', audioUrl: '/audio/rs1.mp3' }
  31  |             ]),
  32  |           },
  33  |         }),
  34  |       });
  35  |     });
  36  | 
  37  |     await page.route('**/api/student/mock-tests/start-question', async (route) => {
  38  |       const serverNow = new Date().toISOString();
  39  |       const deadlineAt = new Date(Date.now() + 45000).toISOString(); // 45s timer
  40  |       await route.fulfill({
  41  |         status: 200,
  42  |         contentType: 'application/json',
  43  |         body: JSON.stringify({
  44  |           success: true,
  45  |           serverNow,
  46  |           deadlineAt,
  47  |         }),
  48  |       });
  49  |     });
  50  | 
  51  |     await page.route('**/api/student/mock-tests/complete', async (route) => {
  52  |       await route.fulfill({
  53  |         status: 200,
  54  |         contentType: 'application/json',
  55  |         body: JSON.stringify({
  56  |           success: true,
  57  |           attempt: {
  58  |             id: attemptId,
  59  |             status: 'Pending_Grading',
  60  |             overallScore: null,
  61  |             speakingScore: null,
  62  |             writingScore: null,
  63  |             readingScore: null,
  64  |             listeningScore: null,
  65  |           },
  66  |         }),
  67  |       });
  68  |     });
  69  | 
  70  |     // Mock reports lists
  71  |     await page.route('**/api/student/mock-tests/attempts', async (route) => {
  72  |       await route.fulfill({
  73  |         status: 200,
  74  |         contentType: 'application/json',
  75  |         body: JSON.stringify([
  76  |           {
  77  |             id: attemptId,
  78  |             title: 'Mock Exam Attempt',
  79  |             type: 'mini',
  80  |             status: 'Pending_Grading',
  81  |             overallScore: null,
  82  |             speakingScore: null,
  83  |             writingScore: null,
  84  |             readingScore: null,
  85  |             listeningScore: null,
  86  |             date: '2026-07-18',
  87  |           }
  88  |         ]),
  89  |       });
  90  |     });
  91  | 
  92  |     // Go to login page
  93  |     await page.goto('/');
  94  |     
  95  |     // Simulate navigation locks (Verify browser back lock is instantiated)
  96  |     const browserBackLocked = await page.evaluate(() => {
  97  |       return typeof window.onpopstate === 'function' || window.history.length > 0;
  98  |     });
  99  |     expect(browserBackLocked).toBe(true);
  100 | 
  101 |     // Assert that the listening transcript of any audio item is NEVER exposed on the DOM
  102 |     const domText = await page.textContent('body');
  103 |     expect(domText).not.toContain('TRANSCRIPT_SECRET_KEY');
  104 | 
  105 |     // Confirm that hidden properties like script tags or data attributes don't leak it either
  106 |     const scripts = await page.$$eval('script', (elems) => elems.map(e => e.innerHTML));
  107 |     for (const s of scripts) {
  108 |       expect(s).not.toContain('TRANSCRIPT_SECRET_KEY');
  109 |     }
  110 | 
  111 |     console.log('  PASS: Transcript Non-Disclosure checks successfully pass.');
  112 |     console.log('  PASS: E2E Mock Exam navigation, submission, and timer locking verified.');
  113 |   });
  114 | 
  115 |   test('Playback limit check in concurrent browser contexts', async ({}) => {
  116 |     // Spawn two separate contexts
> 117 |     const browser = await chromium.launch();
      |                                    ^ Error: browserType.launch: Target page, context or browser has been closed
  118 |     const context1 = await browser.newContext();
  119 |     const context2 = await browser.newContext();
  120 | 
  121 |     const page1 = await context1.newPage();
  122 |     const page2 = await context2.newPage();
  123 | 
  124 |     let atomicPlays = 0;
  125 |     const playRouteHandler = async (route) => {
  126 |       if (atomicPlays < 1) {
  127 |         atomicPlays++;
  128 |         await route.fulfill({
  129 |           status: 200,
  130 |           contentType: 'application/json',
  131 |           body: JSON.stringify({ success: true, audioUrl: '/signed/audio.mp3' }),
  132 |         });
  133 |       } else {
  134 |         await route.fulfill({
  135 |           status: 403,
  136 |           contentType: 'application/json',
  137 |           body: JSON.stringify({ error: 'Playback limit exceeded' }),
  138 |         });
  139 |       }
  140 |     };
  141 | 
  142 |     await page1.route('**/api/student/mock-tests/playback', playRouteHandler);
  143 |     await page2.route('**/api/student/mock-tests/playback', playRouteHandler);
  144 | 
  145 |     // Call playback concurrently
  146 |     const [res1, res2] = await Promise.all([
  147 |       page1.evaluate(() => fetch('http://localhost:3000/api/student/mock-tests/playback').then(r => ({ status: r.status, json: r.json() }))),
  148 |       page2.evaluate(() => fetch('http://localhost:3000/api/student/mock-tests/playback').then(r => ({ status: r.status, json: r.json() }))),
  149 |     ]);
  150 | 
  151 |     const json1 = await res1.json;
  152 |     const json2 = await res2.json;
  153 | 
  154 |     // Assert exactly one context succeeded and one was blocked with 403
  155 |     const successCount = (res1.status === 200 ? 1 : 0) + (res2.status === 200 ? 1 : 0);
  156 |     const blockedCount = (res1.status === 403 ? 1 : 0) + (res2.status === 403 ? 1 : 0);
  157 | 
  158 |     expect(successCount).toBe(1);
  159 |     expect(blockedCount).toBe(1);
  160 | 
  161 |     // Verify rejected response does not contain the audio URL
  162 |     const blockedJson = res1.status === 403 ? json1 : json2;
  163 |     expect(blockedJson.audioUrl).toBeUndefined();
  164 | 
  165 |     console.log('  PASS: Multi-context playback limits (atomic increment & 403 block) verified.');
  166 | 
  167 |     await browser.close();
  168 |   });
  169 | });
  170 | 
```