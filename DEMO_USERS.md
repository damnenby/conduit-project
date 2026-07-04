# Sample accounts

We use these accounts to test profiles, follows, articles, comments, and favorites. The email addresses use the reserved `.test` domain. Do not reuse the shared password outside the local application.

Open the application at [http://localhost:5173](http://localhost:5173).

All sample accounts use this password:

```text
Conduit2026!
```

| Username | Email | Profile |
| --- | --- | --- |
| `community_host` | `community.host@conduit.test` | Community host |
| `mara_dev` | `mara_dev@conduit.test` | Vue developer |
| `jonas_backend` | `jonas_backend@conduit.test` | NestJS developer |
| `lina_design` | `lina_design@conduit.test` | Product designer |
| `sofia_travels` | `sofia_travels@conduit.test` | Travel writer |
| `tim_green` | `tim_green@conduit.test` | Sustainability enthusiast |
| `anika_reads` | `anika_reads@conduit.test` | Book reviewer |
| `leo_music` | `leo_music@conduit.test` | Music producer |
| `nina_science` | `nina_science@conduit.test` | Science communicator |
| `paul_docker` | `paul_docker@conduit.test` | Platform developer |
| `olga_cooks` | `olga_cooks@conduit.test` | Home cook |
| `sam_access` | `sam_access@conduit.test` | Accessibility advocate |
| `emil_career` | `emil_career@conduit.test` | Career mentor |
| `katya_notes` | `katya_notes@conduit.test` | Multilingual writer |
| `noah_data` | `noah_data@conduit.test` | Database enthusiast |
| `zara_security` | `zara_security@conduit.test` | Application-security learner |

To recreate the sample data while the Docker stack is running:

```bash
node scripts/seed-demo.mjs
```
