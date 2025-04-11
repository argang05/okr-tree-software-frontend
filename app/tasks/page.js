'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { authAPI, tasksAPI } from '@/lib/api';
import { toast } from 'sonner';
import Header from '@/components/Header';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function Tasks() {
  const { user, loading } = useUser();
  const [tasks, setTasks] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch tasks for the logged-in user
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.empId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch tasks
        const tasksResponse = await authAPI.getUserTasks(user.empId);
        setTasks(tasksResponse.data || []);
        
        // Fetch users map
        const usersMapResponse = await authAPI.getUsersMap();
        setUsersMap(usersMapResponse.data || {});
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast.error('Failed to load tasks. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Open task dialog for updating progress
  const openTaskDialog = (task) => {
    setSelectedTask(task);
    setProgress(task.progressPercentage || 0);
    setIsDialogOpen(true);
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
      
      await tasksAPI.updateTask(selectedTask.id, updatedTaskData);
      
      // Update local state with new progress
      setTasks(tasks.map(task => 
        task.id === selectedTask.id 
          ? { ...task, progressPercentage: progress } 
          : task
      ));
      
      toast.success('Task progress updated successfully!');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task progress. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Render task assignees
  const renderAssignees = (assignedTo) => {
    if (!assignedTo || !assignedTo.length) return 'Not assigned';
    
    return assignedTo.map(empId => usersMap[empId] || empId).join(', ');
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading your tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Your Tasks</h1>
          <p className="text-slate-600">Manage and track your assigned tasks</p>
        </div>

        {tasks.length === 0 ? (
          <Card className="w-full">
            <CardContent className="py-10">
              <div className="text-center">
                <h3 className="text-lg font-medium text-slate-700">No tasks assigned</h3>
                <p className="text-slate-500 mt-2">{"You currently don't have any tasks assigned to you."}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <Card key={task.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <CardDescription>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="mb-4">
                    <p className="text-sm text-slate-600">{task.description}</p>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{task.progressPercentage}%</span>
                    </div>
                    <Progress value={task.progressPercentage} className="h-2" />
                  </div>
                  <div className="mt-4 text-sm">
                    <p className="text-slate-500">
                      <span className="font-semibold">Assigned to:</span>{' '}
                      {renderAssignees(task.assignedTo)}
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => openTaskDialog(task)} 
                    variant="outline" 
                    className="w-full"
                  >
                    Update Progress
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Update Task Progress Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Task Progress</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="mb-6">
                <h3 className="font-medium">{selectedTask?.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedTask?.description}</p>
              </div>
              
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
                onClick={() => setIsDialogOpen(false)}
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
      </div>
    </div>
  );
} 