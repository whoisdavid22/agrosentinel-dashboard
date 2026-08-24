# AgroSentinel — Handoff (23 agosto 2026)

Documento para retomar el trabajo en una sesión nueva de Claude Code. Pégale
esto a Claude al abrir: *"Lee HANDOFF.md en la carpeta Dashboard y sigamos
donde quedamos."*

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
| `Red Stats` (webhook `red-stats`) | Debería devolver estadísticas agregadas por cuenca | ❌ Devuelve 200 vacío, **sin depurar todavía** — mismo tipo de bug que los demás (probablemente header Authorization sin espacio, o Prefer/select mal puesto, o RLS). Pendiente. |
| `Optimizar asignacion` (Schedule Trigger, sin webhook) | Cada cierto tiempo reparte agua entre parcelas de una misma cuenca por urgencia | ✅ Funciona, verificado con 2 usuarios compitiendo por agua — el urgente recibió 100%, el que tenía margen quedó en 20% |
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

## Pendiente / ideas futuras

Todas las innovaciones planeadas para la presentación (28 agosto 2026)
están completas y verificadas: auto-calibración, red de agua compartida,
ventana de riego con pronóstico, y anomalía de sensor + tool-calling
autónomo. Si sobra tiempo antes de la presentación: pulir el bug pendiente
de `Red Stats` (ver tabla de workflows arriba), o considerar una tercera
tool para el triage (ej. `consultar_calibracion_historica`, descartada
esta sesión por ser una lectura interna barata sin mucho valor demostrativo
frente a las llamadas externas costosas que sí vale la pena mostrar que el
agente elige on-demand).
