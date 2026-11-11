'use strict';

const $ = (selector) => document.querySelector(selector);
const taskList = $('#task-list');
const modal = $('#modal-backdrop');
const form = $('#task-form');
const message = $('#message');
const toast = $('#toast');
let tasks = [];
let toastTimer;

const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const prettyDate = (dateString) => new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
  return data;
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}
function showMessage(text) {
  message.textContent = text;
  message.hidden = !text;
}
function dateDifference(dateString) {
  const target = new Date(`${dateString}T00:00:00`);
  const today = new Date(`${todayISO()}T00:00:00`);
  return Math.round((target - today) / 86400000);
}
function dueLabel(task) {
  if (task.status === 'Completed') return { label: `Due ${prettyDate(task.due_date)}`, className: '' };
  const difference = dateDifference(task.due_date);
  if (difference < 0) return { label: `Overdue · ${Math.abs(difference)} day${Math.abs(difference) === 1 ? '' : 's'}`, className: 'due-overdue' };
  if (difference === 0) return { label: 'Due today', className: 'due-soon' };
  if (difference === 1) return { label: 'Due tomorrow', className: 'due-soon' };
  return { label: `Due ${prettyDate(task.due_date)}`, className: difference <= 7 ? 'due-soon' : '' };
}

function renderStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.status === 'Completed').length;
  const pending = total - completed;
  const dueSoon = tasks.filter(task => task.status === 'Pending' && dateDifference(task.due_date) >= 0 && dateDifference(task.due_date) <= 7).length;
  const percentage = total ? Math.round(completed / total * 100) : 0;
  $('#total-count').textContent = total;
  $('#pending-count').textContent = pending;
  $('#completed-count').textContent = completed;
  $('#due-count').textContent = dueSoon;
  $('#progress-percent').textContent = `${percentage}%`;
  $('#progress-fill').style.width = `${percentage}%`;
  $('#progress-caption').textContent = total ? `${completed} of ${total} assignment${total === 1 ? '' : 's'} completed. ${percentage === 100 ? 'You have finished everything — amazing work!' : 'Keep going, you are making progress.'}` : 'Complete your first assignment to get started.';
}

function renderTasks() {
  const query = $('#search-input').value.trim().toLocaleLowerCase();
  const status = $('#status-filter').value;
  const filtered = tasks.filter(task => {
    const matchesStatus = status === 'All' || task.status === status;
    const matchesQuery = !query || [task.title, task.subject, task.description].some(value => value.toLocaleLowerCase().includes(query));
    return matchesStatus && matchesQuery;
  });
  $('#results-count').textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;

  if (!filtered.length) {
    const hasTasks = tasks.length > 0;
    taskList.innerHTML = `<div class="empty-state"><div class="empty-illustration">${hasTasks ? '⌕' : '✦'}</div><h3>${hasTasks ? 'No matching assignments' : 'Your list is a blank canvas'}</h3><p>${hasTasks ? 'Try another search term or change the status filter.' : 'Add your first assignment and make a plan for success.'}</p>${hasTasks ? '' : '<button class="button button-primary" id="empty-add">＋ Add your first assignment</button>'}</div>`;
    $('#empty-add')?.addEventListener('click', () => openModal());
    return;
  }

  taskList.innerHTML = filtered.map(task => {
    const due = dueLabel(task);
    const priorityClass = `priority-${task.priority.toLowerCase()}`;
    return `<article class="task-card ${task.status === 'Completed' ? 'is-completed' : ''}" data-id="${task.id}">
      <input class="task-check" type="checkbox" data-action="toggle" aria-label="Mark ${escapeHTML(task.title)} as ${task.status === 'Completed' ? 'pending' : 'completed'}" ${task.status === 'Completed' ? 'checked' : ''}>
      <div class="task-main"><div class="task-title-row"><h3 class="task-title">${escapeHTML(task.title)}</h3><span class="subject-chip">${escapeHTML(task.subject)}</span></div>
      ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ''}
      <div class="task-meta"><span class="${due.className}">◷ ${escapeHTML(due.label)}</span><span class="priority ${priorityClass}">● ${escapeHTML(task.priority)} priority</span><span>${task.status === 'Completed' ? '✓ Completed' : '○ Pending'}</span></div></div>
      <div class="task-actions"><button class="icon-button" data-action="edit" aria-label="Edit ${escapeHTML(task.title)}" title="Edit">✎</button><button class="icon-button delete" data-action="delete" aria-label="Delete ${escapeHTML(task.title)}" title="Delete">⌫</button></div>
    </article>`;
  }).join('');
}

