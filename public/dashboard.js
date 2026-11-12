'use strict';

/**
 * StudyFlow Dashboard Controller
 */
let allTasks = [];
let modalController;

async function loadDashboardData() {
  const messageEl = $('#dashboard-message');
  try {
    const data = await api('/api/tasks');
    allTasks = data.tasks || [];
    if (messageEl) messageEl.hidden = true;
    renderDashboardStats();
    renderUpcomingDeadlines();
    renderSubjectBreakdown();
    renderPriorityOverview();
  } catch (error) {
    if (messageEl) {
      messageEl.textContent = `${error.message}. Is the server running? Please refresh once connected.`;
      messageEl.hidden = false;
    }
  }
}

function renderDashboardStats() {
  const total = allTasks.length;
  const completed = allTasks.filter(t => t.status === 'Completed').length;
  const pending = total - completed;
  const overdue = allTasks.filter(t => t.status === 'Pending' && dateDifference(t.due_date) < 0).length;
  const dueSoon = allTasks.filter(t => t.status === 'Pending' && dateDifference(t.due_date) >= 0 && dateDifference(t.due_date) <= 7).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  $('#total-count').textContent = total;
  $('#pending-count').textContent = pending;
  $('#completed-count').textContent = completed;
  $('#due-count').textContent = dueSoon;
  if ($('#overdue-count')) $('#overdue-count').textContent = overdue;

  const overdueCard = $('#overdue-card');
  if (overdueCard) {
    if (overdue > 0) {
      overdueCard.classList.add('has-overdue');
    } else {
      overdueCard.classList.remove('has-overdue');
    }
  }

  // Progress Panel
  $('#progress-percent').textContent = `${percent}%`;
  $('#progress-fill').style.width = `${percent}%`;

  let caption = 'Get started by creating your first assignment!';
  if (total > 0) {
    if (percent === 100) {
      caption = '🎉 Outstanding! You have completed all assignments!';
    } else if (overdue > 0) {
      caption = `You have ${overdue} overdue assignment${overdue === 1 ? '' : 's'} that need attention.`;
    } else if (dueSoon > 0) {
      caption = `${completed} of ${total} finished · ${dueSoon} due in the next 7 days.`;
    } else {
      caption = `${completed} of ${total} finished. Keep up the consistent pace!`;
    }
  }
  $('#progress-caption').textContent = caption;
}

function renderUpcomingDeadlines() {
  const container = $('#upcoming-list');
  if (!container) return;

  const pendingTasks = allTasks
    .filter(t => t.status === 'Pending')
    .sort((a, b) => {
      // Sort by due date ascending
      return a.due_date.localeCompare(b.due_date);
    });

  if (pendingTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state mini">
        <div class="empty-illustration">✓</div>
        <h3>No Pending Deadlines</h3>
        <p>${allTasks.length > 0 ? 'All your assignments are completed! Great job.' : 'Add your first task to see upcoming deadlines here.'}</p>
        <button class="button button-primary button-sm trigger-add-modal">＋ Add Assignment</button>
      </div>`;
    return;
  }

  // Take top 5 urgent
  const topTasks = pendingTasks.slice(0, 5);

  container.innerHTML = topTasks.map(task => {
    const due = dueLabel(task);
    const priorityClass = `priority-${task.priority.toLowerCase()}`;
    return `
      <div class="upcoming-item ${due.isOverdue ? 'is-overdue-item' : ''}" data-id="${task.id}">
        <input type="checkbox" class="task-check" data-action="quick-complete" title="Mark as completed">
        <div class="upcoming-body">
          <div class="upcoming-header">
            <span class="subject-chip">${escapeHTML(task.subject)}</span>
            <span class="priority ${priorityClass}">● ${escapeHTML(task.priority)}</span>
            <span class="due-badge ${due.className}">${escapeHTML(due.badgeText)}</span>
          </div>
          <h4 class="upcoming-title">${escapeHTML(task.title)}</h4>
        </div>
        <a href="/assignments.html" class="icon-button" title="View in assignments">➔</a>
      </div>`;
  }).join('');
}

function renderSubjectBreakdown() {
  const container = $('#subject-breakdown-list');
  if (!container) return;

  if (allTasks.length === 0) {
    container.innerHTML = `<p class="quiet-hint">No subject data available yet.</p>`;
    return;
  }

  // Group by subject
  const subjectsMap = {};
  allTasks.forEach(t => {
    const s = t.subject || 'General';
    if (!subjectsMap[s]) subjectsMap[s] = { total: 0, completed: 0, pending: 0 };
    subjectsMap[s].total++;
    if (t.status === 'Completed') subjectsMap[s].completed++;
    else subjectsMap[s].pending++;
  });

  const subjectNames = Object.keys(subjectsMap).sort((a, b) => subjectsMap[b].total - subjectsMap[a].total);

  container.innerHTML = subjectNames.map(subj => {
    const data = subjectsMap[subj];
    const pct = Math.round((data.completed / data.total) * 100);
    return `
      <div class="subject-row">
        <div class="subject-row-header">
          <span class="subject-name">${escapeHTML(subj)}</span>
          <span class="subject-counts">${data.completed}/${data.total} done (${data.pending} pending)</span>
        </div>
        <div class="mini-progress-track">
          <div class="mini-progress-fill" style="width: ${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

function renderPriorityOverview() {
  const container = $('#priority-overview');
  if (!container) return;

  const pending = allTasks.filter(t => t.status === 'Pending');
  const high = pending.filter(t => t.priority === 'High').length;
  const medium = pending.filter(t => t.priority === 'Medium').length;
  const low = pending.filter(t => t.priority === 'Low').length;

  $('#high-priority-count').textContent = high;
  $('#medium-priority-count').textContent = medium;
  $('#low-priority-count').textContent = low;
}

// Quick completion listener on upcoming deadlines
document.addEventListener('change', async (event) => {
  const checkbox = event.target.closest('[data-action="quick-complete"]');
  if (!checkbox) return;
  const item = checkbox.closest('[data-id]');
  const id = Number(item?.dataset.id);
  if (!id) return;

  checkbox.disabled = true;
  try {
    await api(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Completed' })
    });
    showToast('Assignment completed! Nice job.');
    await loadDashboardData();
  } catch (err) {
    checkbox.checked = false;
    showToast(err.message);
  } finally {
    checkbox.disabled = false;
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  modalController = initTaskModal(loadDashboardData);
  loadDashboardData();
});
