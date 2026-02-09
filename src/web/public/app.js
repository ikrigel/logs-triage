// State management
const state = {
  currentView: 'dashboard',
  currentLogSet: 1,
  currentPage: 1,
  filters: {
    service: '',
    level: '',
    keyword: '',
  },
  ticketFilters: {
    status: '',
    severity: '',
  },
};

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('.view');
const themeBtn = document.getElementById('theme-toggle');
const toggleFiltersBtn = document.getElementById('toggle-filters');
const filtersPanel = document.getElementById('filters-panel');
const runTriageBtn = document.getElementById('run-triage-btn');
const ticketForm = document.getElementById('ticket-form');

// Event listeners
navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const view = e.target.dataset.view;
    switchView(view);
  });
});

themeBtn.addEventListener('click', toggleTheme);
toggleFiltersBtn.addEventListener('click', toggleFiltersPanel);
runTriageBtn.addEventListener('click', runTriage);
ticketForm?.addEventListener('submit', submitTicket);

document.getElementById('clear-filters')?.addEventListener('click', clearFilters);
document.getElementById('service-filter')?.addEventListener('change', applyFilters);
document.getElementById('level-filter')?.addEventListener('change', applyFilters);
document.getElementById('keyword-filter')?.addEventListener('input', applyFilters);
document.getElementById('status-filter')?.addEventListener('change', loadTickets);
document.getElementById('severity-filter')?.addEventListener('change', loadTickets);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  loadTickets();
  loadLogSet();
  loadSettings();
  setupPagination();
});

