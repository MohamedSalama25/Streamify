# Streamify

Streamify هو MVP لتطبيق تعاون لحظي ومكالمات فيديو مبني كـ `pnpm monorepo`.

التطبيق يسمح للمستخدمين بـ:

- إدخال `display name`
- إنشاء غرفة أو الانضمام لغرفة موجودة
- بدء مكالمة فيديو `peer-to-peer`
- إرسال رسائل Chat لحظية
- مشاركة الشاشة
- مشاهدة المشاركين وحالة الاتصال
- تشغيل / إيقاف الميكروفون والكاميرا
- مغادرة الغرفة مع cleanup سليم للـ sockets والـ media tracks

المشروع معمول بهيكل production-minded من البداية بحيث يكون سهل التطوير لاحقًا، خصوصًا عند استبدال WebRTC mesh بـ SFU بدون إعادة كتابة الواجهة بالكامل.

## 1. نظرة عامة على التقنيات

### Frontend

- `Next.js 16` مع `App Router`
- `React 19`
- `TypeScript`
- `Tailwind CSS`
- `shadcn-style UI primitives`
- `lucide-react`
- `socket.io-client`
- `WebRTC`
- `sonner` للتنبيهات
- `zod` للتحقق من البيانات

### Backend

- `Express.js`
- `Socket.IO`
- `TypeScript`
- `zod`
- `tsx` للتشغيل أثناء التطوير
- `tsup` للبناء

### Shared Layer

- Package مشتركة فيها:
  - أسماء الـ socket events
  - الـ schemas
  - الـ shared types
  - الثوابت المشتركة

## 2. الفكرة المعمارية

### لماذا Monorepo؟

لأن المشروع فيه 3 طبقات مترابطة:

- `apps/web`: الواجهة
- `apps/server`: الـ signaling server
- `packages/shared`: العقود المشتركة بين الطرفين

هذا يمنع duplication في الأنواع والأحداث، ويقلل جدًا احتمالية اختلاف الـ payloads بين الـ frontend والـ backend.

### لماذا WebRTC Mesh؟

في هذا الـ MVP، الميديا تنتقل `peer-to-peer` مباشرة بين المشاركين، بينما الـ server مسؤول فقط عن:

- signaling
- room membership
- presence
- chat relay
- ICE config endpoint

السبب:

- أبسط للتنفيذ كبداية
- مناسب لغرف صغيرة
- يحقق MVP فعلي وقابل للتجربة بسرعة

لكن بما أن mesh لا يتوسع جيدًا، تم تنظيم الكود بحيث يمكن لاحقًا استبداله بـ `SFU` مع أقل تغيير ممكن في الواجهة.

## 3. Monorepo Structure

