import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const STATUS_OPTIONS = ['Todo', 'In Progress', 'Done'];

export default function TaskCard({ task, onUpdate, onDelete }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isCreator = task.creator?._id === user?._id || task.creator === user?._id;
  const isAssignee = task.assignee && (task.assignee?._id === user?._id || task.assignee === user?._id);
  const isPersonal = !task.assignee;
  const isAssigned = !!task.assignee;

  // Assignee can only change status; Creator cannot change status of assigned tasks
  const canChangeStatus = isAssignee || (isCreator && isPersonal);
  const canEdit = isCreator;
  const canDelete = isCreator;

  const handleStatusChange = async (newStatus) => {
    if (!canChangeStatus) return;
    setUpdating(true);
    try {
      const res = await api.put(`/tasks/${task._id}`, { status: newStatus });
      onUpdate(res.data.task);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${task._id}`);
      onDelete(task._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
      setDeleting(false);
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
  const statusColor = { 'Todo': 'var(--todo)', 'In Progress': 'var(--inprogress)', 'Done': 'var(--done)' }[task.status] || 'var(--text-muted)';
  const statusBg = { 'Todo': 'var(--todo-bg)', 'In Progress': 'var(--inprogress-bg)', 'Done': 'var(--done-bg)' }[task.status] || 'transparent';

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'border-color 0.2s, box-shadow 0.2s',
      position: 'relative',
      overflow: 'hidden',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-hover)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: statusColor, borderRadius: '3px 0 0 3px',
        transition: 'background 0.2s',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: '0.98rem',
            fontWeight: 600,
            fontFamily: 'Syne, sans-serif',
            color: task.status === 'Done' ? 'var(--text-muted)' : 'var(--text)',
            textDecoration: task.status === 'Done' ? 'line-through' : 'none',
            wordBreak: 'break-word',
          }}>
            {task.title}
          </h3>
          {task.description && (
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginTop: 4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {task.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {canEdit && (
            <button
              onClick={() => navigate(`/tasks/${task._id}/edit`)}
              className="btn btn-ghost"
              style={{ padding: '6px 8px' }}
              title="Edit task"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9.5 2L12 4.5 4.5 12H2v-2.5L9.5 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="btn btn-ghost"
              style={{ padding: '6px 8px', color: deleting ? 'var(--danger)' : undefined }}
              title="Delete task"
              disabled={deleting}
            >
              {deleting ? <div className="spinner" style={{ width: 14, height: 14 }} /> : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 3.5h10M5 3.5V2.5h4v1M5.5 6v4M8.5 6v4M3 3.5l.8 8h6.4l.8-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Status selector */}
        {canChangeStatus ? (
          <select
            value={task.status}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={updating}
            style={{
              background: statusBg,
              color: statusColor,
              border: `1px solid ${statusColor}40`,
              borderRadius: 999,
              padding: '2px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '0.03em',
            }}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s} style={{ background: 'var(--surface2)', color: 'var(--text)' }}>{s}</option>
            ))}
          </select>
        ) : (
          <span className={`status-badge ${task.status.replace(' ', '-')}`}>
            {task.status}
          </span>
        )}

        {/* Due date */}
        {task.dueDate && (
          <span style={{
            fontSize: '0.78rem',
            color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <rect x="1" y="1.5" width="9" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M3.5 1v1M7.5 1v1M1 4h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {isOverdue && 'Overdue · '}
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}

        {/* Task type label */}
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.73rem',
          color: 'var(--text-dim)',
          background: 'var(--surface2)',
          padding: '2px 8px',
          borderRadius: 999,
          border: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {isPersonal ? 'Personal' : isCreator ? 'Assigned by you' : `From ${task.creator?.name || 'Unknown'}`}
        </span>
      </div>

      {/* Assignee row */}
      {isAssigned && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          background: 'var(--surface2)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem',
        }}>
          <div style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            {(task.assignee?.name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Assigned to </span>
            <span style={{ fontWeight: 500 }}>{task.assignee?.name}</span>
            <span style={{ color: 'var(--text-dim)' }}> · {task.assignee?.email}</span>
          </div>
          {isAssignee && (
            <span style={{
              marginLeft: 'auto',
              fontSize: '0.73rem',
              color: 'var(--accent-light)',
              fontWeight: 500,
            }}>You</span>
          )}
        </div>
      )}
    </div>
  );
}
