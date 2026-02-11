import dotenv from 'dotenv';

dotenv.config();

// Import the Express app from dist/src/web/app.js
// This reuses all the existing Express setup and routes
import app from '../dist/src/web/app.js';

// Favicon handler (return 204 No Content)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

export default app;
