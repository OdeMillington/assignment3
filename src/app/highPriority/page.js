'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

function convertDate(key) {
  const day = key.substring(0, 2);
  const month = key.substring(2, 4);
  const year = '20' + key.substring(4, 6);
  return new Date(`${year}-${month}-${day}`);
}

export default function HighPriorityPage() {
  const [tasks, setTasks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('upcomingHighPriorityTasks') || '{}');
    const taskList = [];

    for (const date in stored) {
      stored[date].forEach((task, index) => {
        taskList.push({ ...task, startDate: date, index });
      });
    }

    setTasks(taskList);
    if (taskList.length > 0) updateSelectedTask(taskList[0]);
  }, []);

  const updateSelectedTask = (task) => {
    const selectedTask = {
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      completionDate: task.completionDate,
      setDate: task.startDate,
      category: task.category,
      setDateFormat: convertDate(task.startDate),
      index: task.index,
    };
    localStorage.setItem('selectedTask', JSON.stringify(selectedTask));
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const swipeHandler = () => {
    const container = containerRef.current;
    let startY = 0;

    const onTouchStart = (e) => startY = e.touches[0].clientY;

    const onTouchEnd = (e) => {
      const endY = e.changedTouches[0].clientY;
      const diffY = endY - startY;

      if (Math.abs(diffY) > 50) {
        if (diffY < 0 && currentIndex < tasks.length - 1) {
          const newIndex = currentIndex + 1;
          setCurrentIndex(newIndex);
          updateSelectedTask(tasks[newIndex]);
        } else if (diffY > 0 && currentIndex > 0) {
          const newIndex = currentIndex - 1;
          setCurrentIndex(newIndex);
          updateSelectedTask(tasks[newIndex]);
        }
      }
    };

    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
    };
  };

  useEffect(swipeHandler, [currentIndex, tasks]);

  const task = tasks[currentIndex];

  return (
    <div className="containerTask" ref={containerRef} style={{ touchAction: 'none' }}>
      <div className="taskDetailsContainer">
        <div className="taskDetails">
          <h1 className="task-title">{task?.title || 'No High Priority Tasks'}</h1>
          {task && (
            <>
              <p><strong>Start Date:</strong> {formatDate(task.setDateFormat)}</p>
              <p><strong>Completion Date:</strong> {task.completionDate ? formatDate(task.completionDate) : 'Not Completed'}</p>
              <p><strong>Due Date:</strong> {formatDate(task.dueDate)}</p>
              <p><strong>Description:</strong> {task.description}</p>
              <p><strong>Priority:</strong> <span style={{ color: getPriorityColor(task.priority) }}>{getPriorityLabel(task.priority)}</span></p>
              <p><strong>Status:</strong> {task.status}</p>
              <p><strong>Category:</strong> {task.category}</p>
            </>
          )}
          <button id="returnHomeBtn" className="button" onClick={() => router.push('/')}>Return to Calendar View</button>
        </div>
      </div>
    </div>
  );
}

function getPriorityLabel(level) {
  return {
    '1': 'Critical',
    '2': 'Urgent',
    '3': 'High Priority',
    '4': 'Medium Priority',
    '5': 'Low Priority',
  }[level] || 'Unknown';
}

function getPriorityColor(level) {
  return {
    '1': '#E63946',
    '2': 'orange',
    '3': '#008080',
    '4': '#6A0DAD',
    '5': 'gray',
  }[level] || 'black';
}
