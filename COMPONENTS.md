# Component Reference

Comprehensive guide to all React components in the Production Logs Triage Agent.

---

## Component Categories

- **[Layout Components](#layout-components)** - Page structure (Header, Sidebar, Layout)
- **[Chat Components](#chat-components)** - Conversation UI (ChatWindow, ChatMessage, ChatInput)
- **[View Components](#view-components)** - Page views (Dashboard, Logs, Tickets, Settings)
- **[Common Components](#common-components)** - Utilities (ErrorBoundary, LoadingSkeleton)

---

## Layout Components

### Header

**Location**: `frontend/src/components/Layout/Header.tsx`

**Purpose**: Top navigation bar with dark mode toggle

**Props**:
```typescript
interface HeaderProps {
  // None - uses Zustand store internally
}
```

**Features**:
- ✅ Sticky positioning at top
- ✅ Dark mode toggle button
- ✅ Responsive design (hamburger menu on mobile)
- ✅ App title/logo

**Usage**:
```tsx
import { Header } from './components/Layout/Header';

function App() {
  return <Header />;
}
```

**Styles**:
- Height: 64px
- Background: `var(--bg)`
- Border bottom: `var(--border)`
- Sticky positioning: `top: 0`

**Dark Mode**:
- Toggle button reads/updates `darkMode` from Zustand store
- Applies `dark-mode` class to `document.documentElement`

---

### Sidebar

**Location**: `frontend/src/components/Layout/Sidebar.tsx`

**Purpose**: Left navigation menu with view selection

**Props**:
```typescript
interface SidebarProps {
  // None - uses Zustand store internally
}
```

**Features**:
- ✅ 5 navigation views: Dashboard, Triage, Logs, Tickets, Settings
- ✅ Active view highlighting
- ✅ Responsive: collapses to hamburger on mobile (< 768px)
- ✅ Auto-closes after navigation on mobile
- ✅ Smooth slide-in/out animation
- ✅ Overlay when open on mobile

**Usage**:
```tsx
import { Sidebar } from './components/Layout/Sidebar';

function App() {
  return <Sidebar />;
}
```

**Navigation Items**:
1. Dashboard (📊)
2. Triage (🤖)
3. Logs (📋)
4. Tickets (🎫)
5. Settings (⚙️)

**Mobile Behavior**:
- Hamburger button visible on width < 768px
- Sidebar transforms off-screen (`translateX(-100%)`)
- Overlay prevents background scroll
- Auto-closes on nav item click

**State Management** (Zustand):
- `currentView`: Current selected view
- `sidebarOpen`: Sidebar visibility on mobile
- `setSidebarOpen()`: Toggle sidebar

---

### Layout

**Location**: `frontend/src/components/Layout/Layout.tsx`

**Purpose**: Main wrapper combining Header and Sidebar

**Props**:
```typescript
interface LayoutProps {
  children: React.ReactNode;  // Page content
}
```

**Features**:
- ✅ Wraps Header and Sidebar
- ✅ Applies dark mode styling
- ✅ Responsive grid layout
- ✅ Handles sidebar resize on desktop

**Usage**:
```tsx
import { Layout } from './components/Layout/Layout';

function App() {
  return (
    <Layout>
      <YourPageContent />
    </Layout>
  );
}
```

**Layout Grid**:
```
Desktop (>= 768px):
┌──────────────────────────┐
│        Header            │
├────────┬─────────────────┤
│        │                 │
│ Sidebar │   Children     │
│        │                 │
├────────┴─────────────────┤

Mobile (< 768px):
┌──────────────────────────┐
│        Header            │
├──────────────────────────┤
│       Children           │
├──────────────────────────┤
│ [Sidebar - hidden/overlay] │
```

---

## Chat Components

### TriageView

**Location**: `frontend/src/components/Chat/TriageView.tsx`

**Purpose**: Main orchestrator for triage/chat flow

**Props**:
```typescript
interface TriageViewProps {
  // None - uses Zustand store internally
}
```

**Features**:
- ✅ Shows LogSourceSelector OR ChatWindow based on session state
- ✅ Manages session lifecycle (start, end)
- ✅ Toggles between Chat Mode and Auto Triage Mode
- ✅ Displays session info (log count, source)
- ✅ Handles API key validation

**Internal State**:
```typescript
const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
const [sessionLogs, setSessionLogs] = useState<LogsInfo | null>(null);
const [conversationMode, setConversationMode] = useState<'chat' | 'auto'>('chat');
```

**Key Methods**:
- `startConversation()`: Initiates chat mode with selected log source
- `startAutoTriage()`: Runs autonomous investigation
- `endSession()`: Cleans up session
- `sendMessage()`: Sends user message via useChat hook

**Mode Toggle**:
- **Chat Mode**: Interactive conversation, one turn per message
- **Auto Mode**: Autonomous investigation, 1-10 automatic iterations

**Session Info Display**:
Shows when session is active:
- Log count from selected source
- Source identifier (log_set_1, file_upload, etc.)
- "End Conversation" button

---

### ChatWindow

**Location**: `frontend/src/components/Chat/ChatWindow.tsx`

**Purpose**: Container displaying conversation messages

**Props**:
```typescript
interface ChatWindowProps {
  messages: ChatMessage[];              // All messages in conversation
  isLoading: boolean;                   // True while waiting for response
  onSendMessage: (message: string) => Promise<void>;  // Send handler
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: string;
  toolCall?: {
    toolName: string;
    arguments: any;
    result: any;
  };
}
```

**Features**:
- ✅ Auto-scrolls to latest message
- ✅ Shows loading indicator (pulsing animation)
- ✅ Displays tool executions inline
- ✅ Message timestamps
- ✅ Responsive layout (mobile-friendly)

**Usage**:
```tsx
import { ChatWindow } from './components/Chat/ChatWindow';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  return (
    <ChatWindow
      messages={messages}
      isLoading={false}
      onSendMessage={async (msg) => { /* ... */ }}
    />
  );
}
```

**Styling**:
- Scrollable container (max-height: calc(100vh - 200px))
- White background (light mode) / Dark (dark mode)
- Left/right alignment for user/assistant messages
- Loading animation (pulse effect)

---

### ChatMessage

**Location**: `frontend/src/components/Chat/ChatMessage.tsx`

**Purpose**: Individual message display with formatting

**Props**:
```typescript
interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant' | 'tool';
    content: string;
    timestamp: string;
    toolCall?: {
      toolName: string;
      arguments: any;
      result: any;
    };
  };
}
```

**Features**:
- ✅ Markdown formatting (bold, italic, code)
- ✅ Different styles for user/assistant/tool messages
- ✅ Timestamp display
- ✅ Tool call visualization with results
- ✅ Code syntax highlighting (basic)

**Message Types**:
| Type | Styling | Content |
|------|---------|---------|
| **user** | Blue background, right-aligned | User input |
| **assistant** | Gray background, left-aligned | AI response |
| **tool** | Subtle blue border | Tool execution info |

**Markdown Support**:
- **bold**: `**text**` → Bold text
- *italic*: `*text*` → Italic text
- `code`: `` `code` `` → Monospace
- Links: `[text](url)` → Clickable links

**Tool Call Display**:
```
🔧 search_logs
Found 47 matching logs
```

---

### ChatInput

**Location**: `frontend/src/components/Chat/ChatInput.tsx`

**Purpose**: Message input field with auto-growing textarea

**Props**:
```typescript
interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;  // Send handler
  disabled?: boolean;  // Disable during processing
  placeholder?: string;  // Input placeholder
}
```

**Features**:
- ✅ Auto-expanding textarea (grows with content)
- ✅ Enter to send (Shift+Enter for newline)
- ✅ Send button
- ✅ Disabled state during processing
- ✅ 44px minimum height (touch accessibility)

**Keyboard Bindings**:
| Key | Action |
|-----|--------|
| Enter | Send message |
| Shift+Enter | New line |
| Escape | (Future: clear input) |

**Usage**:
```tsx
import { ChatInput } from './components/Chat/ChatInput';

function App() {
  const handleSend = async (message: string) => {
    console.log('User said:', message);
    // Send to API
  };

  return (
    <ChatInput
      onSendMessage={handleSend}
      placeholder="Ask a question..."
    />
  );
}
```

**Styling**:
- Textarea min-height: 48px (WCAG 44px minimum)
- Auto-grows up to 150px max-height
- Responsive padding (1rem)
- Border color changes on focus (primary color)

---

### LogSourceSelector

**Location**: `frontend/src/components/Chat/LogSourceSelector.tsx`

**Purpose**: UI for selecting log source before starting conversation

**Props**:
```typescript
interface LogSourceSelectorProps {
  onSelect: (source: LogSource) => Promise<void>;  // Selection handler
  isLoading?: boolean;  // Show spinner during processing
}

type LogSource = 'log_set_1' | 'log_set_2' | 'log_set_3' | 'log_set_4' | 'log_set_5';
```

**Features**:
- ✅ 5 predefined log set cards
- ✅ Card-based UI with descriptions
- ✅ Loading spinner on selection
- ✅ Responsive grid layout

**Log Sets**:
| Set | Name | Description | Use Case |
|-----|------|-------------|----------|
| 1 | Healthy System | No errors | Baseline / learn |
| 2 | Warnings | Connection issues | Intermediate |
| 3 | Critical Errors | Payment outage | Advanced |
| 4 | Deployment Issues | DB after deploy | Correlation |
| 5 | Complex Investigation | Zendesk token | Deep analysis |

**Usage**:
```tsx
import { LogSourceSelector } from './components/Chat/LogSourceSelector';

function App() {
  const handleSelect = async (source: LogSource) => {
    const response = await fetch('/api/chat/start', {
      method: 'POST',
      body: JSON.stringify({ logSetNumber: parseInt(source.split('_')[2]) })
    });
    // ... handle response
  };

  return (
    <LogSourceSelector
      onSelect={handleSelect}
      isLoading={false}
    />
  );
}
```

---

## View Components

### DashboardView

**Location**: `frontend/src/components/Views/DashboardView.tsx`

**Purpose**: Overview dashboard with key metrics

**Props**:
```typescript
interface DashboardViewProps {
  // None - uses Zustand store internally
}
```

**Features**:
- ✅ 4 metric cards (Total Logs, Open Tickets, Critical Issues, Chat Sessions)
- ✅ Trend indicators (up/down arrows)
- ✅ Recent activity feed
- ✅ Responsive grid layout

**Metric Cards**:
| Metric | Icon | Shows |
|--------|------|-------|
| Total Logs | 📊 | Total log count |
| Open Tickets | 🎫 | Count + trend |
| Critical Issues | 🚨 | Count + severity |
| Chat Sessions | 💬 | Active sessions |

**Activity Feed**:
- Shows recent logs/actions
- Timestamp and type (error, warning, info)
- Clickable to navigate to Logs view

**Usage**:
```tsx
import { DashboardView } from './components/Views/DashboardView';

function App() {
  return <DashboardView />;
}
```

**Styling**:
- Card layout with shadow and hover effects
- Metric number in primary color
- Trend indicator (green ↑ or red ↓)
- Activity feed: bordered list

---

### LogsView

**Location**: `frontend/src/components/Views/LogsView.tsx`

**Purpose**: Browse and search production logs

**Props**:
```typescript
interface LogsViewProps {
  // None - fetches logs from API
}
```

**Features**:
- ✅ Searchable log table
- ✅ Filter by level (ERROR, WARNING, INFO, DEBUG)
- ✅ Filter by service name
- ✅ Sticky header
- ✅ Severity color badges
- ✅ Time-based sorting
- ✅ Pagination (if implemented)

**Log Table Columns**:
| Column | Content |
|--------|---------|
| Time | ISO timestamp |
| Service | Service name |
| Level | ERROR/WARNING/INFO/DEBUG |
| Message | Log content (truncated) |
| Action | Expand button |

**Filters**:
- **Search**: Keyword in message content
- **Level**: Dropdown (ERROR, WARNING, INFO, DEBUG)
- **Service**: Dropdown (dynamically populated)

**Usage**:
```tsx
import { LogsView } from './components/Views/LogsView';

function App() {
  return <LogsView />;
}
```

**Color Badges**:
- ERROR: Red (#ef4444)
- WARNING: Orange (#f97316)
- INFO: Blue (#3b82f6)
- DEBUG: Gray (#6b7280)

---

### TicketsView

**Location**: `frontend/src/components/Views/TicketsView.tsx`

**Purpose**: View and manage support tickets

**Props**:
```typescript
interface TicketsViewProps {
  // None - fetches tickets from API
}
```

**Features**:
- ✅ Ticket card grid
- ✅ Filter by status (Open, In Progress, Closed)
- ✅ Filter by severity (Low, Medium, High, Critical)
- ✅ Detail panel on selection
- ✅ Action buttons (Update Status, Add Comment)
- ✅ Severity color coding

**Ticket Card**:
```
┌─────────────────────┐
│ Title               │
│ [severity] [status] │
│ Service: xyz        │
│ Created: time ago   │
│ [View Details] →    │
└─────────────────────┘
```

**Detail Panel** (right side):
- Full ticket content
- All related logs
- AI suggestions
- Comments section
- Update/Delete buttons

**Filter Buttons**:
- Status: Open, In Progress, Closed
- Severity: Low, Medium, High, Critical
- Can combine filters

**Usage**:
```tsx
import { TicketsView } from './components/Views/TicketsView';

function App() {
  return <TicketsView />;
}
```

**Severity Colors**:
- Critical: Red (#dc2626)
- High: Orange (#f97316)
- Medium: Yellow (#eab308)
- Low: Green (#16a34a)

---

### SettingsView

**Location**: `frontend/src/components/Views/SettingsView.tsx`

**Purpose**: API key and provider configuration

**Props**:
```typescript
interface SettingsViewProps {
  // None - uses Zustand store internally
}
```

**Features**:
- ✅ Provider selection (Gemini, Claude, Perplexity)
- ✅ Dynamic model list per provider
- ✅ API key input (password field)
- ✅ Setup links (open provider console)
- ✅ Save/validate keys
- ✅ Provider logos/icons

**Provider Information**:

**Google Gemini**:
- Free tier: 60 requests/minute
- Default model: gemini-2.0-flash
- Models: 5 options
- Docs: https://aistudio.google.com
- Get key: https://aistudio.google.com/app/apikeys

**Anthropic Claude**:
- Paid (per-token)
- Default model: claude-3-5-sonnet
- Models: 3 options
- Docs: https://console.anthropic.com
- Get key: https://console.anthropic.com/

**Perplexity**:
- Paid (per-call)
- Default model: sonar
- Models: 3 options
- Docs: https://www.perplexity.ai
- Get key: https://www.perplexity.ai/settings/api

**Usage**:
```tsx
import { SettingsView } from './components/Views/SettingsView';

function App() {
  return <SettingsView />;
}
```

**State Management**:
- `aiProvider`: Selected provider (stored in localStorage)
- `aiModel`: Selected model (stored in localStorage)
- `${provider}_api_key`: API key (stored in localStorage)

**Validation**:
- Key must not be empty
- Shows success message after save
- Validates on chat start

---

## Common Components

### ErrorBoundary

**Location**: `frontend/src/components/Common/ErrorBoundary.tsx`

**Purpose**: Catch React errors and display fallback UI

**Props**:
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;  // Child components to wrap
  fallback?: React.ReactNode;  // Optional custom fallback UI
}
```

**Features**:
- ✅ Catches errors in child component tree
- ✅ Graceful error UI with "Try Again" button
- ✅ Development-only error details display
- ✅ Custom fallback support
- ✅ Prevents white screen of death

**Error Boundary States**:
1. **No Error**: Renders children normally
2. **Error Occurred**: Shows error UI with "Try Again" button
3. **Development Mode**: Shows full error stack trace in expandable `<details>`

**Usage**:
```tsx
import { ErrorBoundary } from './components/Common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary fallback={<CustomErrorUI />}>
      <YourComponent />
    </ErrorBoundary>
  );
}

// Or with default error UI:
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Error Display** (Production):
```
⚠️ Oops! Something went wrong

We encountered an unexpected error.
Please try refreshing the page.

[Try Again]
```

**Error Display** (Development):
```
(Same as above, plus:)

<details>
  <summary>Error Details (Development Only)</summary>
  <pre>Error: Component rendering failed...</pre>
  <pre>Component stack trace...</pre>
</details>
```

**Methods**:
- `handleReset()`: Reset error state and retry

---

### LoadingSkeleton

**Location**: `frontend/src/components/Common/LoadingSkeleton.tsx`

**Purpose**: Animated placeholder while loading content

**Props**:
```typescript
interface LoadingSkeletonProps {
  type?: 'card' | 'text' | 'line' | 'circle' | 'metric';  // Default: 'card'
  count?: number;  // Number of skeletons (default: 1)
  width?: string | number;  // Custom width
  height?: string | number;  // Custom height
  className?: string;  // Additional CSS classes
}
```

**Skeleton Types**:

| Type | Use Case | Appearance |
|------|----------|-----------|
| **card** | List items, ticket cards | Rounded rect with header |
| **text** | Single line | Inline placeholder |
| **line** | Text row | Full-width bar |
| **circle** | Avatar, icon | 40x40px circle |
| **metric** | Dashboard metric | Icon + 2 text lines |

**Features**:
- ✅ Animated shimmer (1.5s loop)
- ✅ Dark mode support
- ✅ Respects `prefers-reduced-motion`
- ✅ Multiple count support (grid layout)
- ✅ Custom sizing

**Animation**:
```css
gradient: linear-gradient(90deg,
  var(--bg-secondary) 25%,
  var(--bg-tertiary) 50%,
  var(--bg-secondary) 75%
)
animation: loading 1.5s infinite
```

**Usage**:
```tsx
import { LoadingSkeleton, CardsSkeleton, MetricsSkeleton } from './components/Common/LoadingSkeleton';

// Single skeleton
<LoadingSkeleton type="line" />

// Multiple cards
<LoadingSkeleton type="card" count={3} />

// Helper components
<CardsSkeleton count={4} />
<MetricsSkeleton count={4} />
<TextSkeleton lines={5} />

// Custom sizing
<LoadingSkeleton type="circle" width={60} height={60} />
```

**Helper Components**:

**CardsSkeleton**:
```tsx
export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return <LoadingSkeleton type="card" count={count} />;
}
```

**MetricsSkeleton**:
```tsx
export function MetricsSkeleton({ count = 4 }: { count?: number }) {
  return <LoadingSkeleton type="metric" count={count} />;
}
```

**TextSkeleton**:
```tsx
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="loading-skeleton-group">
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingSkeleton key={i} type="line" />
      ))}
    </div>
  );
}
```

**Dark Mode**:
- Automatically adjusts gradient colors
- Background becomes darker
- Maintains contrast

**Accessibility**:
- Respects `prefers-reduced-motion: reduce`
- Reduces animation to static placeholder
- Alternative: Gray background with 50% opacity

---

## Hooks

### useChat

**Location**: `frontend/src/hooks/useChat.ts`

**Purpose**: Manage chat session state with TanStack Query

**Signature**:
```typescript
function useChat(sessionId: string | null): {
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (message: string) => Promise<void>;
  endSession: () => Promise<void>;
}
```

**Features**:
- ✅ Automatic session fetching (refetch every 30s)
- ✅ Message caching via TanStack Query
- ✅ Optimistic updates
- ✅ Error handling
- ✅ Automatic cleanup on unmount

**Usage**:
```tsx
import { useChat } from '../hooks/useChat';

function ChatComponent({ sessionId }: { sessionId: string }) {
  const { messages, isLoading, error, sendMessage } = useChat(sessionId);

  if (error) return <div>Error: {error.message}</div>;

  return (
    <>
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        onSendMessage={sendMessage}
      />
    </>
  );
}
```

**Query Behavior**:
- **Refetch Interval**: 30 seconds
- **Cache Time**: 5 minutes
- **Stale Time**: 10 seconds
- **Retry**: 3 times with exponential backoff

---

## State Management

### Zustand Store (uiStore)

**Location**: `frontend/src/store/uiStore.ts`

**State**:
```typescript
interface UIState {
  // Navigation
  currentView: View;
  setCurrentView: (view: View) => void;

  // Mobile menu
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Theme
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;

  // AI Settings
  aiProvider: 'gemini' | 'claude' | 'perplexity';
  setAIProvider: (provider: AIProvider) => void;

  aiModel: string;
  setAIModel: (model: string) => void;
}
```

**Usage**:
```tsx
import { useUIStore } from '../store/uiStore';

function MyComponent() {
  const { currentView, setCurrentView, darkMode, setDarkMode } = useUIStore();

  return (
    <>
      Current view: {currentView}
      <button onClick={() => setCurrentView('logs')}>Go to Logs</button>
      <button onClick={() => setDarkMode(!darkMode)}>Toggle Theme</button>
    </>
  );
}
```

**Persistence**:
- State is persisted to localStorage
- Automatically loaded on page refresh
- Provider/model settings survive tab close

---

## Styling Guidelines

### CSS Variables (globals.css)

**Colors**:
```css
--primary: #3b82f6        /* Blue */
--secondary: #6b7280      /* Gray */
--success: #16a34a        /* Green */
--warning: #f97316        /* Orange */
--danger: #dc2626         /* Red */
--info: #3b82f6           /* Blue */
```

**Backgrounds**:
```css
--bg: #ffffff             /* Main background */
--bg-secondary: #f3f4f6   /* Secondary background */
--bg-tertiary: #e5e7eb    /* Tertiary background */
```

**Text**:
```css
--text: #1f2937           /* Main text */
--text-secondary: #6b7280 /* Secondary text */
--text-muted: #9ca3af     /* Muted text */
```

**Borders & Effects**:
```css
--border: #e5e7eb         /* Border color */
--shadow: 0 1px 3px rgba(0,0,0,0.1)
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1)
--radius-sm: 0.25rem      /* 4px */
--radius-md: 0.5rem       /* 8px */
--radius-lg: 1rem         /* 16px */
```

**Spacing**:
```css
--spacing-xs: 0.25rem     /* 4px */
--spacing-sm: 0.5rem      /* 8px */
--spacing-md: 1rem        /* 16px */
--spacing-lg: 1.5rem      /* 24px */
--spacing-xl: 2rem        /* 32px */
```

---

## Component Checklist

**Layout Components** ✅
- [x] Header
- [x] Sidebar
- [x] Layout

**Chat Components** ✅
- [x] TriageView
- [x] ChatWindow
- [x] ChatMessage
- [x] ChatInput
- [x] LogSourceSelector

**View Components** ✅
- [x] DashboardView
- [x] LogsView
- [x] TicketsView
- [x] SettingsView

**Common Components** ✅
- [x] ErrorBoundary
- [x] LoadingSkeleton

**Hooks** ✅
- [x] useChat

---

## Best Practices

### When Creating New Components

1. **Keep Under 250 Lines**: Split if larger
2. **Use TypeScript**: Full type safety with interfaces
3. **Functional Components**: Prefer over class components
4. **Custom Hooks**: Extract logic to reusable hooks
5. **Props Interface**: Always define prop types explicitly
6. **Accessibility**: Use semantic HTML, ARIA labels
7. **Mobile First**: Design for mobile, enhance for desktop
8. **Error Handling**: Consider error states and loading states

### Component Template

```tsx
import { ReactNode } from 'react';
import './ComponentName.css';

interface ComponentNameProps {
  // Props here
  title: string;
  children?: ReactNode;
  onClick?: () => void;
}

export function ComponentName({
  title,
  children,
  onClick
}: ComponentNameProps) {
  return (
    <div className="component-name" onClick={onClick}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### Styling Best Practices

1. **Use CSS Variables**: Don't hardcode colors
2. **Responsive**: Mobile-first approach
3. **Dark Mode**: Test with `dark-mode` class
4. **Accessibility**: Min touch target 44px, color contrast
5. **Performance**: CSS Grid > Flexbox for layouts

---

**Last Updated**: January 2025
**Status**: Complete Reference