function switchView(view) {
  // Store old view before updating state
  const oldView = state.currentView;
  state.currentView = view;

  // Remove active class from old view
  const oldViewElement = document.getElementById(`${oldView}-view`);
  if (oldViewElement) {
    oldViewElement.classList.remove('active');
  }

  // Add active class to new view
  const newViewElement = document.getElementById(`${view}-view`);
  if (newViewElement) {
    newViewElement.classList.add('active');
  }

  // Update navigation links
  navLinks.forEach((link) => link.classList.remove('active'));
  const activeLink = document.querySelector(`[data-view="${view}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  // Update page title
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) {
    const titleText = view.charAt(0).toUpperCase() + view.slice(1).replace(/-/g, ' ');
    pageTitle.textContent = titleText;
  }

  // Load view-specific content
  if (view === 'logs') {
    loadLogSet();
  } else if (view === 'tickets') {
    loadTickets();
  } else if (view === 'dashboard') {
    loadDashboard();
  } else if (view === 'settings') {
    loadSettings();
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeBtn.textContent = isDark ? '☀️' : '🌙';
}

function toggleFiltersPanel() {
  filtersPanel.classList.toggle('open');
  const icon = document.getElementById('filter-icon');
  icon.textContent = filtersPanel.classList.contains('open') ? '▲' : '▼';
}

async function loadLogSet() {
  const logset = document.getElementById('logset-filter')?.value || state.currentLogSet;
  state.currentLogSet = parseInt(logset);
  state.currentPage = 1;

  const params = new URLSearchParams({
    page: state.currentPage,
    pageSize: 50,
    ...(state.filters.service && { service: state.filters.service }),
    ...(state.filters.level && { level: state.filters.level }),
    ...(state.filters.keyword && { keyword: state.filters.keyword }),
  });

  try {
    const response = await fetch(`/api/logs/${state.currentLogSet}?${params}`);
    const data = await response.json();

    renderLogs(data.logs);
    updatePagination(data.total, data.filtered);
    populateServiceFilter(data.logs);
  } catch (error) {
    console.error('Error loading logs:', error);
    document.getElementById('logs-tbody').innerHTML =
      '<tr><td colspan="4" class="text-center">Error loading logs</td></tr>';
  }
}

function renderLogs(logs) {
  const tbody = document.getElementById('logs-tbody');

  if (!logs || logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">No logs found</td></tr>';
    return;
  }

  tbody.innerHTML = logs
    .map(
      (log) => `
    <tr>
      <td>${log.time}</td>
      <td>${log.service}</td>
      <td class="level-${log.level.toLowerCase()}">${log.level}</td>
      <td title="${log.msg}">${log.msg.substring(0, 50)}</td>
    </tr>
  `
    )
    .join('');
}

function populateServiceFilter(logs) {
  const services = [...new Set(logs.map((l) => l.service))].sort();
  const select = document.getElementById('service-filter');

  if (select && services.length > 0) {
    const currentValue = select.value;
    select.innerHTML = '<option value="">All Services</option>';
    services.forEach((service) => {
      const option = document.createElement('option');
      option.value = service;
      option.textContent = service;
      select.appendChild(option);
    });
    select.value = currentValue;
  }
}

function applyFilters() {
  state.filters.service = document.getElementById('service-filter')?.value || '';
  state.filters.level = document.getElementById('level-filter')?.value || '';
  state.filters.keyword = document.getElementById('keyword-filter')?.value || '';
  loadLogSet();
}

function clearFilters() {
  state.filters = { service: '', level: '', keyword: '' };
  document.getElementById('service-filter').value = '';
  document.getElementById('level-filter').value = '';
  document.getElementById('keyword-filter').value = '';
  loadLogSet();
}

function setupPagination() {
  document.getElementById('prev-page').addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      loadLogSet();
    }
  });

  document.getElementById('next-page').addEventListener('click', () => {
    state.currentPage++;
    loadLogSet();
  });
}

function updatePagination(total, filtered) {
  const pageSize = 50;
  const totalPages = Math.ceil(filtered / pageSize);
  document.getElementById('page-info').textContent = `Page ${state.currentPage} of ${totalPages}`;
  document.getElementById('prev-page').disabled = state.currentPage === 1;
  document.getElementById('next-page').disabled = state.currentPage >= totalPages;
}

async function loadTickets() {
  const params = new URLSearchParams({
    ...(state.ticketFilters.status && { status: state.ticketFilters.status }),
    ...(state.ticketFilters.severity && { severity: state.ticketFilters.severity }),
  });

  try {
    const response = await fetch(`/api/tickets?${params}`);
    const data = await response.json();

    renderTickets(data.tickets);
    if (state.currentView === 'dashboard') {
      updateDashboardStats(data.stats);
    }
  } catch (error) {
    console.error('Error loading tickets:', error);
  }
}

function renderTickets(tickets) {
  const list = document.getElementById('tickets-list');

  if (!tickets || tickets.length === 0) {
    list.innerHTML = '<p class="text-center">No tickets found</p>';
    return;
  }

  list.innerHTML = tickets
    .map(
      (ticket) => `
    <div class="ticket-item" onclick="toggleTicketDetail('${ticket.id}')">
      <div class="ticket-header">
        <div class="ticket-title">${ticket.title}</div>
        <div style="display: flex; gap: 0.5rem;">
          <span class="ticket-badge badge-${ticket.severity}">${ticket.severity}</span>
          <span class="ticket-badge badge-${ticket.status}">${ticket.status}</span>
        </div>
      </div>
      <div class="ticket-meta">${ticket.id} • Created: ${new Date(ticket.createdAt).toLocaleDateString()}</div>
      <div class="ticket-services">
        ${ticket.affectedServices.map((s) => `<span class="service-tag">${s}</span>`).join('')}
      </div>
      <div id="detail-${ticket.id}" style="display: none; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
        <p>${ticket.description}</p>
        ${
          ticket.suggestions.length > 0
            ? `<div style="margin-top: 0.75rem;"><strong>Suggestions:</strong><ul>${ticket.suggestions.map((s) => `<li>${s}</li>`).join('')}</ul></div>`
            : ''
        }
        <div class="ticket-actions" style="margin-top: 1rem;">
          <button class="btn btn-small" onclick="updateTicketStatus('${ticket.id}', 'in-progress')">In Progress</button>
          <button class="btn btn-small" onclick="updateTicketStatus('${ticket.id}', 'closed')">Close</button>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

function toggleTicketDetail(ticketId) {
  const detail = document.getElementById(`detail-${ticketId}`);
  detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
}

async function updateTicketStatus(ticketId, status) {
  try {
    const response = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      loadTickets();
    }
  } catch (error) {
    console.error('Error updating ticket:', error);
  }
}

function showCreateTicketForm() {
  document.getElementById('create-ticket-form').style.display = 'block';
}

async function submitTicket(e) {
  e.preventDefault();

  const ticket = {
    title: document.getElementById('ticket-title').value,
    description: document.getElementById('ticket-description').value,
    severity: document.getElementById('ticket-severity').value,
    affectedServices: document.getElementById('ticket-services').value.split(',').map((s) => s.trim()),
  };

  try {
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    });

    if (response.ok) {
      ticketForm.reset();
      document.getElementById('create-ticket-form').style.display = 'none';
      loadTickets();
    }
  } catch (error) {
    console.error('Error creating ticket:', error);
  }
}

