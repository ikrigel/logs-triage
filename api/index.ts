import dotenv from 'dotenv';

dotenv.config();

// Import the Express app from src/web/app.js
// When deployed to Vercel, the dist/ contents become the root of /var/task/
// So from /var/task/api/index.js, the relative path to /var/task/src/web/app.js is ../src/web/app.js
import app from '../src/web/app.js';

// Favicon handler (return 204 No Content)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

export default app;
