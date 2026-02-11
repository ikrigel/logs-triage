import dotenv from 'dotenv';
import { Request, Response } from 'express';

dotenv.config();

// Import the Express app from src/web/app.js
// This reuses all the existing Express setup and routes defined in src/web/app.ts
// Note: .js extension is required for ES modules in Node.js
import app from '../src/web/app.js';

// Favicon handler (return 204 No Content)
app.get('/favicon.ico', (req: Request, res: Response) => {
  res.status(204).end();
});

export default app;