```text
streamify/
├── apps/
│   ├── server/
│   │   ├── src/
│   │   │   ├── app.ts
│   │   │   ├── server.ts
│   │   │   ├── config/
│   │   │   ├── common/
│   │   │   ├── features/
│   │   │   │   ├── health/
│   │   │   │   ├── rooms/
│   │   │   │   ├── users/
│   │   │   │   ├── signaling/
│   │   │   │   ├── chat/
│   │   │   │   ├── rtc/
│   │   │   │   └── presence/
│   │   │   └── socket/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   ├── room/
│       │   │   ├── rtc/
│       │   │   ├── chat/
│       │   │   ├── participants/
│       │   │   ├── screen-share/
│       │   │   ├── layout/
│       │   │   └── ui/
│       │   └── shared/
│       ├── package.json
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       └── tsconfig.json
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── constants/
│       │   ├── events/
│       │   ├── schemas/
│       │   └── types/
│       ├── package.json
│       └── tsconfig.json
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

## 4. شرح كل جزء في المشروع

### `apps/web`

الواجهة مبنية بأسلوب `feature-based architecture` بدل تنظيم الملفات حسب النوع فقط. هذا يجعل كل feature مسؤولة عن نفسها.

#### Features الأساسية

- `auth`
  - حفظ هوية المستخدم محليًا في `localStorage`
  - إنشاء `userId`
  - إدارة `displayName`

- `room`
  - إدارة دورة حياة الغرفة
  - join / leave
  - room store
  - room header + controls + home hero

- `rtc`
  - تشغيل الكاميرا والميكروفون
  - إدارة `RTCPeerConnection` لكل participant
  - التعامل مع:
    - offer
    - answer
    - ICE candidates
    - track events
    - connection state
    - cleanup

- `chat`
  - إرسال واستقبال الرسائل في الوقت الحقيقي
  - عرض الرسائل مع اسم المرسل والتوقيت
  - auto-scroll داخل نافذة المحادثة

- `participants`
  - عرض قائمة المشاركين
  - ترتيب المشاركين
  - إظهار الحالة مثل:
    - mic
    - camera
    - screen share
    - connection state

- `screen-share`
  - اكتشاف الشاشة التي تتم مشاركتها
  - pin تلقائي للمحتوى المشترك
  - عرضها في `PinnedStage`

- `ui`
  - مكونات UI reusable مبنية بأسلوب `shadcn/ui`
  - مثل:
    - Button
    - Card
    - Input
    - Sheet
    - Tooltip
    - Badge
    - Avatar

### `apps/server`

الـ server مسؤول عن logic الغرف والإشارات اللحظية وليس عن بث الميديا نفسها.

#### Features الأساسية

- `health`
  - endpoint بسيط: `GET /health`

- `rooms`
  - إنشاء room ID
  - تخزين الغرف في الذاكرة
  - التحقق من الحد الأقصى للمشاركين
  - tracking للموجودين داخل كل غرفة

- `users`
  - بناء/توحيد تمثيل المستخدم داخل الـ server

- `signaling`
  - relay للـ WebRTC events بين المشاركين

- `chat`
  - استقبال الرسائل وبثها داخل الغرفة

- `rtc`
  - endpoint لإرجاع إعدادات ICE:
    - STUN
    - TURN

- `presence`
  - أحداث join / leave
  - تحديث قائمة المشاركين

### `packages/shared`

هذه أهم طبقة في المشروع من ناحية التماسك بين الطرفين.

تحتوي على:

- socket event constants
- zod schemas
- room types
- participant types
- chat types
- RTC payload types
- shared constants مثل:
  - room size limit
  - أسماء الأحداث

## 5. ما الذي تم تنفيذه في التطبيق؟

تم تنفيذ الـ MVP فعليًا وليس مجرد scaffold.

### Home Page

- Branding باسم `Streamify`
- Hero section منظم
- إدخال `display name`
- إنشاء غرفة جديدة
- الانضمام إلى غرفة عبر `room ID`
- حفظ الهوية محليًا

### Room Page

- عرض local video
- عرض remote participants في video grid responsive
- pinned area لمشاركة الشاشة
- participants sidebar
- chat panel
- controls bar في الأسفل
- حالة loading و error و empty states

### Real-Time Features

- إنشاء غرفة عبر socket contract موحد
- الانضمام لغرفة موجودة
- حضور المشاركين لحظيًا
- رسائل chat في الوقت الحقيقي
- تنبيهات join / leave / errors
- copy room link
- reconnect behavior مناسب للـ session الحالي

### Media / WebRTC

- طلب صلاحيات الكاميرا والميكروفون
- تشغيل وإيقاف الميكروفون
- تشغيل وإيقاف الكاميرا
- مشاركة الشاشة باستخدام `getDisplayMedia`
- استبدال video track أثناء screen share
- استرجاع camera track بعد إيقاف مشاركة الشاشة
- cleanup صحيح للـ peer connections عند الخروج أو الانقطاع

### Room Rules

- الحد الأقصى للمشاركين: `4`
- رفض الانضمام إذا كانت الغرفة ممتلئة
- رفض الغرفة غير الصحيحة برسالة مفهومة
- استخدام غرف ephemeral بدون قاعدة بيانات

## 6. تدفق العمل داخل التطبيق

### 1. دخول المستخدم

- المستخدم يكتب اسمه
- التطبيق ينشئ أو يسترجع `userId`
- يتم حفظ الهوية محليًا

### 2. إنشاء غرفة

- الواجهة ترسل `room:create`
- الـ server يولد room code
- يتم توجيه المستخدم إلى `/room/[roomId]`

### 3. الانضمام لغرفة

- الواجهة ترسل `room:join`
- الـ server يتحقق من:
  - وجود الغرفة
  - عدم تجاوز السعة
- بعدها يرسل participants الحاليين

### 4. تجهيز الميديا

- الواجهة تطلب `getUserMedia`
- يتم إنشاء local stream
- يبدأ signaling بين المشاركين

### 5. WebRTC Signaling

- participant جديد يعلن أنه جاهز
- peer آخر ينشئ `offer`
- الطرف المقابل يرد بـ `answer`
- يتم تبادل `ICE candidates`
- عند نجاح الاتصال تظهر الـ remote tracks

### 6. Chat و Presence

- الرسائل تُبث على مستوى الغرفة
- join / leave events تحدث تحديثًا لحظيًا للـ UI

### 7. Leave / Disconnect

- إغلاق peer connections
- إيقاف media tracks عند الحاجة
- إزالة المستخدم من room membership
- تحديث presence لباقي المشاركين

## 7. Socket Contract المستخدم

الأحداث الأساسية المشتركة بين `web` و `server`:

- `room:create`
- `room:join`
- `room:joined`
- `room:error`
- `room:leave`
- `room:participants`
- `presence:user-joined`
- `presence:user-left`
- `chat:send`
- `chat:new-message`
- `rtc:offer`
- `rtc:answer`
- `rtc:ice-candidate`
- `rtc:peer-ready`
- `rtc:connection-state`
- `screen:start`
- `screen:stop`

جميعها معرفة في `packages/shared` لضمان التوافق الكامل.

## 8. الصفحات الأساسية

### `/`

الصفحة الرئيسية وتحتوي على:

- تعريف بالمنتج
- display name form
- create room action
- join room action

### `/room/[roomId]`

غرفة الاجتماع وتحتوي على:

- room header
- pinned stage
- video grid
- participants sidebar
- chat panel
- bottom controls

### صفحات إضافية

- `error.tsx`
- `not-found.tsx`

## 9. Environment Variables

### `apps/server/.env`

```env
PORT=4000
CLIENT_URL=http://localhost:3000
RTC_STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
RTC_TURN_URLS=
RTC_TURN_USERNAME=
RTC_TURN_CREDENTIAL=
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

