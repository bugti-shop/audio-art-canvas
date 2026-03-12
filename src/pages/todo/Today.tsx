import { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TodoItem, Priority, TaskSection, TaskStatus } from '@/types/note';
import { Play, Pause, Repeat, Check, Trash2 as TrashIcon, Edit, Plus as PlusIcon, ArrowUpCircle, ArrowDownCircle, Move, History, TrendingUp, Flag, MapPin, ChevronsUpDown, Circle, Loader2, Clock as ClockIcon, Pin } from 'lucide-react';
import { Plus, FolderIcon, ChevronRight, ChevronDown, MoreVertical, Eye, EyeOff, Filter, Copy, MousePointer2, FolderPlus, Settings, LayoutList, LayoutGrid, Trash2, ListPlus, Tag, ArrowDownAZ, ArrowUpDown, Sun, Columns3, GitBranch, X, Search, ListChecks, Star, Crown } from 'lucide-react';
import { TaskWidgets } from '@/components/TaskWidgets';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TaskItem } from '@/components/TaskItem';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sparkles, AlertCircle, CalendarX, Flame, Clock, CheckCircle2, Calendar as CalendarIcon2, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TodoLayout } from './TodoLayout';
import { toast } from 'sonner';
import { isToday, isTomorrow, isThisWeek, isBefore, startOfDay, isYesterday, subDays } from 'date-fns';
import { applyTaskOrder, updateSectionOrder } from '@/utils/taskOrderStorage';
import { ResolvedTaskImage } from '@/components/ResolvedTaskImage';
import { WaveformProgressBar } from '@/components/WaveformProgressBar';
import { resolveTaskMediaUrl } from '@/utils/todoItemsStorage';
import { playCompletionSound } from '@/utils/taskSounds';
import { TASK_CIRCLE, TASK_CHECK_ICON } from '@/utils/taskItemStyles';
import { loadCustomSmartViews } from '@/utils/customSmartViews';

// Extracted hooks and components
import { useTodayState } from '@/hooks/useTodayState';
import { useTodayActions } from '@/hooks/useTodayActions';
import { TodaySheets } from '@/components/todo/TodaySheets';

