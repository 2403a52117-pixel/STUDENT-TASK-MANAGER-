'use strict';

/**
 * StudyFlow Assignments Manager Controller
 */
let tasks = [];
let modalController;

const searchInput = $('#search-input');
const statusFilter = $('#status-filter');
const priorityFilter = $('#priority-filter');
const subjectFilter = $('#subject-filter');
const sortSelect = $('#sort-select');
const taskList = $('#task-list');
const resultsCount = $('#results-count');
const resetFiltersBtn = $('#reset-filters');
const filterSummary = $('#filter-summary');

async function loadAssignments() {
  const messageEl = $('#assignments-message');
  try {
    const data = await api('/api/tasks');
    tasks = data.tasks || [];
    if (messageEl) messageEl.hidden = true;
    updateSubjectFilterOptions();
    applyFiltersAndRender();
  } catch (error) {
    if (messageEl) {
      messageEl.textContent = `${error.message}. Is the server running? Please refresh once connected.`;
      messageEl.hidden = false;
    }
  }
}

function updateSubjectFilterOptions() {
  if (!subjectFilter) return;
  const currentVal = subjectFilter.value;
  const uniqueSubjects = Array.from(new Set(tasks.map(t => t.subject).filter(Boolean))).sort();
  
  subjectFilter.innerHTML = '<option value="All">All Subjects</option>' +
    uniqueSubjects.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('');

  if (uniqueSubjects.includes(currentVal)) {
    subjectFilter.value = currentVal;
  } else {
    subjectFilter.value = 'All';
  }
}

function applyFiltersAndRender() {
  const query = (searchInput?.value || '').trim().toLowerCase();
  const status = statusFilter?.value || 'All';
  const priority = priorityFilter?.value || 'All';
  const subject = subjectFilter?.value || 'All';
  const sortBy = sortSelect?.value || 'due-asc';

  // 1. Filter
  let filtered = tasks.filter(task => {
    const matchesStatus = status === 'All' || task.status === status;
    const matchesPriority = priority === 'All' || task.priority === priority;
    const matchesSubject = subject === 'All' || task.subject === subject;
    const matchesQuery = !query || [task.title, task.subject, task.description].some(val =>
      (val || '').toLowerCase().includes(query)
    );
    return matchesStatus && matchesPriority && matchesSubject && matchesQuery;
  });

  // 2. Sort
  const priorityWeight = { High: 3, Medium: 2, Low: 1 };
  filtered.sort((a, b) => {
    if (sortBy === 'due-asc') {
      return a.due_date.localeCompare(b.due_date);
    } else if (sortBy === 'due-desc') {
      return b.due_date.localeCompare(a.due_date);
    } else if (sortBy === 'priority-desc') {
      const diff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (diff !== 0) return diff;
      return a.due_date.localeCompare(b.due_date);
    } else if (sortBy === 'title-asc') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'created-desc') {
      return (b.id || 0) - (a.id || 0);
    }
    return 0;
  });

  // 3. Update summary badge
  const isFiltered = query || status !== 'All' || priority !== 'All' || subject !== 'All';
  if (resetFiltersBtn) resetFiltersBtn.hidden = !isFiltered;

  if (resultsCount) {
    resultsCount.textContent = `Showing ${filtered.length} of ${tasks.length} assignment${tasks.length === 1 ? '' : 's'}`;
  }

  // 4. Render
  if (!filtered.length) {
    const hasAnyTasks = tasks.length > 0;
    taskList.innerHTML = `
      <div class="empty-state">
        <div class="empty-illustration">${hasAnyTasks ? '⌕' : '✦'}</div>
        <h3>${hasAnyTasks ? 'No matching assignments found' : 'Your assignments list is empty'}</h3>
        <p>${hasAnyTasks ? 'Try adjusting your search terms or clearing the active filters.' : 'Add your first coursework assignment to get started!'}</p>
        <div class="empty-actions">
          ${hasAnyTasks 
            ? '<button class="button button-quiet" id="empty-reset-btn">Reset all filters</button>' 
            : '<button class="button button-primary trigger-add-modal">＋ Add Assignment</button>'
          }
        </div>
      </div>`;
    $('#empty-reset-btn')?.addEventListener('click', resetAllFilters);
    return;
  }

  taskList.innerHTML = filtered.map(task => {
    const due = dueLabel(task);
    const priorityClass = `priority-${task.priority.toLowerCase()}`;
    const isCompleted = task.status === 'Completed';

    return `
      <article class="task-card ${isCompleted ? 'is-completed' : ''}" data-id="${task.id}">
        <input class="task-check" type="checkbox" data-action="toggle" 
          aria-label="Mark ${escapeHTML(task.title)} as ${isCompleted ? 'pending' : 'completed'}" 
          ${isCompleted ? 'checked' : ''}>
        <div class="task-main">
          <div class="task-title-row">
            <h3 class="task-title">${escapeHTML(task.title)}</h3>
            <span class="subject-chip">${escapeHTML(task.subject)}</span>
            <span class="priority ${priorityClass}">● ${escapeHTML(task.priority)}</span>
          </div>
          ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ''}
          <div class="task-meta">
            <span class="due-badge ${due.className}">◷ ${escapeHTML(due.label)}</span>
            <span class="status-indicator">${isCompleted ? '✓ Completed' : '○ Pending'}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="icon-button" data-action="edit" title="Edit assignment" aria-label="Edit ${escapeHTML(task.title)}">✎</button>
          <button class="icon-button delete" data-action="delete" title="Delete assignment" aria-label="Delete ${escapeHTML(task.title)}">⌫</button>
        </div>
      </article>`;
  }).join('');
}

