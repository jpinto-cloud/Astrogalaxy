# Stack tecnológico de Astrogalaxy

## Frontend (lo que ve el usuario)
- **HTML5** — estructura de la interfaz.
- **CSS3** — estilos, gradientes y diseño responsive (sin frameworks pesados).
- **JavaScript (ES2020+)** — interactividad.
- **React** — para la aplicación (dashboard, subida de fotos, ranking en vivo).
- Tipografías: *Bricolage Grotesque* (títulos) + *DM Sans* (texto).

> La landing incluida en este proyecto está hecha con HTML + CSS + JS y se
> publica como un solo archivo `index.html` (ideal para GitHub Pages).

## Backend / API
- **Lenguaje: TypeScript** sobre **Node.js**.
- **Framework: Express** (API REST).
- **Autenticación:** JWT (tokens) + API keys para integraciones de colegios.
- **Almacenamiento de fotos:** un bucket de objetos (S3 / GCS / Supabase Storage).

### Endpoints principales
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/v1/evidence` | Sube la foto de evidencia de un reto |
| POST | `/v1/ai/verify` | Lanza la evaluación por IA de una evidencia |
| POST | `/v1/nfts/mint`  | Emite la NFT cuando la evidencia es aprobada |
| GET  | `/v1/leaderboard` | Devuelve el ranking (por grado o individual) |
| GET  | `/v1/dashboard/:id` | Puntajes, NFTs y posición de un participante/grado |
| GET  | `/v1/challenges` | Lista de retos (gratuitos y premium) |

## Servicio de Inteligencia Artificial
- **Lenguaje: Python 3.11+**
- **Framework: FastAPI** (microservicio independiente).
- **Visión por computador:** un modelo de clasificación/visión (p. ej. PyTorch
  o un proveedor de visión) para comprobar que la foto corresponde al reto y no
  es repetida ni falsa.
- Devuelve: `ai_verified` (bool), `confidence` (0–1) y los puntos sugeridos.

## Base de datos
- **PostgreSQL** (SQL relacional).
- Tablas: `users`, `schools`, `grades`, `challenges`, `evidence`, `points`, `nfts`.
- Ver `backend/db/schema.sql`.

## NFTs (blockchain)
- **Lenguaje: Solidity** — estándar **ERC-721**.
- Cada reto completado y aprobado por la IA dispara el *mint* de una NFT.
- Los retos **premium** ($15/mes) emiten NFTs **únicas/raras**.
- Herramientas sugeridas para compilar y desplegar: **Hardhat** o **Foundry**.
- Redes recomendadas por bajo costo: Polygon / Base (L2).

## Pagos (suscripción Premium)
- Pasarela: **Stripe** (suscripción de $15/mes).
- Al activarse, desbloquea retos premium y un multiplicador de puntos ×2.

## Infraestructura sugerida
- API y servicio de IA en contenedores **Docker**.
- Despliegue: Railway / Render / Fly.io / cualquier nube.
- Frontend estático (landing) en **GitHub Pages** o Vercel.
