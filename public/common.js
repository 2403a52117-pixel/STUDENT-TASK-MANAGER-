'use strict';

/**
 * Shared utility functions across all pages of StudyFlow
 */
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const prettyDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? dateString
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const escapeHTML = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'The request could not be completed.');
  }
  return data;
}

let toastTimer;
function showToast(text) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function dateDifference(dateString) {
  const target = new Date(`${dateString}T00:00:00`);
  const today = new Date(`${todayISO()}T00:00:00`);
  return Math.round((target - today) / 86400000);
}

function dueLabel(task) {
  if (task.status === 'Completed') {
    return {
      label: `Completed · Due was ${prettyDate(task.due_date)}`,
      badgeText: 'Completed',
      className: 'due-completed',
      isOverdue: false
    };
  }
  const diff = dateDifference(task.due_date);
  if (diff < 0) {
    const days = Math.abs(diff);
    return {
      label: `Overdue by ${days} day${days === 1 ? '' : 's'} (${prettyDate(task.due_date)})`,
      badgeText: `Overdue ${days}d`,
      className: 'due-overdue',
      isOverdue: true
    };
  }
  if (diff === 0) {
    return {
      label: 'Due today',
      badgeText: 'Due today',
      className: 'due-soon due-today',
      isOverdue: false
    };
  }
  if (diff === 1) {
    return {
      label: 'Due tomorrow',
      badgeText: 'Due tomorrow',
      className: 'due-soon',
      isOverdue: false
    };
  }
  if (diff <= 7) {
    return {
      label: `Due in ${diff} days (${prettyDate(task.due_date)})`,
      badgeText: `In ${diff} days`,
      className: 'due-soon',
      isOverdue: false
    };
  }
  return {
    label: `Due ${prettyDate(task.due_date)}`,
    badgeText: prettyDate(task.due_date),
    className: '',
    isOverdue: false
  };
}

/**
 * Common Task Modal initialization
 */
function initTaskModal(onSuccessCallback) {
  const modal = $('#modal-backdrop');
  const form = $('#task-form');
  if (!modal || !form) return { openModal: () => {}, closeModal: () => {} };

  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  };

  const openModal = (task = null) => {
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
    
    const errorEl = $('#form-error');
    if (errorEl) errorEl.hidden = true;

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#title-input')?.focus(), 40);
  };

  $('#close-modal')?.addEventListener('click', closeModal);
  $('#cancel-modal')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });

  // Open Add modal triggers
  $$('.trigger-add-modal').forEach((btn) => {
    btn.addEventListener('click', () => openModal());
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = $('#task-id').value;
    const payload = {
      title: $('#title-input').value.trim(),
      subject: $('#subject-input').value.trim(),
      due_date: $('#due-input').value,
      priority: $('#priority-input').value,
      description: $('#description-input').value.trim()
    };

    const errorEl = $('#form-error');
    if (!payload.title || !payload.subject || !payload.due_date) {
      if (errorEl) {
        errorEl.textContent = 'Please fill in the title, subject, and due date.';
        errorEl.hidden = false;
      }
      return;
    }

    const saveButton = $('#save-button');
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    try {
      if (id) {
        await api(`/api/tasks/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Assignment updated successfully.');
      } else {
        await api('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Assignment created successfully.');
      }
      closeModal();
      if (typeof onSuccessCallback === 'function') {
        await onSuccessCallback();
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      }
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = id ? 'Save changes' : 'Save assignment';
    }
  });

  return { openModal, closeModal };
}

// Set today label if present on page
const todayLabel = $('#today-label');
if (todayLabel) {
  const now = new Date();
  todayLabel.textContent = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).toUpperCase();
}
