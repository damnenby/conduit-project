import Express from 'express';
import bodyParser from 'body-parser';
import { router } from './modules/books/books.controller';
import { dbService } from './modules/db/db.service';

const PORT = 3000;

// Init DB connection
dbService.connect();

const app = Express();

// Ensure JSON/URL-encoded bodies on HTTP requests are parsed correctly
app.use(bodyParser.json()).use(bodyParser.urlencoded({ extended: true }));

// Setup routes
app.use('/api/books', router);

// Init server
app.listen(PORT, () => {
  console.info(`Server running at http://localhost:${PORT}`);
});