## 10. Setup

### المتطلبات

- `Node.js 20+`
- `pnpm 10+`

إذا لم يكن `pnpm` مثبتًا:

```bash
corepack enable
corepack prepare pnpm@10.5.2 --activate
```

### تثبيت المشروع

```bash
pnpm install
```

### تجهيز ملفات البيئة

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env.local
```

## 11. أوامر التشغيل

من root المشروع:

```bash
pnpm dev
pnpm dev:web
pnpm dev:server
pnpm build
pnpm lint
pnpm typecheck
```

## 12. طريقة تشغيل التطبيق

1. ثبت dependencies باستخدام `pnpm install`
2. أنشئ ملفات البيئة من الأمثلة
3. شغل المشروع باستخدام `pnpm dev`
4. افتح `http://localhost:3000`
5. أنشئ غرفة من تبويب
6. افتح تبويب أو جهاز آخر وانضم لنفس الغرفة

## 13. التحقق الذي تم على المشروع

تم تنفيذ والتحقق من:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

كما تم إصلاح عدد من المشاكل التشغيلية أثناء التطوير، منها:

- مشاكل TypeScript الخاصة بـ `@types/node`
- مشكلة hydration mismatch بسبب browser extension على `<body>`
- مشكلة route params في Next.js 16 داخل صفحة `/room/[roomId]`

## 14. القيود الحالية

لأن المشروع مبني على `WebRTC mesh`:

- الغرفة محددة بـ 4 مشاركين فقط
- استهلاك الرفع يزيد مع زيادة عدد المشاركين
- الأداء لن يكون مناسبًا لغرف كبيرة
- لا توجد قاعدة بيانات
- لا يوجد authentication حقيقي
- لا يوجد message history دائم
- لا يوجد recording

## 15. لماذا الكود قابل للتوسع؟

لأن المسؤوليات مفصولة بوضوح:

- الـ signaling معزول عن media transport
- shared contracts موحدة بين العميل والخادم
- room state منفصل عن تفاصيل socket implementation
- peer management موجود داخل service مخصص

هذا يجعل الانتقال إلى:

- `SFU`
- persistence
- auth
- moderation
- analytics

أسهل بكثير من مشروع مبني بشكل عشوائي.

## 16. تحسينات مستقبلية مقترحة

- إضافة authentication وصلاحيات فعلية
- ربط قاعدة بيانات للغرف والرسائل
- دعم `SFU` بدل mesh
- تسجيل المكالمات
- device selection
- reconnect strategy أقوى
- network quality indicators أدق
- moderation tools
- waiting room
- host controls

## 17. ملخص سريع

في Streamify تم بناء:

- Monorepo منظم باستخدام `pnpm workspaces`
- Frontend حديث بـ `Next.js 16`
- Backend modular بـ `Express + Socket.IO`
- Shared contract layer بـ `zod + TypeScript`
- مكالمات فيديو `peer-to-peer`
- Chat لحظي
- Presence tracking
- Screen sharing
- Responsive UI منظمة وقابلة للتطوير

النتيجة هي MVP كامل وقابل للتشغيل محليًا، وفي نفس الوقت منظم بطريقة تسهّل تطويره لاحقًا بدل الحاجة لإعادة بنائه من الصفر.
