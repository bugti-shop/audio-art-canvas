/**
 * useTodayActions — All action handlers for the Today page.
 * Extracted from Today.tsx to reduce file size.
 */
import { useCallback, useRef } from 'react';
import { TodoItem, Folder, Priority, Note, TaskSection } from '@/types/note';
import { useTranslation } from 'react-i18next';
import { recordCompletion, TASK_STREAK_KEY } from '@/utils/streakStorage';
import { createNextRecurringTask } from '@/utils/recurringTasks';
import { playCompletionSound } from '@/utils/taskSounds';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { toast } from 'sonner';
import { DuplicateOption } from '@/components/DuplicateOptionsSheet';
import { SelectAction } from '@/components/SelectActionsSheet';
import { DropResult } from '@hello-pangea/dnd';
import { useSubscription, FREE_LIMITS } from '@/contexts/SubscriptionContext';
import { updateSectionOrder } from '@/utils/taskOrderStorage';

interface UseTodayActionsProps {
  items: TodoItem[];
  setItems: React.Dispatch<React.SetStateAction<TodoItem[]>>;
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  sections: TaskSection[];
  setSections: React.Dispatch<React.SetStateAction<TaskSection[]>>;
  selectedFolderId: string | null;
  setSelectedFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  inputSectionId: string | null;
  setInputSectionId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedTaskIds: Set<string>;
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setIsSelectionMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsInputOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingSection: React.Dispatch<React.SetStateAction<TaskSection | null>>;
  setIsSectionEditOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMoveToFolderOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPrioritySheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsBulkDateSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsBulkReminderSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsBulkRepeatSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsBulkSectionMoveOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsBulkStatusOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSelectActionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCollapsedViewSections: React.Dispatch<React.SetStateAction<Set<string>>>;
  deleteConfirmItem: TodoItem | null;
  setDeleteConfirmItem: React.Dispatch<React.SetStateAction<TodoItem | null>>;
  defaultSectionId?: string;
  taskAddPosition: 'top' | 'bottom';
  uncompletedItems: TodoItem[];
  requireFeature: (feature: string) => boolean;
  isPro: boolean;
  tasksSettings: { confirmBeforeDelete: boolean; swipeToComplete: boolean };
  setOrderVersion: React.Dispatch<React.SetStateAction<number>>;
}

