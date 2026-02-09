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
  setupPagination();
});

function switchView(view) {
  state.currentView = view;
  document.getElementById(`${state.currentView}-view`).classList.remove('active');
  document.getElementById(`${view}-view`).classList.add('active');

  navLinks.forEach((link) => link.classList.remove('active'));
  document.querySelector(`[data-view="${view}"]`).classList.add('active');

  document.getElementById('page-title').textContent =
    view.charAt(0).toUpperCase() + view.slice(1);

  if (view === 'logs') {
    loadLogSet();
  } else if (view === 'tickets') {
    loadTickets();
  } else if (view === 'dashboard') {
    loadDashboard();
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

  runTriageBtn.disabled = true;
  runTriageBtn.textContent = '⏳ Running...';
  document.getElementById('status-indicator').textContent = 'Running triage...';
  document.getElementById('status-indicator').className = 'status-indicator status-running';

  try {
    const response = await fetch('/api/triage/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logSetNumber: logSet }),
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
    }
  } catch (error) {
    console.error('Error running triage:', error);
    document.getElementById('triage-result').textContent = `Error: ${error.message}`;
    document.getElementById('triage-output').style.display = 'block';
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
