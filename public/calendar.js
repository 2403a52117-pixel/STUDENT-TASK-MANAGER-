'use strict';

/**
 * StudyFlow Calendar & Deadlines Timeline Controller
 */
let allTasks = [];
let modalController;

async function loadTimeline() {
  const messageEl = $('#timeline-message');
  try {
    const data = await api('/api/tasks');
    allTasks = data.tasks || [];
    if (messageEl) messageEl.hidden = true;
    renderTimelineSections();
  } catch (error) {
    if (messageEl) {
      messageEl.textContent = `${error.message}. Is the server running? Please refresh once connected.`;
      messageEl.hidden = false;
    }
  }
}

function renderTimelineSections() {
  const overdueTasks = [];
  const todayTomorrowTasks = [];
  const thisWeekTasks = [];
  const laterTasks = [];
  const completedTasks = [];

  allTasks.forEach(task => {
    if (task.status === 'Completed') {
      completedTasks.push(task);
      return;
    }
    const diff = dateDifference(task.due_date);
    if (diff < 0) {
      overdueTasks.push(task);
    } else if (diff === 0 || diff === 1) {
      todayTomorrowTasks.push(task);
    } else if (diff <= 7) {
      thisWeekTasks.push(task);
    } else {
      laterTasks.push(task);
    }
  });

  // Sort groups by due date
  const sortByDate = (a, b) => a.due_date.localeCompare(b.due_date);
  overdueTasks.sort(sortByDate);
  todayTomorrowTasks.sort(sortByDate);
  thisWeekTasks.sort(sortByDate);
  laterTasks.sort(sortByDate);
  completedTasks.sort((a, b) => b.due_date.localeCompare(a.due_date));

  // Render cards
  renderGroup('timeline-overdue', overdueTasks, 'overdue-count-badge', 'No overdue assignments! Excellent discipline.');
  renderGroup('timeline-today', todayTomorrowTasks, 'today-count-badge', 'No assignments due today or tomorrow.');
  renderGroup('timeline-week', thisWeekTasks, 'week-count-badge', 'No assignments due this coming week.');
  renderGroup('timeline-later', laterTasks, 'later-count-badge', 'No future assignments scheduled.');
  renderGroup('timeline-completed', completedTasks, 'completed-count-badge', 'No completed assignments yet.');
}

function renderGroup(containerId, list, badgeId, emptyMsg) {
  const container = $(`#${containerId}`);
  const badge = $(`#${badgeId}`);
  if (badge) badge.textContent = list.length;
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<div class="timeline-empty"><p>${emptyMsg}</p></div>`;
    return;
  }

  container.innerHTML = list.map(task => {
    const due = dueLabel(task);
    const priorityClass = `priority-${task.priority.toLowerCase()}`;
    const isCompleted = task.status === 'Completed';

    return `
      <div class="timeline-item ${isCompleted ? 'is-completed' : ''}" data-id="${task.id}">
        <input type="checkbox" class="task-check" data-action="toggle" ${isCompleted ? 'checked' : ''} title="Toggle status">
        <div class="timeline-body">
          <div class="timeline-header">
            <span class="subject-chip">${escapeHTML(task.subject)}</span>
            <span class="priority ${priorityClass}">● ${escapeHTML(task.priority)}</span>
            <span class="due-badge ${due.className}">${escapeHTML(due.badgeText)}</span>
          </div>
          <h4 class="timeline-title">${escapeHTML(task.title)}</h4>
          ${task.description ? `<p class="timeline-desc">${escapeHTML(task.description)}</p>` : ''}
        </div>
        <div class="timeline-actions">
          <button class="icon-button" data-action="edit" title="Edit assignment">✎</button>
          <button class="icon-button delete" data-action="delete" title="Delete assignment">⌫</button>
        </div>
      </div>`;
  }).join('');
}

// Global action delegation
document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const item = button.closest('[data-id]');
  const id = Number(item?.dataset.id);
  const task = allTasks.find(t => t.id === id);
  if (!task) return;

  const action = button.dataset.action;
  try {
    if (action === 'edit') {
      modalController.openModal(task);
    } else if (action === 'delete') {
      if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
      await api(`/api/tasks/${id}`, { method: 'DELETE' });
      showToast('Assignment deleted.');
      await loadTimeline();
    }
  } catch (err) {
    showToast(err.message);
  }
});

document.addEventListener('change', async (event) => {
  const checkbox = event.target.closest('[data-action="toggle"]');
  if (!checkbox) return;
  const item = checkbox.closest('[data-id]');
  const id = Number(item?.dataset.id);
  const task = allTasks.find(t => t.id === id);
  if (!task) return;

  const nextStatus = checkbox.checked ? 'Completed' : 'Pending';
  checkbox.disabled = true;

  try {
    await api(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus })
    });
    showToast(nextStatus === 'Completed' ? 'Assignment completed!' : 'Assignment moved to pending.');
    await loadTimeline();
  } catch (err) {
    checkbox.checked = task.status === 'Completed';
    showToast(err.message);
  } finally {
    checkbox.disabled = false;
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  modalController = initTaskModal(loadTimeline);
  loadTimeline();
});