export const useTodayActions = (props: UseTodayActionsProps) => {
  const { t } = useTranslation();
  const {
    items, setItems, folders, setFolders, sections, setSections,
    selectedFolderId, setSelectedFolderId, inputSectionId, setInputSectionId,
    selectedTaskIds, setSelectedTaskIds, setIsSelectionMode, setIsInputOpen,
    setEditingSection, setIsSectionEditOpen, setIsMoveToFolderOpen,
    setIsPrioritySheetOpen, setIsBulkDateSheetOpen, setIsBulkReminderSheetOpen,
    setIsBulkRepeatSheetOpen, setIsBulkSectionMoveOpen, setIsBulkStatusOpen,
    setIsSelectActionsOpen, setCollapsedViewSections,
    deleteConfirmItem, setDeleteConfirmItem,
    defaultSectionId, taskAddPosition, uncompletedItems,
    requireFeature, isPro, tasksSettings, setOrderVersion,
  } = props;

  // ── Folder Actions ──
  const handleCreateFolder = useCallback((name: string, color: string) => {
    if (!isPro && folders.length >= FREE_LIMITS.maxTaskFolders) {
      requireFeature('extra_folders');
      return;
    }
    const newFolder: Folder = { id: Date.now().toString(), name, color, isDefault: false, createdAt: new Date() };
    setFolders(prev => [...prev, newFolder]);
  }, [folders.length, isPro, requireFeature, setFolders]);

  const handleEditFolder = useCallback((folderId: string, name: string, color: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name, color } : f));
  }, [setFolders]);

  const handleDeleteFolder = useCallback((folderId: string) => {
    setItems(prev => prev.map(item => item.folderId === folderId ? { ...item, folderId: undefined } : item));
    setFolders(prev => prev.filter(f => f.id !== folderId));
    if (selectedFolderId === folderId) setSelectedFolderId(null);
  }, [selectedFolderId, setItems, setFolders, setSelectedFolderId]);

  const handleReorderFolders = useCallback((reorderedFolders: Folder[]) => {
    setFolders(reorderedFolders);
    toast.success(t('todayPage.foldersReordered'));
  }, [setFolders, t]);

  const handleToggleFolderFavorite = useCallback((folderId: string) => {
    setFolders(prev => {
      const folder = prev.find(f => f.id === folderId);
      toast.success(folder?.isFavorite ? t('todayPage.removedFromFavorites') : t('todayPage.addedToFavorites'), { icon: '⭐' });
      return prev.map(f => f.id === folderId ? { ...f, isFavorite: !f.isFavorite } : f);
    });
  }, [setFolders, t]);

  // ── Section Actions ──
  const handleAddSection = useCallback((position: 'above' | 'below', referenceId?: string) => {
    if (!isPro && sections.length >= 1) {
      requireFeature('extra_sections');
      return;
    }
    const maxOrder = Math.max(...sections.map(s => s.order), 0);
    let newOrder = maxOrder + 1;
    if (referenceId) {
      const refSection = sections.find(s => s.id === referenceId);
      if (refSection) {
        newOrder = position === 'above' ? refSection.order - 0.5 : refSection.order + 0.5;
      }
    }
    const newSection: TaskSection = {
      id: Date.now().toString(), name: t('todayPage.newSection'), color: '#3b82f6', isCollapsed: false, order: newOrder,
    };
    const updatedSections = [...sections, newSection].sort((a, b) => a.order - b.order).map((s, idx) => ({ ...s, order: idx }));
    setSections(updatedSections);
    setEditingSection(newSection);
    setIsSectionEditOpen(true);
    toast.success(t('todayPage.sectionAdded'));
  }, [sections, isPro, requireFeature, setSections, setEditingSection, setIsSectionEditOpen, t]);

  const handleEditSection = useCallback((section: TaskSection) => {
    setEditingSection(section);
    setIsSectionEditOpen(true);
  }, [setEditingSection, setIsSectionEditOpen]);

  const handleSaveSection = useCallback((updatedSection: TaskSection) => {
    setSections(prev => prev.map(s => s.id === updatedSection.id ? updatedSection : s));
  }, [setSections]);

  const handleDeleteSection = useCallback((sectionId: string) => {
    if (sections.length <= 1) {
      toast.error(t('todayPage.cannotDeleteLastSection'));
      return;
    }
    const remainingSections = sections.filter(s => s.id !== sectionId);
    const firstSection = remainingSections.sort((a, b) => a.order - b.order)[0];
    setItems(prev => prev.map(item => item.sectionId === sectionId ? { ...item, sectionId: firstSection.id } : item));
    setSections(remainingSections);
    toast.success(t('todayPage.sectionDeleted'));
  }, [sections, setItems, setSections, t]);

  const handleDuplicateSection = useCallback((sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    const maxOrder = Math.max(...sections.map(s => s.order), 0);
    const newSection: TaskSection = { ...section, id: Date.now().toString(), name: `${section.name} (Copy)`, order: maxOrder + 1 };
    const sectionTasks = items.filter(i => i.sectionId === sectionId && !i.completed);
    const duplicatedTasks = sectionTasks.map((task, idx) => ({ ...task, id: `${Date.now()}-${idx}`, sectionId: newSection.id }));
    setSections(prev => [...prev, newSection]);
    setItems(prev => [...duplicatedTasks, ...prev]);
    toast.success(t('todayPage.sectionDuplicated'));
  }, [sections, items, setSections, setItems, t]);

  const handleMoveSection = useCallback((sectionId: string, targetIndex: number) => {
    const sortedSections = [...sections].sort((a, b) => a.order - b.order);
    const currentIndex = sortedSections.findIndex(s => s.id === sectionId);
    if (currentIndex === targetIndex) return;
    const [movedSection] = sortedSections.splice(currentIndex, 1);
    sortedSections.splice(targetIndex, 0, movedSection);
    setSections(sortedSections.map((s, idx) => ({ ...s, order: idx })));
    toast.success(t('todayPage.sectionMoved'));
  }, [sections, setSections, t]);

  const handleToggleSectionCollapse = useCallback((sectionId: string) => {
    const flatSectionId = `flat-${sectionId}`;
    setCollapsedViewSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(flatSectionId)) newSet.delete(flatSectionId);
      else newSet.add(flatSectionId);
      return newSet;
    });
  }, [setCollapsedViewSections]);

  const handleAddTaskToSection = useCallback(async (sectionId: string) => {
    try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
    setInputSectionId(sectionId);
    setIsInputOpen(true);
  }, [setInputSectionId, setIsInputOpen]);

  const handleSectionDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    if (sourceIndex === destIndex) return;
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
    const sortedSects = [...sections].sort((a, b) => a.order - b.order);
    const [removed] = sortedSects.splice(sourceIndex, 1);
    sortedSects.splice(destIndex, 0, removed);
    setSections(sortedSects.map((s, idx) => ({ ...s, order: idx })));
  }, [sections, setSections]);

  // ── Task CRUD ──
  const handleAddTask = useCallback(async (task: Omit<TodoItem, 'id' | 'completed'>) => {
    const now = new Date();
    const newItem: TodoItem = {
      id: Date.now().toString(), completed: false, ...task,
      sectionId: task.sectionId || inputSectionId || defaultSectionId || sections[0]?.id,
      dueDate: task.dueDate || new Date(),
      createdAt: now, modifiedAt: now,
      status: task.status || 'not_started',
      reminderTime: (task.dueDate && !task.reminderTime) ? task.dueDate : task.reminderTime,
    };
    if (taskAddPosition === 'bottom') setItems(prev => [...prev, newItem]);
    else setItems(prev => [newItem, ...prev]);
    setInputSectionId(null);
    if (newItem.reminderTime) {
      import('@/utils/reminderScheduler').then(({ scheduleTaskReminder }) => {
        scheduleTaskReminder(newItem.id, newItem.text, new Date(newItem.reminderTime!)).catch(console.warn);
      });
    }
  }, [inputSectionId, defaultSectionId, sections, taskAddPosition, setItems, setInputSectionId]);

  const handleBatchAddTasks = useCallback(async (taskTexts: string[], sectionId?: string, folderId?: string, priority?: Priority, dueDate?: Date) => {
    const now = new Date();
    const newItems: TodoItem[] = taskTexts.map((text, idx) => ({
      id: `${Date.now()}-${idx}`, text, completed: false,
      folderId: folderId || selectedFolderId || undefined,
      sectionId: sectionId || inputSectionId || sections[0]?.id,
      priority, dueDate: dueDate || new Date(), createdAt: now, modifiedAt: now,
    }));
    setItems(prev => [...newItems, ...prev]);
    toast.success(t('todayPage.addedTasks', { count: newItems.length }));
    setInputSectionId(null);
  }, [selectedFolderId, inputSectionId, sections, setItems, setInputSectionId, t]);

  const updateItem = useCallback(async (itemId: string, updates: Partial<TodoItem>) => {
    const now = new Date();
    const updatesWithTimestamp: Partial<TodoItem> = { ...updates, modifiedAt: now };

    // Get the current item from items
    let currentItem: TodoItem | undefined;
    setItems(prev => {
      currentItem = prev.find(i => i.id === itemId);
      return prev; // Don't modify yet
    });

    if (updates.completed === true && currentItem && !currentItem.completed) {
      updatesWithTimestamp.completedAt = now;
      playCompletionSound();
      import('@/utils/reminderScheduler').then(({ cancelTaskReminder }) => {
        cancelTaskReminder(itemId).catch(console.warn);
      });
      try {
        const streakResult = await recordCompletion(TASK_STREAK_KEY);
        if (streakResult.newMilestone) {
          toast.success(t('todayPage.streakMilestone', { days: streakResult.newMilestone }));
          window.dispatchEvent(new CustomEvent('streakMilestone', { detail: { milestone: streakResult.newMilestone } }));
        }
        if (streakResult.earnedFreeze) {
          toast.success(t('todayPage.earnedStreakFreeze'), { description: t('todayPage.earnedStreakFreezeDesc') });
        }
        if (streakResult.streakIncremented) {
          window.dispatchEvent(new CustomEvent('streakChallengeShow', { detail: { currentStreak: streakResult.data.currentStreak } }));
        }
        window.dispatchEvent(new CustomEvent('streakUpdated'));
      } catch (e) { console.warn('Failed to record streak:', e); }
    }
    if (updates.completed === false && currentItem?.completed) {
      updatesWithTimestamp.completedAt = undefined;
    }

    // Handle recurring tasks
    if (currentItem && updates.completed === true && !currentItem.completed) {
      if (currentItem.repeatType && currentItem.repeatType !== 'none') {
        const nextTask = createNextRecurringTask(currentItem);
        if (nextTask) {
          const nextTaskWithTimestamps = { ...nextTask, createdAt: now, modifiedAt: now };
          setItems(prev => [nextTaskWithTimestamps, ...prev.map(i => i.id === itemId ? { ...i, ...updatesWithTimestamp } : i)]);
          toast.success(t('todayPage.recurringTaskCompleted'), { icon: '🔄' });
          return;
        }
      }
    }

    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updatesWithTimestamp } : i));

    if (updates.completed === true && currentItem && !currentItem.completed) {
      toast.success(t('todayPage.taskCompleted'), {
        action: {
          label: t('todayPage.undo'),
          onClick: () => {
            setItems(prev => prev.map(i => i.id === itemId ? { ...i, completed: false, completedAt: undefined, modifiedAt: new Date() } : i));
            toast.success(t('todayPage.taskRestored'));
          }
        },
        duration: 5000,
      });
    }
  }, [setItems, t]);

  const deleteItem = useCallback(async (itemId: string, _showUndo: boolean = false, skipConfirm: boolean = false) => {
    let deletedItem: TodoItem | undefined;
    setItems(prev => {
      deletedItem = prev.find(item => item.id === itemId);
      return prev;
    });
    if (!deletedItem) return;
    
    if (tasksSettings.confirmBeforeDelete && !skipConfirm) {
      setDeleteConfirmItem(deletedItem);
      return;
    }
    
    try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
    const itemToRestore = deletedItem;
    setItems(prev => prev.filter(item => item.id !== itemId));
    toast.success(t('todayPage.taskDeleted'), {
      action: { label: t('todayPage.undo'), onClick: () => { setItems(prev => [itemToRestore!, ...prev]); toast.success(t('todayPage.taskRestored')); } },
      duration: 5000,
    });
  }, [tasksSettings.confirmBeforeDelete, setItems, setDeleteConfirmItem, t]);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmItem) return;
    try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
    const deletedItem = deleteConfirmItem;
    setItems(prev => prev.filter(item => item.id !== deletedItem.id));
    setDeleteConfirmItem(null);
    toast.success(t('todayPage.taskDeleted'), {
      action: { label: t('todayPage.undo'), onClick: () => { setItems(prev => [deletedItem, ...prev]); toast.success(t('todayPage.taskRestored')); } },
      duration: 5000,
    });
  }, [deleteConfirmItem, setItems, setDeleteConfirmItem, t]);

  const duplicateTask = useCallback(async (task: TodoItem) => {
    try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
    const duplicatedTask: TodoItem = { ...task, id: Date.now().toString(), completed: false, text: `${task.text} (Copy)` };
    setItems(prev => [duplicatedTask, ...prev]);
  }, [setItems]);

  // ── Selection / Bulk ──
  const handleSelectTask = useCallback((taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) newSet.delete(taskId);
      else newSet.add(taskId);
      return newSet;
    });
  }, [setSelectedTaskIds]);

  const handleDuplicate = useCallback((option: DuplicateOption) => {
    const filteredItems = selectedFolderId ? items.filter(i => i.folderId === selectedFolderId) : items;
    let toDuplicate: TodoItem[] = option === 'uncompleted' ? filteredItems.filter(i => !i.completed) : filteredItems;
    const duplicated = toDuplicate.map((item, idx) => ({
      ...item, id: `${Date.now()}-${idx}`, completed: option === 'all-reset' ? false : item.completed, text: `${item.text} (Copy)`
    }));
    setItems(prev => [...duplicated, ...prev]);
    toast.success(t('todayPage.duplicatedTasks', { count: duplicated.length }));
  }, [items, selectedFolderId, setItems, t]);

  const convertToNotes = useCallback(async (tasksToConvert: TodoItem[]) => {
    const { loadNotesFromDB, saveNotesToDB } = await import('@/utils/noteStorage');
    const existingNotes = await loadNotesFromDB();
    const newNotes: Note[] = tasksToConvert.map((task, idx) => ({
      id: `${Date.now()}-${idx}`, type: 'regular' as const, title: task.text,
      content: task.description || '', voiceRecordings: [],
      images: task.imageUrl ? [task.imageUrl] : [],
      syncVersion: 1, syncStatus: 'pending' as const, isDirty: true,
      createdAt: new Date(), updatedAt: new Date(),
    }));
    await saveNotesToDB([...newNotes, ...existingNotes]);
    setItems(prev => prev.filter(i => !tasksToConvert.some(tc => tc.id === i.id)));
    setSelectedTaskIds(new Set());
    setIsSelectionMode(false);
    toast.success(t('todayPage.convertedToNotes', { count: tasksToConvert.length }));
  }, [setItems, setSelectedTaskIds, setIsSelectionMode, t]);

  const handleConvertSingleTask = useCallback((task: TodoItem) => {
    convertToNotes([task]);
  }, [convertToNotes]);

  const handleSelectAction = useCallback((action: SelectAction) => {
    const selectedItems = items.filter(i => selectedTaskIds.has(i.id));
    switch (action) {
      case 'selectAll':
        setSelectedTaskIds(new Set(uncompletedItems.map(i => i.id)));
        toast.success(t('todayPage.selectedTasks', { count: uncompletedItems.length }));
        return;
      case 'move': setIsMoveToFolderOpen(true); break;
      case 'delete':
        setItems(prev => prev.filter(i => !selectedTaskIds.has(i.id)));
        setSelectedTaskIds(new Set()); setIsSelectionMode(false);
        toast.success(t('todayPage.deletedTasks', { count: selectedItems.length }));
        break;
      case 'complete':
        playCompletionSound();
        setItems(prev => prev.map(i => selectedTaskIds.has(i.id) ? { ...i, completed: true } : i));
        setSelectedTaskIds(new Set()); setIsSelectionMode(false);
        toast.success(t('todayPage.completedTasks', { count: selectedItems.length }));
        break;
      case 'pin':
        if (!requireFeature('pin_feature')) return;
        setItems(prev => prev.map(i => selectedTaskIds.has(i.id) ? { ...i, isPinned: !i.isPinned } : i));
        toast.success(t('todayPage.pinnedTasks', { count: selectedItems.length }));
        setSelectedTaskIds(new Set()); setIsSelectionMode(false);
        break;
      case 'priority': setIsPrioritySheetOpen(true); break;
      case 'duplicate':
        const duplicated = selectedItems.map((item, idx) => ({ ...item, id: `${Date.now()}-${idx}`, completed: false, text: `${item.text} (Copy)` }));
        setItems(prev => [...duplicated, ...prev]);
        setSelectedTaskIds(new Set()); setIsSelectionMode(false);
        toast.success(t('todayPage.duplicatedTasks', { count: selectedItems.length }));
        break;
      case 'convert': convertToNotes(selectedItems); break;
      case 'setDueDate': setIsBulkDateSheetOpen(true); break;
      case 'setReminder': setIsBulkReminderSheetOpen(true); break;
      case 'setRepeat': setIsBulkRepeatSheetOpen(true); break;
      case 'moveToSection': setIsBulkSectionMoveOpen(true); break;
      case 'setStatus':
        if (!requireFeature('task_status')) return;
        setIsBulkStatusOpen(true); break;
    }
    setIsSelectActionsOpen(false);
  }, [items, selectedTaskIds, uncompletedItems, requireFeature, setItems, setSelectedTaskIds, setIsSelectionMode, setIsMoveToFolderOpen, setIsPrioritySheetOpen, setIsBulkDateSheetOpen, setIsBulkReminderSheetOpen, setIsBulkRepeatSheetOpen, setIsBulkSectionMoveOpen, setIsBulkStatusOpen, setIsSelectActionsOpen, convertToNotes, t]);

  const handleMoveToFolder = useCallback((folderId: string | null) => {
    setItems(prev => prev.map(i => selectedTaskIds.has(i.id) ? { ...i, folderId: folderId || undefined } : i));
    setSelectedTaskIds(new Set()); setIsSelectionMode(false);
    toast.success(t('todayPage.movedTasks', { count: selectedTaskIds.size }));
  }, [selectedTaskIds, setItems, setSelectedTaskIds, setIsSelectionMode, t]);

  const handleSetPriority = useCallback((priority: Priority) => {
    setItems(prev => prev.map(i => selectedTaskIds.has(i.id) ? { ...i, priority } : i));
    setSelectedTaskIds(new Set()); setIsSelectionMode(false);
    toast.success(t('todayPage.updatedPriority', { count: selectedTaskIds.size }));
  }, [selectedTaskIds, setItems, setSelectedTaskIds, setIsSelectionMode, t]);

  const handleMoveTaskToFolder = useCallback((taskId: string, folderId: string | null) => {
    setItems(prev => prev.map(i => i.id === taskId ? { ...i, folderId: folderId || undefined } : i));
    toast.success(t('todayPage.taskMoved'));
  }, [setItems, t]);

  // ── Subtask handlers ──
  const handleUnifiedReorder = useCallback((updatedItems: TodoItem[]) => {
    setItems(prev => {
      const completedItems = prev.filter(item => item.completed);
      return [...updatedItems, ...completedItems];
    });
  }, [setItems]);

  const handleSectionReorder = useCallback((updatedSections: TaskSection[]) => {
    setSections(updatedSections);
  }, [setSections]);

  const handleUpdateSubtaskFromSheet = useCallback((parentId: string, subtaskId: string, updates: Partial<TodoItem>) => {
    const now = new Date();
    const updatesWithTimestamp: Partial<TodoItem> = { ...updates, modifiedAt: now };
    if (updates.completed === true) updatesWithTimestamp.completedAt = now;
    if (updates.completed === false) updatesWithTimestamp.completedAt = undefined;
    setItems(prev => prev.map(item => {
      if (item.id === parentId && item.subtasks) {
        return { ...item, modifiedAt: now, subtasks: item.subtasks.map(st => st.id === subtaskId ? { ...st, ...updatesWithTimestamp } : st) };
      }
      return item;
    }));
  }, [setItems]);

  const handleDeleteSubtaskFromSheet = useCallback((parentId: string, subtaskId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === parentId && item.subtasks) {
        return { ...item, subtasks: item.subtasks.filter(st => st.id !== subtaskId) };
      }
      return item;
    }));
  }, [setItems]);

  const handleConvertSubtaskToTask = useCallback((parentId: string, subtask: TodoItem) => {
    setItems(prev => {
      const updatedItems = prev.map(item => {
        if (item.id === parentId && item.subtasks) {
          return { ...item, subtasks: item.subtasks.filter(st => st.id !== subtask.id) };
        }
        return item;
      });
      const newTask: TodoItem = { ...subtask, sectionId: prev.find(i => i.id === parentId)?.sectionId || sections[0]?.id };
      return [newTask, ...updatedItems];
    });
  }, [sections, setItems]);

  const updateSubtask = useCallback(async (parentId: string, subtaskId: string, updates: Partial<TodoItem>) => {
    const now = new Date();
    const updatesWithTimestamp: Partial<TodoItem> = { ...updates, modifiedAt: now };
    if (updates.completed === true) updatesWithTimestamp.completedAt = now;
    if (updates.completed === false) updatesWithTimestamp.completedAt = undefined;
    setItems(prev => prev.map(item => {
      if (item.id === parentId && item.subtasks) {
        return { ...item, modifiedAt: now, subtasks: item.subtasks.map(st => st.id === subtaskId ? { ...st, ...updatesWithTimestamp } : st) };
      }
      return item;
    }));
  }, [setItems]);

  const deleteSubtask = useCallback((parentId: string, subtaskId: string, showUndo: boolean = false) => {
    let deletedSubtask: TodoItem | null = null;
    setItems(prev => prev.map(item => {
      if (item.id === parentId && item.subtasks) {
        deletedSubtask = item.subtasks.find(st => st.id === subtaskId) || null;
        return { ...item, subtasks: item.subtasks.filter(st => st.id !== subtaskId) };
      }
      return item;
    }));
    if (showUndo && deletedSubtask) {
      const subtaskToRestore = deletedSubtask;
      toast.success(t('todayPage.subtaskDeleted', 'Subtask deleted'), {
        action: {
          label: t('todayPage.undo'),
          onClick: () => {
            setItems(prev => prev.map(item => {
              if (item.id === parentId) return { ...item, subtasks: [...(item.subtasks || []), subtaskToRestore] };
              return item;
            }));
            toast.success(t('todayPage.subtaskRestored', 'Subtask restored'));
          }
        },
        duration: 5000,
      });
    }
  }, [setItems, t]);

  return {
    // Folder actions
    handleCreateFolder, handleEditFolder, handleDeleteFolder, handleReorderFolders, handleToggleFolderFavorite,
    // Section actions
    handleAddSection, handleEditSection, handleSaveSection, handleDeleteSection,
    handleDuplicateSection, handleMoveSection, handleToggleSectionCollapse,
    handleAddTaskToSection, handleSectionDragEnd,
    // Task CRUD
    handleAddTask, handleBatchAddTasks, updateItem, deleteItem, confirmDelete, duplicateTask,
    // Selection / Bulk
    handleSelectTask, handleDuplicate, handleSelectAction, handleMoveToFolder,
    handleSetPriority, handleMoveTaskToFolder,
    // Convert
    convertToNotes, handleConvertSingleTask,
    // Reorder
    handleUnifiedReorder, handleSectionReorder,
    // Subtask handlers
    handleUpdateSubtaskFromSheet, handleDeleteSubtaskFromSheet, handleConvertSubtaskToTask,
    updateSubtask, deleteSubtask,
  };
};
