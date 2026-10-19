import { useState, useEffect } from 'react';
import { db, type DailyTarget } from '../../db';
import { useLiveQuery } from '../../hooks/useLiveQuery';

export default function TargetsCard() {
  const todayStr = new Date().toISOString().split('T')[0];

  const targets = useLiveQuery(
    () => db.dailyTargets.where('date').equals(todayStr).sortBy('order'),
    [todayStr],
    [] as DailyTarget[]
  );

  const [newTaskText, setNewTaskText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  // Daily reset check: cleanup old dates if necessary or just query today's
  useEffect(() => {
    // If first time today and no tasks exist, seed default template targets
    const initToday = async () => {
      const count = await db.dailyTargets.where('date').equals(todayStr).count();
      if (count === 0) {
        await db.dailyTargets.bulkAdd([
          { text: 'Complete 2 Pomodoro focus sessions', completed: false, date: todayStr, order: 0 },
          { text: 'Review due flashcards in Revise', completed: false, date: todayStr, order: 1 },
          { text: 'Practice 5 GATE CSE previous year questions', completed: false, date: todayStr, order: 2 },
        ]);
      }
    };
    initToday();
  }, [todayStr]);

  const toggleTask = async (task: DailyTarget) => {
    if (!task.id) return;
    await db.dailyTargets.update(task.id, { completed: !task.completed });
  };

  const handleAddTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskText.trim()) return;
    await db.dailyTargets.add({
      text: newTaskText.trim(),
      completed: false,
      date: todayStr,
      order: targets.length,
    });
    setNewTaskText('');
  };

  const handleDeleteTask = async (id: number) => {
    await db.dailyTargets.delete(id);
  };

  const handleSaveEdit = async () => {
    if (editingId && editingText.trim()) {
      await db.dailyTargets.update(editingId, { text: editingText.trim() });
    }
    setEditingId(null);
  };

  const completedCount = targets.filter((t) => t.completed).length;

  return (
    <div className="card flex flex-col h-full overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
        <div>
          <h2 className="font-semibold text-text text-base">Today's Targets</h2>
          <p className="text-xs text-text-muted">
            {completedCount} of {targets.length} completed
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-surface-light text-accent border border-border">
          {todayStr}
        </span>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 mt-3 scrollbar-thin">
        {targets.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">No targets set for today.</p>
        ) : (
          targets.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                task.completed
                  ? 'bg-surface-light/30 border-border/40 opacity-75'
                  : 'bg-surface-light/70 border-border hover:border-accent/40'
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task)}
                  className="w-5 h-5 rounded border-border accent-accent cursor-pointer shrink-0"
                />
                {editingId === task.id ? (
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="input !py-1 !px-2 !min-h-[32px] text-xs flex-1"
                    autoFocus
                  />
                ) : (
                  <span
                    className={`text-sm truncate select-none ${
                      task.completed ? 'line-through text-text-muted' : 'text-text font-medium'
                    }`}
                  >
                    {task.text}
                  </span>
                )}
              </label>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => {
                    if (task.id) {
                      setEditingId(task.id);
                      setEditingText(task.text);
                    }
                  }}
                  className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface"
                  title="Edit target"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => task.id && handleDeleteTask(task.id)}
                  className="p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-surface"
                  title="Delete target"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Target Input */}
      <form onSubmit={handleAddTask} className="flex items-center gap-2 pt-3 border-t border-border mt-2 shrink-0">
        <input
          type="text"
          placeholder="Add a target (e.g. Solve 10 OS questions)..."
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          className="input !min-h-[40px] text-xs flex-1"
        />
        <button
          type="submit"
          disabled={!newTaskText.trim()}
          className="btn-primary !min-h-[40px] !px-4 text-xs font-semibold disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
