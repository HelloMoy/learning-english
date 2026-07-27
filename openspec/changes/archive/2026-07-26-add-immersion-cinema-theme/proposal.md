## Why

Las cuatro vistas del recorrido público — home (`/[locale]`), overview de curso, overview de módulo y Lesson Page — ya existen y funcionan sobre datos reales (10 módulos, 107 lecciones del seed `advanced-intermediate-course`). Lo que falta es identidad visual: hoy usan la paleta clara "studio" (papel crema, azul de práctica, amarillo señal) sin un lenguaje propio.

Los mockups `04-immersion-cinema-*.png` definen una dirección coherente de "cine de inmersión" / streaming: fondo casi negro con brillo ámbar cálido, acentos dorados, wordmark `LEARN·ENGLISH`, y metáforas de catálogo (posters, episodios, "Now streaming", "Season 1 · 10 episodes"). Queremos aplicar esa identidad a las cuatro vistas sin tocar el dominio, los puertos ni el almacenamiento, y sin perder i18n (en/es/pt), accesibilidad ni el toggle de tema.

## What Changes

- Redefinir la capa de tokens de color en `globals.css` a la paleta Immersion Cinema, con **dos variantes cálidas** (`:root` cinema-light y `.dark` cinema-dark) sobre el mismo dorado, de modo que las utilidades existentes (`bg-background`, `text-ink`, `bg-signal-yellow`, `bg-card`, `text-muted-foreground`, …) hereden el nuevo aspecto sin reescribir cada componente.
- Añadir el cromo global en `[locale]/layout.tsx`: wordmark `LEARN·ENGLISH`, subtítulo `IMMERSION CINEMA · <SECCIÓN>`, y `LocaleSwitcher` / `ThemeToggle` re-estilizados como "chips".
- Añadir primitivos compartidos en `src/components/`: `CinemaBackground` (glow radial + barras letterbox), `Brand`/wordmark, `SectionChrome`/eyebrow, `PosterCard` (glow + número de episodio + badge de play, usando los `*-snapshot.jpeg` como artwork), `GoldBadge` (pill) y `PlayButton` circular.
- **Home:** hero "Now streaming" con `CinemaBackground` + rail del curso destacado (poster "Welcome", conteos, mini-grid 01–10).
- **Course:** retirar `CourseOverviewTrack` y renderizar los módulos como grid 5×2 de `PosterCard` ("Season 1 · 10 episodes"), con CTA "Start course".
- **Module:** hero poster del módulo + filas de episodios ("Episode N · duración · Open").
- **Lesson:** video-hero con overlay de título dorado, tabs **Notes / Transcript** (Transcript deshabilitada, sin datos), split **ESPAÑOL / ENGLISH** derivado del `readme.md` bilingüe existente, y re-estilo del outline izquierdo y del rail derecho (Resources / Lesson notes / Up next).
- Nuevos textos de interfaz (cinema microcopy) en `src/messages/{en,es,pt}.json`.

## Capabilities

### New Capabilities

- `cinema-theme-tokens`: capa de tokens Immersion Cinema (light + dark) y primitivos visuales compartidos, con contraste accesible.
- `cinema-home`: home re-estilizada como portada de streaming con hero y curso destacado.
- `cinema-course-overview`: overview de curso como catálogo de episodios en grid de posters.
- `cinema-module-overview`: overview de módulo como lista de episodios con hero poster.
- `cinema-lesson-view`: Lesson Page como reproductor de cine con tabs Notes/Transcript y split ES/EN.

### Modified Capabilities

- Ninguna. El cambio es puramente de presentación: reutiliza los use cases y read models existentes (`findCourseCatalog`, `findCourseForView`, `findModuleForView`, `findLessonForView`, `findLessonNotes`) sin alterar contratos de dominio, puertos ni `BlobStore`.

## Impact

- **UI:** `src/app/globals.css`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, componentes de `course-catalog`, `course-overview`, `module-overview` y `lesson-view`; nuevos primitivos bajo `src/components/cinema-*`.
- **Dominio / adapters:** sin cambios. No se añaden puertos, use cases ni dependencias de almacenamiento; los posters se sirven por los URLs que ya produce `BlobStore`.
- **i18n:** nuevas claves de microcopy en `src/messages/{en,es,pt}.json` y mensajes de Storybook.
- **Testing:** Vitest + RTL para los primitivos y las vistas; Playwright e2e para el recorrido `/en` → curso → módulo → lección con el nuevo aspecto y la accesibilidad de los controles.
- **Breaking changes:** ninguno en rutas ni datos. `CourseOverviewTrack` deja de usarse en la vista de curso (se puede conservar el componente o retirarlo según D2).

## Non-goals

- No modificar el dominio, los puertos, los use cases ni el almacenamiento (`BlobStore`, adapters, layout de `public/local-filesystem-lesson/`).
- No incorporar datos reales de transcripción: la pestaña Transcript se muestra por fidelidad visual pero queda deshabilitada.
- No sustituir el `NativeVideoPlayer` existente ni añadir streaming HLS o animaciones de reproducción.
- No mantener en paralelo el sistema de temas "studio": la paleta cinema lo reemplaza (light + dark).
- No cambiar el copy de contenido de las lecciones; sólo se re-encuadra el `readme.md` bilingüe ya presente.
