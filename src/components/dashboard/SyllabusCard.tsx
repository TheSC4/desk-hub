import { useState } from 'react';
import { db, type Subject, type Topic } from '../../db';
import { useLiveQuery } from '../../hooks/useLiveQuery';

export default function SyllabusCard() {
  const subjects = useLiveQuery(
    () => db.subjects.orderBy('order').toArray(),
    [],
    [] as Subject[]
  );

  const topics = useLiveQuery(
    () => db.topics.orderBy('order').toArray(),
    [],
    [] as Topic[]
  );

  const [expandedSubjectId, setExpandedSubjectId] = useState<number | null>(null);
  const [editingSubject, setEditingSubject] = useState<{ id?: number; name: string } | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [editingTopic, setEditingTopic] = useState<{ id: number; name: string } | null>(null);

  // Stats calculation
  const totalTopics = topics.length;
  const completedTopics = topics.filter((t) => t.completed).length;
  const overallPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const toggleTopic = async (topic: Topic) => {
    if (!topic.id) return;
    await db.topics.update(topic.id, { completed: !topic.completed });
  };

  const addSubject = async () => {
    const name = prompt('Enter new subject name:');
    if (!name?.trim()) return;
    await db.subjects.add({
      name: name.trim(),
      order: subjects.length,
    });
  };

  const deleteSubject = async (e: React.MouseEvent, subjectId: number) => {
    e.stopPropagation();
    if (!confirm('Delete this subject and all its topics?')) return;
    await db.transaction('rw', db.subjects, db.topics, async () => {
      await db.topics.where('subjectId').equals(subjectId).delete();
      await db.subjects.delete(subjectId);
    });
    if (expandedSubjectId === subjectId) {
      setExpandedSubjectId(null);
    }
  };

  const handleAddTopic = async (subjectId: number) => {
    if (!newTopicName.trim()) return;
    const subjectTopics = topics.filter((t) => t.subjectId === subjectId);
    await db.topics.add({
      subjectId,
      name: newTopicName.trim(),
      completed: false,
      order: subjectTopics.length,
    });
    setNewTopicName('');
  };

  const handleDeleteTopic = async (topicId: number) => {
    await db.topics.delete(topicId);
  };

  const handleUpdateSubjectName = async () => {
    if (!editingSubject?.id || !editingSubject.name.trim()) return;
    await db.subjects.update(editingSubject.id, { name: editingSubject.name.trim() });
    setEditingSubject(null);
  };

  const handleUpdateTopicName = async () => {
    if (!editingTopic?.id || !editingTopic.name.trim()) return;
    await db.topics.update(editingTopic.id, { name: editingTopic.name.trim() });
    setEditingTopic(null);
  };

  return (
    <div className="card flex flex-col h-full overflow-hidden">
      {/* Header with overall progress ring */}
      <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface-light stroke-current"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-accent stroke-current transition-all duration-500"
                strokeDasharray={`${overallPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-text tabular-nums">
              {overallPercent}%
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-text text-base">Syllabus Progress</h2>
            <p className="text-xs text-text-muted">
              {completedTopics} of {totalTopics} topics completed
            </p>
          </div>
        </div>

        <button
          onClick={addSubject}
          className="btn-ghost !min-h-[36px] !px-3 text-xs gap-1"
          title="Add subject"
        >
          <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Subject
        </button>
      </div>

      {/* Subjects list */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 mt-3 scrollbar-thin">
        {subjects.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">No subjects yet.</p>
        ) : (
          subjects.map((sub) => {
            const subTopics = topics.filter((t) => t.subjectId === sub.id);
            const subTotal = subTopics.length;
            const subDone = subTopics.filter((t) => t.completed).length;
            const subPct = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0;
            const isExpanded = expandedSubjectId === sub.id;

            return (
              <div
                key={sub.id}
                className="rounded-xl border border-border/60 bg-surface-light/40 overflow-hidden transition-colors"
              >
                {/* Subject header bar */}
                <div
                  onClick={() => setExpandedSubjectId(isExpanded ? null : (sub.id ?? null))}
                  className="px-3.5 py-2.5 flex flex-col gap-1.5 cursor-pointer hover:bg-surface-light/80 select-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <svg
                        className={`w-4 h-4 text-text-muted transition-transform duration-200 shrink-0 ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>

                      {editingSubject && editingSubject.id === sub.id ? (
                        <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingSubject.name}
                            onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                            className="input !py-1 !px-2 !min-h-[32px] text-xs flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateSubjectName();
                              if (e.key === 'Escape') setEditingSubject(null);
                            }}
                          />
                          <button
                            onClick={handleUpdateSubjectName}
                            className="text-xs text-accent font-medium px-2 py-1"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-text truncate">{sub.name}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-text-muted tabular-nums">
                        {subDone}/{subTotal} ({subPct}%)
                      </span>

                      {/* Edit subject title */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSubject({ id: sub.id, name: sub.name });
                        }}
                        className="p-1 text-text-muted hover:text-text rounded"
                        title="Rename subject"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      {/* Delete subject */}
                      <button
                        onClick={(e) => sub.id && deleteSubject(e, sub.id)}
                        className="p-1 text-text-muted hover:text-danger rounded"
                        title="Delete subject"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Subject progress bar */}
                  <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-accent h-full rounded-full transition-all duration-300"
                      style={{ width: `${subPct}%` }}
                    />
                  </div>
                </div>

                {/* Collapsible Topics Checklist */}
                {isExpanded && (
                  <div className="px-4 py-2 border-t border-border/40 bg-surface/50 space-y-2">
                    {subTopics.length === 0 ? (
                      <p className="text-xs text-text-muted py-1">No topics yet.</p>
                    ) : (
                      subTopics.map((topic) => (
                        <div key={topic.id} className="flex items-center justify-between group py-1">
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={topic.completed}
                              onChange={() => toggleTopic(topic)}
                              className="w-4 h-4 rounded border-border accent-accent bg-surface-light cursor-pointer"
                            />
                            {editingTopic && editingTopic.id === topic.id ? (
                              <input
                                type="text"
                                value={editingTopic.name}
                                onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                                onBlur={handleUpdateTopicName}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateTopicName();
                                  if (e.key === 'Escape') setEditingTopic(null);
                                }}
                                className="input !py-0.5 !px-1.5 !min-h-[26px] text-xs flex-1"
                                autoFocus
                              />
                            ) : (
                              <span
                                className={`text-xs select-none truncate ${
                                  topic.completed ? 'line-through text-text-muted' : 'text-text'
                                }`}
                              >
                                {topic.name}
                              </span>
                            )}
                          </label>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => topic.id && setEditingTopic({ id: topic.id, name: topic.name })}
                              className="p-1 text-text-muted hover:text-text"
                              title="Rename topic"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => topic.id && handleDeleteTopic(topic.id)}
                              className="p-1 text-text-muted hover:text-danger"
                              title="Delete topic"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Add topic inline input */}
                    <div className="flex items-center gap-2 pt-1.5 border-t border-border/30">
                      <input
                        type="text"
                        placeholder="Add topic..."
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && sub.id) handleAddTopic(sub.id);
                        }}
                        className="input !py-1 !px-2.5 !min-h-[32px] text-xs flex-1"
                      />
                      <button
                        onClick={() => sub.id && handleAddTopic(sub.id)}
                        disabled={!newTopicName.trim()}
                        className="btn-primary !min-h-[32px] !py-1 !px-3 text-xs disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