async function runTriage() {
  const logSet = parseInt(document.getElementById('triage-logset').value);
  let provider = localStorage.getItem('ai_provider') || 'gemini';
  let model = localStorage.getItem('ai_model') || 'gemini-2.0-flash';

  // Get API key from sessionStorage, with fallback to other providers
  let apiKey = sessionStorage.getItem(`${provider}_api_key`);

  // If selected provider doesn't have a key, try other providers
  if (!apiKey) {
    const providers = ['gemini', 'claude', 'perplexity'];
    for (const fallbackProvider of providers) {
      const fallbackKey = sessionStorage.getItem(`${fallbackProvider}_api_key`);
      if (fallbackKey) {
        provider = fallbackProvider;
        apiKey = fallbackKey;
        // Update model based on fallback provider
        if (fallbackProvider === 'gemini') {
          model = 'gemini-2.0-flash';
        } else if (fallbackProvider === 'claude') {
          model = 'claude-opus';
        } else if (fallbackProvider === 'perplexity') {
          model = 'sonar';
        }
        showToast(`Using fallback provider: ${provider}`, 'info');
        break;
      }
    }
  }

  if (!apiKey) {
    showToast('No API keys found. Please add at least one API key in settings.', 'error');
    return;
  }

  runTriageBtn.disabled = true;
  runTriageBtn.textContent = '⏳ Running...';
  document.getElementById('status-indicator').textContent = 'Running triage...';
  document.getElementById('status-indicator').className = 'status-indicator status-running';

  try {
    const response = await fetch('/api/triage/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logSetNumber: logSet,
        provider: provider,
        model: model,
        apiKey: apiKey,
      }),
    });

    const data = await response.json();

    const output = document.getElementById('triage-output');
    const result = document.getElementById('triage-result');

    if (data.success) {
      result.textContent = data.result;
      output.style.display = 'block';
      document.getElementById('status-indicator').textContent = `Ready (${data.ticketsCreated} tickets created)`;
      document.getElementById('status-indicator').className = 'status-indicator status-idle';
      loadTickets();
    } else {
      result.textContent = `Error: ${data.error}`;
      output.style.display = 'block';
      document.getElementById('status-indicator').textContent = 'Error';
      document.getElementById('status-indicator').className = 'status-indicator status-error';
    }
  } catch (error) {
    console.error('Error running triage:', error);
    document.getElementById('triage-result').textContent = `Error: ${error.message}`;
    document.getElementById('triage-output').style.display = 'block';
    document.getElementById('status-indicator').textContent = 'Error';
    document.getElementById('status-indicator').className = 'status-indicator status-error';
  } finally {
    runTriageBtn.disabled = false;
    runTriageBtn.textContent = '▶ Run Triage';
  }
}

