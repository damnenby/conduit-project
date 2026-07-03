# Conduit Demo Users

These accounts contain mock data only. They are intended for local testing and
the university defense. They are not real people or production credentials.

Local app: http://localhost:5173

All demo accounts use the password:

```text
Conduit2026!
```

| Username | Email | Persona |
| --- | --- | --- |
| `defense_demo` | `defense.demo@conduit.test` | Community host |
| `mara_dev` | `mara_dev@conduit.test` | Vue developer |
| `jonas_backend` | `jonas_backend@conduit.test` | NestJS developer |
| `lina_design` | `lina_design@conduit.test` | Product designer |
| `sofia_travels` | `sofia_travels@conduit.test` | Travel writer |
| `tim_green` | `tim_green@conduit.test` | Sustainability enthusiast |
| `anika_reads` | `anika_reads@conduit.test` | Book reviewer |
| `leo_music` | `leo_music@conduit.test` | Music producer |
| `nina_science` | `nina_science@conduit.test` | Science communicator |
| `paul_docker` | `paul_docker@conduit.test` | DevOps student |
| `olga_cooks` | `olga_cooks@conduit.test` | Home cook |
| `sam_access` | `sam_access@conduit.test` | Accessibility advocate |
| `emil_career` | `emil_career@conduit.test` | Career mentor |
| `katya_notes` | `katya_notes@conduit.test` | International student |
| `noah_data` | `noah_data@conduit.test` | Database enthusiast |
| `zara_security` | `zara_security@conduit.test` | Application-security student |

To recreate the demo data while the Docker stack is running:

```bash
node scripts/seed-demo.mjs
```
