const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET /api/tasks — get all tasks visible to the user
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, type } = req.query;

    // A user can see tasks they created OR are assigned to
    let filter = {
      $or: [{ creator: userId }, { assignee: userId }],
    };

    if (status) filter.status = status;

    if (type === 'personal') {
      filter = { creator: userId, assignee: null };
    } else if (type === 'assigned_by_me') {
      filter = { creator: userId, assignee: { $ne: null } };
    } else if (type === 'assigned_to_me') {
      filter = { assignee: userId };
    }

    const tasks = await Task.find(filter)
      .populate('creator', 'name email')
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/:id — get a single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('assignee', 'name email');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const userId = req.user._id.toString();
    const isCreator = task.creator._id.toString() === userId;
    const isAssignee = task.assignee && task.assignee._id.toString() === userId;

    if (!isCreator && !isAssignee) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks — create a task
router.post('/', async (req, res) => {
  try {
    const { title, description, status, dueDate, assigneeId } = req.body;

    if (!title) return res.status(400).json({ message: 'Title is required' });

    let assignee = null;
    if (assigneeId) {
      const assigneeUser = await User.findById(assigneeId);
      if (!assigneeUser) {
        return res.status(404).json({ message: 'Assignee not found' });
      }
      if (assigneeId === req.user._id.toString()) {
        return res
          .status(400)
          .json({ message: 'Cannot assign task to yourself' });
      }
      assignee = assigneeId;
    }

    const task = await Task.create({
      title,
      description: description || '',
      status: status || 'Todo',
      dueDate: dueDate || null,
      creator: req.user._id,
      assignee,
    });

    const populated = await task.populate([
      { path: 'creator', select: 'name email' },
      { path: 'assignee', select: 'name email' },
    ]);

    res.status(201).json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tasks/:id — update a task with role-based permissions
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const userId = req.user._id.toString();
    const isCreator = task.creator.toString() === userId;
    const isAssignee = task.assignee && task.assignee.toString() === userId;

    if (!isCreator && !isAssignee) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, status, dueDate, assigneeId } = req.body;

    if (isCreator && !isAssignee) {
      // Creator of assigned task: can edit title, description, dueDate, assignee
      // but CANNOT change status
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (dueDate !== undefined) task.dueDate = dueDate || null;

      if (assigneeId !== undefined) {
        if (assigneeId === null || assigneeId === '') {
          task.assignee = null;
        } else {
          const assigneeUser = await User.findById(assigneeId);
          if (!assigneeUser)
            return res.status(404).json({ message: 'Assignee not found' });
          task.assignee = assigneeId;
        }
      }

      // Creator cannot change status of assigned tasks
      if (status !== undefined && task.assignee) {
        return res.status(403).json({
          message: 'Assigner cannot update status of assigned tasks',
        });
      }
      // For personal tasks, creator can change status
      if (status !== undefined && !task.assignee) {
        task.status = status;
      }
    } else if (isAssignee && !isCreator) {
      // Assignee: can ONLY update status
      if (status !== undefined) {
        task.status = status;
      }
      // Reject any other field updates
      const forbidden = ['title', 'description', 'dueDate', 'assigneeId'];
      const attempted = forbidden.filter(
        (f) => req.body[f] !== undefined
      );
      if (attempted.length > 0) {
        return res.status(403).json({
          message: `Assignee cannot modify: ${attempted.join(', ')}`,
        });
      }
    } else if (isCreator && isAssignee) {
      // Edge case: creator assigned to themselves (prevented on create, but handle gracefully)
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
    }

    await task.save();

    const populated = await Task.findById(task._id).populate([
      { path: 'creator', select: 'name email' },
      { path: 'assignee', select: 'name email' },
    ]);

    res.json({ task: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id — only creator can delete
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.creator.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Only the creator can delete this task' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
