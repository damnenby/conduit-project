import Express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import bodyParser from 'body-parser';
import { articlesRouter } from './modules/articles/articles.controller';
import { profilesRouter } from './modules/profiles/profiles.controller';
import { tagsRouter } from './modules/tags/tags.controller';
import {
  currentUserRouter,
  usersRouter,
} from './modules/users/users.controller';

const PORT = 3000;

const app = Express();

// Ensure JSON/URL-encoded bodies on HTTP requests are parsed correctly
app.use(bodyParser.json()).use(bodyParser.urlencoded({ extended: true }));

// Setup routes
app.get('/api/health', (_req, res) => {
  return res.json({ status: 'ok' });
});

app.use('/api/articles', articlesRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/user', currentUserRouter);
app.use('/api/users', usersRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);

  return res.status(500).json({
    errors: {
      body: ['Internal server error'],
    },
  });
});

// Init server
app.listen(PORT, () => {
  console.info(`Server running at http://localhost:${PORT}`);
});
