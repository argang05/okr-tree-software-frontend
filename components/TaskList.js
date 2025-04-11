'use client';

import { useState, useEffect, useCallback } from 'react';
import { tasksAPI, authAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Edit2, Trash2 } from 'lucide-react';
import TaskForm from '@/components/TaskForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TaskList({ objectiveId, onRefresh }) {
  const [tasks, setTasks] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Function to refresh tasks
  const refreshTasks = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all tasks for the objective
      const tasksResponse = await tasksAPI.getTasksByObjective(objectiveId);
      setTasks(tasksResponse.data || []);
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      toast.error('Failed to refresh tasks');
    } finally {
      setLoading(false);
    }
  }, [objectiveId]);
  
  // Fetch tasks and users map
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get all tasks for the objective
        const tasksResponse = await tasksAPI.getTasksByObjective(objectiveId);
        setTasks(tasksResponse.data || []);
        
        // Get users map for displaying assigned names
        const usersMapResponse = await authAPI.getUsersMap();
        setUsersMap(usersMapResponse.data || {});
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast.error('Failed to load tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [objectiveId]);

  // Listen for refresh calls from parent
  useEffect(() => {
    if (onRefresh && typeof onRefresh === 'function') {
      onRefresh(refreshTasks);
    }
  }, [onRefresh, refreshTasks]);
  
  // Listen for task refresh events
  useEffect(() => {
    const handleTaskRefresh = (event) => {
      if (event.detail.objectiveId === objectiveId) {
        // If we got a new task directly, add it to the list without a full refresh
        if (event.detail.createdTask) {
          setTasks(prev => [...prev, event.detail.createdTask]);
        } else {
          // Otherwise do a full refresh
          refreshTasks();
        }
      }
    };
    
    // Add event listener
    document.addEventListener('refreshTasks', handleTaskRefresh);
    
    // Cleanup
    return () => {
      document.removeEventListener('refreshTasks', handleTaskRefresh);
    };
  }, [objectiveId, refreshTasks]);
  
  // Get formatted date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Get assignees names from IDs
  const getAssigneeNames = (assignedTo) => {
    if (!assignedTo || assignedTo.length === 0) {
      return 'Not assigned';
    }
    
    return assignedTo
      .map(empId => usersMap[empId] || empId)
      .join(', ');
  };
  
  // Handle opening task deletion alert
  const openDeleteAlert = (taskId) => {
    setTaskToDelete(taskId);
    setShowDeleteAlert(true);
  };
  
  // Handle task deletion
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      await tasksAPI.deleteTask(taskToDelete);
      
      // Update local state by removing the deleted task
      setTasks(tasks.filter(task => task.id !== taskToDelete));
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task. Please try again.');
    } finally {
      setShowDeleteAlert(false);
      setTaskToDelete(null);
    }
  };
  
  // Handle opening task details
  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };
  
  // Handle opening update form
  const openUpdateForm = (task) => {
    setSelectedTask(task);
    setShowUpdateForm(true);
  };
  
  // Handle opening progress dialog
  const openProgressDialog = (task) => {
    setSelectedTask(task);
    setProgress(task.progressPercentage || 0);
    setShowProgressDialog(true);
  };
  
  // Update task progress
  const updateTaskProgress = async () => {
    if (!selectedTask) return;
    
    try {
      setIsUpdating(true);
      
      const updatedTaskData = {
        ...selectedTask,
        progressPercentage: progress,
      };
      
      const response = await tasksAPI.updateTask(selectedTask.id, updatedTaskData);
      
      // Update the task in local state
      setTasks(tasks.map(task => 
        task.id === selectedTask.id 
          ? { ...task, progressPercentage: progress } 
          : task
      ));
      
      setShowProgressDialog(false);
      toast.success('Task progress updated successfully');
    } catch (error) {
      console.error('Error updating task progress:', error);
      toast.error('Failed to update task progress. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle task update success
  const handleTaskUpdated = (updatedTask) => {
    setShowUpdateForm(false);
    
    // Refresh the tasks list
    tasksAPI.getTasksByObjective(objectiveId)
      .then(response => {
        setTasks(response.data || []);
      })
      .catch(error => {
        console.error('Error refreshing tasks:', error);
      });
  };
  
  // Get status color class
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };
  
  if (loading) {
    return (
      <div className="py-4 text-center">
        <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-sm text-slate-500">Loading tasks...</p>
      </div>
    );
  }
  
  if (tasks.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-slate-500">No tasks found for this objective.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3 mt-2">
      <h3 className="text-sm font-medium">Tasks ({tasks.length})</h3>
      
      {tasks.map(task => (
        <div 
          key={task.id} 
          className="border border-slate-200 rounded-md p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => openTaskDetails(task)}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-sm">{task.title}</h4>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
          </div>
          
          <div className="text-xs text-slate-500 mb-2">
            Due: {formatDate(task.dueDate)}
          </div>
          
          <div className="mt-2">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Progress</span>
              <span>{task.progressPercentage}%</span>
            </div>
            <Progress value={task.progressPercentage} className="h-1.5" />
          </div>
        </div>
      ))}
      
      {/* Task Details Dialog */}
      <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-500">Description</h4>
                <p className="mt-1">{selectedTask?.description}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-500">Status</h4>
                <div className="mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedTask?.status)}`}>
                    {selectedTask?.status}
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-500">Due Date</h4>
                <p className="mt-1">{selectedTask && formatDate(selectedTask.dueDate)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-500">Assigned To</h4>
                <p className="mt-1">{selectedTask && getAssigneeNames(selectedTask.assignedTo)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-500">Progress</h4>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Completion</span>
                    <span>{selectedTask?.progressPercentage}%</span>
                  </div>
                  <Progress value={selectedTask?.progressPercentage} className="h-2" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTaskDetails(false);
                  openUpdateForm(selectedTask);
                }}
              >
                <Edit2 size={14} />
                <span>Edit Task</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-red-500 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTaskDetails(false);
                  openDeleteAlert(selectedTask.id);
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </Button>
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setShowTaskDetails(false);
                openProgressDialog(selectedTask);
              }}
            >
              Update Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Update Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Progress</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Progress Percentage</label>
                  <span className="text-sm">{progress}%</span>
                </div>
                <Slider
                  value={[progress]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(vals) => setProgress(vals[0])}
                />
              </div>
              
              <div className="flex justify-center">
                <div className="relative h-32 w-32">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{progress}%</span>
                  </div>
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle
                      className="text-slate-200"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-blue-500"
                      strokeWidth="8"
                      strokeDasharray={`${(2 * Math.PI * 40) * (progress / 100)} ${2 * Math.PI * 40}`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowProgressDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={updateTaskProgress}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update Progress"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Update Task Form */}
      {selectedTask && (
        <TaskForm
          isOpen={showUpdateForm}
          onClose={() => setShowUpdateForm(false)}
          onSuccess={handleTaskUpdated}
          objectiveId={objectiveId}
          task={selectedTask}
          isUpdate={true}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this task.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 