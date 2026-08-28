# Workflows n8n (exportados)

Estos JSON son exports de los workflows de n8n Cloud, **con los secretos
redactados** (`__SUPABASE_SERVICE_ROLE_KEY__`, `__ANTHROPIC_API_KEY__`,
`__TELEGRAM_BOT_TOKEN__`). Sirven como documentación de la estructura /
para reconstruir un workflow si hace falta.

| Archivo | Workflow en n8n | Disparador |
|---|---|---|
| `Digest-diario-Telegram.json` | Digest diario Telegram (`78pkJom6NbuapLc7`) | Schedule `0 7 * * *` (hora Costa Rica) |
| `Aviso-reasignacion-Telegram.json` | Aviso reasignacion Telegram (`KyHDfJi24Ff1eXZZ`) | Schedule `7,37 * * * *` |
| `Negociacion-cuenca.json` | Negociacion cuenca (pendiente de importar) | Schedule `5,35 * * * *` |

## Importar `Negociacion cuenca`

El clasificador de permisos de Claude Code bloqueó crear este workflow por
API (modifica infraestructura compartida + hace llamadas salientes), así
que hay que importarlo a mano:

1. En n8n Cloud → **Workflows → Add workflow → menú ⋯ → Import from File**
   (o pegar el JSON con el que Claude te pasó — ese trae los secretos
   reales, este del repo los tiene redactados).
2. Revisar que los nodos HTTP tengan la `service_role` key, la API key de
   Anthropic y (no aplica acá) el token del bot bien pegados.
3. **Activar** el workflow.
4. **Desactivar** `Optimizar asignacion` — `Negociacion cuenca` lo
   reemplaza (ambos escriben `porcentaje_apertura_asignado` en
   `RedParcelas`; su rama "sin conflicto" cubre el mismo caso base).

Antes de nada, correr `sql/negociacion_cuenca.sql` en Supabase.
