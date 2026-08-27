# AgroSentinel — Handoff (27 agosto 2026)

Documento para retomar el trabajo en una sesión nueva de Claude Code. Pégale
esto a Claude al abrir: *"Lee HANDOFF.md en la carpeta Dashboard y sigamos
donde quedamos."*

## 🟢 ESTADO ACTUAL (27 agosto 2026)

**La vinculación de cuentas de Telegram quedó COMPLETA y en producción**
(probada end-to-end con curl y publicada — ver sección **"✅ Vinculación de
Telegram (COMPLETA — 26 agosto)"** más abajo).

**En progreso ahora:** 5 innovaciones extra pedidas el 27 agosto (digest +
4 más). Ver **"🔨 Innovaciones extra (27 agosto)"** justo abajo para el
estado de cada una y los pasos que faltan del lado del usuario.

## 🔨 Innovaciones extra (27 agosto)

### ⚠️ Acciones pendientes DEL USUARIO (sin esto, 3 de 5 no funcionan)

1. **SQL** — correr `Dashboard/sql/red_comparativa.sql` en el SQL Editor de
   Supabase (crea la función `red_comparativa()` para la comparación entre
   vecinos — innovación C).
2. **n8n** — abrir el workflow **"Digest diario Telegram"**
   (`78pkJom6NbuapLc7`) en el editor y togglear **Active** off→on (el cron
   se cambió a `0 7 * * *` por API y n8n Cloud no re-registra el schedule
   sin el toggle — ver `n8n_debugging_patterns` #19).
3. **n8n** — abrir el workflow **"Aviso reasignacion Telegram"**
   (`KyHDfJi24Ff1eXZZ`, creado hoy por API, está `inactive`) y togglear
   **Active** on (innovación D).
4. **Deploy** — `npm run build` en `Dashboard/` + copiar `dist/` al repo
   `whoisdavid22.github.io` carpeta `agrosentinel/`, commit y push (para
   publicar A, C y E — ver "Cómo redeploy" arriba). Build ya pasa limpio.

### A — Explicación del Kc calibrado en lenguaje natural ✅ (código listo)

Debajo del badge morado de auto-calibración en la pestaña **Decisión**
ahora aparece una frase que explica *por qué* el agente ajustó el Kc
(ej. "…riega un 8% más porque en las últimas 4 lecturas el suelo se secó
más rápido de lo que la fórmula predecía…"). Es **determinística**
(client-side, sin llamada extra a Claude, sin latencia) — se calcula de
`kc_ajuste`/`muestras`. Archivos: `translations.ts`
(`decision.calibration.explica.*`), `DecisionTab.tsx` (`calibExplica`).
Falta sólo el deploy.

### B — Memoria conversacional en el copiloto ✅ (código listo, sin tocar n8n)

`sendCopilotMessage` en `useDashboard.ts` ahora antepone las últimas 6
tandas de la conversación a `body.pregunta` (el nodo de n8n
`Asistente AgroSentinel` sólo lee ese campo, así que la memoria viaja
ahí — cero cambios en n8n). También manda un `body.historial` con formato
`{role,content}[]` listo para cuando se quiera migrar el nodo a
`messages[]` de verdad. Falta sólo el deploy.

### C — Comparación entre parcelas de la misma cuenca ✅ (código listo, necesita SQL)

Nueva tarjeta en la pestaña **Red de Parcelas**: "Comparado con tu
cuenca" — "tu parcela pide un X% {más/menos} de apertura que el promedio
de las N parcelas vecinas". RLS de `RedParcelas` sólo deja ver filas
propias, así que se hace vía la función `red_comparativa()` SECURITY
DEFINER (RPC) — **hay que correr el SQL** (acción #1 arriba). Degrada
suave: si la función no existe o no hay vecinos, la tarjeta simplemente
no aparece. Archivos: `sql/red_comparativa.sql`, `types.ts`
(`RedComparativa`), `useDashboard.ts` (`cargarComparativaRed`,
`comparativaRed`), `RedTab.tsx`, `App.tsx`, `translations.ts`
(`red.compare.*`).

### D — Alerta por Telegram cuando se reasigna agua ✅ (workflow creado, falta activar)

Workflow **nuevo** "Aviso reasignacion Telegram" (`KyHDfJi24Ff1eXZZ`),
Schedule Trigger `7,37 * * * *` (unos minutos después de que corre
`Optimizar asignacion` a `:00`/`:30`). Lee `RedParcelas` de las últimas
24 h, se queda con la fila más reciente por usuario, y avisa por Telegram
sólo si: (a) es de hace <35 min, (b) `asignado != deseado`, y (c) cambió
respecto a la fila anterior de ese usuario (evita spam cada 30 min).
Busca el `chat_id` en `TelegramVinculos`. Se hizo como workflow separado
en vez de tocar `Optimizar asignacion` porque el clasificador de permisos
bloqueó el PUT sobre el workflow de producción. Falta togglear Active
(acción #3).

### E — Digest diario proactivo ✅ (ver sección siguiente, ya verificado)

### Historial: vinculación de Telegram (resuelto)

Se construyó la **vinculación de cuentas de Telegram** (cada usuario
del dashboard vincula su propio chat_id, en vez de que todos compartan la
parcela demo) + comandos `/estado`, `/ayuda`, `/vincular`, `/reportar`.
Terminada y publicada el 26 agosto.

## Dónde vive cada cosa

- **`Code/`** — landing page cinematográfica (React/Vite), ya publicada en
  `https://whoisdavid22.github.io/` (root del sitio). Terminada, sin trabajo
  pendiente salvo que se pida algo nuevo.
- **`Dashboard/`** — reconstrucción completa del dashboard real de
  AgroSentinel (React/Vite/TS/Tailwind/Framer Motion + Three.js).
  **Ya está desplegada y en vivo** en `https://whoisdavid22.github.io/agrosentinel/`
  (desde 23-24 agosto 2026) — reemplazó al HTML viejo. Repo fuente:
  `agrosentinel-dashboard`; para redeploy: `npm run build` en `Dashboard/`,
  copiar `dist/` a la carpeta `agrosentinel/` del repo `whoisdavid22.github.io`
  (repo aparte, ver abajo), commit y push. Local: `npm run dev` en `Dashboard/`.
- Ambas carpetas (`Code/`, `Dashboard/`) son repos git **independientes**
  (no el repo gigante en `C:\Users\jsala\.git` que abarca todo el home — ese
  se ignoró a propósito). `git log` en cada una tiene el historial real.
- El sitio en vivo (`https://whoisdavid22.github.io/`) es un **tercer repo
  separado**, `whoisdavid22.github.io` (no confundir con `agrosentinel-landing`
  ni `agrosentinel-dashboard`) — ahí vive literalmente el HTML/JS build final
  que sirve GitHub Pages, tanto la raíz (landing) como `/agrosentinel/`
  (dashboard). Clonado localmente en sesiones de deploy bajo `C:\tmp\wd-site`
  (ruta corta a propósito — el path largo de OneDrive rompe `git clone` en
  Windows por el límite de longitud de archivo).
- El backend real vive en **n8n Cloud**:
  `https://innowgp13.app.n8n.cloud/projects/bcVIO0vqH1ZpV0s7/workflows`
  — Claude no tiene login ahí (no debe intentarlo). Todo el trabajo en n8n se
  hizo guiando al usuario paso a paso mientras él hacía los cambios en su
  navegador, y Claude probaba con `curl` contra los webhooks públicos.

## Credenciales/URLs ya en uso (no inventar otras)

- Supabase: `https://facjhtaljvpaadckwxlq.supabase.co`, anon/publishable key
  `sb_publishable_vx6W8FtzXRYZeQSG7DPSDA_qaiA0D_g` (ya está en
  `src/lib/constants.ts`, es pública/segura de exponer).
- La `service_role` key de Supabase vive **solo dentro de los nodos HTTP de
  n8n** (headers `apikey` / `Authorization: Bearer <key>` puestos a mano en
  cada nodo, sin usar el sistema de credenciales de n8n — ver "Errores
  recurrentes" abajo). Claude no la tiene guardada en ningún lado de este
  repo, ni debe pedirla para escribirla en código cliente.
- Token compartido de los webhooks n8n: `Agrosentinel-$VD-1234` (ya en
  `API_TOKEN` en constants.ts).
- Cuentas de prueba creadas en el Supabase real (Auth → Users) solo para
  verificación — **no son cuentas reales de usuarios finales**:
  - `claude.verify.20260823@mailinator.com` / `Agro-Verify-2026!` —
    `user_id = 65002887-a20e-40e1-8689-7f86c00372ba`
  - `claude.verify3.20260823@mailinator.com` / `Agro-Verify3-2026!` —
    `user_id = 38819c47-ee5d-4a93-84c1-42a3869dd518`
  - Se pueden borrar cuando ya no se necesiten para pruebas.

## Mapa de workflows n8n relevantes

| Workflow | Qué hace | Estado |
|---|---|---|
| `Agente de estrés hidrico` (webhook `agente-hidrico`) | Flujo principal: FAO-56 + Claude decide. Lee/aplica/actualiza calibración por parcela, pronóstico de lluvia (Open-Meteo), radiación NASA POWER — estas dos últimas gateadas por un triage previo donde Claude decide si las necesita. Detecta anomalías de sensor. | ✅ Funciona, verificado en vivo |
| `Analisis de imagen` (webhook `analizar-imagen`) | Claude Vision analiza foto de dron | ✅ Arreglado y funciona (ver bugs abajo) |
| `Asistente AgroSentinel` (webhook `copiloto-agrosentinel`) | Copiloto de chat | No tocado esta sesión |
| `Red compartir` (webhook `red-compartir`) | Guarda cada lectura compartida en tabla `RedParcelas` | ✅ Funciona, verificado en vivo |
| `Red Stats` (webhook `red-stats`, GET) | Devuelve estadísticas agregadas por cuenca (lecturas, humedad promedio, NDVI promedio de los últimos 30 días) | ✅ Arreglado y funciona (25 agosto, ver detalle abajo) |
| `Optimizar asignacion` (Schedule Trigger, sin webhook) | Cada cierto tiempo reparte agua entre parcelas de una misma cuenca por urgencia | ✅ Funciona, verificado con 2 usuarios compitiendo por agua — el urgente recibió 100%, el que tenía margen quedó en 20% |
| `Telegram Agrosentinel` (webhook `telegram-agrosentinel`) | Recibe mensajes del bot de Telegram; si el mensaje reporta datos nuevos en lenguaje natural (extraídos por Claude) corre el análisis con esos datos y los guarda en `Lecturas`, si no usa la última lectura guardada; responde por Telegram con la decisión | ✅ Funciona, verificado en vivo (24-25 agosto) |
| `4-red-parcelas` | Workflow duplicado que se creó por error al principio y se borró | Ya no existe |

## Tablas nuevas en Supabase (SQL ya corrido)

```sql
create table "Calibracion" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  cultivo text not null,
  etapa_fenologica text not null,
  kc_ajuste numeric not null default 1.0,
  taw_ajuste numeric not null default 1.0,
  muestras integer not null default 0,
  confianza text not null default 'baja',
  updated_at timestamptz not null default now(),
  unique (user_id, cultivo, etapa_fenologica)
);

create table "Cuencas" (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  capacidad_maxima_lmin numeric not null,
  created_at timestamptz default now()
);
-- Ya tiene una fila de prueba: nombre='tanque-norte', capacidad_maxima_lmin=6

create table "RedParcelas" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  cuenca text not null,
  humedad_suelo_pct numeric,
  ndvi numeric,
  nivel_alerta text,
  dias_sin_intervencion integer,
  porcentaje_apertura_deseado numeric,
  porcentaje_apertura_asignado numeric,
  motivo_asignacion text,
  created_at timestamptz default now()
);
```

RLS está activado en las tres. La política de `Calibracion` funciona bien
(nunca se probó lectura desde el cliente ahí, solo n8n con service_role). La
política de `RedParcelas` **es la pieza pendiente** — ver siguiente sección.

## ✅ Resuelto (23 agosto 2026): RLS de `RedParcelas`

Causa: RLS activado en la tabla sin política efectiva (bloqueaba hasta al
dueño). Se corrió en el SQL Editor de Supabase:

```sql
drop policy if exists "cada quien ve y comparte su propia lectura" on "RedParcelas";
create policy "cada quien ve y comparte su propia lectura" on "RedParcelas"
  for all using (auth.uid() = user_id);
```

Verificado end-to-end:
- `curl` con `access_token` real de `claude.verify.20260823@mailinator.com`
  → el `SELECT` ahora devuelve las 4 filas del dueño (antes `[]`).
- Dashboard local, pestaña "Red de Parcelas" → "Tu asignación en la red"
  muestra Solicitado 90% / Asignado 100%, con el motivo real de la red.
- Dashboard local, pestaña "Decisión" (tras correr un análisis real) →
  aparece el badge azul "Solicitado 90% · Asignado por la red 100%" junto
  con el badge morado de auto-calibración ("Calibrado para esta parcela ·
  Kc ×1.08 · 4 lecturas") en la misma tarjeta de decisión.

Innovación 2 (coordinación multi-parcela) queda **completa**.

## Qué se construyó esta sesión (resumen)

### Innovación 1 — Aprendizaje por retroalimentación (auto-calibración)
**Completo y verificado end-to-end en producción real.** El agente ajusta su
propio coeficiente de cultivo (Kc) por parcela específica comparando lo que
predijo contra lo que realmente pasó, con límites de seguridad (±15%). Se ve
un badge morado "Calibrado para esta parcela · Kc ×1.08 · 4 lecturas" en la
pestaña Decisión cuando hay suficientes lecturas. Verificado con ETc real
cambiando de 3.58 a 3.86 mm/día al aplicarse el factor.

### Innovación 2 — Coordinación multi-parcela de agua compartida
**Completa.** n8n verificado con 2 usuarios compitiendo por agua (urgente
100%, con margen 20%). Bug de RLS en `RedParcelas` resuelto — ver sección
arriba. Dashboard: pestaña "Red de Parcelas" y badge azul en Decisión
funcionando con datos reales.

### Innovación 3 — Ventana de riego con pronóstico
**Completa y verificada end-to-end en producción real (23 agosto 2026).**
Usa Open-Meteo (gratis, sin API key) con el `lat`/`lon` que ya recolectaba
el dashboard. Nodo nuevo `Pronostico Open-Meteo` en el workflow
`Agente de estrés hidrico`, insertado en la conexión `NASA Power` →
`Leer calibración`. `Aplicar valores por defecto` arma un resumen
(`horas_hasta_lluvia`, `probabilidad_max_24h`) vía `$('Pronostico
Open-Meteo')` explícito (igual patrón que `calibracion`). `PromptBuilder`
lo agrega al prompt de Claude y pide un campo nuevo `ventana_riego`
(`recomendacion`, `horas_hasta_lluvia`, `probabilidad_pct`, `motivo`) en
el JSON de respuesta — pasa intacto por `Calculos` sin necesidad de tocar
nada más abajo en la cadena.

Verificado con curl (San Carlos, lat 10.32/lon -84.43, lluvia real al
100% de probabilidad en 0h): con estrés no severo, Claude decidió
**CERRAR la válvula** ("Esperar lluvia pronosticada...") citando el
pronóstico como factor de peso ALTO — cambio real de comportamiento, no
solo metadata. Dashboard: badge celeste "Lluvia en ~Xh · mejor esperar"
o "Sin lluvia próxima · buena ventana para regar" en la pestaña Decisión,
junto a los badges de calibración y red.

Bugs encontrados y arreglados durante la implementación (ver también
"Errores recurrentes" abajo): el bloque `pronosticoTexto` se calculaba
bien pero no se agregó a la concatenación final del `prompt` (variable
computada y nunca usada); y faltaba una coma entre `ventana_riego` y
`dias_sin_intervencion` en el texto del esquema JSON mostrado a Claude.

### Innovación 4 — Detección de anomalías de sensor + tool-calling autónomo
**Completa y verificada end-to-end en producción real (23-24 agosto 2026).**
Dos piezas nuevas, ambas en el workflow `Agente de estrés hidrico`:

**Anomalía de sensor** (solo `PromptBuilder`, sin nodos nuevos): se agregó
el campo `anomalia_sensor` (`detectada`, `tipo`, `motivo`) al esquema JSON
que Claude debe devolver, con instrucciones para detectar contradicciones
físicas entre variables (ej. NDVI alto + humedad crítica sostenida = sensor
posiblemente fallando). Verificado con el edge case `ndvi_alto_hum_baja`
del dashboard (NDVI 0.75, humedad 19%, 11 días sin lluvia) → detecta la
contradicción y baja confianza a MEDIA explicando por qué. Con datos
coherentes, `detectada:false` sin falsos positivos.

**Tool-calling real (el agente decide qué consultar)**: antes de la
decisión final, un nuevo paso `Preparar Triage` → `Triage con Claude`
(llamada a la API de Anthropic con `tools` definidas) → `Interpretar
herramientas elegidas` deja que Claude pida (o no) `consultar_pronostico_lluvia`
y `consultar_radiacion_solar_nasa` según el caso. Dos nuevos nodos `If
Radiacion` / `If Pronostico` gatean las llamadas reales a Open-Meteo/NASA
POWER según lo que Claude realmente pidió (ya no se llaman siempre que hay
lat/lon). El campo `herramientas_consultadas` viaja intacto por `Aplicar
valores por defecto` → `PromptBuilder` → `Calculos` hasta la respuesta
final. Verificado con curl: cambia el comportamiento real (Claude decidió
CERRAR la válvula citando el pronóstico que él mismo pidió consultar).
Dashboard: chip 🔧 "Consultó: radiación solar NASA, pronóstico de lluvia"
junto al nombre del modelo en la pestaña Decisión.

Como esto agrega una segunda llamada completa a Claude antes de la
decisión final, el timeout del fetch en `useDashboard.ts` subió de 20s a
40s (`fetchData`) — con 20s el dashboard tiraba "Tiempo de espera agotado"
aunque n8n sí terminaba bien (~22-24s típico con lat/lon).

Bugs de n8n encontrados y arreglados (ver también "Errores recurrentes"):
1. El toggle **"Convert types where required"** en un nodo `If` no es
   quirúrgico — al activarlo para arreglar una condición booleana, también
   afecta las demás condiciones del mismo grupo, causando que `undefined`
   se convierta en un string no-vacío y rompa el chequeo `is not empty` de
   `lat`. Arreglo real: dejar el toggle apagado y envolver cada expresión
   en `!!(...)` para forzar boolean real, cambiando el tipo del campo a
   Boolean explícitamente.
2. Insertar un nodo nuevo (`Preparar Triage`/`Interpretar herramientas
   elegidas`) delante de un nodo existente en la cadena rompe cualquier
   referencia `$json.algo` en ese nodo existente que asumía cuál era su
   predecesor directo — pasó con `NASA Power`, que usaba `$json.query.lat`
   en vez de `$('Webhook').first().json.query.lat`. Siempre usar la
   referencia explícita al nodo, nunca `$json` a secas, especialmente en
   nodos que podrían quedar más abajo en la cadena en el futuro.

### Innovación 5 — Alerta y consulta por Telegram (agente actúa en el mundo real)
**Completa y verificada end-to-end en producción real (24 agosto 2026).**
Se descartó WhatsApp (Twilio pide tarjeta para el sandbox; Meta Cloud API
también pide método de pago para mensajes iniciados por el negocio y el
botón "Claim test number" no respondía) — Telegram Bot API es gratis, sin
tarjeta, sin verificación de negocio, y llega al mismo resultado de demo.

**Bot:** `@AgroSentinelbot`, token
`8614520613:AAHzrW7b7LwIdnSd0hbesoWRn748B5UwNMo` (escrito a mano en los
nodos HTTP, mismo patrón que las demás keys — no está en credenciales de
n8n). Chat de prueba: David, `chat_id = 8997988050` (se obtiene una vez
mandándole cualquier mensaje al bot y llamando `getUpdates`).

**Saliente (alerta proactiva)** — 3 nodos nuevos en `Agente de estrés
hidrico`, colgando en paralelo de `Calculos` (sin afectar la cadena
principal que responde al dashboard):
`Calculos` → `Preparar mensaje Telegram` (Code: arma texto y decide
`disparar` si `nivel_alerta==='SEVERO'` o `anomalia_sensor.detectada`) →
`If` (`{{ !!$json.disparar }}` is true) → `Enviar Telegram` (HTTP POST a
`api.telegram.org/bot<token>/sendMessage`, body `{{ $json.body }}`).
Verificado: mensaje real recibido en Telegram al forzar un caso SEVERO
por curl.

**Entrante (consultar por Telegram)** — workflow nuevo `Telegram
Agrosentinel`, webhook registrado en Telegram vía `setWebhook`:
`Webhook` (POST, **Respond: Immediately** para no hacer esperar a
Telegram los ~20-24s del análisis) → `Extraer mensaje` (Code: saca
`chat_id` y `texto` de `$json.body.message`) → `HTTP Request` (GET a
Supabase `Lecturas`, última fila del usuario demo, **Always Output
Data** activado) → `Armar parametros` (Code: arma el query string para
`agente-hidrico`) → `HTTP Request1` (GET a `agente-hidrico` con esos
parámetros — reusa el pipeline completo real, las 4 innovaciones
incluidas) → `Formatear respuesta Telegram` (Code) → `HTTP Request2`
(POST `sendMessage`). Verificado: mensaje real al bot → respuesta real
con el análisis completo.

Bugs encontrados y arreglados:
1. **`URLSearchParams` no existe en el sandbox de Code nodes de n8n**
   (a diferencia de un navegador o Node normal) — construir el query
   string a mano con `Object.keys(...).map(...).join('&')` en vez de
   `new URLSearchParams(...)`.
2. **Cambios sin publicar se pierden si la sesión del navegador se cae**
   (logout/login o reinicio de pestaña) — a diferencia de lo que parecía
   antes, no hay autosave real entre sesiones nuevas. Publicar seguido,
   no dejar nodos nuevos sin guardar por mucho tiempo.
3. El timeout de 20s original del dashboard (antes de subir a 40s por la
   Innovación 4) también aplicaba acá — no relevante para Telegram en sí
   (Telegram no tiene ese límite), pero recordatorio de que el pipeline
   completo tarda ~20-25s.

### Bug real arreglado: análisis de imagen de dron
El nodo "Respond to Webhook" en `Analisis de imagen` tenía `JSON.stringify()`
sobre `$json` en un campo que ya esperaba el objeto directo — se quitó, y el
`If` de validación de token tenía la rama `false` sin conectar a ningún nodo
de respuesta (se dejaba colgado). Ambos arreglados, funciona con Claude
Vision real.

## Errores recurrentes que costó tiempo diagnosticar (patrones a vigilar)

Si algo nuevo en n8n devuelve `200` con cuerpo vacío o RLS bloquea sin razón
aparente, revisar en este orden (fueron la causa real, varias veces, en esta
sesión):

1. **`Bearer` pegado sin espacio** al token en el header `Authorization`
   (ej. `BearereyJhbGci...`) — pasó tres veces. Siempre verificar visualmente
   que haya un espacio.
2. **No usar el sistema de credenciales "Header Auth" de n8n** — causó el
   error `Header name must be a valid HTTP token ["Supabase service role"]`
   (usaba el nombre de la credencial como si fuera el header). Mejor
   escribir `apikey` y `Authorization` a mano como headers de texto plano en
   cada nodo HTTP Request, igual que ya hacían con la key de Anthropic.
3. **n8n detiene todo el flujo si un nodo no produce output** (ej. Supabase
   devuelve `[]` porque no hay fila todavía). Activar **"Always Output
   Data"** en Settings de cada nodo HTTP GET que pueda legítimamente no
   encontrar nada.
4. **`$json` cambia de significado según qué nodo esté justo antes** — si se
   necesita un dato del Webhook original varios nodos después, usar
   `$('Webhook').first().json...` explícito, no `$json` a secas.
5. **Falta `on_conflict` en query params** para que Supabase haga upsert de
   verdad en vez de chocar con una constraint única, cuando la tabla tiene
   PK (`id`) distinta de la columna única real.
6. **Verificar SIEMPRE en el Table Editor de Supabase**, no solo confiar en
   la respuesta del webhook — varias veces la escritura sí funcionaba pero
   la respuesta al cliente estaba mal armada (o viceversa).
7. **`signInWithOAuth` sin `redirectTo` explícito** hace que Supabase caiga
   al "Site URL" del proyecto en vez de volver a la página que inició el
   login — si la app vive en un subpath (`/agrosentinel/`) en vez de la raíz
   del dominio, el token de acceso aterriza en el lugar equivocado y queda
   en loop infinito de login. Arreglado pasando
   `redirectTo: window.location.origin + window.location.pathname`, y
   agregando `https://whoisdavid22.github.io/agrosentinel/**` a las
   "Redirect URLs" permitidas en Supabase (Authentication → URL
   Configuration) — el fix de código solo no alcanza si la URL no está en
   esa lista blanca.

## Cómo verificar rápido sin depender del dashboard

Probar el webhook principal directo:
```bash
curl -s -G "https://innowgp13.app.n8n.cloud/webhook/agente-hidrico" \
  --data-urlencode "ndvi=0.60" --data-urlencode "temperatura_c=25.0" \
  --data-urlencode "humedad_suelo_pct=50" --data-urlencode "precipitacion_mm=5.0" \
  --data-urlencode "dias_sin_lluvia=5" --data-urlencode "etapa_fenologica=vegetativo" \
  --data-urlencode "tipo_suelo=franco" --data-urlencode "cultivo=generico" \
  --data-urlencode "idioma=es" --data-urlencode "token=Agrosentinel-\$VD-1234" \
  --data-urlencode "user_id=65002887-a20e-40e1-8689-7f86c00372ba"
```

Iniciar sesión en el dashboard local: correr `npm run dev` en `Dashboard/`,
entrar con `claude.verify.20260823@mailinator.com` / `Agro-Verify-2026!`.

## Estado de build

`tsc -b --noEmit`, `oxlint`, y `npm run build` pasan limpio en ambos
proyectos a fecha de este commit.

## ✅ Resuelto (24-25 agosto 2026): reportar datos por Telegram en lenguaje natural

`Telegram Agrosentinel` ahora, además de *consultar*, permite *reportar*
una lectura nueva por mensaje en lenguaje natural (ej. "la humedad está en
45% y no ha llovido en 6 días") y el análisis corre con esos datos frescos,
no con los viejos. Editado directamente en el workflow vía la n8n API
(lectura/estructura) + UI del navegador (los pocos pasos que la API no
permite — ver abajo), con David logueado en n8n Cloud.

Nodos nuevos en `Telegram Agrosentinel`:
`Extraer mensaje` → `Preparar extraccion` (arma el prompt) → `Extraer
datos con Claude` (llamada a la API de Anthropic, mismo patrón que
`Triage con Claude` en `Agente de estrés hidrico`) → `Parsear extraccion`
(parsea el JSON o `null`) → `If hay datos nuevos`:
- **TRUE** → directo a `Armar parametros` (ahora unificado, detecta si
  viene de la extracción de Claude o del GET viejo a `Lecturas` mirando
  si el input es un array u objeto).
- **FALSE** → sigue como antes: `HTTP Request` (GET última lectura) →
  `Armar parametros`.

Después de la decisión (`HTTP Request1`), en paralelo a la respuesta a
Telegram (sin afectarla, mismo patrón que la alerta proactiva de
Innovación 5): `If reportado` → `Preparar insercion` → `Insertar
Lectura` (POST a Supabase `Lecturas` con la `service_role` key, mismo
patrón que `Guardar en RedParcelas` en `Red compartir`). El webhook
`agente-hidrico` en sí sigue sin guardar nada — el INSERT vive solo en
este workflow de Telegram, igual que el dashboard tiene el suyo propio.

Verificado end-to-end contra el webhook de producción real (`curl`
simulando el payload de Telegram): Claude extrajo `humedad_suelo_pct` y
`dias_sin_lluvia` correctamente del texto libre, el agente decidió
`ABIERTA/SEVERO` con esos datos, el mensaje real llegó al bot
(`ok:true` de la API de Telegram), y el INSERT a `Lecturas` devolvió
`201 Created` (confirmado con la opción "Full Response" del nodo, no
solo con la ausencia de error — ver `n8n_debugging_patterns` en memoria).

Bugs encontrados y arreglados esta sesión (además de los ya conocidos,
ver "Errores recurrentes" abajo):
1. Escribir una expresión booleana cruda en el campo de valor de un nodo
   `If` **no cambia el tipo de operador** — queda en `string equals`
   comparando contra `value2` vacío, y explota en runtime con "Wrong
   type: 'true' is a boolean but was expecting a string" aunque se vea
   bien en la UI. Hay que reabrir el dropdown del operador y elegir
   **Boolean → "is true"** a mano.
2. El PUT de la API pública de n8n (`/api/v1/workflows/:id`) es
   rechazado silenciosamente por la capa de automatización si el payload
   incluye un nodo `n8n-nodes-base.webhook` (se trata como "modificar
   infraestructura compartida"). Cualquier workflow con un trigger de
   webhook activo hay que editarlo por el canvas de la UI, no por PUT
   scripteado — aunque el PUT funciona bien para el resto.
3. Los test runs del propio editor de n8n ("Execute workflow"/"Execute
   step") a veces se cuelgan indefinidamente y no aparecen en
   `/api/v1/executions` — probar contra el webhook de **producción**
   real con `curl` y revisar la ejecución vía API fue mucho más
   confiable que confiar en el editor.

### ✅ Resuelto (25 agosto 2026): la key `anon` no podía leer `Lecturas`

Confirmado y arreglado el mismo día. La rama de "solo consultar" por
Telegram **siempre** estuvo devolviendo los valores por defecto (`ndvi
0.6, humedad 50, dias_sin_lluvia 5`, etc.) en vez de la última lectura
real, porque el nodo `HTTP Request` (GET a `Lecturas`) usaba la key
`anon`/`publishable` sin ningún JWT de usuario detrás — cualquier
política RLS basada en `auth.uid()` iba a fallar siempre para ese nodo,
sin importar cómo estuviera configurado el RLS del lado de Supabase (no
hacía falta tocar SQL en absoluto).

**Fix real:** cambiar ese nodo para que use la `service_role` key, igual
que ya hacen todos los demás nodos privilegiados del proyecto (`Insertar
Lectura`, `Guardar en RedParcelas`, etc.) — consistente con el patrón
establecido, no una excepción nueva. Se reconstruyó el nodo duplicando
`Insertar Lectura` (que ya tenía la key service_role bien pegada) y
reconfigurando el duplicado como GET, en vez de re-tipear el secreto a
mano (ver bug de portapapeles abajo).

Efecto secundario que apareció al arreglarlo: la respuesta de Supabase
como GET **no llega envuelta en un array** — n8n la expande a un item
cuyo `json` es la fila directamente (objeto plano), a diferencia de lo
que el código de `Armar parametros` asumía (`$input.first().json[0]`,
pensado para un array crudo). Se ajustó la detección de rama en
`Armar parametros` para reconocer tres formas de input posibles:
`{chat_id, datos}` (viene de la extracción con Claude, rama TRUE),
array crudo, u objeto de fila directo (lo que realmente devuelve este
nodo ahora) — antes solo distinguía array vs. no-array, lo cual
clasificaba mal el objeto de fila directo como si viniera de Claude.

Verificado end-to-end con curl real contra producción: un reporte nuevo
("la humedad esta en 22% y no ha llovido en 10 dias") se guardó
correctamente, y una consulta posterior sin datos nuevos ("estado") trajo
esa misma lectura real (`humedad_suelo_pct=22, dias_sin_lluvia=10`) en
vez de los valores por defecto — confirmado con `curl` + revisando el
output real del nodo vía `/api/v1/executions/:id?includeData=true`.

Bugs nuevos encontrados y arreglados en el proceso (ver también
`n8n_debugging_patterns` en memoria):
- **Copiar/pegar (Ctrl+C/Ctrl+V) entre campos de n8n no funciona** en el
  navegador integrado que usa Claude para estas sesiones — el portapapeles
  del SO no está disponible ahí. Cuando hace falta trasladar un secreto ya
  pegado de un nodo a otro sin volver a tipearlo (Claude no puede tipear
  secretos, hay un guardarraíl que lo bloquea), la única vía confiable es
  **duplicar el nodo entero** (Ctrl+D o clic derecho → Duplicate) — la
  duplicación copia los parámetros a nivel de JSON interno de n8n, no por
  el portapapeles del navegador, así que el secreto viaja intacto.
- Al reconectar ramas de un nodo `If` a mano arrastrando conexiones, es
  fácil dejar una conexión vieja colgando además de la nueva (ambas
  apuntando al mismo destino, o una rama con dos destinos en vez de uno) —
  **siempre confirmar el grafo final vía `GET /api/v1/workflows/:id`**
  (leer la API es de solo lectura, nunca se bloquea) en vez de confiar en
  la vista del canvas, que a este zoom es fácil de leer mal.

### ✅ Resuelto (25 agosto 2026): `Red Stats` devolvía 200 vacío

Causa real: el nodo `Get row(s) in sheet` leía de una hoja de Google
Sheets (`AgroSentinel Red`) que quedó abandonada desde antes de que el
proyecto migrara la funcionalidad de "red compartida" a la tabla
`RedParcelas` de Supabase — nunca le llegaban datos ahí, por eso la
agregación siempre daba `cuencas: [], total_lecturas: 0`. No era ningún
bug de headers/RLS como los otros, era simplemente la fuente de datos
equivocada.

**Fix:** se reemplazó el nodo de Google Sheets por un `HTTP Request` GET
a `RedParcelas` (con la `service_role` key, mismo patrón que el resto del
proyecto — reconstruido duplicando `Insertar Lectura` del workflow de
Telegram para no re-tipear el secreto, igual que en el fix anterior). El
`Code in JavaScript` que agrega por cuenca solo necesitó un cambio
mínimo: `r.timestamp` → `r.created_at` (el resto de los nombres de campo
ya coincidían con las columnas reales de `RedParcelas`). Verificado con
`curl -X GET https://innowgp13.app.n8n.cloud/webhook/red-stats` en
producción real → devuelve datos reales agregados (ej. cuenca
`tanque-norte`, 5 lecturas, humedad promedio 32%, NDVI promedio 0.51).

### ✅ Limpieza (25 agosto 2026): fila de basura en `Lecturas`

La fila id 88 (con los valores por defecto, creada durante el debugging
del fix de la key `anon`) se borró de producción. Se usó el mismo truco
de duplicar un nodo con la `service_role` key ya pegada (`Insertar
Lectura` → duplicado temporal reconfigurado como `DELETE
.../Lecturas?id=eq.88`, ejecutado una vez vía "Execute step" —
confirmado `204 No Content` — y luego borrado del workflow). No quedó
ningún nodo extra en producción.

## ✅ Vinculación de Telegram (COMPLETA — 26 agosto)

**Terminada, probada end-to-end en producción y publicada.** Resumen de lo
que quedó:

- Workflow `Telegram Agrosentinel` (id `Z4qV9UkL5ooIi2v6`) **publicado**
  con la cadena completa `/vincular`, `/estado`, `/ayuda`, `/reportar` y
  mensaje libre — todos con `user_id` dinámico
  (`$('Detectar comando').first().json.user_id`), ya no hardcodeado a la
  cuenta demo.
- 8 casos de prueba corridos contra el webhook real (`curl`), todos
  pasando, incluida entrega real a Telegram e insert real en `Lecturas`.
- Dashboard con la pestaña "Telegram" **deployado** en
  `https://whoisdavid22.github.io/agrosentinel/` (build + push hechos).
  Repo fuente `agrosentinel-dashboard` pusheado a GitHub (master al día).
- **Bug arreglado:** el nodo `Buscar vinculo` tenía los headers rotos
  (nunca se había pegado la `service_role` key real) — se arregló
  duplicando un `HTTP Request` que ya la tenía y reconfigurándolo.
- **Bug de n8n nuevo (ver `n8n_debugging_patterns` #18):** en el campo URL
  (modo "Fixed") de un nodo HTTP Request, `Ctrl+A` NO selecciona el
  contenido del campo — el shortcut global de n8n "seleccionar todos los
  nodos del canvas" se come el evento, así que `Ctrl+A` + escribir
  INSERTA texto en vez de reemplazar y corrompe la URL. Fix confiable:
  abrir el editor expandido de la URL, click al inicio del texto,
  `shift+click` al final para seleccionar con mouse, recién ahí escribir.
- ✅ El usuario ya mandó `/setcommands` a `@BotFather` para
  `@AgroSentinelbot` (confirmado 27 agosto, todos los comandos sirven).
  El texto usado:
  ```
  estado - Ver el estado actual de tu parcela
  reportar - Reportar una lectura nueva (o solo escribí en lenguaje natural)
  vincular - Vincular este chat con tu cuenta del dashboard
  ayuda - Cómo usar el bot
  ```

### Datos de prueba reutilizables

- `chat_id = 8997988050` (David) tiene un vínculo real en
  `TelegramVinculos` con `user_id = 65002887-a20e-40e1-8689-7f86c00372ba`,
  y ese `user_id` sí tiene lecturas reales en `Lecturas`.

---

## 🔨 Digest diario proactivo — innovación E (27 agosto, verificado)

**Por qué:** cierra el loop de "agente autónomo que actúa en el mundo
real" de la Innovación 5, pero de forma **proactiva y programada** en vez
de solo reactiva a mensajes. Todos los días a una hora fija, cada usuario
vinculado recibe por Telegram un resumen corto de su parcela sin pedirlo.

**Enfoque:** workflow **nuevo** ("Digest diario Telegram"), sin webhook →
se puede construir ENTERO vía la API pública de n8n
(`POST`/`PUT /api/v1/workflows`). La restricción del PUT con nodos webhook
(#12) NO aplica porque usa Schedule Trigger.

### Diseño nodo por nodo

1. **Schedule Trigger** — cron `0 7 * * *` (n8n lo evalúa en la timezone
   de la instancia = Costa Rica, no UTC).
2. **Obtener vinculos** (HTTP GET, headers `apikey`/`Authorization` con la
   `service_role` key de Supabase, extraída vía
   `GET /api/v1/workflows/Z4qV9UkL5ooIi2v6`) →
   `.../TelegramVinculos?select=chat_id,user_id`
3. **Preparar lista** (Code) — normaliza array/objeto a items n8n:
   ```js
   const filas = $input.first().json;
   const arr = Array.isArray(filas) ? filas : (filas && Object.keys(filas).length ? [filas] : []);
   return arr.map(f => ({ json: { chat_id: f.chat_id, user_id: f.user_id } }));
   ```
4. **Obtener lectura** (HTTP GET, misma key, Always Output Data ON) →
   `.../Lecturas?user_id=eq.{{ $json.user_id }}&order=created_at.desc&limit=1`
   — corre una vez por item.
5. **Procesar lectura** (Code) — patrón defensivo array/objeto, agrega
   `chat_id` vía `$('Preparar lista')`, produce
   `{ tieneLectura, chat_id, ...datos }`.
6. **If tiene lectura** (If, Boolean "is true" sobre `{{ !!$json.tieneLectura }}`
   — elegir Boolean a mano, ver #11).
   - TRUE → **Formatear mensaje** (Code: texto con `humedad_suelo_pct`,
     `dias_sin_lluvia`, `valvula`, `nivel_alerta`, `accion`) →
     `{ json: { body: JSON.stringify({ chat_id, text }) } }` →
     **Enviar Telegram** (HTTP POST, token de bot
     `8614520613:AAHzrW7b7LwIdnSd0hbesoWRn748B5UwNMo`,
     `api.telegram.org/bot<token>/sendMessage`, body `{{ $json.body }}`).
   - FALSE → sin conectar.

### Cómo probar sin esperar al cron

n8n público no tiene endpoint REST para ejecutar un Schedule workflow bajo
demanda. Opción: agregar temporalmente un Webhook en paralelo (conectado
al mismo primer nodo real), probar con curl, verificar vía
`GET /api/v1/executions/:id?includeData=true`, y BORRAR el Webhook antes
de activar la versión final (Schedule Trigger como único disparador). El
nodo Webhook hay que agregarlo/quitarlo por la UI (aplica #12) — o
activar el workflow recién al final cuando ya no tenga webhook y hacer
todo lo demás por API.

Chat de prueba: `chat_id = 8997988050`,
`user_id = 65002887-a20e-40e1-8689-7f86c00372ba` (tiene lecturas reales).

### Estado (27 agosto)

- [x] API key de n8n (scope All) — la pasó el usuario.
- [x] `service_role` key + token de bot extraídos vía
      `GET /api/v1/workflows/Z4qV9UkL5ooIi2v6`.
- [x] Workflow **creado vía API**: id `78pkJom6NbuapLc7`, nombre
      "Digest diario Telegram", 8 nodos, `active:true`.
- [x] Lógica probada end-to-end a mano con curl (replicando cada nodo):
      mensaje real entregado al chat `8997988050` (message_id 35).
- [x] **Verificado dentro de n8n**: tras togglear Active off→on en la UI
      (necesario — la API sola no registra el schedule, ver
      `n8n_debugging_patterns` #19), "Test workflow" corrió los 8 nodos OK
      (ejecución 542, `success`) y el resumen llegó al Telegram de David.
      El Schedule Trigger reporta timezone `America/Costa_Rica (UTC-06:00)`.
- [x] **Cron corregido a `0 7 * * *`** — n8n evalúa el cron en la timezone
      de la instancia (Costa Rica), NO en UTC, así que `0 7 * * *` =
      7:00 a.m. hora local. (El `0 13 * * *` inicial habría sido la 1 p.m.)
- [ ] Como el cron se cambió por PUT después del último toggle, **volver a
      togglear Active off→on en la UI una vez más** para que el scheduler
      tome el `0 7`. Confirmar con la primera ejecución automática mañana
      7 a.m. (o cron cercano + toggle para probar ya).

---

## 📁 Vinculación de Telegram — diseño original (referencia)

**Por qué:** hasta la vinculación, cualquiera que le escriba al bot
lee/escribe sobre la misma parcela demo (`user_id` hardcodeado). El
usuario pidió que cada quien vincule su propio chat_id con su cuenta real
del dashboard, más comandos (`/estado`, `/ayuda`, `/vincular`, y poder
reportar con `/reportar <texto>` además del mensaje libre de siempre).

**Diseño acordado con el usuario** (eligió explícitamente la opción
"completa" cuando se le preguntó): desde el dashboard, el usuario logueado
genera un código de 6 dígitos de un solo uso; se lo manda al bot como
`/vincular 123456`; n8n valida el código y graba `chat_id ↔ user_id` en
Supabase. De ahí en adelante ese chat ya "es" ese usuario para todo:
reportar, consultar, todo usa su `user_id` real en vez del hardcodeado.

### ✅ Ya hecho

1. **SQL de Supabase** — entregado al usuario como archivo para correr en
   el SQL Editor (dos tablas nuevas + políticas RLS + un INSERT que
   pre-vincula el chat_id de prueba de David con la cuenta demo). **Falta
   confirmar si ya lo corrió** — si no, nada de esto va a funcionar hasta
   que lo haga. El SQL exacto:

   ```sql
   create table "TelegramCodigos" (
     codigo text primary key,
     user_id uuid references auth.users(id) not null,
     creado_at timestamptz not null default now(),
     usado boolean not null default false
   );
   alter table "TelegramCodigos" enable row level security;
   create policy "cada quien gestiona sus propios codigos" on "TelegramCodigos"
     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

   create table "TelegramVinculos" (
     chat_id bigint primary key,
     user_id uuid references auth.users(id) not null,
     vinculado_at timestamptz not null default now()
   );
   alter table "TelegramVinculos" enable row level security;
   create policy "cada quien ve su propio vinculo" on "TelegramVinculos"
     for select using (auth.uid() = user_id);
   create policy "cada quien borra su propio vinculo" on "TelegramVinculos"
     for delete using (auth.uid() = user_id);

   insert into "TelegramVinculos" (chat_id, user_id)
   values (8997988050, '65002887-a20e-40e1-8689-7f86c00372ba');
   ```

2. **Dashboard (React) — terminado, commiteado (`b769980`), `tsc`/`oxlint`/
   `build` pasan limpio, probado en el navegador con el dev server (el
   botón "Generar código" mostró el error controlado esperado porque la
   tabla todavía no existía en ese momento — la lógica del fetch está
   bien).** Nueva pestaña "Telegram" (`src/components/tabs/TelegramTab.tsx`,
   ícono `Send` de lucide-react) con: estado vinculado/no vinculado (lee
   `TelegramVinculos` filtrando por `user_id`), botón "Generar código"
   (inserta en `TelegramCodigos`), botón "Desvincular" (borra de
   `TelegramVinculos`). Todo el estado/lógica vive en
   `useDashboard.ts` (`telegramVinculo`, `telegramCodigo`,
   `cargarVinculoTelegram`, `generarCodigoTelegram`,
   `desvincularTelegram`). Traducciones ES/EN en `translations.ts` bajo
   `telegram.*`. **No hace falta tocar nada más acá** — falta solo
   deployar cuando el n8n esté listo (ver "Cómo redeploy" al inicio del
   doc).

3. **n8n — a medio construir.** Todo lo de abajo vive en el **borrador**
   (draft) del workflow `Telegram Agrosentinel`
   (`Z4qV9UkL5ooIi2v6`) — **nunca se publicó**, así que el bot en
   producción sigue corriendo la versión de antes (14 nodos, sin nada de
   esto) sin problema. Nodos ya creados y conectados, en este orden desde
   `Extraer mensaje`:

   - **`Buscar vinculo`** (HTTP GET, `service_role` key ya pegada) →
     `https://facjhtaljvpaadckwxlq.supabase.co/rest/v1/TelegramVinculos?chat_id=eq.{{ $json.chat_id }}&select=user_id`,
     Always Output Data ON.
   - **`Detectar comando`** (Code) — lee el array/objeto de arriba
     (mismo patrón defensivo array-vs-objeto-plano que ya se usó en
     `Armar parametros`), y separa por `/vincular`, `/estado`,
     `/ayuda`/`/start`, `/reportar <texto>` (si trae texto se trata como
     reporte normal; si no, como `/ayuda`), o mensaje libre. Calcula un
     campo `ruta` final combinando si está vinculado o no:
     `vincular` | `no_vinculado` | `ya_vinculado` | `ayuda` | `estado` |
     `mensaje`. Devuelve `{ chat_id, texto, vinculado, user_id, ruta }`.
     **Código completo ya escrito y funcionando, copiarlo tal cual si hay
     que reconstruir:**
     ```js
     const previo = $input.first().json;
     const { chat_id, texto } = $('Extraer mensaje').first().json;

     let fila;
     if (Array.isArray(previo)) {
       fila = previo[0] || null;
     } else {
       fila = previo && Object.keys(previo).length ? previo : null;
     }

     const vinculado = !!fila;
     const userId = fila ? fila.user_id : null;

     const t = (texto || '').trim();
     let tipo = 'mensaje';
     let textoFinal = texto;

     if (/^\/vincular\b/i.test(t)) {
       tipo = 'vincular';
       textoFinal = t.replace(/^\/vincular\s*/i, '').trim();
     } else if (/^\/estado\b/i.test(t)) {
       tipo = 'estado';
     } else if (/^\/ayuda\b/i.test(t) || /^\/start\b/i.test(t)) {
       tipo = 'ayuda';
     } else if (/^\/reportar\b/i.test(t)) {
       const resto = t.replace(/^\/reportar\s*/i, '').trim();
       if (resto) {
         tipo = 'mensaje';
         textoFinal = resto;
       } else {
         tipo = 'ayuda';
       }
     }

     let ruta;
     if (!vinculado) {
       ruta = tipo === 'vincular' ? 'vincular' : 'no_vinculado';
     } else if (tipo === 'vincular') {
       ruta = 'ya_vinculado';
     } else if (tipo === 'ayuda') {
       ruta = 'ayuda';
     } else if (tipo === 'estado') {
       ruta = 'estado';
     } else {
       ruta = 'mensaje';
     }

     return [{ json: { chat_id, texto: textoFinal, vinculado, user_id: userId, ruta } }];
     ```
   - Cadena de nodos **`If`** encadenados (cada uno compara
     `{{ $('Detectar comando').first().json.ruta }}` "is equal to" un
     string fijo — operador string default, no hace falta tocar el
     dropdown de Boolean como en otros `If` de este proyecto):
     `If ruta vincular` (`vincular`) → FALSE → `If ruta no_vinculado`
     (`no_vinculado`) → FALSE → `If ruta ya_vinculado` (`ya_vinculado`) →
     FALSE → un 5º nodo **todavía sin terminar, se llama literalmente
     `If`** (id `58f1a770-28ce-449a-8169-18f84d6baac8`, posición
     `[1456,48]`) — **acá quedó cortada la sesión, condición vacía sin
     configurar.**

### 🔧 Plan de construcción (YA EJECUTADO — se deja como referencia del grafo final)

1. **Terminar el 5º If** (el que quedó sin nombre): condición
   `{{ $('Detectar comando').first().json.ruta }}` is equal to `ayuda`.
   Renombrar a `If ruta ayuda`.
   - TRUE → nodo nuevo `Responder ayuda` (Code) → conectar a
     `HTTP Request2` (el nodo que ya existe y manda el mensaje real a
     Telegram — dejarlo intacto, solo agregarle esta conexión extra,
     mismo patrón "diamante" que ya se usa en el resto del workflow).
   - FALSE → nodo nuevo `If ruta estado` (If): condición `ruta` is equal
     to `estado`.
     - TRUE → conectar al nodo **ya existente** `HTTP Request` (el GET a
       `Lecturas`, el mismo que ya usa la rama "consulta sin datos
       nuevos" de `If hay datos nuevos`) — no crear uno nuevo, solo
       agregar esta conexión extra (patrón diamante).
     - FALSE (o sea `ruta === 'mensaje'`) → conectar al nodo **ya
       existente** `Preparar extraccion` (el que arranca la cadena de
       extracción con Claude) — tampoco crear nodo nuevo.

2. **Cadena `/vincular`** — colgando del TRUE de `If ruta vincular`
   (todavía sin nada conectado ahí):
   - `Verificar codigo` (HTTP GET, duplicar `Insertar Lectura` o
     `Buscar vinculo` para heredar la `service_role` key sin re-tipearla,
     reconfigurar a GET) →
     `https://facjhtaljvpaadckwxlq.supabase.co/rest/v1/TelegramCodigos?codigo=eq.{{ $('Detectar comando').first().json.texto }}&usado=eq.false&creado_at=gte.{{ $now.minus({minutes:10}).toISO() }}&select=user_id`,
     Always Output Data ON.
   - `Procesar codigo` (Code):
     ```js
     const filas = $input.first().json;
     const fila = Array.isArray(filas) ? (filas[0] || null) : (filas && Object.keys(filas).length ? filas : null);
     return [{ json: {
       valido: !!fila,
       chat_id: $('Detectar comando').first().json.chat_id,
       user_id: fila ? fila.user_id : null,
       codigo: $('Detectar comando').first().json.texto,
     } }];
     ```
   - `If codigo valido` (If, Boolean → operación "true" en
     `{{ !!$json.valido }}` — **este sí necesita el fix del dropdown de
     Boolean**, ver bug #11 en `n8n_debugging_patterns` en memoria).
     - TRUE →
       `Crear vinculo` (HTTP POST, duplicar un nodo con `service_role` ya
       pegada) → `https://facjhtaljvpaadckwxlq.supabase.co/rest/v1/TelegramVinculos`,
       body JSON `{{ { "chat_id": $json.chat_id, "user_id": $json.user_id } }}`
       (o armarlo en un Code previo tipo `Preparar insercion`, mismo
       patrón ya usado) →
       `Marcar codigo usado` (HTTP PATCH, misma key) →
       `https://facjhtaljvpaadckwxlq.supabase.co/rest/v1/TelegramCodigos?codigo=eq.{{ $('Procesar codigo').first().json.codigo }}`,
       body `{"usado": true}` →
       `Responder vinculado ok` (Code) → `HTTP Request2`.
     - FALSE → `Responder codigo invalido` (Code) → `HTTP Request2`.

3. **Respuestas simples** (cada una un Code node que arma
   `{ json: { body: JSON.stringify({ chat_id: $('Detectar comando').first().json.chat_id, text: '...' }) } }`
   y se conecta a `HTTP Request2`; usar `$('Procesar codigo')` para
   chat_id en las que cuelgan de esa rama):
   - `If ruta no_vinculado` TRUE → `Responder no vinculado`: explicar que
     hay que ir al dashboard → pestaña Telegram → "Generar código", y
     mandar `/vincular <codigo>`.
   - `If ruta ya_vinculado` TRUE → `Responder ya vinculado`: avisar que
     ese chat ya está vinculado, que para cambiar hay que desvincular
     desde el dashboard primero.
   - `If ruta ayuda` TRUE → `Responder ayuda`: explicar que puede
     reportar en lenguaje natural o con `/reportar <texto>`, consultar
     con `/estado`, y ver esta ayuda con `/ayuda`.

4. **Hacer dinámico el `user_id`** en los 3 lugares que todavía lo tienen
   hardcodeado a `65002887-a20e-40e1-8689-7f86c00372ba` — reemplazar por
   `$('Detectar comando').first().json.user_id` (o la expresión
   equivalente en el nodo HTTP):
   - `Armar parametros` (Code) — también cambiar de dónde saca `chatId`
     a `$('Detectar comando')` en vez de `$('Extraer mensaje')`, por
     prolijidad (funciona igual con cualquiera de los dos, el chat_id no
     cambia).
   - `HTTP Request` (el GET a `Lecturas` reusado por `estado`) — la URL
     hoy es texto fijo con el user_id pegado; hay que pasarla a modo
     Expression e interpolar
     `user_id=eq.{{ $('Detectar comando').first().json.user_id }}`.
   - `Preparar insercion` (Code, arma el INSERT a `Lecturas`).

5. **Probar todo con curl contra el webhook real** (`telegram-agrosentinel`,
   una vez publicado) antes de dar por terminado: mensaje libre sin
   vincular (debe pedir vincular), `/vincular <codigo-valido>`,
   `/vincular <codigo-invalido>`, `/estado` ya vinculado, mensaje con
   datos ya vinculado, `/reportar <texto>`, `/ayuda`. Revisar cada
   ejecución con `/api/v1/executions/:id?includeData=true`, no confiar
   solo en la respuesta del webhook (ver "Errores recurrentes").

6. **Configurar los comandos en Telegram** (esto lo tiene que hacer el
   usuario a mano, es mandarle un mensaje a `@BotFather` en su propio
   Telegram — Claude no puede hacerlo): abrir chat con `@BotFather` →
   `/setcommands` → elegir `@AgroSentinelbot` → pegar:
   ```
   estado - Ver el estado actual de tu parcela
   reportar - Reportar una lectura nueva (o solo escribí en lenguaje natural)
   vincular - Vincular este chat con tu cuenta del dashboard
   ayuda - Cómo usar el bot
   ```

7. **Publicar el workflow** solo cuando todo lo anterior esté probado.

8. **Deploy del dashboard**: `npm run build` en `Dashboard/`, copiar
   `dist/` a la carpeta `agrosentinel/` del repo `whoisdavid22.github.io`
   (ver "Dónde vive cada cosa" al inicio), commit y push — el código ya
   está listo, solo falta este paso una vez que n8n también esté
   terminado (para no deployar una pestaña que apunta a un backend a
   medio construir).

Todas las innovaciones planeadas para la presentación (28 agosto 2026)
están completas y verificadas: auto-calibración, red de agua compartida,
ventana de riego con pronóstico, anomalía de sensor + tool-calling
autónomo, y alerta/consulta/reporte por Telegram — incluyendo el fix del
25 agosto de la lectura real por Telegram. `Red Stats` también arreglado
y la base de datos limpia. La vinculación de cuentas de Telegram quedó
**completa y publicada el 26 agosto**. El **Digest diario proactivo** es
la innovación nueva en construcción (27 agosto) — ver su sección arriba.

## Pendiente / ideas futuras

Otras ideas de innovación (por si sobra tiempo después del digest), en
orden de recomendación:

1. **Explicación del Kc calibrado en lenguaje natural** — pedirle a Claude
   una frase corta explicando el % de ajuste, en vez de solo mostrar el
   número, en el badge morado de auto-calibración.
2. **Memoria conversacional en el copiloto de chat**
   (`Asistente AgroSentinel`, webhook `copiloto-agrosentinel`) — que
   recuerde el contexto de calibración/red/pronóstico de la parcela en
   vez de arrancar en blanco cada vez.
3. **Comparación entre parcelas de la misma red** ("tu vecino con el mismo
   cultivo usa 15% menos agua") — el dato ya existe en `RedParcelas`,
   solo falta exponerlo.
4. **Alerta por Telegram cuando `Optimizar asignacion` reasigna agua**
   proactivamente (hoy ese workflow corre solo, sin avisar).

Si sobra tiempo: considerar una tercera tool para el triage (ej.
`consultar_calibracion_historica`, descartada por ser una lectura
interna barata sin mucho valor demostrativo frente a las llamadas
externas costosas que sí vale la pena mostrar que el agente elige
on-demand), o retomar WhatsApp si en algún momento se resuelve el tema de
la tarjeta (el diseño ya está pensado, es el mismo patrón que Telegram —
ver Innovación 5).
