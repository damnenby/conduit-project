import Express from 'express';
import bodyParser from 'body-parser';
import { router } from './modules/books/books.controller';
import { articlesRouter } from './modules/articles/articles.controller';
import { profilesRouter } from './modules/profiles/profiles.controller';
import { tagsRouter } from './modules/tags/tags.controller';
import { usersRouter } from './modules/users/users.controller';
import { dbService } from './modules/db/db.service';

const PORT = 3000;

// Init DB connection
dbService.connect();

const app = Express();

// Ensure JSON/URL-encoded bodies on HTTP requests are parsed correctly
app.use(bodyParser.json()).use(bodyParser.urlencoded({ extended: true }));

// Setup routes
app.get('/api/health', (_req, res) => {
  return res.json({ status: 'ok' });
});

app.use('/api/books', router);
app.use('/api/articles', articlesRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/users', usersRouter);

// Init server
app.listen(PORT, () => {
  console.info(`Server running at http://localhost:${PORT}`);
});
