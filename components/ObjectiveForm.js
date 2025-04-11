'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { objectivesAPI } from '@/lib/api';
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

export default function ObjectiveForm({
  isOpen,
  onClose,
  onSuccess,
  parentId = null,
  objective = null,
  isUpdate = false,
  isRootObjective = false,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, setValue, reset, watch, control, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      level: 'COMPANY',
      progressPercentage: 0,
    },
  });
  
  // Set form values when editing an existing objective
  useEffect(() => {
    if (isUpdate && objective) {
      setValue('title', objective.title || '');
      setValue('description', objective.description || '');
      setValue('level', objective.level || 'COMPANY');
      setValue('progressPercentage', objective.progressPercentage || 0);
    }
  }, [isUpdate, objective, setValue, isOpen]);
  
  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      reset({
        title: '',
        description: '',
        level: 'COMPANY',
        progressPercentage: 0,
      });
    }
  }, [isOpen, reset]);
  
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      if (isUpdate) {
        // Update existing objective
        await objectivesAPI.updateObjective(objective.id, data);
        toast.success('Objective updated successfully');
      } else if (parentId) {
        // Create sub-objective
        await objectivesAPI.createSubObjective(parentId, data);
        toast.success('Sub-objective created successfully');
      } else {
        // Create root objective - explicitly set treeLevel=0 and parentId=null
        const rootObjectiveData = {
          ...data,
          treeLevel: 0,
          parentId: null
        };
        await objectivesAPI.createObjective(rootObjectiveData);
        toast.success('Objective created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving objective:', error);
      toast.error(error.response?.data?.message || 'Failed to save objective. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? 'Update Objective' : 
              isRootObjective ? 'Create Root Objective' : 'Add Sub-Objective'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter objective title"
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
              placeholder="Enter objective description"
              rows={4}
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="level">Level</Label>
            <Select
              defaultValue={watch('level')}
              onValueChange={(value) => setValue('level', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPANY">Company</SelectItem>
                <SelectItem value="DEPARTMENT">Department</SelectItem>
                <SelectItem value="TEAMS">Team</SelectItem>
                <SelectItem value="INDIVIDUALS">Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isUpdate && (
            <div className="space-y-2">
              <Label htmlFor="progressPercentage">Progress Percentage</Label>
              <Controller
                name="progressPercentage"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completion</span>
                      <span>{field.value}%</span>
                    </div>
                    <Input
                      id="progressPercentage"
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className="w-full"
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </div>
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