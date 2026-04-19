import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import api from '../utils/api';

const FILTERS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'personal', label: 'Personal' },
  { key: 'assigned_by_me', label: 'Assigned by Me' },
  { key: 'assigned_to_me', label: 'Assigned to Me' },
];

const STATUS_FILTERS = ['All', 'Todo', 'In Progress', 'Done'];

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'All') params.set('status', statusFilter);
      const res = await api.get(`/tasks?${params}`);
      setTasks(res.data.tasks);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleUpdate = (updated) => {
    setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
  };

  const handleDelete = (id) => {
    setTasks(prev => prev.filter(t => t._id !== id));
  };

  // Stats
  const total = tasks.length;
  const todoCount = tasks.filter(t => t.status === 'Todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const doneCount = tasks.filter(t => t.status === 'Done').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }} className="page-enter">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.03em', marginBottom: 4 }}>Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Track and manage all your tasks in one place
            </p>
          </div>
          <Link to="/tasks/new">
            <button className="btn btn-primary">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              New Task
            </button>
          </Link>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 28,
        }}>
          {[
            { label: 'Total', value: total, color: 'var(--text)', bg: 'var(--surface)' },
            { label: 'Todo', value: todoCount, color: 'var(--todo)', bg: 'var(--todo-bg)' },
            { label: 'In Progress', value: inProgressCount, color: 'var(--inprogress)', bg: 'var(--inprogress-bg)' },
            { label: 'Done', value: doneCount, color: 'var(--done)', bg: 'var(--done-bg)' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                {stat.label}
              </span>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: stat.color }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: '0.83rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: '1px solid',
                transition: 'all 0.15s',
                borderColor: typeFilter === f.key ? 'var(--accent)' : 'var(--border)',
                background: typeFilter === f.key ? 'var(--accent-glow)' : 'transparent',
                color: typeFilter === f.key ? 'var(--accent-light)' : 'var(--text-muted)',
              }}
            >
              {f.label}
            </button>
          ))}

          <div style={{ marginLeft: 'auto' }}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-input"
              style={{ padding: '6px 12px', fontSize: '0.83rem', width: 'auto' }}
            >
              {STATUS_FILTERS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Task list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : error ? (
          <div className="error-msg">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect x="8" y="12" width="40" height="36" rx="4" stroke="var(--text-muted)" strokeWidth="2"/>
              <path d="M18 22h20M18 30h14M18 38h8" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>No tasks found</p>
            <p>
              {typeFilter !== 'all' ? 'No tasks match the current filter.' : 'Create your first task to get started.'}
            </p>
            <Link to="/tasks/new">
              <button className="btn btn-primary" style={{ marginTop: 8 }}>Create Task</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tasks.map(task => (
              <TaskCard key={task._id} task={task} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