async function loadTasks() {
  try {
    const data = await api('/api/tasks');
    tasks = data.tasks;
    showMessage('');
    renderStats();
    renderTasks();
  } catch (error) {
    showMessage(`${error.message} Check that the backend server is running, then refresh this page.`);
  }
}

function openModal(task = null) {
  form.reset();
  $('#task-id').value = task ? task.id : '';
  $('#modal-title').textContent = task ? 'Edit assignment' : 'Add an assignment';
  $('#modal-kicker').textContent = task ? 'UPDATE YOUR PLAN' : 'STAY ON TRACK';
  $('#save-button').textContent = task ? 'Save changes' : 'Save assignment';
  $('#title-input').value = task?.title || '';
  $('#subject-input').value = task?.subject || '';
  $('#due-input').value = task?.due_date || todayISO();
  $('#priority-input').value = task?.priority || 'Medium';
  $('#description-input').value = task?.description || '';
  $('#form-error').hidden = true;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('#title-input').focus(), 30);
}
function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
}

$('#open-add').addEventListener('click', () => openModal());
$('#close-modal').addEventListener('click', closeModal);
$('#cancel-modal').addEventListener('click', closeModal);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
$('#search-input').addEventListener('input', renderTasks);
$('#status-filter').addEventListener('change', renderTasks);

taskList.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const card = button.closest('[data-id]');
  const id = Number(card?.dataset.id);
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  const action = button.dataset.action;
  try {
    if (action === 'edit') openModal(task);
    if (action === 'delete') {
      if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
      await api(`/api/tasks/${id}`, { method: 'DELETE' });
      showToast('Assignment deleted.');
      await loadTasks();
    }
  } catch (error) { showToast(error.message); }
});

taskList.addEventListener('change', async event => {
  const checkbox = event.target.closest('[data-action="toggle"]');
  if (!checkbox) return;
  const card = checkbox.closest('[data-id]');
  const id = Number(card?.dataset.id);
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  const nextStatus = checkbox.checked ? 'Completed' : 'Pending';
  checkbox.disabled = true;
  try {
    await api(`/api/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
    showToast(nextStatus === 'Completed' ? 'Assignment completed — nice work!' : 'Assignment moved back to pending.');
    await loadTasks();
  } catch (error) {
    checkbox.checked = task.status === 'Completed';
    showToast(error.message);
  } finally { checkbox.disabled = false; }
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const id = $('#task-id').value;
  const payload = {
    title: $('#title-input').value.trim(),
    subject: $('#subject-input').value.trim(),
    due_date: $('#due-input').value,
    priority: $('#priority-input').value,
    description: $('#description-input').value.trim()
  };
  if (!payload.title || !payload.subject || !payload.due_date) {
    $('#form-error').textContent = 'Please fill in the title, subject, and due date.';
    $('#form-error').hidden = false;
    return;
  }
  const saveButton = $('#save-button');
  saveButton.disabled = true;
  saveButton.textContent = 'Saving...';
  try {
    await api(id ? `/api/tasks/${id}` : '/api/tasks', { method: id ? 'PUT' : 'POST', body: JSON.stringify(id ? { ...payload, status: tasks.find(task => task.id === Number(id))?.status || 'Pending' } : payload) });
    closeModal();
    showToast(id ? 'Assignment updated.' : 'Assignment added successfully.');
    await loadTasks();
  } catch (error) {
    $('#form-error').textContent = error.message;
    $('#form-error').hidden = false;
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = id ? 'Save changes' : 'Save assignment';
  }
});

const today = new Date();
$('#today-label').textContent = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
loadTasks();
