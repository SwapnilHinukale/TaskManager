import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['Todo', 'In Progress', 'Done'];

export default function TaskFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'Todo',
    dueDate: '',
    assigneeId: '',
  });
  const [assigneeDisplay, setAssigneeDisplay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // User search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef(null);
  const searchRef = useRef(null);

  // Permission flags for edit
  const [permissions, setPermissions] = useState({
    canEditTitle: true,
    canEditDescription: true,
    canEditDueDate: true,
    canEditStatus: true,
    canEditAssignee: true,
  });

  // Load task for edit
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await api.get(`/tasks/${id}`);
        const task = res.data.task;

        const isCreator = task.creator?._id === user?._id || task.creator === user?._id;
        const isAssignee = task.assignee && (task.assignee?._id === user?._id || task.assignee === user?._id);
        const isPersonal = !task.assignee;
        const isAssigned = !!task.assignee;

        setPermissions({
          canEditTitle: isCreator,
          canEditDescription: isCreator,
          canEditDueDate: isCreator,
          canEditStatus: isAssignee || (isCreator && isPersonal),
          canEditAssignee: isCreator,
        });

        setForm({
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'Todo',
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          assigneeId: task.assignee?._id || task.assignee || '',
        });

        if (task.assignee && task.assignee.name) {
          setAssigneeDisplay(task.assignee);
          setSearchQuery(task.assignee.name);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load task');
      } finally {
        setFetching(false);
      }
    })();
  }, [id, isEdit, user]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  // User search with debounce
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    setShowDropdown(true);

    if (!q.trim() || q.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      if (!q.trim()) {
        setForm(p => ({ ...p, assigneeId: '' }));
        setAssigneeDisplay(null);
      }
      return;
    }

    clearTimeout(searchTimeout.current);
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
        setSearchResults(res.data.users);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const selectAssignee = (u) => {
    setForm(p => ({ ...p, assigneeId: u._id }));
    setAssigneeDisplay(u);
    setSearchQuery(u.name);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const clearAssignee = () => {
    setForm(p => ({ ...p, assigneeId: '' }));
    setAssigneeDisplay(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim()) return setError('Title is required');
    setLoading(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        dueDate: form.dueDate || null,
        assigneeId: form.assigneeId || null,
      };

      if (isEdit) {
        await api.put(`/tasks/${id}`, payload);
        setSuccess('Task updated successfully!');
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        await api.post('/tasks', payload);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (fetching) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="spinner" style={{ width: 36, height: 36 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main style={{ maxWidth: 620, margin: '0 auto', padding: '32px 24px' }} className="page-enter">
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dashboard
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text)' }}>{isEdit ? 'Edit Task' : 'New Task'}</span>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h1 style={{ fontSize: '1.4rem', marginBottom: 6, letterSpacing: '-0.02em' }}>
            {isEdit ? 'Edit Task' : 'Create Task'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 28 }}>
            {isEdit ? 'Update the task details below.' : 'Fill in the details to create a new task.'}
          </p>

          {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}
          {success && (
            <div style={{
              background: 'var(--done-bg)',
              border: '1px solid rgba(78,203,141,0.3)',
              color: 'var(--done)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              marginBottom: 20,
            }}>{success}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Title */}
            <div className="form-group">
              <label className="form-label">
                Title <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                className={`form-input ${!permissions.canEditTitle ? 'readonly' : ''}`}
                type="text"
                name="title"
                placeholder="Enter task title"
                value={form.title}
                onChange={handleChange}
                required
                disabled={!permissions.canEditTitle}
                style={!permissions.canEditTitle ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              />
              {!permissions.canEditTitle && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Only the task creator can modify this field.
                </span>
              )}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                name="description"
                placeholder="Describe the task (optional)"
                value={form.description}
                onChange={handleChange}
                rows={4}
                disabled={!permissions.canEditDescription}
                style={!permissions.canEditDescription ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              />
            </div>

            {/* Status + Due Date row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  disabled={!permissions.canEditStatus}
                  style={!permissions.canEditStatus ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
                {!permissions.canEditStatus && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Only the assignee can update status.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  className="form-input"
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  disabled={!permissions.canEditDueDate}
                  style={!permissions.canEditDueDate ? { opacity: 0.6, cursor: 'not-allowed' } : {
                    colorScheme: 'dark',
                  }}
                />
              </div>
            </div>

            {/* Assignee search */}
            {permissions.canEditAssignee && (
              <div className="form-group" ref={searchRef} style={{ position: 'relative' }}>
                <label className="form-label">Assign To (Optional)</label>

                {assigneeDisplay ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                  }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#fff',
                      flexShrink: 0,
                    }}>
                      {assigneeDisplay.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{assigneeDisplay.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{assigneeDisplay.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={clearAssignee}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                      title="Remove assignee"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                      autoComplete="off"
                    />

                    {showDropdown && (searchResults.length > 0 || searching) && (
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        zIndex: 50,
                        boxShadow: 'var(--shadow)',
                        overflow: 'hidden',
                      }}>
                        {searching ? (
                          <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div className="spinner" style={{ width: 14, height: 14 }} />
                            Searching...
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                            No users found
                          </div>
                        ) : (
                          searchResults.map(u => (
                            <button
                              key={u._id}
                              type="button"
                              onClick={() => selectAssignee(u)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                width: '100%',
                                padding: '10px 14px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background 0.1s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                              <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: 'var(--accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: '#fff',
                                flexShrink: 0,
                              }}>
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text)' }}>{u.name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}

                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Leave empty to create a personal task. Assignees can only update the task status.
                </span>
              </div>
            )}

            {/* Role-based info banner for assignees */}
            {isEdit && !permissions.canEditTitle && (
              <div style={{
                background: 'rgba(108,99,255,0.08)',
                border: '1px solid rgba(108,99,255,0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                fontSize: '0.85rem',
                color: 'var(--accent-light)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>You are the assignee of this task. You can only update the <strong>status</strong>.</span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <Link to="/dashboard">
                <button type="button" className="btn btn-secondary">Cancel</button>
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ minWidth: 100, justifyContent: 'center' }}
              >
                {loading ? <div className="spinner" /> : isEdit ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
