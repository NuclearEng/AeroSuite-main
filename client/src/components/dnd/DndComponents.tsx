import React, { forwardRef } from 'react';
import {
  DragDropContext as RbdDragDropContext,
  Droppable as RbdDroppable,
  Draggable as RbdDraggable,
  DroppableProps,
  DraggableProps,
  DragDropContextProps,
  DroppableProvided,
  DraggableProvided,
  DroppableStateSnapshot,
  DraggableStateSnapshot,
  DraggableRubric
} from 'react-beautiful-dnd';

// Create a forwardRef wrapper for DragDropContext
export const DragDropContext: React.FC<DragDropContextProps> = (props) => {
  return <RbdDragDropContext {...props} />;
};

// Create a forwardRef wrapper for Droppable
export const Droppable: React.FC<DroppableProps & {
  children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactElement;
}> = (props) => {
  return <RbdDroppable {...props} />;
};

// Create a forwardRef wrapper for Draggable
export const Draggable: React.FC<DraggableProps & {
  children: (
    provided: DraggableProvided,
    snapshot: DraggableStateSnapshot,
    rubric: DraggableRubric
  ) => React.ReactElement;
}> = (props) => {
  return <RbdDraggable {...props} />;
};