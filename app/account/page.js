'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useForm } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Account() {
  const { user, updateUser, loading } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors }, getValues } = useForm({
    defaultValues: {
      name: '',
      email: '',
    },
  });

  // Set initial form values when user data is available
  useEffect(() => {
    if (user) {
      // Only set values if they're not already set (prevents erasing user input)
      if (user.name && (!getValues().name || getValues().name === '')) {
        setValue('name', user.name);
      }
      
      if (user.email && (!getValues().email || getValues().email === '')) {
        setValue('email', user.email);
      }
    }
  }, [user, setValue, getValues]);

  const onSubmit = async (data) => {
    try {
      setIsUpdating(true);
      await updateUser(data);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading account information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Account Settings</CardTitle>
            <CardDescription>
              Manage your account information
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="empId">Employee ID</Label>
                <Input
                  id="empId"
                  type="text"
                  value={user?.empId || ''}
                  disabled
                  className="bg-slate-100"
                />
                <p className="text-xs text-slate-500">Employee ID cannot be changed</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  {...register('name', { 
                    required: 'Full name is required' 
                  })}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 