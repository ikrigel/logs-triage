import dotenv from 'dotenv';

dotenv.config();

// Import the Express app from src/web/app.ts
// This reuses all the existing Express setup and routes
import app from '../src/web/app';

// Favicon handler (return 204 No Content)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

export default app;
