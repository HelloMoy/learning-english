## Why

`/en` no ofrece todavía una entrada navegable al curso real `advanced-intermediate-course`: solo muestra la pantalla inicial, mientras que el contenido ya está disponible en el seed generado y la Lesson Page funciona únicamente cuando se conoce una URL profunda. Además, la Lesson Page contiene breadcrumbs que apuntan a niveles de curso y módulo que aún no existen, y los `readme.md` se exponen como recursos crudos en lugar de formar parte de la experiencia de aprendizaje.

Ahora que el contenido local está normalizado y validado —10 módulos, 107 lecciones y assets servidos mediante `BlobStore`— hace falta completar la navegación pública sin duplicar la capa de almacenamiento ni acoplar la UI al filesystem.

## What Changes

- Convertir `/[locale]` en una entrada de catálogo que muestre una card locale-aware para `Advanced Intermediate Course`.
- Añadir una página overview del curso con sus 10 módulos y un CTA claro para comenzar por la primera lección.
- Añadir una página overview de módulo con sus lecciones, duración y enlaces a las Lesson Pages existentes.
- Hacer que todos los segmentos del breadcrumb de la Lesson Page apunten a páginas reales y locale-aware.
- Mostrar los `readme.md` asociados a lecciones como notas inline seguras, conservando el enlace al archivo original cuando corresponda.
- Mantener videos, posters y recursos binarios detrás de los URLs producidos por `BlobStore`; no añadir un segundo mecanismo de acceso al filesystem.
- Añadir una navegación visual de 10 módulos basada en una “practice track” que codifique la secuencia real del curso.
- Mejorar el flujo para teclado y móvil: skip link, foco visible, targets táctiles adecuados, reduced motion y outline que no expanda innecesariamente las 107 lecciones.
- Añadir casos de uso/read models de lectura para catálogo, curso y módulo sin permitir que el dominio importe Next.js, React, next-intl o adapters.
- Añadir tests unitarios, stories y un flujo E2E desde `/en` hasta una lección y su siguiente lección.

## Capabilities

### New Capabilities

- `course-catalog-navigation`: catálogo locale-aware, card del curso, overview de curso, overview de módulo y navegación hacia lecciones.
- `inline-lesson-notes`: lectura segura y renderizado inline de los `readme.md` asociados a una lección, con fallback a recursos enlazados cuando no exista nota.

### Modified Capabilities

- `course-platform-domain`: añadir contratos de lectura necesarios para obtener el catálogo, el overview del curso, el overview de un módulo y las notas de una lección mediante use cases que devuelvan `ResultAsync`.
- `course-content-storage`: permitir lectura de texto UTF-8 por clave mediante `BlobStore` y el adapter local, sin aceptar rutas arbitrarias ni leer binarios como texto.
- `lesson-page`: exigir breadcrumbs funcionales hacia el curso y módulo, e integrar las notas inline en la composición de la Lesson Page.
- `lesson-view-polish`: ajustar el outline y los controles del LessonView para listas grandes, accesibilidad de teclado/táctil y preferencias de movimiento reducido.

## Impact

- **UI y rutas:** `src/app/[locale]/page.tsx`, nuevos segmentos bajo `src/app/[locale]/courses/[courseSlug]/`, `src/components/course-card/`, componentes de overview y ajustes en `src/components/lesson-view/`.
- **Dominio:** nuevos use cases y view models de lectura bajo `src/domain/use-cases/`, manteniendo las entidades, puertos y límites hexagonales existentes.
- **Adapters:** composición mediante `getCoursePlatformDeps()` y los repositorios ya existentes; no se modifica el contrato de `BlobStore` ni se mueve el contenido de `public/local-filesystem-lesson/`.
- **i18n:** nuevos namespaces y textos en `src/messages/{en,es,pt}.json` y sus mensajes de Storybook.
- **Testing:** Vitest/RTL, Storybook y `e2e/` para validar navegación, URLs locale-aware, errores, accesibilidad básica y reproducción del asset de vídeo.
- **Dependencias:** no se requiere una nueva dependencia de almacenamiento. El parser Markdown debe reutilizar una dependencia existente o incorporarse como decisión explícita en el diseño, evitando HTML no sanitizado.
- **Breaking changes:** ninguno previsto para las rutas existentes; las nuevas páginas completan URLs que ya aparecen en breadcrumbs.
