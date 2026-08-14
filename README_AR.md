# EX™ PLAYABLE WORLDS — MAX TECH V2

هذه ليست نسخة "نهائية AAA" بالمحتوى الفني، لكنها أعلى بنية تقنية عملية يمكن تشغيلها على الويب الآن بدون ادعاء زائف أن الرسومات اليدوية، الصوت الأصلي، الخوادم العالمية أو اعتماد المنصات تم إنجازها.

## ARABIA STRIKE
- 304×224 native simulation
- 59.18Hz fixed timestep
- modular engine
- deterministic tactical slowdown
- enemy FSM
- weapon definitions
- grenade physics
- destructibles
- vehicle hook
- phased boss
- replay recorder
- analytics adapter
- pixel renderer
- independent service worker/cache
- smoke test

الخطوة التالية ليست زيادة JavaScript؛ بل Production Asset Pipeline:
Sprite atlases + 12–30 frames per action + original audio banks + 4–8 missions.

## EX ALJAZIRA
- Three.js WebGPURenderer architecture
- WebGPU with WebGL2 fallback handled by renderer
- Worker-based deterministic chunk generation
- 16×16 chunks
- prefetch / visible chunk radii
- instanced terrain columns
- IndexedDB saves
- PULSE GRID logic simulator
- RaidDirector
- enemy manager
- chat adapter
- analytics adapter
- independent PWA cache
- smoke test

المرحلة التالية للوصول إلى MMO:
- greedy-meshed voxel chunks
- persistent delta store
- server authoritative simulation
- Cloud Functions/App Check
- realtime gateway
- matchmaking/world shards
- moderation/admin tools

## التشغيل المحلي
شغل HTTP server من جذر الحزمة، مثال:
python -m http.server 8080

ARABIA:
http://localhost:8080/arabiastrike/

ALJAZIRA:
http://localhost:8080/aljazira/

## النشر الآمن
من مجلد shared:
.\safe-deploy.ps1 -Game arabiastrike
.\safe-deploy.ps1 -Game aljazira

هذا ينشئ preview branch فقط.

للنشر على main بعد الاختبار:
.\safe-deploy.ps1 -Game arabiastrike -Publish
.\safe-deploy.ps1 -Game aljazira -Publish
