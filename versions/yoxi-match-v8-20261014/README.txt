yoxi MATCH! V8 — 2026-10-14

Entry: index.html (review mode), ?mode=app#explore (phone view).
Review pages: highlights.html, overview.html, integration.html, mechanism.html, pdf-placement.html, compare.html, references.html.
Main routes: #journey, #footprints, #bear, #run, #runplay, #runresult, #leaderboard, #tripmemory.
Preserved V7: https://e40125.github.io/yoxi-meeting-review/versions/yoxi-match-v7-20261014/

What V8 adds
A sample ride to Yuanshan now connects to the same place's city footprint, flower souvenir and Run course. Completing that sample arrival adds 3.8 km, 15 minutes and Zhongshan once; it also collects the Yuanshan course and flower badge. The story can continue next day on the same Yuanshan course, wearing the trip souvenir.
Dadaocheng is the default course and remains freely playable. Yuanshan is playable as a trial before arrival and through a shared course link. Trial play records game scores but does not count as visiting, add ride mileage, award the ride flower or collect the trip-earned course.
Course links: ?mode=app&course=dadaocheng#run and ?mode=app&course=yuanshan#run.
Run scores and personal bests are separate for each course. Mileage rankings use the trip records, not game points. First completed Run grants the existing leaf bookmark; it is separate from the Yuanshan flower.

Interactive scope
Local Three.js renders the bear and both city courses. A Run lasts 30 seconds with touch buttons, swipes, arrow/space controls, pause and retry. Equipped accessories appear on the bear and carry into Run. Scores, selections, sample arrival and collections save in this browser under yoxi-studio-v8, separate from V7. Current internals keep some v7-named files and APIs; these names do not identify the published version.

Data
The 9–10 month trip list, people, fares, promotions and rival scores are examples. October starts at 66.9 km/8 rides/6 visited districts, becomes 70.7 km/9 rides/7 districts after the one sample arrival. September plus October cumulative mileage is 116.6 km before arrival and 120.4 km after. Monthly analytics and cumulative mileage collectibles use these different, stated periods.
The city map and 3D scenes are thematic illustrations, not exact administrative boundaries, real driving tracks or navigation. The official historical dataset has endpoints, distance and time, not traveled road traces or live companions. V8 does not publish official passenger coordinates.
No production ride sync, cross-device account, real multiplayer leaderboard, automatic friend notification, verified identity, reward redemption or payment backend is connected. Challenge sharing copies a course-specific link for the user to send.
AI import/recommendation and the existing co-rider data remain examples. Music is opened through external services; no in-app licensed music, lyrics or audio recording is added.

Hosting and verification
Serve over HTTP(S); the WebGL module is not intended for file:// opening. V8 checks and final screen captures belong in qa-v8. Inherited qa-v7 and older folders are historical evidence only, not proof that V8 was tested. Reuse unchanged imagery only when its exact visible state still applies; newly connected routes, arrival, wardrobe and course results need V8 captures.
The PDF/PPTX was inspected for placement, not edited by this product revision. Narrative planning is separate from video production; no video is implied by these pages.

Sources
Three.js MIT: run-v7/vendor/THREE-LICENSE.txt.
Existing activity photos: assets/v5/SOURCES.txt.
Original ride map: assets/map-v5/SOURCE.txt.
Song artwork and external music links: assets/v6/SOURCES.txt.
References.html retains the Strava, Pikmin Bloom and Three.js design references.
