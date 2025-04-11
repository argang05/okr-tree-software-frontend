'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { tasksAPI, authAPI } from '@/lib/api';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function TaskForm({
  isOpen,
  onClose,
  onSuccess,
  objectiveId,
  task = null,
  isUpdate = false,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usersMap, setUsersMap] = useState({});
  const [usersArray, setUsersArray] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const { register, handleSubmit, setValue, reset, control, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      assignedTo: [],
      progressPercentage: 0,
    },
  });
  
  // Fetch users map for the select dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await authAPI.getUsersMap();
        setUsersMap(response.data || {});
        
        // Convert map to array format for select options
        const userOptions = Object.entries(response.data || {}).map(([empId, name]) => ({
          value: empId,
          label: `${name} (${empId})`,
        }));
        
        setUsersArray(userOptions);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load user list');
      }
    };
    
    fetchUsers();
  }, []);
  
  // Set form values when editing an existing task
  useEffect(() => {
    if (isUpdate && task) {
      setValue('title', task.title || '');
      setValue('description', task.description || '');
      setValue('dueDate', task.dueDate || '');
      setValue('status', task.status || 'PENDING');
      setValue('assignedTo', task.assignedTo || []);
      setValue('progressPercentage', task.progressPercentage || 0);
      
      setSelectedUsers(task.assignedTo || []);
    }
  }, [isUpdate, task, setValue, isOpen]);
  
  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      reset({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'PENDING',
        assignedTo: [],
        progressPercentage: 0,
      });
      setSelectedUsers([]);
    }
  }, [isOpen, reset]);
  
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Make sure assignedTo is always an array
      const taskData = {
        ...data,
        assignedTo: selectedUsers,
      };
      
      let createdOrUpdatedTask;
      
      if (isUpdate) {
        // Update existing task
        const response = await tasksAPI.updateTask(task.id, taskData);
        createdOrUpdatedTask = response.data;
        toast.success('Task updated successfully');
      } else {
        // Create new task
        const response = await tasksAPI.addTaskToObjective(objectiveId, taskData);
        createdOrUpdatedTask = response.data;
        toast.success('Task created successfully');
      }
      
      // Pass the updated task to onSuccess
      onSuccess(createdOrUpdatedTask);
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(error.response?.data?.message || 'Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Toggle user selection
  const toggleUserSelection = (empId) => {
    setSelectedUsers(prev => {
      if (prev.includes(empId)) {
        return prev.filter(id => id !== empId);
      } else {
        return [...prev, empId];
      }
    });
    
    // Also update the form value
    const newSelection = selectedUsers.includes(empId)
      ? selectedUsers.filter(id => id !== empId)
      : [...selectedUsers, empId];
    
    setValue('assignedTo', newSelection);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? 'Update Task' : 'Add New Task'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              rows={3}
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate', { required: 'Due date is required' })}
              />
              {errors.dueDate && (
                <p className="text-sm text-red-500">{errors.dueDate.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                defaultValue={watch('status')}
                onValueChange={(value) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Assigned To (Select Multiple)</Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
              <div className="mb-2">
                <Input 
                  type="text"
                  placeholder="Search users..." 
                  onChange={(e) => {
                    // Simple search filter
                    const searchValue = e.target.value.toLowerCase();
                    const filtered = Object.entries(usersMap).filter(([empId, name]) => 
                      name.toLowerCase().includes(searchValue) || empId.includes(searchValue)
                    );
                    
                    if (searchValue) {
                      setUsersArray(filtered.map(([empId, name]) => ({
                        value: empId,
                        label: `${name} (${empId})`,
                      })));
                    } else {
                      // Reset to full list
                      setUsersArray(Object.entries(usersMap).map(([empId, name]) => ({
                        value: empId,
                        label: `${name} (${empId})`,
                      })));
                    }
                  }}
                />
              </div>
              
              <div className="space-y-2">
                {usersArray.map((user) => (
                  <div key={user.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`user-${user.value}`}
                      className="form-checkbox h-4 w-4"
                      checked={selectedUsers.includes(user.value)}
                      onChange={() => toggleUserSelection(user.value)}
                    />
                    <label 
                      htmlFor={`user-${user.value}`}
                      className="text-sm flex-grow cursor-pointer"
                    >
                      {user.label}
                    </label>
                  </div>
                ))}
                
                {usersArray.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">No users found</p>
                )}
              </div>
            </div>
            
            {/* Display selected users */}
            {selectedUsers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedUsers.map(empId => (
                  <div
                    key={empId}
                    className="bg-slate-100 text-slate-800 text-xs px-2 py-1 rounded-full flex items-center"
                  >
                    <span>{usersMap[empId] || empId}</span>
                    <button
                      type="button"
                      className="ml-1 text-slate-500 hover:text-slate-800"
                      onClick={() => toggleUserSelection(empId)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {isUpdate && (
            <div className="space-y-2">
              <Label htmlFor="progressPercentage">Progress Percentage</Label>
              <Controller
                name="progressPercentage"
                control={control}
                render={({ field }) => (
                  <Input
                    id="progressPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                )}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isUpdate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 