async function loadDashboard() {
  try {
    const logsResponse = await fetch('/api/logs/1');
    const logsData = await logsResponse.json();

    document.getElementById('total-logs').textContent = logsData.total;

    const ticketsResponse = await fetch('/api/tickets');
    const ticketsData = await ticketsResponse.json();

    updateDashboardStats(ticketsData.stats);
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

function updateDashboardStats(stats) {
  document.getElementById('open-tickets').textContent = stats.open;
  document.getElementById('critical-tickets').textContent = stats.critical;
  document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
}

// Settings Management
function loadSettings() {
  try {
    // Get stored settings from localStorage
    const provider = localStorage.getItem('ai_provider') || 'gemini';
    const model = localStorage.getItem('ai_model') || 'gemini-2.0-flash';

    // Get API keys from sessionStorage
    const geminiKey = sessionStorage.getItem('gemini_api_key') || '';
    const claudeKey = sessionStorage.getItem('claude_api_key') || '';
    const perplexityKey = sessionStorage.getItem('perplexity_api_key') || '';

    // Populate input fields with saved keys
    const geminiInput = document.getElementById('gemini-key');
    const claudeInput = document.getElementById('claude-key');
    const perplexityInput = document.getElementById('perplexity-key');

    if (geminiInput) geminiInput.value = geminiKey;
    if (claudeInput) claudeInput.value = claudeKey;
    if (perplexityInput) perplexityInput.value = perplexityKey;

    // Update provider display
    const providerDisplay = document.getElementById('provider-display');
    if (providerDisplay) {
      providerDisplay.textContent = provider.charAt(0).toUpperCase() + provider.slice(1);
    }

    // Update model display
    const modelDisplay = document.getElementById('model-display');
    if (modelDisplay) {
      modelDisplay.textContent = model;
    }

    // Update form values
    const providerSelect = document.getElementById('ai-provider');
    if (providerSelect) {
      providerSelect.value = provider;
      updateModelOptions();
    }

    const modelSelect = document.getElementById('ai-model');
    if (modelSelect) {
      modelSelect.value = model;
    }

    // Update theme status
    const themeStatus = document.getElementById('theme-status');
    if (themeStatus) {
      themeStatus.textContent = document.documentElement.classList.contains('dark') ? 'Dark' : 'Light';
    }

    // Update provider statuses
    const hasGeminiKey = !!geminiKey;
    const hasClaudeKey = !!claudeKey;
    const hasPerplexityKey = !!perplexityKey;

    updateProviderStatus('gemini', hasGeminiKey, provider === 'gemini');
    updateProviderStatus('claude', hasClaudeKey, provider === 'claude');
    updateProviderStatus('perplexity', hasPerplexityKey, provider === 'perplexity');
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// API Key Management
function toggleKeyVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) {
    console.error(`Input element not found: ${inputId}`);
    return;
  }

  try {
    input.type = input.type === 'password' ? 'text' : 'password';
  } catch (e) {
    console.error(`Error toggling visibility for ${inputId}:`, e);
  }
}

function saveAPIKeys() {
  const geminiKey = document.getElementById('gemini-key')?.value || '';
  const perplexityKey = document.getElementById('perplexity-key')?.value || '';
  const claudeKey = document.getElementById('claude-key')?.value || '';

  // Save all keys that are provided (even if empty, to allow clearing)
  if (geminiKey) {
    sessionStorage.setItem('gemini_api_key', geminiKey);
  }
  if (perplexityKey) {
    sessionStorage.setItem('perplexity_api_key', perplexityKey);
  }
  if (claudeKey) {
    sessionStorage.setItem('claude_api_key', claudeKey);
  }

  // Also save the current provider and model selection
  const provider = document.getElementById('ai-provider')?.value || 'gemini';
  const model = document.getElementById('ai-model')?.value || 'gemini-2.0-flash';
  localStorage.setItem('ai_provider', provider);
  localStorage.setItem('ai_model', model);

  showToast('Settings saved! API keys & provider/model selected', 'success');
  loadSettings();
}

function deleteAPIKey(provider) {
  const inputId = `${provider}-key`;
  const input = document.getElementById(inputId);
  if (input) {
    input.value = '';
  }
  sessionStorage.removeItem(`${provider}_api_key`);
  showToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key deleted`, 'info');
  loadSettings();
}

// Model Selection
const modelOptions = {
  gemini: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Fastest)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Most Capable)' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  claude: [
    { value: 'claude-opus', label: 'Claude Opus (Most Capable)' },
    { value: 'claude-sonnet', label: 'Claude Sonnet (Balanced)' },
    { value: 'claude-haiku', label: 'Claude Haiku (Fastest)' },
  ],
  perplexity: [
    { value: 'sonar', label: 'Sonar (Standard)' },
    { value: 'sonar-pro', label: 'Sonar Pro (Advanced)' },
  ],
};

function updateModelOptions() {
  const provider = document.getElementById('ai-provider')?.value || 'gemini';
  const modelSelect = document.getElementById('ai-model');

  if (!modelSelect) return;

  const options = modelOptions[provider] || modelOptions.gemini;
  modelSelect.innerHTML = options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('');
}

function saveModelSelection() {
  const provider = document.getElementById('ai-provider')?.value || 'gemini';
  const model = document.getElementById('ai-model')?.value || 'gemini-2.0-flash';

  localStorage.setItem('ai_provider', provider);
  localStorage.setItem('ai_model', model);

  showToast(`Switched to ${provider}: ${model}`, 'success');
  loadSettings();
}

function updateProviderStatus(provider, hasKey, isCurrent) {
  const statusElement = document.getElementById(`${provider}-status`);
  const cardElement = document.getElementById(`${provider}-card`);

  if (!statusElement) {
    console.warn(`Status element not found for provider: ${provider}`);
    return;
  }

  if (hasKey) {
    statusElement.textContent = isCurrent ? '✓ Current' : '✓ Available';
    statusElement.className = 'provider-status available';
    if (cardElement) {
      cardElement.style.borderColor = isCurrent ? 'var(--primary)' : 'var(--border)';
      cardElement.style.borderWidth = '2px';
      cardElement.style.opacity = '1';
      if (isCurrent) {
        cardElement.classList.add('current');
      } else {
        cardElement.classList.remove('current');
      }
    }
  } else {
    statusElement.textContent = '✗ No Key';
    statusElement.className = 'provider-status unavailable';
    if (cardElement) {
      cardElement.style.opacity = '0.6';
      cardElement.style.borderColor = 'var(--border)';
    }
  }
}
