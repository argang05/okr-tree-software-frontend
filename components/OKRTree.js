'use client';

import { useState, useEffect, useCallback } from 'react';
import Tree from 'react-d3-tree';
import { objectivesAPI } from '@/lib/api';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  ListTodo, 
  ChevronDown, 
  ChevronRight, 
  Trash2 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import TaskList from '@/components/TaskList';
import ObjectiveForm from '@/components/ObjectiveForm';
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

// Custom node component for the tree
const CustomNode = ({ 
  nodeDatum, 
  toggleNode, 
  onAddSubObjective, 
  onAddTask, 
  onViewTasks,
  onDeleteObjective,
  onUpdateObjective
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [taskRefreshFunc, setTaskRefreshFunc] = useState(null);
  
  // Format the level label
  const getLevelLabel = (level) => {
    switch (level) {
      case 'COMPANY': return 'Company Level';
      case 'DEPARTMENT': return 'Department Level';
      case 'TEAMS': return 'Team Level';
      case 'INDIVIDUALS': return 'Individual Level';
      default: return 'Unknown Level';
    }
  };

  // Handle task added - refresh task list
  const refreshTaskList = () => {
    if (taskRefreshFunc && typeof taskRefreshFunc === 'function') {
      taskRefreshFunc();
    }
  };

  return (
    <g>
      {/* Node circle */}
      <circle r={25} fill="#E2E8F0" onClick={() => toggleNode()} />
      
      {/* Node card */}
      <foreignObject 
        width={320} 
        height={expanded ? 'auto' : 180} 
        x={-160} 
        y={-40} 
        className="overflow-visible"
      >
        <div>
          <Card className="shadow-md border-2 border-slate-200 hover:border-blue-300 transition-colors">
            <CardHeader className="p-3 pb-2 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
              <div className="flex justify-between items-start">
                <CardTitle className="text-md">{nodeDatum.title}</CardTitle>
                <span className="text-xs px-2 py-1 bg-slate-100 rounded-full">
                  {getLevelLabel(nodeDatum.level)}
                </span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{nodeDatum.progressPercentage}%</span>
                </div>
                <Progress value={nodeDatum.progressPercentage} className="h-2" />
              </div>
            </CardHeader>
            
            {showDetails && (
              <CardContent className="p-3 pt-0 border-t border-slate-100">
                <p className="text-sm text-slate-600 mt-2">{nodeDatum.description}</p>
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs w-full"
                    onClick={() => onUpdateObjective(nodeDatum)}
                  >
                    Update Details
                  </Button>
                </div>
              </CardContent>
            )}
            
            <CardFooter className="p-3 pt-0 flex justify-between gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs flex items-center gap-1 px-2"
                onClick={() => onAddSubObjective(nodeDatum.id)}
              >
                <PlusCircle size={14} />
                <span>Sub-Objective</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs flex items-center gap-1 px-2"
                onClick={() => onAddTask(nodeDatum.id)}
              >
                <PlusCircle size={14} />
                <span>Task</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs flex items-center gap-1 px-2"
                onClick={() => {
                  setExpanded(!expanded);
                  onViewTasks(nodeDatum.id);
                }}
              >
                <ListTodo size={14} />
                <span>Tasks</span>
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs flex items-center gap-1 px-2 text-red-500 hover:text-red-700"
                onClick={() => onDeleteObjective(nodeDatum.id)}
              >
                <Trash2 size={14} />
              </Button>
            </CardFooter>
            
            {expanded && (
              <div className="px-3 pb-3">
                <TaskList 
                  objectiveId={nodeDatum.id} 
                  onRefresh={setTaskRefreshFunc}
                />
              </div>
            )}
          </Card>
        </div>
      </foreignObject>
    </g>
  );
};

export default function OKRTree() {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rootObjectives, setRootObjectives] = useState([]);
  const [selectedRootId, setSelectedRootId] = useState(null);
  
  // Form dialogs state
  const [showAddRootDialog, setShowAddRootDialog] = useState(false);
  const [showAddSubDialog, setShowAddSubDialog] = useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [currentObjectiveId, setCurrentObjectiveId] = useState(null);
  const [currentObjective, setCurrentObjective] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [objectiveToDelete, setObjectiveToDelete] = useState(null);
  
  // Fetch root objectives (initial load)
  const fetchRootObjectives = useCallback(async () => {
    try {
      setLoading(true);
      // Get all root objectives from the new endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/objectives/trees`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch OKR trees: ${response.statusText}`);
      }
      
      const trees = await response.json();
      
      if (trees && Array.isArray(trees) && trees.length > 0) {
        // Set all root objectives
        setRootObjectives(trees);
        
        // Don't automatically select the first tree or set tree data
        // This will be handled by calling code depending on context
        return trees;
      } else {
        // No trees found
        setRootObjectives([]);
        setTreeData(null);
        return [];
      }
    } catch (error) {
      console.error('Error fetching root objectives:', error);
      setError('Failed to load OKR trees. Please try again later.');
      
      // Fallback to old method if the new endpoint fails
      try {
        // Start with default root ID = 1
        const initialResponse = await objectivesAPI.getOKRTree(1);
        if (initialResponse.data) {
          const roots = [initialResponse.data];
          setRootObjectives(roots);
          return roots;
        }
      } catch (fallbackError) {
        console.error('Error with fallback root fetching:', fallbackError);
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    // Initial load - select first tree by default
    fetchRootObjectives().then(trees => {
      if (trees.length > 0 && !selectedRootId) {
        setSelectedRootId(trees[0].id);
        setTreeData(formatDataForD3Tree(trees[0]));
      }
    });
  }, [fetchRootObjectives, selectedRootId]);
  
  // Load a specific tree
  const loadTree = async (rootId) => {
    try {
      setLoading(true);
      const response = await objectivesAPI.getOKRTree(rootId);
      if (response.data) {
        setSelectedRootId(rootId);
        setTreeData(formatDataForD3Tree(response.data));
      }
    } catch (error) {
      console.error(`Error loading tree ${rootId}:`, error);
      toast.error('Failed to load OKR tree. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format data for react-d3-tree
  const formatDataForD3Tree = (objective) => {
    if (!objective) return null;
    
    return {
      name: objective.title,
      id: objective.id,
      title: objective.title,
      description: objective.description,
      level: objective.level,
      treeLevel: objective.treeLevel,
      progressPercentage: objective.progressPercentage,
      parentId: objective.parentId,
      children: objective.children.map(formatDataForD3Tree).filter(Boolean)
    };
  };
  
  // Handle adding a new root objective
  const handleAddRootObjective = () => {
    setCurrentObjectiveId(null);
    setShowAddRootDialog(true);
  };
  
  // Handle adding a sub-objective
  const handleAddSubObjective = (parentId) => {
    setCurrentObjectiveId(parentId);
    setShowAddSubDialog(true);
  };
  
  // Handle adding a task
  const handleAddTask = (objectiveId) => {
    setCurrentObjectiveId(objectiveId);
    setShowAddTaskDialog(true);
  };
  
  // Handle updating an objective
  const handleUpdateObjective = (objective) => {
    setCurrentObjective(objective);
    setShowUpdateDialog(true);
  };
  
  // Handle deleting an objective
  const handleDeleteObjective = (objectiveId) => {
    setObjectiveToDelete(objectiveId);
    setShowDeleteAlert(true);
  };
  
  // Confirm objective deletion
  const confirmDeleteObjective = async () => {
    if (!objectiveToDelete) return;
    
    try {
      await objectivesAPI.deleteObjective(objectiveToDelete);
      toast.success('Objective deleted successfully');
      
      // If the deleted objective is the root, refresh the list of roots
      if (selectedRootId === objectiveToDelete) {
        fetchRootObjectives();
      } else {
        // Otherwise, reload the current tree
        loadTree(selectedRootId);
      }
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast.error('Failed to delete objective. Please try again.');
    } finally {
      setShowDeleteAlert(false);
      setObjectiveToDelete(null);
    }
  };
  
  // Handle objective creation success
  const handleObjectiveCreated = async () => {
    setShowAddRootDialog(false);
    setShowAddSubDialog(false);
    
    // Store the current selected root ID before refresh
    const currentRootId = selectedRootId;
    
    // Refresh the list of roots
    const trees = await fetchRootObjectives();
    
    // For a new root objective (no currentRootId), select the last one created
    if (!currentRootId && trees.length > 0) {
      const newRootId = trees[trees.length - 1].id;
      setSelectedRootId(newRootId);
      setTreeData(formatDataForD3Tree(trees[trees.length - 1]));
    } 
    // For a sub-objective, stay on the current tree
    else if (currentRootId) {
      loadTree(currentRootId);
    }
  };
  
  // Handle task creation success - refresh relevant task list
  const handleTaskCreated = (createdTask) => {
    setShowAddTaskDialog(false);
    
    // Notify specific node to refresh its tasks if expanded
    const refreshNode = () => {
      const customEvent = new CustomEvent('refreshTasks', { 
        detail: { 
          objectiveId: currentObjectiveId,
          createdTask: createdTask 
        } 
      });
      document.dispatchEvent(customEvent);
    };
    
    // Fire event after a small delay to ensure components are mounted
    setTimeout(refreshNode, 100);
    
    // If we have a tree loaded, refresh it to show updated task count
    if (selectedRootId) {
      loadTree(selectedRootId);
    }
  };
  
  // Handle objective update success
  const handleObjectiveUpdated = () => {
    setShowUpdateDialog(false);
    
    if (selectedRootId) {
      loadTree(selectedRootId);
    }
  };
  
  if (loading && !treeData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading OKR tree...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={fetchRootObjectives}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!treeData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No OKR Trees Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There are no objective trees available. Create your first root objective to get started.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddRootObjective}>Create Root Objective</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="h-[calc(100vh-64px)] w-full relative">
      {/* Tree navigation */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between bg-white p-3 rounded-lg shadow-md">
        <div className="flex items-center gap-2 overflow-x-auto flex-grow">
          {rootObjectives.map((root) => (
            <Button
              key={root.id}
              variant={selectedRootId === root.id ? "default" : "outline"}
              size="sm"
              onClick={() => loadTree(root.id)}
              className="whitespace-nowrap"
            >
              OKR-{root.id}: {root.title.length > 25 ? root.title.substring(0, 25) + '...' : root.title}
            </Button>
          ))}
        </div>
        <Button
          onClick={handleAddRootObjective}
          variant="default"
          size="sm"
          className="ml-2 whitespace-nowrap"
        >
          <PlusCircle size={16} className="mr-1" />
          Add OKR Tree
        </Button>
      </div>
      
      {/* Tree visualization */}
      <div className="h-full w-full overflow-hidden">
        <Tree
          data={treeData}
          orientation="vertical"
          pathFunc="step"
          separation={{ siblings: 2.5, nonSiblings: 3.5 }}
          translate={{ x: window.innerWidth / 2, y: 160 }}
          nodeSize={{ x: 350, y: 250 }}
          collapsible={false}
          renderCustomNodeElement={(rd3tProps) => (
            <CustomNode
              {...rd3tProps}
              onAddSubObjective={handleAddSubObjective}
              onAddTask={handleAddTask}
              onViewTasks={() => {}} // This is handled in the component itself
              onDeleteObjective={handleDeleteObjective}
              onUpdateObjective={handleUpdateObjective}
            />
          )}
        />
      </div>
      
      {/* Forms for adding/editing objectives and tasks */}
      <ObjectiveForm
        isOpen={showAddRootDialog}
        onClose={() => setShowAddRootDialog(false)}
        onSuccess={handleObjectiveCreated}
        parentId={null}
        isRootObjective={true}
      />
      
      <ObjectiveForm
        isOpen={showAddSubDialog}
        onClose={() => setShowAddSubDialog(false)}
        onSuccess={handleObjectiveCreated}
        parentId={currentObjectiveId}
        isRootObjective={false}
      />
      
      <TaskForm
        isOpen={showAddTaskDialog}
        onClose={() => setShowAddTaskDialog(false)}
        onSuccess={(createdTask) => handleTaskCreated(createdTask)}
        objectiveId={currentObjectiveId}
      />
      
      <ObjectiveForm
        isOpen={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        onSuccess={handleObjectiveUpdated}
        objective={currentObjective}
        isUpdate={true}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this objective, all of its sub-objectives, and associated tasks.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setObjectiveToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteObjective} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 