function resetAllFilters() {
  if (searchInput) searchInput.value = '';
  if (statusFilter) statusFilter.value = 'All';
  if (priorityFilter) priorityFilter.value = 'All';
  if (subjectFilter) subjectFilter.value = 'All';
  if (sortSelect) sortSelect.value = 'due-asc';
  applyFiltersAndRender();
}

// Event Listeners for Filtering & Sorting
searchInput?.addEventListener('input', applyFiltersAndRender);
statusFilter?.addEventListener('change', applyFiltersAndRender);
priorityFilter?.addEventListener('change', applyFiltersAndRender);
subjectFilter?.addEventListener('change', applyFiltersAndRender);
sortSelect?.addEventListener('change', applyFiltersAndRender);
resetFiltersBtn?.addEventListener('click', resetAllFilters);

// Task Action Delegation (Edit / Delete)
taskList?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const card = button.closest('[data-id]');
  const id = Number(card?.dataset.id);
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const action = button.dataset.action;
  try {
    if (action === 'edit') {
      modalController.openModal(task);
    } else if (action === 'delete') {
      if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
      await api(`/api/tasks/${id}`, { method: 'DELETE' });
      showToast('Assignment deleted.');
      await loadAssignments();
    }
  } catch (err) {
    showToast(err.message);
  }
});

// Checkbox Status Toggle
taskList?.addEventListener('change', async (event) => {
  const checkbox = event.target.closest('[data-action="toggle"]');
  if (!checkbox) return;
  const card = checkbox.closest('[data-id]');
  const id = Number(card?.dataset.id);
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const nextStatus = checkbox.checked ? 'Completed' : 'Pending';
  checkbox.disabled = true;

  try {
    await api(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus })
    });
    showToast(nextStatus === 'Completed' ? 'Assignment marked complete! 🎉' : 'Assignment moved back to pending.');
    await loadAssignments();
  } catch (err) {
    checkbox.checked = task.status === 'Completed';
    showToast(err.message);
  } finally {
    checkbox.disabled = false;
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  modalController = initTaskModal(loadAssignments);
  loadAssignments();
});
