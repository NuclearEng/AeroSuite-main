import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

export interface KanbanCard {
  id: string;
  content: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  onDragEnd: (result: DropResult) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ columns, onDragEnd }) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', py: 2 }}>
        {columns.map((column) => (
          <Droppable droppableId={column.id} key={column.id}>
            {(provided) => (
              <Paper
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{ minWidth: 300, p: 2, backgroundColor: 'grey.100', borderRadius: 2 }}
                aria-label={`Kanban column: ${column.title}`}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>{column.title}</Typography>
                {column.cards.map((card, idx) => (
                  <Draggable draggableId={card.id} index={idx} key={card.id}>
                    {(provided) => (
                      <Paper
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        sx={{ mb: 2, p: 2, backgroundColor: 'white', borderRadius: 1, boxShadow: 1 }}
                        aria-label={`Kanban card: ${card.content}`}
                      >
                        {card.content}
                      </Paper>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Paper>
            )}
          </Droppable>
        ))}
      </Box>
    </DragDropContext>
  );
};

export default KanbanBoard; 