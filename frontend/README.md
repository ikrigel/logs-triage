# Production Logs Triage - React Frontend

This is the React + TypeScript frontend for the Production Logs Triage application, built with Vite for fast development and optimal production bundles.

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development

Start the development server (runs on `http://localhost:5173` by default):

```bash
npm run dev
```

The development server proxies API requests to `http://localhost:3000` (the Express backend).

### Building

Create an optimized production build:

```bash
npm run build
```

The output will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Layout/          # App shell (Header, Sidebar, Layout)
│   ├── Chat/            # Chat components (Phase 2)
│   ├── Views/           # Page components (Phase 3)
│   └── Common/          # Reusable UI components
├── hooks/
│   ├── useAPI.ts        # API data fetching hook
│   └── ...              # Custom hooks (Phase 2+)
├── store/
│   └── uiStore.ts       # Zustand store for UI state
├── types/
│   └── index.ts         # TypeScript type definitions
├── config/
│   └── api.ts           # API endpoint configuration
├── styles/
│   └── globals.css      # Global styles and CSS variables
├── App.tsx              # Root component
├── main.tsx             # Entry point
└── routes.tsx           # View routing
```

## Architecture

### State Management
- **UI State**: Zustand store (`uiStore`) for theme, navigation, settings
- **Server State**: TanStack Query (coming in Phase 2) for API data
- **Component State**: React hooks for local component state

### Styling
- CSS custom properties (variables) for theming
- Mobile-first responsive design
- Dark mode support via `dark-mode` class on `document`

### Development Phases

**Phase 1 (Current)**: Core shell and navigation ✅
- ✅ Vite + React + TypeScript setup
- ✅ Layout components (Header, Sidebar)
- ✅ Navigation system with view switching
- ✅ Dark mode toggle
- ✅ Mobile responsive design
- ✅ Zustand store for UI state

**Phase 2**: Chat interface and triage (Coming)
- Triage view with chat interface
- Chat message components
- Tool execution display
- Session management with API integration

**Phase 3**: Dashboard, logs, tickets, and settings (Coming)
- Dashboard with metrics
- Logs view with filtering
- Tickets management
- Settings view for provider/model selection

**Phase 4**: Testing, optimization, and polish (Coming)
- E2E tests with Playwright
- Performance optimization
- Accessibility audit
- Mobile responsiveness fixes

## API Integration

The frontend communicates with the Express backend at `http://localhost:3000`. API endpoints are defined in `src/config/api.ts`:

### Chat Endpoints
- `POST /api/chat/start` - Start new conversation
- `POST /api/chat/:sessionId/message` - Send message
- `GET /api/chat/:sessionId` - Get conversation state
- `DELETE /api/chat/:sessionId` - End conversation

### Logs Endpoints
- `GET /api/logs` - List available log sets
- `GET /api/logs/:setNumber` - Get logs by set

### Tickets Endpoints
- `GET /api/tickets` - List tickets
- `GET /api/tickets/:id` - Get single ticket
- `POST /api/tickets/:id/comments` - Add comment

## Build Output

The production build is highly optimized:
- **HTML**: 0.46 kB (gzipped)
- **CSS**: 1.58 kB (gzipped)
- **JavaScript**: 62.16 kB (gzipped)
- **Total**: ~64 kB gzipped

This is well under the 100 kB target and allows for fast page loads.

## Environment Variables

Create a `.env.local` file in the `frontend/` directory for development:

```
VITE_API_URL=http://localhost:3000/api
```

## Troubleshooting

### HMR Issues
If hot module reloading doesn't work, try restarting the development server:
```bash
npm run dev
```

### Port Already in Use
If port 5173 is already in use, Vite will automatically try the next available port.

### API Connection Errors
Make sure the Express backend is running on `http://localhost:3000` and that the API proxy is configured correctly in `vite.config.ts`.

## Performance Notes

- Zustand provides lightweight state management (~4 kB)
- TanStack Query will be added in Phase 2 for efficient data fetching
- CSS variables enable instant theme switching without repainting
- Code splitting is automatic with Vite
- Tree shaking removes unused code from production builds