const Today = () => {
  const { t } = useTranslation();

  // ── All state from extracted hook ──
  const state = useTodayState();
  const {
    tasksSettings, getPriorityColor, getPriorityName, requireFeature, isPro, allGlobalTags,
    items, setItems, folders, setFolders, sections, setSections,
    selectedFolderId, setSelectedFolderId, isInputOpen, setIsInputOpen,
    inputSectionId, setInputSectionId, selectedTask, setSelectedTask,
    selectedImage, setSelectedImage, isSelectionMode, setIsSelectionMode,
    selectedTaskIds, setSelectedTaskIds, isCompletedOpen, setIsCompletedOpen,
    showCompleted, setShowCompleted,
    dateFilter, setDateFilter, priorityFilter, setPriorityFilter,
    statusFilter, setStatusFilter, tagFilter, setTagFilter,
    smartList, setSmartList,
    viewMode, setViewMode, sortBy, setSortBy,
    hideDetailsOptions, setHideDetailsOptions,
    compactMode, setCompactMode, groupByOption, setGroupByOption,
    viewModeSearch, setViewModeSearch, dropdownView, setDropdownView,
    isFilterSheetOpen, setIsFilterSheetOpen,
    isDuplicateSheetOpen, setIsDuplicateSheetOpen,
    isFolderManageOpen, setIsFolderManageOpen,
    isMoveToFolderOpen, setIsMoveToFolderOpen,
    isSelectActionsOpen, setIsSelectActionsOpen,
    isPrioritySheetOpen, setIsPrioritySheetOpen,
    isBatchTaskOpen, setIsBatchTaskOpen,
    isSectionEditOpen, setIsSectionEditOpen,
    isSectionMoveOpen, setIsSectionMoveOpen,
    editingSection, setEditingSection,
    selectedSubtask, setSelectedSubtask,
    isLocationMapOpen, setIsLocationMapOpen,
    isBulkDateSheetOpen, setIsBulkDateSheetOpen,
    isBulkReminderSheetOpen, setIsBulkReminderSheetOpen,
    isBulkRepeatSheetOpen, setIsBulkRepeatSheetOpen,
    isBulkSectionMoveOpen, setIsBulkSectionMoveOpen,
    isBulkStatusOpen, setIsBulkStatusOpen,
    isTaskOptionsOpen, setIsTaskOptionsOpen,
    isAutoScheduleOpen, setIsAutoScheduleOpen,
    defaultSectionId, setDefaultSectionId,
    taskAddPosition, setTaskAddPosition,
    showStatusBadge, setShowStatusBadge,
    groupBy, setGroupBy, optionsSortBy, setOptionsSortBy,
    orderVersion, setOrderVersion,
    deleteConfirmItem, setDeleteConfirmItem,
    customSmartViews, setCustomSmartViews,
    activeCustomViewId, setActiveCustomViewId,
    isSaveSmartViewOpen, setIsSaveSmartViewOpen,
    swipeMoveTaskId, setSwipeMoveTaskId,
    swipeDateTaskId, setSwipeDateTaskId,
    pendingCompleteId, setPendingCompleteId,
    pendingCompleteTimer,
    collapsedViewSections, setCollapsedViewSections,
    expandedTasks, toggleSubtasks,
    showStreakChallenge, closeStreakChallenge,
    streakData, streakWeekData,
    smartListData,
    processedItems, searchFilteredItems, uncompletedItems, completedItems,
    sortedSections, toggleViewSectionCollapse, handleClearFilters,
  } = state;

  // ── All actions from extracted hook ──
  const actions = useTodayActions({
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
  });

  const {
    handleCreateFolder, handleEditFolder, handleDeleteFolder, handleReorderFolders, handleToggleFolderFavorite,
    handleAddSection, handleEditSection, handleSaveSection, handleDeleteSection,
    handleDuplicateSection, handleMoveSection, handleToggleSectionCollapse,
    handleAddTaskToSection, handleSectionDragEnd,
    handleAddTask, handleBatchAddTasks, updateItem, deleteItem, confirmDelete, duplicateTask,
    handleSelectTask, handleDuplicate, handleSelectAction, handleMoveToFolder,
    handleSetPriority, handleMoveTaskToFolder,
    convertToNotes, handleConvertSingleTask,
    handleUnifiedReorder, handleSectionReorder,
    handleUpdateSubtaskFromSheet, handleDeleteSubtaskFromSheet, handleConvertSubtaskToTask,
    updateSubtask, deleteSubtask,
  } = actions;

  // ── View-specific local state (voice playback, flat swipe) ──
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [voiceCurrentTime, setVoiceCurrentTime] = useState(0);
  const [voiceDuration, setVoiceDuration] = useState<Record<string, number>>({});
  const [voicePlaybackSpeed, setVoicePlaybackSpeed] = useState(1);
  const [resolvedVoiceUrls, setResolvedVoiceUrls] = useState<Record<string, string>>({});
  const flatAudioRef = useRef<HTMLAudioElement | null>(null);
  const VOICE_PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2];

  // Resolve voice URLs
  const voiceItemsKey = items.filter(i => i.voiceRecording?.audioUrl).map(i => i.id).join(',');
  useMemo(() => {
    const resolveUrls = async () => {
      const voiceItems = items.filter(item => item.voiceRecording?.audioUrl);
      for (const item of voiceItems) {
        if (item.voiceRecording && !resolvedVoiceUrls[item.id]) {
          const url = await resolveTaskMediaUrl(item.voiceRecording.audioUrl);
          if (url) setResolvedVoiceUrls(prev => ({ ...prev, [item.id]: url }));
        }
      }
    };
    resolveUrls();
  }, [voiceItemsKey]);

  // Swipe state for flat view
  const [swipeState, setSwipeState] = useState<{ id: string; x: number; isSwiping: boolean; snapped?: 'left' | 'right' } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const SWIPE_THRESHOLD = 60;
  const SWIPE_ACTION_WIDTH = 60;

  // Subtask swipe state
  const [subtaskSwipeState, setSubtaskSwipeState] = useState<{ id: string; parentId: string; x: number; isSwiping: boolean } | null>(null);
  const subtaskTouchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFlatVoicePlay = async (item: TodoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.voiceRecording) return;
    if (playingVoiceId === item.id && flatAudioRef.current) {
      flatAudioRef.current.pause();
      flatAudioRef.current = null;
      setPlayingVoiceId(null);
      setVoiceProgress(0);
      setVoiceCurrentTime(0);
      return;
    }
    if (flatAudioRef.current) {
      flatAudioRef.current.pause();
      flatAudioRef.current = null;
    }
    const audioUrl = await resolveTaskMediaUrl(item.voiceRecording.audioUrl);
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.playbackRate = voicePlaybackSpeed;
    flatAudioRef.current = audio;
    audio.ontimeupdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setVoiceProgress((audio.currentTime / audio.duration) * 100);
        setVoiceCurrentTime(audio.currentTime);
      }
    };
    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setVoiceDuration(prev => ({ ...prev, [item.id]: Math.round(audio.duration) }));
      }
    };
    audio.onended = () => {
      setPlayingVoiceId(null);
      setVoiceProgress(0);
      setVoiceCurrentTime(0);
      flatAudioRef.current = null;
    };
    audio.play();
    setPlayingVoiceId(item.id);
  };

  const cycleVoicePlaybackSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = VOICE_PLAYBACK_SPEEDS.indexOf(voicePlaybackSpeed);
    const nextIndex = (currentIndex + 1) % VOICE_PLAYBACK_SPEEDS.length;
    const newSpeed = VOICE_PLAYBACK_SPEEDS[nextIndex];
    setVoicePlaybackSpeed(newSpeed);
    if (flatAudioRef.current) flatAudioRef.current.playbackRate = newSpeed;
  };

  const handleVoiceSeek = (e: React.MouseEvent<HTMLDivElement>, item: TodoItem) => {
    e.stopPropagation();
    if (!flatAudioRef.current || playingVoiceId !== item.id) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const duration = flatAudioRef.current.duration || voiceDuration[item.id] || item.voiceRecording?.duration || 0;
    if (duration && !isNaN(duration)) {
      flatAudioRef.current.currentTime = percentage * duration;
      setVoiceProgress(percentage * 100);
      setVoiceCurrentTime(percentage * duration);
    }
  };

  const handleFlatTouchStart = (itemId: string, e: React.TouchEvent) => {
    if (!tasksSettings.swipeToComplete) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setSwipeState({ id: itemId, x: 0, isSwiping: false });
  };

  const handleFlatTouchMove = (itemId: string, e: React.TouchEvent) => {
    if (!tasksSettings.swipeToComplete) return;
    if (!swipeState || swipeState.id !== itemId) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
    if (deltaY > 30 && !swipeState.isSwiping) return;
    if (Math.abs(deltaX) > 15) {
      const maxSwipeRight = SWIPE_ACTION_WIDTH * 2;
      const maxSwipeLeft = SWIPE_ACTION_WIDTH * 3;
      const clampedX = Math.max(-maxSwipeLeft, Math.min(maxSwipeRight, deltaX));
      setSwipeState({ id: itemId, x: clampedX, isSwiping: true });
    }
  };

  const handleFlatTouchEnd = async (item: TodoItem) => {
    if (!tasksSettings.swipeToComplete) return;
    if (!swipeState || swipeState.id !== item.id) return;
    const maxSwipeRight = SWIPE_ACTION_WIDTH * 2;
    const maxSwipeLeft = SWIPE_ACTION_WIDTH * 3;
    if (swipeState.isSwiping) {
      if (swipeState.x > SWIPE_THRESHOLD) {
        try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
        setSwipeState({ id: item.id, x: maxSwipeRight, isSwiping: false, snapped: 'right' });
        return;
      } else if (swipeState.x < -SWIPE_THRESHOLD) {
        try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
        setSwipeState({ id: item.id, x: -maxSwipeLeft, isSwiping: false, snapped: 'left' });
        return;
      }
    }
    setSwipeState(null);
  };

  const handleSwipeAction = async (action: () => void) => {
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
    action();
    setSwipeState(null);
  };

  const handleSubtaskSwipeStart = (subtaskId: string, parentId: string, e: React.TouchEvent) => {
    if (!tasksSettings.swipeToComplete) return;
    subtaskTouchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setSubtaskSwipeState({ id: subtaskId, parentId, x: 0, isSwiping: false });
  };

  const handleSubtaskSwipeMove = (subtaskId: string, parentId: string, e: React.TouchEvent) => {
    if (!tasksSettings.swipeToComplete) return;
    if (!subtaskSwipeState || subtaskSwipeState.id !== subtaskId) return;
    const deltaX = e.touches[0].clientX - subtaskTouchStartRef.current.x;
    const deltaY = Math.abs(e.touches[0].clientY - subtaskTouchStartRef.current.y);
    if (deltaY < 30) {
      const clampedX = Math.max(-120, Math.min(120, deltaX));
      setSubtaskSwipeState({ id: subtaskId, parentId, x: clampedX, isSwiping: true });
    }
  };

  const handleSubtaskSwipeEnd = async (subtask: TodoItem, parentId: string) => {
    if (!tasksSettings.swipeToComplete) return;
    if (!subtaskSwipeState || subtaskSwipeState.id !== subtask.id) return;
    if (subtaskSwipeState.x < -SWIPE_THRESHOLD) {
      try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
      deleteSubtask(parentId, subtask.id, true);
    } else if (subtaskSwipeState.x > SWIPE_THRESHOLD) {
      try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
      updateSubtask(parentId, subtask.id, { completed: !subtask.completed });
    }
    setSubtaskSwipeState(null);
  };

  // ── Render helpers ──
  const getViewModeIcon = () => {
    switch (viewMode) {
      case 'kanban': return <Columns3 className="h-3.5 w-3.5" />;
      case 'kanban-status': return <ListChecks className="h-3.5 w-3.5" />;
      case 'timeline': return <GitBranch className="h-3.5 w-3.5" />;
      case 'progress': return <TrendingUp className="h-3.5 w-3.5" />;
      case 'priority': return <Flag className="h-3.5 w-3.5" />;
      case 'history': return <History className="h-3.5 w-3.5" />;
      default: return <LayoutList className="h-3.5 w-3.5" />;
    }
  };

  // Render task item in flat layout style for ALL view modes
  const renderTaskItem = (item: TodoItem) => {
    const hasSubtasks = item.subtasks && item.subtasks.length > 0;
    const currentSwipe = swipeState?.id === item.id ? swipeState : null;
    const isExpanded = expandedTasks.has(item.id);
    const completedSubtasks = item.subtasks?.filter(st => st.completed).length || 0;
    const totalSubtasks = item.subtasks?.length || 0;
    
    return (
      <div key={item.id} className="relative">
        <div className="relative overflow-hidden">
          {/* Swipe action backgrounds */}
          <div className="absolute inset-0 flex">
            <div className="flex items-center justify-start" style={{ opacity: (currentSwipe?.x || 0) > 0 ? 1 : 0 }}>
              <button
                onClick={() => handleSwipeAction(() => {
                  if (!item.completed) {
                    setPendingCompleteId(item.id);
                    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
                    pendingCompleteTimer.current = setTimeout(() => {
                      setPendingCompleteId(null);
                      pendingCompleteTimer.current = null;
                      updateItem(item.id, { completed: true });
                    }, 400);
                  } else {
                    updateItem(item.id, { completed: false });
                  }
                })}
                className="flex flex-col items-center justify-center w-[60px] h-full bg-success text-success-foreground"
              >
                <Check className="h-5 w-5" />
                <span className="text-[10px] font-medium mt-1">{t('swipe.done', 'Done')}</span>
              </button>
              <button
                onClick={() => handleSwipeAction(() => { if (!requireFeature('pin_feature')) return; updateItem(item.id, { isPinned: !item.isPinned }); })}
                className="flex flex-col items-center justify-center w-[60px] h-full bg-warning text-warning-foreground"
              >
                <ArrowUpCircle className={cn("h-5 w-5", item.isPinned && "fill-current")} />
                <span className="text-[10px] font-medium mt-1">{t('swipe.pin', 'Pin')}</span>
              </button>
            </div>
            <div className="absolute right-0 inset-y-0 flex items-center justify-end" style={{ opacity: (currentSwipe?.x || 0) < 0 ? 1 : 0, width: SWIPE_ACTION_WIDTH * 3 }}>
              <button onClick={() => handleSwipeAction(() => setSwipeMoveTaskId(item.id))} className="flex flex-col items-center justify-center w-[60px] h-full bg-info text-info-foreground">
                <FolderIcon className="h-5 w-5" />
                <span className="text-[10px] font-medium mt-1">{t('swipe.move', 'Move')}</span>
              </button>
              <button onClick={() => handleSwipeAction(() => deleteItem(item.id, true))} className="flex flex-col items-center justify-center w-[60px] h-full bg-destructive text-destructive-foreground">
                <TrashIcon className="h-5 w-5" />
                <span className="text-[10px] font-medium mt-1">{t('swipe.delete', 'Delete')}</span>
              </button>
              <button onClick={() => handleSwipeAction(() => setSwipeDateTaskId(item.id))} className="flex flex-col items-center justify-center w-[60px] h-full bg-warning text-warning-foreground">
                <CalendarIcon2 className="h-5 w-5" />
                <span className="text-[10px] font-medium mt-1">{t('swipe.date', 'Date')}</span>
              </button>
            </div>
          </div>
          
          {/* Main flat item */}
          <div 
            className={cn(
              "flex items-start gap-3 border-b border-border/50 bg-background relative z-10",
              compactMode ? "py-1.5 px-1.5 gap-2" : "py-2.5 px-2"
            )}
            style={{ 
              transform: `translateX(${currentSwipe?.x || 0}px)`, 
              transition: currentSwipe?.isSwiping ? 'none' : 'transform 0.3s ease-out' 
            }}
            onTouchStart={(e) => handleFlatTouchStart(item.id, e)}
            onTouchMove={(e) => handleFlatTouchMove(item.id, e)}
            onTouchEnd={() => handleFlatTouchEnd(item)}
          >
            {isSelectionMode && (
              <Checkbox checked={selectedTaskIds.has(item.id)} onCheckedChange={() => handleSelectTask(item.id)} className={cn(compactMode ? "h-4 w-4" : "h-5 w-5", "mt-0.5")} />
            )}
            
            <button
              disabled={false}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                const isPending = pendingCompleteId === item.id;
                if (item.completed || isPending) {
                  if (pendingCompleteTimer.current) {
                    clearTimeout(pendingCompleteTimer.current);
                    pendingCompleteTimer.current = null;
                  }
                  setPendingCompleteId(null);
                  if (item.completed) updateItem(item.id, { completed: false });
                  return;
                }
                setPendingCompleteId(item.id);
                Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
                setTimeout(() => { Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}); }, 100);
                pendingCompleteTimer.current = setTimeout(() => {
                  setPendingCompleteId(null);
                  pendingCompleteTimer.current = null;
                  updateItem(item.id, { completed: true });
                }, 400);
              }}
              className={cn(
                TASK_CIRCLE.base, TASK_CIRCLE.marginTop,
                compactMode ? TASK_CIRCLE.sizeCompact : TASK_CIRCLE.size,
                item.completed && TASK_CIRCLE.completed,
                pendingCompleteId === item.id && TASK_CIRCLE.pending,
              )}
              style={{
                borderColor: (item.completed || pendingCompleteId === item.id) ? undefined : getPriorityColor(item.priority || 'none'),
                backgroundColor: pendingCompleteId === item.id ? getPriorityColor(item.priority || 'none') : undefined,
              }}
            >
              {(item.completed || pendingCompleteId === item.id) && (
                <Check 
                  className={cn(TASK_CHECK_ICON.base, compactMode ? TASK_CHECK_ICON.sizeCompact : TASK_CHECK_ICON.size, pendingCompleteId === item.id && TASK_CHECK_ICON.pendingAnimation)} 
                  style={{ color: pendingCompleteId === item.id ? TASK_CHECK_ICON.pendingColor : TASK_CHECK_ICON.completedColor }}
                  strokeWidth={TASK_CHECK_ICON.strokeWidth}
                />
              )}
            </button>
            <div className="flex-1 min-w-0" onClick={() => !currentSwipe?.isSwiping && setSelectedTask(item)}>
              {item.voiceRecording ? (
                <div className="flex items-center gap-2">
                  <button onClick={(e) => handleFlatVoicePlay(item, e)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors min-w-0 flex-1">
                    {playingVoiceId === item.id ? <Pause className="h-4 w-4 text-primary flex-shrink-0" /> : <Play className="h-4 w-4 text-primary flex-shrink-0" />}
                    <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                      {resolvedVoiceUrls[item.id] ? (
                        <WaveformProgressBar
                          audioUrl={resolvedVoiceUrls[item.id]}
                          progress={playingVoiceId === item.id ? voiceProgress : 0}
                          duration={voiceDuration[item.id] || item.voiceRecording.duration}
                          isPlaying={playingVoiceId === item.id}
                          onSeek={(percent) => {
                            if (flatAudioRef.current && playingVoiceId === item.id) {
                              const duration = flatAudioRef.current.duration || voiceDuration[item.id] || item.voiceRecording!.duration;
                              if (duration && !isNaN(duration)) {
                                flatAudioRef.current.currentTime = (percent / 100) * duration;
                                setVoiceProgress(percent);
                                setVoiceCurrentTime((percent / 100) * duration);
                              }
                            }
                          }}
                          height={12}
                        />
                      ) : (
                        <div className="relative h-1.5 bg-primary/20 rounded-full overflow-hidden cursor-pointer" onClick={(e) => handleVoiceSeek(e, item)}>
                          <div className="absolute h-full bg-primary rounded-full transition-all duration-100" style={{ width: playingVoiceId === item.id ? `${voiceProgress}%` : '0%' }} />
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-primary font-medium">{playingVoiceId === item.id ? formatDuration(Math.round(voiceCurrentTime)) : '0:00'}</span>
                        <span className="text-primary/70">{formatDuration(voiceDuration[item.id] || item.voiceRecording.duration)}</span>
                      </div>
                    </div>
                  </button>
                  <button onClick={cycleVoicePlaybackSpeed} className="px-2 py-1 text-xs font-semibold rounded-md bg-muted hover:bg-muted/80 transition-colors min-w-[40px]">{voicePlaybackSpeed}x</button>
                  {item.repeatType && item.repeatType !== 'none' && <Repeat className="h-3 w-3 text-accent-purple flex-shrink-0" />}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {item.isPinned && <Pin className={cn(compactMode ? "h-3 w-3" : "h-3.5 w-3.5", "text-warning fill-warning flex-shrink-0")} />}
                  <span className={cn(compactMode ? "text-xs" : "text-sm", "transition-all duration-300", (item.completed || pendingCompleteId === item.id) && "text-muted-foreground line-through")}>{item.text}</span>
                  {item.repeatType && item.repeatType !== 'none' && <Repeat className={cn(compactMode ? "h-2.5 w-2.5" : "h-3 w-3", "text-accent-purple flex-shrink-0")} />}
                </div>
              )}
              {!compactMode && !hideDetailsOptions.hideDateTime && item.tagIds && item.tagIds.length > 0 && (
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {item.tagIds.slice(0, 4).map((tagId) => {
                    const tag = allGlobalTags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <span key={tagId} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded-full text-white" style={{ backgroundColor: `hsl(${tag.color})` }}>
                        {tag.icon && <span>{tag.icon}</span>}
                        <Tag className="h-2.5 w-2.5" />
                        {tag.name}
                      </span>
                    );
                  })}
                  {item.tagIds.length > 4 && <span className="text-[10px] text-muted-foreground">+{item.tagIds.length - 4}</span>}
                </div>
              )}
              {!hideDetailsOptions.hideDateTime && item.dueDate && (
                <p className={cn("text-muted-foreground", compactMode ? "text-[10px] mt-0.5" : "text-xs mt-1")}>{new Date(item.dueDate).toLocaleDateString()}</p>
              )}
              {!hideDetailsOptions.hideSubtasks && hasSubtasks && !isExpanded && (
                <p className={cn("text-muted-foreground", compactMode ? "text-[10px] mt-0.5" : "text-xs mt-1")}>{completedSubtasks}/{totalSubtasks} subtasks</p>
              )}
              {!compactMode && !hideDetailsOptions.hideStatus && showStatusBadge && !item.completed && item.status && (
                <Badge variant="outline" className={cn(
                  "text-[10px] px-1.5 py-0 mt-1",
                  item.status === 'not_started' && "border-muted-foreground text-muted-foreground bg-muted/30",
                  item.status === 'in_progress' && "border-info text-info bg-info/10",
                  item.status === 'almost_done' && "border-warning text-warning bg-warning/10"
                )}>
                  {item.status === 'not_started' ? t('grouping.notStarted') : item.status === 'in_progress' ? t('grouping.inProgress') : t('grouping.almostDone')}
                </Badge>
              )}
            </div>
            {item.imageUrl && (
              <div className={cn("rounded-full overflow-hidden border-2 border-border flex-shrink-0 cursor-pointer hover:border-primary transition-colors", compactMode ? "w-7 h-7" : "w-10 h-10")} onClick={(e) => { e.stopPropagation(); setSelectedImage(item.imageUrl!); }}>
                <ResolvedTaskImage srcRef={item.imageUrl} alt="Task attachment" className="w-full h-full object-cover" />
              </div>
            )}
            {hasSubtasks && (
              <button onClick={(e) => { e.stopPropagation(); toggleSubtasks(item.id); }} className={cn("rounded hover:bg-muted transition-colors flex-shrink-0", compactMode ? "p-0.5" : "p-1 mt-0.5")}>
                {isExpanded ? <ChevronDown className={cn(compactMode ? "h-3 w-3" : "h-4 w-4", "text-muted-foreground")} /> : <ChevronRight className={cn(compactMode ? "h-3 w-3" : "h-4 w-4", "text-muted-foreground")} />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render subtasks inline for Kanban/Progress/Timeline views
  const renderSubtasksInline = (item: TodoItem) => {
    const isExpanded = expandedTasks.has(item.id);
    if (!isExpanded || !item.subtasks || item.subtasks.length === 0) return null;
    return (
      <div className="border-t border-border/30 bg-muted/20 p-2 space-y-1">
        {item.subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors" style={{ borderLeft: `3px solid ${getPriorityColor(subtask.priority || 'none')}` }}>
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={(checked) => {
                const updatedSubtasks = item.subtasks?.map(st => st.id === subtask.id ? { ...st, completed: !!checked } : st);
                updateItem(item.id, { subtasks: updatedSubtasks });
              }}
              onClick={(e) => e.stopPropagation()}
              className={cn("h-4 w-4 rounded-sm border-0", subtask.completed ? "bg-muted-foreground/30 data-[state=checked]:bg-muted-foreground/30 data-[state=checked]:text-white" : "border-2")}
              style={{ borderColor: subtask.completed ? undefined : getPriorityColor(subtask.priority || 'none') }}
            />
            <span className={cn("text-xs flex-1", subtask.completed && "text-muted-foreground line-through")} onClick={() => setSelectedSubtask({ subtask, parentId: item.id })}>• {subtask.text}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderSectionHeader = (section: TaskSection, isDragging: boolean = false) => {
    const sectionTasks = uncompletedItems.filter(item => item.sectionId === section.id || (!item.sectionId && section.id === sections[0]?.id));
    return (
      <div data-tour="task-section" className={cn("flex items-center", isDragging && "opacity-90 scale-[1.02] shadow-xl bg-card rounded-t-xl")} style={{ borderLeft: `4px solid ${section.color}` }}>
        <div className="flex-1 flex items-center gap-3 px-3 py-2.5 bg-muted/30">
          <span className="text-muted-foreground" style={{ color: section.color }}>{getViewModeIcon()}</span>
          <span className="text-sm font-semibold">{section.name}</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{sectionTasks.length}</span>
        </div>
        <button onClick={() => handleToggleSectionCollapse(section.id)} className="p-2 hover:bg-muted/50 transition-colors">
          {collapsedViewSections.has(`flat-${section.id}`) ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 hover:bg-muted/50 transition-colors"><MoreVertical className="h-4 w-4 text-muted-foreground" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover border shadow-lg z-50">
            <DropdownMenuItem onClick={() => handleEditSection(section)} className="cursor-pointer"><Edit className="h-4 w-4 mr-2" />{t('sections.editSection')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddTaskToSection(section.id)} className="cursor-pointer"><PlusIcon className="h-4 w-4 mr-2" />{t('sections.addTask')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAddSection('above', section.id)} className="cursor-pointer"><ArrowUpCircle className="h-4 w-4 mr-2" />{t('sections.addSectionAbove')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddSection('below', section.id)} className="cursor-pointer"><ArrowDownCircle className="h-4 w-4 mr-2" />{t('sections.addSectionBelow')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDuplicateSection(section.id)} className="cursor-pointer"><Copy className="h-4 w-4 mr-2" />{t('sections.duplicateSection')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingSection(section); setIsSectionMoveOpen(true); }} className="cursor-pointer"><Move className="h-4 w-4 mr-2" />{t('sections.moveTo')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDeleteSection(section.id)} className="cursor-pointer text-destructive focus:text-destructive" disabled={sections.length <= 1}><Trash2 className="h-4 w-4 mr-2" />{t('common.delete')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const renderViewModeSectionHeader = (label: string, taskCount: number, color: string, icon: React.ReactNode, sectionId: string, extra?: React.ReactNode) => {
    const isCollapsed = collapsedViewSections.has(sectionId);
    return (
      <button onClick={() => toggleViewSectionCollapse(sectionId)} className="w-full flex items-center gap-2 px-4 py-3 border-b border-border/30 hover:bg-muted/20 transition-colors" style={{ borderLeft: `4px solid ${color}` }}>
        <span style={{ color }}>{icon}</span>
        <span className="text-sm font-semibold flex-1 text-left">{label}</span>
        {extra}
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{taskCount}</span>
        {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
    );
  };

  const renderCompletedSectionForViewMode = () => {
    if (!showCompleted || completedItems.length === 0) return null;
    const isCollapsed = collapsedViewSections.has('view-completed');
    return (
      <div className="bg-muted/30 rounded-xl border border-border/30 overflow-hidden mt-6">
        <button onClick={() => toggleViewSectionCollapse('view-completed')} className="w-full flex items-center gap-2 px-4 py-3 border-b border-border/30 hover:bg-muted/20 transition-colors" style={{ borderLeft: `4px solid #10b981` }}>
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="text-sm font-semibold flex-1 text-left text-muted-foreground uppercase tracking-wide">Completed</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{completedItems.length}</span>
          {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {!isCollapsed && (
          <div className="p-2 space-y-2">
            {completedItems.map((item) => (
              <div key={item.id} className="bg-card rounded-lg border border-border/50 opacity-70">{renderTaskItem(item)}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleSubtaskClick = (subtask: TodoItem, parentId?: string) => {
    if (parentId) setSelectedSubtask({ subtask, parentId });
    else setSelectedTask(subtask);
  };

  return (
    <TodoLayout title="Npd" searchValue={viewModeSearch} onSearchChange={setViewModeSearch}>
      <main className="container mx-auto px-4 py-3 pb-32">
        <div className="max-w-2xl mx-auto">
          {/* Folders */}
          <div className="mb-4" data-tour="todo-folders-section">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold flex items-center gap-2"><FolderIcon className="h-5 w-5" />{t('menu.folders')}</h2>
                {smartList === 'location-reminders' && (
                  <Button variant="outline" size="sm" onClick={() => setIsLocationMapOpen(true)} className="gap-1">
                    <MapPin className="h-4 w-4" />{t('menu.mapView')}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isSelectionMode && (
                  <Button variant="default" size="sm" onClick={() => { setIsSelectionMode(false); setSelectedTaskIds(new Set()); }}>{t('menu.cancel')}</Button>
                )}
                <DropdownMenu onOpenChange={(open) => { if (!open) setDropdownView('main'); }}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9" data-tour="todo-options-menu"><MoreVertical className="h-5 w-5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-56 max-h-[70vh] overflow-y-auto bg-popover border shadow-lg z-50">
                    <div className={cn("transition-all duration-200 ease-out", dropdownView === 'main' ? "animate-in slide-in-from-left-full" : "hidden")}>
                      {dropdownView === 'main' && (
                        <>
                          <DropdownMenuItem onClick={(e) => { e.preventDefault(); if (!requireFeature('smart_lists')) return; setDropdownView('smartLists'); }} className="cursor-pointer">
                            <Sparkles className="h-4 w-4 mr-2" />{t('menu.smartLists')}
                            {!isPro && <Crown className="h-3.5 w-3.5 ml-auto" style={{ color: '#3c78f0' }} />}
                            {smartList !== 'all' && <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs mr-1">{t('menu.active')}</Badge>}
                            <ChevronRight className="h-4 w-4 ml-auto" />
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.preventDefault(); setDropdownView('sortBy'); }} className="cursor-pointer">
                            <ArrowUpDown className="h-4 w-4 mr-2" />{t('menu.sortBy')}<ChevronRight className="h-4 w-4 ml-auto" />
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setShowCompleted(!showCompleted)} className="cursor-pointer">
                            {showCompleted ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                            {showCompleted ? t('menu.hideCompleted') : t('menu.showCompleted')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { const allHidden = hideDetailsOptions.hideDateTime && hideDetailsOptions.hideStatus && hideDetailsOptions.hideSubtasks; setHideDetailsOptions({ hideDateTime: !allHidden, hideStatus: !allHidden, hideSubtasks: !allHidden }); }} className="cursor-pointer">
                            {(hideDetailsOptions.hideDateTime && hideDetailsOptions.hideStatus && hideDetailsOptions.hideSubtasks) ? <><Eye className="h-4 w-4 mr-2" />{t('menu.showAllDetails')}</> : <><EyeOff className="h-4 w-4 mr-2" />{t('menu.hideAllDetails')}</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCompactMode(!compactMode)} className="cursor-pointer">
                            {compactMode ? <LayoutList className="h-4 w-4 mr-2" /> : <LayoutGrid className="h-4 w-4 mr-2" />}
                            {compactMode ? t('menu.normalMode') : t('menu.compactMode')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsTaskOptionsOpen(true)} className="cursor-pointer"><Settings className="h-4 w-4 mr-2" />{t('menu.detailSettings')}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.preventDefault(); setDropdownView('groupBy'); }} className="cursor-pointer">
                            <Columns3 className="h-4 w-4 mr-2" />{t('menu.groupBy')}
                            {groupByOption !== 'none' && <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs mr-1">{groupByOption}</Badge>}
                            <ChevronRight className="h-4 w-4 ml-auto" />
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsFilterSheetOpen(true)} className="cursor-pointer"><Filter className="h-4 w-4 mr-2" />{t('menu.filter')}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsDuplicateSheetOpen(true)} className="cursor-pointer"><Copy className="h-4 w-4 mr-2" />{t('menu.duplicate')}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { if (!requireFeature('multiple_tasks')) return; setIsBatchTaskOpen(true); }} className="cursor-pointer">
                            <ListPlus className="h-4 w-4 mr-2" />{t('menu.addMultipleTasks')}
                            {!isPro && <Crown className="h-3.5 w-3.5 ml-auto" style={{ color: '#3c78f0' }} />}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleAddSection('below')} className="cursor-pointer"><PlusIcon className="h-4 w-4 mr-2" />{t('menu.sections')}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsFolderManageOpen(true)} className="cursor-pointer"><FolderIcon className="h-4 w-4 mr-2" />{t('menu.folders')}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setIsSelectionMode(true); setIsSelectActionsOpen(true); }} className="cursor-pointer"><MousePointer2 className="h-4 w-4 mr-2" />{t('menu.select')}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setViewMode('flat')} className={cn("cursor-pointer", viewMode === 'flat' && "bg-accent")}><LayoutList className="h-4 w-4 mr-2" />{t('menu.flatLayout')}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setViewMode('kanban')} className={cn("cursor-pointer", viewMode === 'kanban' && "bg-accent")}><Columns3 className="h-4 w-4 mr-2" />{t('menu.kanbanBoard')}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { if (!requireFeature('view_mode_status_board')) return; setViewMode('kanban-status'); }} className={cn("cursor-pointer", viewMode === 'kanban-status' && "bg-accent")}>
                            <ListChecks className="h-4 w-4 mr-2" />{t('menu.statusBoard')}
                            {!isPro && <Crown className="h-3.5 w-3.5 ml-auto" style={{ color: '#3c78f0' }} />}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { if (!requireFeature('view_mode_timeline')) return; setViewMode('timeline'); }} className={cn("cursor-pointer", viewMode === 'timeline' && "bg-accent")}>
                            <GitBranch className="h-4 w-4 mr-2" />{t('menu.timelineBoard')}
                            {!isPro && <Crown className="h-3.5 w-3.5 ml-auto" style={{ color: '#3c78f0' }} />}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { if (!requireFeature('view_mode_priority')) return; setViewMode('priority'); }} className={cn("cursor-pointer", viewMode === 'priority' && "bg-accent")}>
                            <Flag className="h-4 w-4 mr-2" />{t('menu.priorityBoard')}
                            {!isPro && <Crown className="h-3.5 w-3.5 ml-auto" style={{ color: '#3c78f0' }} />}
                          </DropdownMenuItem>
                        </>
                      )}
                    </div>
                    <div className={cn("transition-all duration-200 ease-out", dropdownView === 'smartLists' ? "animate-in slide-in-from-right-full" : "hidden")}>
                      {dropdownView === 'smartLists' && (
                        <>
                          <DropdownMenuItem onClick={(e) => { e.preventDefault(); setDropdownView('main'); }} className="cursor-pointer"><ChevronRight className="h-4 w-4 mr-2 rotate-180" />{t('menu.back')}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {smartListData.smartLists.map((list) => (
                            <DropdownMenuItem key={list.id} onClick={() => { setSmartList(list.id); setActiveCustomViewId(null); }} className={cn("cursor-pointer", smartList === list.id && !activeCustomViewId && "bg-accent")}>
                              {list.icon}<span className={cn("ml-2", list.color)}>{list.label}</span>
                              {smartListData.getCounts[list.id] > 0 && <Badge variant={list.id === 'overdue' ? "destructive" : "secondary"} className="ml-auto">{smartListData.getCounts[list.id]}</Badge>}
                            </DropdownMenuItem>
                          ))}
                          {customSmartViews.length > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <div className="px-2 py-1.5"><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Saved Views</span></div>
                              {customSmartViews.map((view) => (
                                <DropdownMenuItem key={view.id} onClick={() => {
                                  setDateFilter(view.filters.dateFilter);
                                  setPriorityFilter(view.filters.priorityFilter);
                                  setStatusFilter(view.filters.statusFilter);
                                  setTagFilter(view.filters.tags);
                                  setSelectedFolderId(view.filters.folderId);
                                  setSmartList('all');
                                  setActiveCustomViewId(view.id);
                                  toast.success(`Applied "${view.name}" view`);
                                }} className={cn("cursor-pointer group", activeCustomViewId === view.id && "bg-accent")}>
                                  <span className="mr-2">{view.icon}</span>
                                  <span className="truncate" style={{ color: view.color }}>{view.name}</span>
                                  <button onClick={async (e) => {
                                    e.stopPropagation();
                                    const { deleteCustomSmartView } = await import('@/utils/customSmartViews');
                                    await deleteCustomSmartView(view.id);
                                    loadCustomSmartViews().then(setCustomSmartViews);
                                    if (activeCustomViewId === view.id) setActiveCustomViewId(null);
                                    toast.success('Smart View deleted');
                                  }} className="opacity-0 group-hover:opacity-100 ml-auto p-1 hover:bg-destructive/10 rounded transition-opacity">
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </button>
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <div className={cn("transition-all duration-200 ease-out", dropdownView === 'sortBy' ? "animate-in slide-in-from-right-full" : "hidden")}>
                      {dropdownView === 'sortBy' && (
                        <>
                          <DropdownMenuItem onClick={(e) => { e.preventDefault(); setDropdownView('main'); }} className="cursor-pointer"><ChevronRight className="h-4 w-4 mr-2 rotate-180" />{t('menu.back')}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSortBy('date')} className={cn("cursor-pointer", sortBy === 'date' && "bg-accent")}><CalendarIcon2 className="h-4 w-4 mr-2 text-info" />{t('menu.dueDate')}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSortBy('priority')} className={cn("cursor-pointer", sortBy === 'priority' && "bg-accent")}><Flame className="h-4 w-4 mr-2 text-streak" />{t('menu.priority')}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSortBy('name')} className={cn("cursor-pointer", sortBy === 'name' && "bg-accent")}><ArrowDownAZ className="h-4 w-4 mr-2 text-accent-purple" />{t('menu.name')}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSortBy('created')} className={cn("cursor-pointer", sortBy === 'created' && "bg-accent")}><Clock className="h-4 w-4 mr-2 text-success" />{t('menu.createdTime')}</DropdownMenuItem>
                        </>
                      )}
                    </div>
                    <div className={cn("transition-all duration-200 ease-out", dropdownView === 'groupBy' ? "animate-in slide-in-from-right-full" : "hidden")}>
                      {dropdownView === 'groupBy' && (
                        <>
                          <DropdownMenuItem onClick={(e) => { e.preventDefault(); setDropdownView('main'); }} className="cursor-pointer"><ChevronRight className="h-4 w-4 mr-2 rotate-180" />{t('menu.back')}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setGroupByOption('none')} className={cn("cursor-pointer", groupByOption === 'none' && "bg-accent")}><LayoutList className="h-4 w-4 mr-2 text-muted-foreground" />{t('menu.noGrouping')}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setGroupByOption('section')} className={cn("cursor-pointer", groupByOption === 'section' && "bg-accent")}><Columns3 className="h-4 w-4 mr-2 text-info" />{t('menu.bySection')}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setGroupByOption('priority')} className={cn("cursor-pointer", groupByOption === 'priority' && "bg-accent")}><Flag className="h-4 w-4 mr-2 text-streak" />{t('menu.byPriority')}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setGroupByOption('date')} className={cn("cursor-pointer", groupByOption === 'date' && "bg-accent")}><CalendarIcon2 className="h-4 w-4 mr-2 text-success" />{t('menu.byDueDate')}</DropdownMenuItem>
                        </>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button onClick={() => setSelectedFolderId(null)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap flex-shrink-0", !selectedFolderId ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
                <FolderIcon className="h-4 w-4" />{t('smartLists.allTasks')}
              </button>
              <DragDropContext onDragEnd={(result: DropResult) => {
                if (!result.destination) return;
                const sorted = [...folders].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
                const reordered = Array.from(sorted);
                const [moved] = reordered.splice(result.source.index, 1);
                reordered.splice(result.destination.index, 0, moved);
                handleReorderFolders(reordered);
              }}>
                <Droppable droppableId="folder-chips" direction="horizontal">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="flex gap-2">
                      {[...folders].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)).map((folder, index) => {
                        const isSelected = selectedFolderId === folder.id;
                        return (
                          <Draggable key={folder.id} draggableId={`folder-chip-${folder.id}`} index={index}>
                            {(dragProvided, snapshot) => (
                              <button
                                ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}
                                onClick={() => setSelectedFolderId(folder.id)}
                                onContextMenu={(e) => { e.preventDefault(); handleToggleFolderFavorite(folder.id); }}
                                className={cn("flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap flex-shrink-0", isSelected ? "text-primary-foreground" : "hover:opacity-80 text-foreground", !isSelected && "bg-[#f1f4f9] dark:bg-muted", snapshot.isDragging && "shadow-lg opacity-90 ring-2 ring-primary/30")}
                                style={{ ...(isSelected ? { backgroundColor: folder.color } : undefined), ...dragProvided.draggableProps.style }}
                              >
                                {folder.isFavorite && <Star className="h-3.5 w-3.5 fill-current" />}
                                <FolderIcon className="h-4 w-4" />{folder.name}
                              </button>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>

          {isSelectionMode && selectedTaskIds.size > 0 && (
            <div className="fixed left-4 right-4 z-40 bg-card border rounded-lg shadow-lg p-4" style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
              <p className="text-sm mb-3 font-medium">{t('bulk.tasksSelected', { count: selectedTaskIds.size })}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsSelectActionsOpen(true)}>{t('common.actions', 'Actions')}</Button>
                <Button variant="outline" size="sm" onClick={() => { setItems(items.filter(i => !selectedTaskIds.has(i.id))); setSelectedTaskIds(new Set()); setIsSelectionMode(false); }}>
                  <Trash2 className="h-4 w-4 mr-2" />{t('common.delete')}
                </Button>
              </div>
            </div>
          )}

          {/* Collapse All / Expand All */}
          {['flat', 'timeline', 'progress', 'priority', 'history', 'kanban'].includes(viewMode) && (
            <div className="mb-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => {
                if (collapsedViewSections.size > 0) {
                  setCollapsedViewSections(new Set());
                } else {
                  const allSectionIds = new Set<string>();
                  if (viewMode === 'flat') {
                    if (groupByOption !== 'none') {
                      if (groupByOption === 'section') sortedSections.forEach(s => allSectionIds.add(`group-section-${s.id}`));
                      else if (groupByOption === 'priority') ['high', 'medium', 'low', 'none'].forEach(id => allSectionIds.add(`group-priority-${id}`));
                      else if (groupByOption === 'date') ['overdue', 'today', 'tomorrow', 'this-week', 'later', 'no-date'].forEach(id => allSectionIds.add(`group-date-${id}`));
                    } else {
                      sortedSections.forEach(s => allSectionIds.add(`flat-${s.id}`));
                    }
                  } else if (viewMode === 'kanban') {
                    sortedSections.forEach(s => allSectionIds.add(`kanban-${s.id}`));
                    allSectionIds.add('kanban-completed');
                  } else if (viewMode === 'timeline') {
                    ['timeline-overdue', 'timeline-today', 'timeline-tomorrow', 'timeline-thisweek', 'timeline-later', 'timeline-nodate'].forEach(id => allSectionIds.add(id));
                  } else if (viewMode === 'progress') {
                    ['progress-notstarted', 'progress-inprogress', 'progress-almostdone'].forEach(id => allSectionIds.add(id));
                  } else if (viewMode === 'priority') {
                    ['priority-high', 'priority-medium', 'priority-low', 'priority-none'].forEach(id => allSectionIds.add(id));
                  } else if (viewMode === 'history') {
                    ['history-completed-today', 'history-completed-yesterday', 'history-this-week', 'history-older'].forEach(id => allSectionIds.add(id));
                  }
                  allSectionIds.add('view-completed');
                  setCollapsedViewSections(allSectionIds);
                }
              }} className="gap-1 whitespace-nowrap">
                {collapsedViewSections.size > 0 ? <><ChevronDown className="h-4 w-4" />{t('sections.expandAll')}</> : <><ChevronRight className="h-4 w-4" />{t('sections.collapseAll')}</>}
              </Button>
            </div>
          )}

          {/* Tasks by View Mode */}
          {processedItems.length === 0 ? (
            <div className="text-center py-20"><p className="text-muted-foreground">{t('emptyStates.noTasks')}</p></div>
          ) : viewMode === 'kanban' ? (
            <DragDropContext onDragEnd={(result: DropResult) => {
              if (!result.destination) return;
              const { source, destination, draggableId } = result;
              const taskId = draggableId;
              const sourceSectionId = source.droppableId;
              const destSectionId = destination.droppableId;
              if (sourceSectionId === destSectionId && source.index === destination.index) return;
              setItems(prevItems => {
                const taskToMove = prevItems.find(item => item.id === taskId);
                if (!taskToMove) return prevItems;
                const uncompletedList = prevItems.filter(item => !item.completed);
                const completedList = prevItems.filter(item => item.completed);
                const sourceTasks = uncompletedList.filter(item => item.sectionId === sourceSectionId || (!item.sectionId && sourceSectionId === sections[0]?.id));
                const destTasksRaw = uncompletedList.filter(item => item.id !== taskId && (item.sectionId === destSectionId || (!item.sectionId && destSectionId === sections[0]?.id)));
                const currentlyOrderedDestTasks = applyTaskOrder(destTasksRaw, `kanban-${destSectionId}`);
                const currentDestOrderIds = currentlyOrderedDestTasks.map(t => t.id);
                currentDestOrderIds.splice(destination.index, 0, taskId);
                updateSectionOrder(`kanban-${destSectionId}`, currentDestOrderIds);
                const destTasks = [...currentlyOrderedDestTasks];
                const updatedTask = { ...taskToMove, sectionId: destSectionId };
                destTasks.splice(destination.index, 0, updatedTask);
                if (sourceSectionId !== destSectionId) {
                  const currentlyOrderedSourceTasks = applyTaskOrder(sourceTasks, `kanban-${sourceSectionId}`);
                  const sourceOrderIds = currentlyOrderedSourceTasks.map(t => t.id).filter(id => id !== taskId);
                  updateSectionOrder(`kanban-${sourceSectionId}`, sourceOrderIds);
                }
                const otherTasks = uncompletedList.filter(item => item.id !== taskId && item.sectionId !== destSectionId && (item.sectionId || destSectionId !== sections[0]?.id));
                return [...otherTasks, ...destTasks, ...completedList];
              });
              setOrderVersion(v => v + 1);
              Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
              toast.success('Task moved');
            }}>
              <div className="overflow-x-auto pb-4 -mx-4 px-4">
                <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                  {sortedSections.map((section) => {
                    const rawSectionTasks = uncompletedItems.filter(item => item.sectionId === section.id || (!item.sectionId && section.id === sections[0]?.id));
                    const sectionTasks = applyTaskOrder(rawSectionTasks, `kanban-${section.id}`);
                    const kanbanSectionId = `kanban-${section.id}`;
                    const isCollapsed = collapsedViewSections.has(kanbanSectionId);
                    return (
                      <div key={section.id} className="flex-shrink-0 w-72 bg-muted/30 rounded-xl border border-border/30 overflow-hidden">
                        <button onClick={() => toggleViewSectionCollapse(kanbanSectionId)} className="w-full flex items-center gap-2 px-3 py-3 border-b border-border/30 hover:bg-muted/20 transition-colors" style={{ borderLeft: `4px solid ${section.color}` }}>
                          <Columns3 className="h-3.5 w-3.5" style={{ color: section.color }} />
                          <span className="text-sm font-semibold flex-1 text-left">{section.name}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{sectionTasks.length}</span>
                          {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <div className="p-1 hover:bg-muted/50 rounded transition-colors"><MoreVertical className="h-4 w-4 text-muted-foreground" /></div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-popover border shadow-lg z-50">
                              <DropdownMenuItem onClick={() => handleEditSection(section)} className="cursor-pointer"><Edit className="h-4 w-4 mr-2" />{t('sections.editSection')}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddTaskToSection(section.id)} className="cursor-pointer"><PlusIcon className="h-4 w-4 mr-2" />{t('sections.addTask')}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDuplicateSection(section.id)} className="cursor-pointer"><Copy className="h-4 w-4 mr-2" />{t('common.duplicate')}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteSection(section.id)} className="cursor-pointer text-destructive focus:text-destructive" disabled={sections.length <= 1}><Trash2 className="h-4 w-4 mr-2" />{t('common.delete')}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </button>
                        {!isCollapsed && (
                          <>
                            <Droppable droppableId={section.id}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className={cn("min-h-[300px] max-h-[400px] overflow-y-auto p-2 space-y-2", snapshot.isDraggingOver && "bg-primary/5")}>
                                  {sectionTasks.length === 0 ? (
                                    <div className="py-8 text-center text-sm text-muted-foreground">{t('sections.dropTasksHere')}</div>
                                  ) : sectionTasks.map((item, index) => (
                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={cn("bg-card rounded-lg border border-border/50 shadow-sm", snapshot.isDragging && "shadow-lg ring-2 ring-primary")}>
                                          {renderTaskItem(item)}
                                          {renderSubtasksInline(item)}
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                            <div className="p-2 border-t border-border/30">
                              <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => handleAddTaskToSection(section.id)}>
                                <PlusIcon className="h-4 w-4 mr-2" />{t('sections.addTask')}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {showCompleted && completedItems.length > 0 && (
                    <div className="flex-shrink-0 w-72 bg-muted/30 rounded-xl border border-border/30 overflow-hidden">
                      <button onClick={() => toggleViewSectionCollapse('kanban-completed')} className="w-full flex items-center gap-2 px-3 py-3 border-b border-border/30 hover:bg-muted/20 transition-colors" style={{ borderLeft: `4px solid #10b981` }}>
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        <span className="text-sm font-semibold flex-1 text-left text-muted-foreground uppercase tracking-wide">Completed</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{completedItems.length}</span>
                        {collapsedViewSections.has('kanban-completed') ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      {!collapsedViewSections.has('kanban-completed') && (
                        <div className="min-h-[100px] max-h-[400px] overflow-y-auto p-2 space-y-2">
                          {completedItems.map((item) => (
                            <div key={item.id} className="bg-card rounded-lg border border-border/50 shadow-sm opacity-70">{renderTaskItem(item)}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-shrink-0 w-72">
                    <Button variant="outline" className="w-full h-12 border-dashed" onClick={() => handleAddSection('below')}>
                      <PlusIcon className="h-4 w-4 mr-2" />Add Section
                    </Button>
                  </div>
                </div>
              </div>
            </DragDropContext>
          ) : viewMode === 'kanban-status' ? (
            <DragDropContext onDragEnd={(result) => {
              if (!result.destination) return;
              const { source, destination, draggableId } = result;
              const taskId = draggableId;
              const sourceStatus = source.droppableId.replace('status-', '') as TaskStatus;
              const destStatus = destination.droppableId.replace('status-', '') as TaskStatus;
              if (source.droppableId === destination.droppableId && source.index === destination.index) return;
              if (sourceStatus !== destStatus) {
                updateItem(taskId, { status: destStatus, completed: destStatus === 'completed', completedAt: destStatus === 'completed' ? new Date() : undefined });
                Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
                toast.success(`Task status updated to ${destStatus.replace('_', ' ')}`);
              }
              const destGroupId = destination.droppableId;
              const destTasks = items.filter(item => { const s = item.status || 'not_started'; return destGroupId === `status-${s}` || (destGroupId === 'status-completed' && item.completed); });
              const ordered = applyTaskOrder(destTasks, destGroupId);
              const ids = ordered.map(t => t.id);
              const idx = ids.indexOf(taskId);
              if (idx !== -1) ids.splice(idx, 1);
              ids.splice(destination.index, 0, taskId);
              updateSectionOrder(destGroupId, ids);
              setOrderVersion(v => v + 1);
            }}>
              <div className="overflow-x-auto pb-4 -mx-4 px-4">
                <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                  {[
                    { id: 'not_started' as TaskStatus, label: t('grouping.notStarted'), color: '#6b7280', icon: <Circle className="h-3.5 w-3.5" />, tasks: uncompletedItems.filter(item => !item.status || item.status === 'not_started') },
                    { id: 'in_progress' as TaskStatus, label: t('grouping.inProgress'), color: '#3b82f6', icon: <Loader2 className="h-3.5 w-3.5" />, tasks: uncompletedItems.filter(item => item.status === 'in_progress') },
                    { id: 'almost_done' as TaskStatus, label: t('grouping.almostDone'), color: '#f59e0b', icon: <ClockIcon className="h-3.5 w-3.5" />, tasks: uncompletedItems.filter(item => item.status === 'almost_done') },
                    { id: 'completed' as TaskStatus, label: t('grouping.completed'), color: '#10b981', icon: <CheckCircle2 className="h-3.5 w-3.5" />, tasks: completedItems },
                  ].map((group) => {
                    const statusSectionId = `status-${group.id}`;
                    const isCollapsed = collapsedViewSections.has(statusSectionId);
                    const orderedTasks = applyTaskOrder(group.tasks, statusSectionId);
                    return (
                      <div key={group.id} className="flex-shrink-0 w-72 bg-muted/30 rounded-xl border border-border/30 overflow-hidden">
                        <button onClick={() => toggleViewSectionCollapse(statusSectionId)} className="w-full flex items-center gap-2 px-3 py-3 border-b border-border/30 hover:bg-muted/20 transition-colors" style={{ borderLeft: `4px solid ${group.color}` }}>
                          <span style={{ color: group.color }}>{group.icon}</span>
                          <span className="text-sm font-semibold flex-1 text-left">{group.label}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{group.tasks.length}</span>
                          {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </button>
                        {!isCollapsed && (
                          <Droppable droppableId={statusSectionId}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} className={cn("min-h-[200px] max-h-[400px] overflow-y-auto p-2 space-y-2", snapshot.isDraggingOver && "bg-primary/5")}>
                                {orderedTasks.length === 0 ? <div className="py-8 text-center text-sm text-muted-foreground">Drop tasks here</div> : orderedTasks.map((item, index) => (
                                  <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={cn("bg-card rounded-lg border border-border/50 shadow-sm overflow-hidden", snapshot.isDragging && "shadow-lg ring-2 ring-primary", group.id === 'completed' && "opacity-70")}>
                                        {renderTaskItem(item)}{renderSubtasksInline(item)}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </DragDropContext>
          ) : viewMode === 'timeline' ? (
            <DragDropContext onDragEnd={(result) => {
              if (!result.destination) return;
              const { source, destination, draggableId } = result;
              const taskId = draggableId;
              if (source.droppableId === destination.droppableId && source.index === destination.index) return;
              const today = new Date();
              if (source.droppableId !== destination.droppableId) {
                let newDate: Date | undefined;
                if (destination.droppableId === 'timeline-overdue') newDate = subDays(today, 1);
                else if (destination.droppableId === 'timeline-today') newDate = today;
                else if (destination.droppableId === 'timeline-tomorrow') { newDate = new Date(); newDate.setDate(newDate.getDate() + 1); }
                else if (destination.droppableId === 'timeline-thisweek') { newDate = new Date(); newDate.setDate(newDate.getDate() + 3); }
                else if (destination.droppableId === 'timeline-later') { newDate = new Date(); newDate.setDate(newDate.getDate() + 14); }
                else if (destination.droppableId === 'timeline-nodate') newDate = undefined;
                updateItem(taskId, { dueDate: newDate });
                Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
                toast.success('Task date updated');
              }
              const destGroup = destination.droppableId;
              const destGroupTasks = items.filter(item => !item.completed).filter(item => {
                const d = item.dueDate ? new Date(item.dueDate) : null;
                if (destGroup === 'timeline-overdue') return d && isBefore(d, startOfDay(today));
                if (destGroup === 'timeline-today') return d && isToday(d);
                if (destGroup === 'timeline-tomorrow') return d && isTomorrow(d);
                if (destGroup === 'timeline-thisweek') return d && isThisWeek(d) && !isToday(d) && !isTomorrow(d);
                if (destGroup === 'timeline-later') return d && !isBefore(d, startOfDay(today)) && !isThisWeek(d);
                if (destGroup === 'timeline-nodate') return !d;
                return false;
              });
              const ordered = applyTaskOrder(destGroupTasks, destGroup);
              const ids = ordered.map(t => t.id);
              const idx = ids.indexOf(taskId);
              if (idx !== -1) ids.splice(idx, 1);
              ids.splice(destination.index, 0, taskId);
              updateSectionOrder(destGroup, ids);
              setOrderVersion(v => v + 1);
              Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
            }}>
              <div className="space-y-6">
                {(() => {
                  const today = startOfDay(new Date());
                  const timelineGroups = [
                    { id: 'timeline-overdue', label: t('grouping.overdue'), tasks: uncompletedItems.filter(item => item.dueDate && isBefore(new Date(item.dueDate), today)), color: '#ef4444', icon: <AlertCircle className="h-4 w-4" /> },
                    { id: 'timeline-today', label: t('grouping.today'), tasks: uncompletedItems.filter(item => item.dueDate && isToday(new Date(item.dueDate))), color: '#3b82f6', icon: <Sun className="h-4 w-4" /> },
                    { id: 'timeline-tomorrow', label: t('grouping.tomorrow'), tasks: uncompletedItems.filter(item => item.dueDate && isTomorrow(new Date(item.dueDate))), color: '#f59e0b', icon: <CalendarIcon2 className="h-4 w-4" /> },
                    { id: 'timeline-thisweek', label: t('grouping.thisWeek'), tasks: uncompletedItems.filter(item => item.dueDate && isThisWeek(new Date(item.dueDate)) && !isToday(new Date(item.dueDate)) && !isTomorrow(new Date(item.dueDate))), color: '#10b981', icon: <CalendarIcon2 className="h-4 w-4" /> },
                    { id: 'timeline-later', label: t('grouping.later'), tasks: uncompletedItems.filter(item => item.dueDate && !isBefore(new Date(item.dueDate), today) && !isThisWeek(new Date(item.dueDate))), color: '#8b5cf6', icon: <Clock className="h-4 w-4" /> },
                    { id: 'timeline-nodate', label: t('grouping.noDate'), tasks: uncompletedItems.filter(item => !item.dueDate), color: '#6b7280', icon: <CalendarX className="h-4 w-4" /> },
                  ];
                  return (<>{timelineGroups.map((group) => {
                    const isCollapsed = collapsedViewSections.has(group.id);
                    const orderedTasks = applyTaskOrder(group.tasks, group.id);
                    return (
                      <div key={group.id} className="bg-muted/30 rounded-xl border border-border/30 overflow-hidden">
                        {renderViewModeSectionHeader(group.label, group.tasks.length, group.color, group.icon, group.id)}
                        {!isCollapsed && (
                          <Droppable droppableId={group.id}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} className={cn("p-2 space-y-2 min-h-[50px]", snapshot.isDraggingOver && "bg-primary/5")}>
                                {orderedTasks.map((item, index) => (
                                  <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={cn("bg-card rounded-lg border border-border/50", snapshot.isDragging && "shadow-lg ring-2 ring-primary")}>
                                        {renderTaskItem(item)}{renderSubtasksInline(item)}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        )}
                      </div>
                    );
                  })}{renderCompletedSectionForViewMode()}</>);
                })()}
              </div>
            </DragDropContext>
          ) : viewMode === 'progress' ? (
            <DragDropContext onDragEnd={(result) => {
              if (!result.destination) return;
              const { source, destination } = result;
              const taskId = result.draggableId;
              const destGroup = destination.droppableId;
              if (source.droppableId === destination.droppableId && source.index === destination.index) return;
              const destGroupTasks = items.filter(item => !item.completed).filter(item => {
                const hs = item.subtasks && item.subtasks.length > 0;
                const cs = hs ? item.subtasks!.filter(st => st.completed).length : 0;
                const ts = hs ? item.subtasks!.length : 0;
                const cp = hs ? cs / ts : 0;
                if (destGroup === 'progress-notstarted') return !hs || cs === 0;
                if (destGroup === 'progress-inprogress') return hs && cs > 0 && cp < 0.75;
                if (destGroup === 'progress-almostdone') return hs && cp >= 0.75 && cs < ts;
                return false;
              });
              const ordered = applyTaskOrder(destGroupTasks, destGroup);
              const ids = ordered.map(t => t.id);
              const idx = ids.indexOf(taskId);
              if (idx !== -1) ids.splice(idx, 1);
              ids.splice(destination.index, 0, taskId);
              updateSectionOrder(destGroup, ids);
              setOrderVersion(v => v + 1);
              Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
            }}>
              <div className="space-y-6">
                {(() => {
                  const notStarted = uncompletedItems.filter(item => !item.subtasks || item.subtasks.length === 0 || item.subtasks.every(st => !st.completed));
                  const inProgress = uncompletedItems.filter(item => item.subtasks && item.subtasks.length > 0 && item.subtasks.some(st => st.completed) && item.subtasks.some(st => !st.completed));
                  const almostDone = uncompletedItems.filter(item => item.subtasks && item.subtasks.length > 0 && item.subtasks.filter(st => st.completed).length >= item.subtasks.length * 0.75 && item.subtasks.some(st => !st.completed));
                  const progressGroups = [
                    { id: 'progress-notstarted', label: t('grouping.notStarted'), tasks: notStarted.filter(t => !inProgress.includes(t) && !almostDone.includes(t)), color: '#6b7280', percent: '0%' },
                    { id: 'progress-inprogress', label: t('grouping.inProgress'), tasks: inProgress.filter(t => !almostDone.includes(t)), color: '#f59e0b', percent: '25-74%' },
                    { id: 'progress-almostdone', label: t('grouping.almostDone'), tasks: almostDone, color: '#10b981', percent: '75%+' },
                  ];
                  return (<>{progressGroups.map((group) => {
                    const isCollapsed = collapsedViewSections.has(group.id);
                    const orderedTasks = applyTaskOrder(group.tasks, group.id);
                    return (
                      <div key={group.id} className="bg-muted/30 rounded-xl border border-border/30 overflow-hidden">
                        {renderViewModeSectionHeader(group.label, group.tasks.length, group.color, <TrendingUp className="h-4 w-4" />, group.id, <span className="text-xs text-muted-foreground">{group.percent}</span>)}
                        {!isCollapsed && (
                          <Droppable droppableId={group.id}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} className={cn("p-2 space-y-2 min-h-[50px]", snapshot.isDraggingOver && "bg-primary/5")}>
                                {orderedTasks.map((item, index) => (
                                  <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={cn("bg-card rounded-lg border border-border/50 overflow-hidden", snapshot.isDragging && "shadow-lg ring-2 ring-primary")}>
                                        {renderTaskItem(item)}{renderSubtasksInline(item)}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        )}
                      </div>
                    );
                  })}{renderCompletedSectionForViewMode()}</>);
                })()}
              </div>
            </DragDropContext>
          ) : viewMode === 'priority' ? (
            <DragDropContext onDragEnd={(result) => {
              if (!result.destination) return;
              const { source, destination, draggableId } = result;
              const taskId = draggableId;
              const destGroup = destination.droppableId;
              if (source.droppableId === destination.droppableId && source.index === destination.index) return;
              if (source.droppableId !== destGroup) {
                let newPriority: Priority = 'none';
                if (destGroup === 'priority-high') newPriority = 'high';
                else if (destGroup === 'priority-medium') newPriority = 'medium';
                else if (destGroup === 'priority-low') newPriority = 'low';
                updateItem(taskId, { priority: newPriority });
                Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
                toast.success(t('todayPage.priorityUpdated'));
              }
              const destGroupTasks = items.filter(item => !item.completed).filter(item => {
                if (destGroup === 'priority-high') return item.priority === 'high';
                if (destGroup === 'priority-medium') return item.priority === 'medium';
                if (destGroup === 'priority-low') return item.priority === 'low';
                if (destGroup === 'priority-none') return !item.priority || item.priority === 'none';
                return false;
              });
              const ordered = applyTaskOrder(destGroupTasks, destGroup);
              const ids = ordered.map(t => t.id);
              const idx = ids.indexOf(taskId);
              if (idx !== -1) ids.splice(idx, 1);
              ids.splice(destination.index, 0, taskId);
              updateSectionOrder(destGroup, ids);
              setOrderVersion(v => v + 1);
              Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
            }}>
              <div className="space-y-6">
                {(() => {
                  const priorityGroups = [
                    { id: 'priority-high', label: t('grouping.highPriority', 'High Priority'), tasks: uncompletedItems.filter(i => i.priority === 'high'), color: getPriorityColor('high'), icon: <Flame className="h-4 w-4" style={{ color: getPriorityColor('high') }} /> },
                    { id: 'priority-medium', label: t('grouping.mediumPriority', 'Medium Priority'), tasks: uncompletedItems.filter(i => i.priority === 'medium'), color: getPriorityColor('medium'), icon: <Flag className="h-4 w-4" style={{ color: getPriorityColor('medium') }} /> },
                    { id: 'priority-low', label: t('grouping.lowPriority', 'Low Priority'), tasks: uncompletedItems.filter(i => i.priority === 'low'), color: getPriorityColor('low'), icon: <Flag className="h-4 w-4" style={{ color: getPriorityColor('low') }} /> },
                    { id: 'priority-none', label: t('grouping.noPriority', 'No Priority'), tasks: uncompletedItems.filter(i => !i.priority || i.priority === 'none'), color: getPriorityColor('none'), icon: <Flag className="h-4 w-4" style={{ color: getPriorityColor('none') }} /> },
                  ];
                  return (<>{priorityGroups.map((group) => {
                    const isCollapsed = collapsedViewSections.has(group.id);
                    const orderedTasks = applyTaskOrder(group.tasks, group.id);
                    return (
                      <div key={group.id} className="bg-muted/30 rounded-xl border border-border/30 overflow-hidden">
                        {renderViewModeSectionHeader(group.label, group.tasks.length, group.color, group.icon, group.id)}
                        {!isCollapsed && (
                          <Droppable droppableId={group.id}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} className={cn("p-2 space-y-2 min-h-[50px]", snapshot.isDraggingOver && "bg-primary/5")}>
                                {orderedTasks.map((item, index) => (
                                  <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={cn("bg-card rounded-lg border border-border/50 overflow-hidden", snapshot.isDragging && "shadow-lg ring-2 ring-primary")}>
                                        {renderTaskItem(item)}{renderSubtasksInline(item)}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        )}
                      </div>
                    );
                  })}{renderCompletedSectionForViewMode()}</>);
                })()}
              </div>
            </DragDropContext>
          ) : viewMode === 'history' ? (
            <div className="space-y-6">
              {(() => {
                const historyGroups = [
                  { label: t('grouping.completedToday', 'Completed Today'), tasks: completedItems.filter(item => item.dueDate && isToday(new Date(item.dueDate))), color: '#10b981' },
                  { label: t('grouping.completedYesterday', 'Completed Yesterday'), tasks: completedItems.filter(item => item.dueDate && isYesterday(new Date(item.dueDate))), color: '#3b82f6' },
                  { label: t('grouping.thisWeek', 'This Week'), tasks: completedItems.filter(item => item.dueDate && isThisWeek(new Date(item.dueDate)) && !isToday(new Date(item.dueDate)) && !isYesterday(new Date(item.dueDate))), color: '#8b5cf6' },
                  { label: t('grouping.older', 'Older'), tasks: completedItems.filter(item => !item.dueDate || (!isThisWeek(new Date(item.dueDate)))), color: '#6b7280' },
                ];
                return historyGroups.filter(g => g.tasks.length > 0).length === 0 ? (
                  <div className="text-center py-20"><History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">{t('emptyStates.noCompletedTasks')}</p></div>
                ) : (<>{historyGroups.filter(g => g.tasks.length > 0).map((group) => {
                  const sectionId = `history-${group.label.toLowerCase().replace(/\s+/g, '-')}`;
                  const isCollapsed = collapsedViewSections.has(sectionId);
                  return (
                    <div key={group.label} className="bg-muted/30 rounded-xl border border-border/30 overflow-hidden">
                      {renderViewModeSectionHeader(group.label, group.tasks.length, group.color, <CheckCircle2 className="h-4 w-4" />, sectionId)}
                      {!isCollapsed && <div className="p-2 space-y-2">{group.tasks.map((item) => (<div key={item.id} className="bg-card rounded-lg border border-border/50 opacity-70">{renderTaskItem(item)}</div>))}</div>}
                    </div>
                  );
                })}</>);
              })()}
            </div>
          ) : groupByOption !== 'none' ? (
            <DragDropContext onDragEnd={(result) => {
              if (!result.destination) return;
              const { source, destination, draggableId } = result;
              const taskId = draggableId;
              const sourceGroup = source.droppableId.replace('grouped-', '');
              const destGroup = destination.droppableId.replace('grouped-', '');
              if (source.droppableId === destination.droppableId && source.index === destination.index) return;
              if (sourceGroup !== destGroup) {
                if (groupByOption === 'priority') {
                  const priorityMap: Record<string, Priority> = { 'high': 'high', 'medium': 'medium', 'low': 'low', 'none': 'none' };
                  updateItem(taskId, { priority: priorityMap[destGroup] || 'none' });
                  toast.success(t('todayPage.priorityUpdated'));
                } else if (groupByOption === 'section') {
                  updateItem(taskId, { sectionId: destGroup });
                  toast.success(t('todayPage.sectionMoved'));
                } else if (groupByOption === 'date') {
                  const today = new Date();
                  let newDate: Date | undefined;
                  if (destGroup === 'overdue') newDate = subDays(today, 1);
                  else if (destGroup === 'today') newDate = today;
                  else if (destGroup === 'tomorrow') { newDate = new Date(); newDate.setDate(newDate.getDate() + 1); }
                  else if (destGroup === 'this-week') { newDate = new Date(); newDate.setDate(newDate.getDate() + 3); }
                  else if (destGroup === 'later') { newDate = new Date(); newDate.setDate(newDate.getDate() + 14); }
                  else if (destGroup === 'no-date') newDate = undefined;
                  updateItem(taskId, { dueDate: newDate });
                  toast.success(t('todayPage.dateUpdated', 'Date updated'));
                }
                Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
              }
              updateSectionOrder(`grouped-${destGroup}`, [taskId]);
              setOrderVersion(v => v + 1);
            }}>
              <div className="space-y-4">
                {(() => {
                  let groups: { id: string; label: string; color: string; icon: React.ReactNode; tasks: TodoItem[] }[] = [];
                  if (groupByOption === 'section') {
                    groups = sortedSections.map(section => ({ id: section.id, label: section.name, color: section.color, icon: <Columns3 className="h-4 w-4" style={{ color: section.color }} />, tasks: uncompletedItems.filter(item => item.sectionId === section.id || (!item.sectionId && section.id === sections[0]?.id)) }));
                  } else if (groupByOption === 'priority') {
                    groups = [
                      { id: 'high', label: t('grouping.highPriority'), color: getPriorityColor('high'), icon: <Flame className="h-4 w-4" style={{ color: getPriorityColor('high') }} />, tasks: uncompletedItems.filter(i => i.priority === 'high') },
                      { id: 'medium', label: t('grouping.mediumPriority'), color: getPriorityColor('medium'), icon: <Flag className="h-4 w-4" style={{ color: getPriorityColor('medium') }} />, tasks: uncompletedItems.filter(i => i.priority === 'medium') },
                      { id: 'low', label: t('grouping.lowPriority'), color: getPriorityColor('low'), icon: <Flag className="h-4 w-4" style={{ color: getPriorityColor('low') }} />, tasks: uncompletedItems.filter(i => i.priority === 'low') },
                      { id: 'none', label: t('grouping.noPriority'), color: getPriorityColor('none'), icon: <Flag className="h-4 w-4" style={{ color: getPriorityColor('none') }} />, tasks: uncompletedItems.filter(i => !i.priority || i.priority === 'none') },
                    ];
                  } else if (groupByOption === 'date') {
                    const today = startOfDay(new Date());
                    groups = [
                      { id: 'overdue', label: t('grouping.overdue'), color: '#ef4444', icon: <AlertCircle className="h-4 w-4 text-destructive" />, tasks: uncompletedItems.filter(i => i.dueDate && isBefore(new Date(i.dueDate), today)) },
                      { id: 'today', label: t('grouping.today'), color: '#3b82f6', icon: <Sun className="h-4 w-4 text-info" />, tasks: uncompletedItems.filter(i => i.dueDate && isToday(new Date(i.dueDate))) },
                      { id: 'tomorrow', label: t('grouping.tomorrow'), color: '#f59e0b', icon: <CalendarIcon2 className="h-4 w-4 text-warning" />, tasks: uncompletedItems.filter(i => i.dueDate && isTomorrow(new Date(i.dueDate))) },
                      { id: 'this-week', label: t('grouping.thisWeek'), color: '#10b981', icon: <CalendarIcon2 className="h-4 w-4 text-success" />, tasks: uncompletedItems.filter(i => i.dueDate && isThisWeek(new Date(i.dueDate)) && !isToday(new Date(i.dueDate)) && !isTomorrow(new Date(i.dueDate))) },
                      { id: 'later', label: t('grouping.later'), color: '#8b5cf6', icon: <Clock className="h-4 w-4 text-accent-purple" />, tasks: uncompletedItems.filter(i => i.dueDate && !isBefore(new Date(i.dueDate), today) && !isThisWeek(new Date(i.dueDate))) },
                      { id: 'no-date', label: t('grouping.noDate'), color: '#6b7280', icon: <CalendarX className="h-4 w-4 text-muted-foreground" />, tasks: uncompletedItems.filter(i => !i.dueDate) },
                    ];
                  }
                  return groups.map(group => {
                    const groupSectionId = `group-${groupByOption}-${group.id}`;
                    const isCollapsed = collapsedViewSections.has(groupSectionId);
                    const orderedTasks = applyTaskOrder(group.tasks, `grouped-${group.id}`);
                    return (
                      <div key={group.id} className="bg-muted/30 rounded-xl border border-border/30 overflow-hidden">
                        <button onClick={() => toggleViewSectionCollapse(groupSectionId)} className="w-full flex items-center gap-2 px-3 py-3 border-b border-border/30 hover:bg-muted/20 transition-colors" style={{ borderLeft: `4px solid ${group.color}` }}>
                          {group.icon}
                          <span className="text-sm font-semibold flex-1 text-left">{group.label}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{group.tasks.length}</span>
                          {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </button>
                        {!isCollapsed && (
                          <Droppable droppableId={`grouped-${group.id}`}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} className={cn("p-2 space-y-1 min-h-[40px]", compactMode && "p-1 space-y-0", snapshot.isDraggingOver && "bg-primary/5")}>
                                {orderedTasks.length === 0 ? <div className="py-4 text-center text-sm text-muted-foreground">{t('todayPage.dropTasksHere')}</div> : orderedTasks.map((item, index) => (
                                  <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={cn("bg-card rounded-lg border border-border/50", snapshot.isDragging && "shadow-lg ring-2 ring-primary")}>
                                        {renderTaskItem(item)}{renderSubtasksInline(item)}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        )}
                      </div>
                    );
                  });
                })()}
                {showCompleted && completedItems.length > 0 && (
                  <Collapsible open={isCompletedOpen} onOpenChange={setIsCompletedOpen}>
                    <div className="bg-muted/50 rounded-xl p-3 border border-border/30">
                      <CollapsibleTrigger asChild>
                        <button className="w-full flex items-center justify-between px-2 py-2 hover:bg-muted/60 rounded-lg transition-colors">
                          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('grouping.completed')}</span>
                          <div className="flex items-center gap-2 text-muted-foreground"><span className="text-sm font-medium">{completedItems.length}</span>{isCompletedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className={cn("space-y-2 mt-2", compactMode && "space-y-1 mt-1")}>{completedItems.map(renderTaskItem)}</CollapsibleContent>
                    </div>
                  </Collapsible>
                )}
              </div>
            </DragDropContext>
          ) : (
            /* Default Flat Mode with Sections + Drag & Drop */
            <DragDropContext onDragEnd={(result) => {
              if (!result.destination) return;
              const { source, destination, draggableId, type } = result;
              if (type === 'SECTION') { handleSectionDragEnd(result); return; }
              const taskId = draggableId;
              const sourceSectionId = source.droppableId.replace('flat-section-', '');
              const destSectionId = destination.droppableId.replace('flat-section-', '');
              const destIndex = destination.index;
              if (source.droppableId === destination.droppableId && source.index === destination.index) return;
              if (sourceSectionId !== destSectionId) {
                const actualDestSectionId = destSectionId === 'default' ? sections[0]?.id : destSectionId;
                updateItem(taskId, { sectionId: actualDestSectionId });
              }
              const destSectionTasks = uncompletedItems.filter(item => {
                const actualDestId = destSectionId === 'default' ? sections[0]?.id : destSectionId;
                return item.sectionId === actualDestId || (!item.sectionId && actualDestId === sections[0]?.id);
              });
              const currentlyOrderedTasks = applyTaskOrder(destSectionTasks, `flat-section-${destSectionId}`);
              const currentOrderIds = currentlyOrderedTasks.map(t => t.id);
              const taskCurrentIndex = currentOrderIds.indexOf(taskId);
              if (taskCurrentIndex !== -1) currentOrderIds.splice(taskCurrentIndex, 1);
              currentOrderIds.splice(destIndex, 0, taskId);
              updateSectionOrder(`flat-section-${destSectionId}`, currentOrderIds);
              setOrderVersion(v => v + 1);
              Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
            }}>
              <div className="space-y-4">
                {sortedSections.map((section) => {
                  const sectionTasks = uncompletedItems.filter(item => item.sectionId === section.id || (!item.sectionId && section.id === sections[0]?.id));
                  const sectionId = section.id === sections[0]?.id ? 'default' : section.id;
                  const isCollapsed = collapsedViewSections.has(`flat-${section.id}`);
                  const orderedTasks = applyTaskOrder(sectionTasks, `flat-section-${sectionId}`);
                  return (
                    <div key={section.id} className="bg-muted/30 rounded-xl border border-border/30 overflow-hidden">
                      {renderSectionHeader(section, false)}
                      {!isCollapsed && (
                        <Droppable droppableId={`flat-section-${sectionId}`}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className={cn("p-2 space-y-1 min-h-[40px]", compactMode && "p-1 space-y-0", snapshot.isDraggingOver && "bg-primary/5")}>
                              {orderedTasks.length === 0 ? (
                                <div className={cn("text-center text-sm text-muted-foreground", compactMode ? "py-2 px-2" : "py-4 px-4")}>{t('emptyStates.noTasksInSection')}</div>
                              ) : orderedTasks.map((item, index) => (
                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={cn("bg-card rounded-lg border border-border/50", snapshot.isDragging && "shadow-lg ring-2 ring-primary")}>
                                      {renderTaskItem(item)}{renderSubtasksInline(item)}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      )}
                    </div>
                  );
                })}
                {showCompleted && completedItems.length > 0 && (
                  <Collapsible open={isCompletedOpen} onOpenChange={setIsCompletedOpen}>
                    <div className="bg-muted/50 rounded-xl p-3 border border-border/30">
                      <CollapsibleTrigger asChild>
                        <button className="w-full flex items-center justify-between px-2 py-2 hover:bg-muted/60 rounded-lg transition-colors">
                          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('grouping.completed')}</span>
                          <div className="flex items-center gap-2 text-muted-foreground"><span className="text-sm font-medium">{completedItems.length}</span>{isCompletedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className={cn("space-y-2 mt-2", compactMode && "space-y-1 mt-1")}>{completedItems.map(renderTaskItem)}</CollapsibleContent>
                    </div>
                  </Collapsible>
                )}
              </div>
            </DragDropContext>
          )}
        </div>
      </main>

      <Button data-tour="todo-add-task" onClick={async () => { try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {} setIsInputOpen(true); }} className="fixed left-4 right-4 z-30 h-12 text-base font-semibold" style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }} size="lg">
        <Plus className="h-5 w-5" />{t('tasks.addTask')}
      </Button>

      {/* All sheets/dialogs extracted to TodaySheets */}
      <TodaySheets
        isInputOpen={isInputOpen}
        onCloseInput={() => { setIsInputOpen(false); setInputSectionId(null); }}
        onAddTask={handleAddTask}
        folders={folders}
        selectedFolderId={selectedFolderId}
        onCreateFolder={handleCreateFolder}
        sections={sections}
        inputSectionId={inputSectionId}
        selectedTask={selectedTask}
        items={items}
        onCloseTask={() => setSelectedTask(null)}
        onUpdateTask={(updatedTask) => setSelectedTask(updatedTask)}
        updateItem={updateItem}
        onDeleteTask={deleteItem}
        onDuplicateTask={duplicateTask}
        onConvertToNote={handleConvertSingleTask}
        onMoveTaskToFolder={handleMoveTaskToFolder}
        isFilterSheetOpen={isFilterSheetOpen}
        onCloseFilter={() => setIsFilterSheetOpen(false)}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        selectedTags={tagFilter}
        onTagsChange={setTagFilter}
        onFolderChange={setSelectedFolderId}
        onClearAll={handleClearFilters}
        isSaveSmartViewOpen={isSaveSmartViewOpen}
        onOpenSaveSmartView={() => setIsSaveSmartViewOpen(true)}
        onCloseSaveSmartView={() => setIsSaveSmartViewOpen(false)}
        onSmartViewSaved={() => loadCustomSmartViews().then(setCustomSmartViews)}
        isDuplicateSheetOpen={isDuplicateSheetOpen}
        onCloseDuplicate={() => setIsDuplicateSheetOpen(false)}
        onDuplicate={handleDuplicate}
        isFolderManageOpen={isFolderManageOpen}
        onCloseFolderManage={() => setIsFolderManageOpen(false)}
        onEditFolder={handleEditFolder}
        onDeleteFolder={handleDeleteFolder}
        onReorderFolders={handleReorderFolders}
        onToggleFolderFavorite={handleToggleFolderFavorite}
        isAutoScheduleOpen={isAutoScheduleOpen}
        onCloseAutoSchedule={() => setIsAutoScheduleOpen(false)}
        onApplySchedule={(updated) => { setItems(updated); toast.success(t('todayPage.scheduleApplied', 'Schedule applied!'), { icon: '📅' }); }}
        isMoveToFolderOpen={isMoveToFolderOpen}
        onCloseMoveToFolder={() => setIsMoveToFolderOpen(false)}
        onMoveToFolder={handleMoveToFolder}
        isSelectActionsOpen={isSelectActionsOpen}
        onCloseSelectActions={() => setIsSelectActionsOpen(false)}
        selectedCount={selectedTaskIds.size}
        onSelectAction={handleSelectAction}
        totalCount={uncompletedItems.length}
        isPrioritySheetOpen={isPrioritySheetOpen}
        onClosePriority={() => setIsPrioritySheetOpen(false)}
        onSetPriority={handleSetPriority}
        isBatchTaskOpen={isBatchTaskOpen}
        onCloseBatchTask={() => setIsBatchTaskOpen(false)}
        onBatchAddTasks={handleBatchAddTasks}
        isSectionEditOpen={isSectionEditOpen}
        onCloseSectionEdit={() => { setIsSectionEditOpen(false); setEditingSection(null); }}
        editingSection={editingSection}
        onSaveSection={handleSaveSection}
        isSectionMoveOpen={isSectionMoveOpen}
        onCloseSectionMove={() => { setIsSectionMoveOpen(false); setEditingSection(null); }}
        onMoveToPosition={(targetIndex) => editingSection && handleMoveSection(editingSection.id, targetIndex)}
        selectedSubtask={selectedSubtask}
        onCloseSubtask={() => setSelectedSubtask(null)}
        onUpdateSubtask={handleUpdateSubtaskFromSheet}
        onDeleteSubtask={handleDeleteSubtaskFromSheet}
        onConvertSubtaskToTask={handleConvertSubtaskToTask}
        isTaskOptionsOpen={isTaskOptionsOpen}
        onCloseTaskOptions={() => setIsTaskOptionsOpen(false)}
        groupBy={groupBy}
        sortBy={optionsSortBy}
        onGroupByChange={setGroupBy}
        onSortByChange={setOptionsSortBy}
        defaultSectionId={defaultSectionId}
        onDefaultSectionChange={setDefaultSectionId}
        taskAddPosition={taskAddPosition}
        onTaskAddPositionChange={setTaskAddPosition}
        hideDetailsOptions={hideDetailsOptions}
        onHideDetailsOptionsChange={setHideDetailsOptions}
        selectedImage={selectedImage}
        onCloseImage={() => setSelectedImage(null)}
        isLocationMapOpen={isLocationMapOpen}
        onCloseLocationMap={setIsLocationMapOpen}
        onLocationTaskClick={(task) => { setSelectedTask(task); setIsLocationMapOpen(false); }}
        isBulkDateSheetOpen={isBulkDateSheetOpen}
        onCloseBulkDate={() => setIsBulkDateSheetOpen(false)}
        onBulkSetDate={(date) => { setItems(items.map(i => selectedTaskIds.has(i.id) ? { ...i, dueDate: date } : i)); setSelectedTaskIds(new Set()); setIsSelectionMode(false); toast.success(t('todayPage.bulkDateSet', { count: selectedTaskIds.size })); }}
        isBulkReminderSheetOpen={isBulkReminderSheetOpen}
        onCloseBulkReminder={() => setIsBulkReminderSheetOpen(false)}
        onBulkSetReminder={(date) => { setItems(items.map(i => selectedTaskIds.has(i.id) ? { ...i, reminderTime: date } : i)); setSelectedTaskIds(new Set()); setIsSelectionMode(false); toast.success(t('todayPage.bulkReminderSet', { count: selectedTaskIds.size })); }}
        isBulkRepeatSheetOpen={isBulkRepeatSheetOpen}
        onCloseBulkRepeat={() => setIsBulkRepeatSheetOpen(false)}
        onBulkSetRepeat={(repeatType) => { setItems(items.map(i => selectedTaskIds.has(i.id) ? { ...i, repeatType: repeatType as TodoItem['repeatType'] } : i)); setSelectedTaskIds(new Set()); setIsSelectionMode(false); toast.success(t('todayPage.bulkRepeatSet', { count: selectedTaskIds.size })); }}
        isBulkSectionMoveOpen={isBulkSectionMoveOpen}
        onCloseBulkSectionMove={() => setIsBulkSectionMoveOpen(false)}
        onBulkMoveToSection={(sectionId) => { setItems(items.map(i => selectedTaskIds.has(i.id) ? { ...i, sectionId } : i)); setSelectedTaskIds(new Set()); setIsSelectionMode(false); toast.success(t('todayPage.bulkSectionMoved', { count: selectedTaskIds.size })); }}
        isBulkStatusOpen={isBulkStatusOpen}
        onCloseBulkStatus={() => setIsBulkStatusOpen(false)}
        onBulkStatusChange={(status) => {
          const isCompleting = status === 'completed';
          const now = new Date();
          setItems(items.map(i => selectedTaskIds.has(i.id) ? { ...i, status: status as TodoItem['status'], completed: isCompleting ? true : i.completed, completedAt: isCompleting ? now : i.completedAt, modifiedAt: now } : i));
          setSelectedTaskIds(new Set()); setIsSelectionMode(false);
          if (isCompleting) playCompletionSound();
          toast.success(t('todayPage.bulkStatusSet', { count: selectedTaskIds.size }));
        }}
        deleteConfirmItem={deleteConfirmItem}
        onCloseDeleteConfirm={() => setDeleteConfirmItem(null)}
        onConfirmDelete={confirmDelete}
        swipeMoveTaskId={swipeMoveTaskId}
        onCloseSwipeMove={() => setSwipeMoveTaskId(null)}
        onSwipeMoveFolder={(folderId) => { if (swipeMoveTaskId) { updateItem(swipeMoveTaskId, { folderId: folderId || undefined }); toast.success(t('tasks.movedToFolder', 'Task moved to folder')); } setSwipeMoveTaskId(null); }}
        onSwipeMoveSection={(sectionId) => { if (swipeMoveTaskId) { updateItem(swipeMoveTaskId, { sectionId: sectionId || undefined }); toast.success(t('tasks.movedToSection', 'Task moved to section')); } setSwipeMoveTaskId(null); }}
        swipeMoveCurrentFolderId={items.find(i => i.id === swipeMoveTaskId)?.folderId}
        swipeMoveCurrentSectionId={items.find(i => i.id === swipeMoveTaskId)?.sectionId}
        swipeDateTaskId={swipeDateTaskId}
        onCloseSwipeDate={() => setSwipeDateTaskId(null)}
        onSwipeDateSet={(taskId, date) => { updateItem(taskId, { dueDate: date }); }}
        showStreakChallenge={showStreakChallenge}
        onCloseStreakChallenge={closeStreakChallenge}
        currentStreak={streakData?.currentStreak || 0}
        streakWeekData={streakWeekData}
      />
    </TodoLayout>
  );
};

export default Today;
