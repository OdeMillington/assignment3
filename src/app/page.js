'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import './globals.css';

function fuzzySearch(query, text) {
  if (!query || !text) return false;
  query = query.toLowerCase();
  text = text.toLowerCase();
  let pattern = '';
  for (let char of query) pattern += char + '.*';
  return new RegExp(pattern).test(text);
}

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openIndex, setOpenIndex] = useState(null);
  const [showTaskBox, setShowTaskBox] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [mode, setMode] = useState('accordion');
  const [tasks, setTasks] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const containerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('tasks');
    if (stored) setTasks(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    let startY = 0;
    let startX = 0;

    const onTouchStart = (e) => {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    };

    const onTouchEnd = (e) => {
      const endY = e.changedTouches[0].clientY;
      const endX = e.changedTouches[0].clientX;
      const diffY = endY - startY;
      const diffX = endX - startX;
      const minMove = openIndex !== null ? 150 : 50;

      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > minMove) {
        setOpenIndex(null);
        setCurrentDate((prev) => {
          const newDate = new Date(prev);
          newDate.setDate(prev.getDate() + (diffY > 0 ? -7 : 7));
          return newDate;
        });
      } else if (Math.abs(diffX) > 50) {
        const now = new Date();
        const allTasks = JSON.parse(localStorage.getItem('tasks')) || {};

        if (diffX < 0) {
          const upcomingHighPriorityTasks = {};
          for (let date in allTasks) {
            allTasks[date]?.forEach((task) => {
              const due = new Date(task.dueDate);
              if (task.priority === '3' && task.status !== 'Completed' && due > now) {
                if (!upcomingHighPriorityTasks[date]) upcomingHighPriorityTasks[date] = [];
                upcomingHighPriorityTasks[date].push(task);
              }
            });
          }
          localStorage.setItem('upcomingHighPriorityTasks', JSON.stringify(upcomingHighPriorityTasks));
          router.push('/highPriority');
        } else {
          const completedTasks = {};
          for (let date in allTasks) {
            allTasks[date]?.forEach((task, index) => {
              if (task.status === 'Completed') {
                if (!completedTasks[date]) completedTasks[date] = [];
                if (!task.completionDate) task.completionDate = new Date().toISOString();
                completedTasks[date].push({ ...task, index });
              }
            });
          }
          localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
          router.push('/completed');
        }
      }
    };

    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [openIndex]);

  const formatDateKey = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}${month}${year}`;
  };

  const formatReadableDate = (date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);

  const handleAddTaskClick = (date) => {
    setSelectedDate(date);
    setMode('accordion');
    setShowTaskBox(true);
  };

  const handleGlobalTaskClick = () => {
    setSelectedDate(null);
    setMode('global');
    setShowTaskBox(true);
  };

  const handleAddTask = () => {
    const title = document.querySelector('.taskTitle').value;
    const description = document.querySelector('.taskDescription').value;
    const dueDate = document.querySelector('.dueDate').value;
    const startDateInput = document.querySelector('.startDate');
    const priority = document.querySelector('.priority').value;
    const status = document.querySelector('.status').value;
    const category = document.querySelector('.category').value;

    let taskDate = selectedDate;

    if (mode === 'global') {
      const inputDate = startDateInput?.value;
      if (!inputDate) {
        alert('Start date is required for global task.');
        return;
      }
      const [year, month, day] = inputDate.split('-');
      taskDate = new Date(year, month - 1, day);
    }

    if (!title || !dueDate || !taskDate) {
      alert('Please fill all required fields.');
      return;
    }

    const key = formatDateKey(taskDate);
    const newTask = {
      title,
      description,
      dueDate,
      priority,
      status,
      category,
      setDate: key,
      setDateFormat: taskDate,
      index: tasks[key]?.length || 0,
      completionDate: status === 'Completed' ? new Date().toISOString() : null,
    };

    const updatedTasks = { ...tasks };

    if (updatedTasks[key]) {
      updatedTasks[key].push(newTask);
    } else {
      updatedTasks[key] = [newTask];
    }

    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    setShowTaskBox(false);
  };

  return (
    <div ref={containerRef} className="container" style={{ touchAction: 'none' }}>
      <div className="header">
        <button className="globalAddTaskBtn" onClick={handleGlobalTaskClick}>⊞</button>
        <input
          type="text"
          name="searchTask"
          id="searchTask"
          placeholder="Search Task"
          autoComplete="off"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {(searchQuery || filterPriority || filterStatus) && (
        <div className="search">
          <div className="searchHeader">
            <div className="closeSearch" onClick={() => {
              setSearchQuery('');
              setFilterPriority('');
              setFilterStatus('');
            }}>✕</div>
          </div>

          <div className="filterControls">
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="1">Critical</option>
              <option value="2">Urgent</option>
              <option value="3">High Priority</option>
              <option value="4">Medium Priority</option>
              <option value="5">Low Priority</option>
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In-progress">In-Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {
            (() => {
              const results = [];
              for (const [dateKey, dayTasks] of Object.entries(tasks)) {
                for (let i = 0; i < dayTasks.length; i++) {
                  const task = dayTasks[i];
                  if (
                    fuzzySearch(searchQuery, task.title) &&
                    (!filterPriority || task.priority === filterPriority) &&
                    (!filterStatus || task.status === filterStatus)
                  ) {
                    results.push(
                      <div key={`${dateKey}-${i}`} className="taskItem">
                        <div
                          className="priorityBuble"
                          style={{
                            backgroundColor:
                              task.priority === '1'
                                ? '#E63946'
                                : task.priority === '2'
                                  ? 'orange'
                                  : task.priority === '3'
                                    ? '#008080'
                                    : task.priority === '4'
                                      ? '#6A0DAD'
                                      : 'gray',
                          }}
                        ></div>
                        <span>{task.title}</span>
                        <span className={`categoryLabel ${task.category.replace(" ", '-')}`}>
                          {task.category}
                        </span>
                      </div>
                    );
                  }
                }
              }
              return results;
            })()
          }
        </div>
      )}

      {showTaskBox && (
        <div className="inputTaskBox">
          <p id="titleInput">Input Task</p>

          <div className="formContainer">
            <div><label>Task Title</label><input type="text" className="taskTitle" required /></div>
            {mode === 'global' && (
              <div><label>Start Date</label><input type="date" className="startDate" required /></div>
            )}
            <div><label>Due Date</label><input type="date" className="dueDate" required /></div>
            <div>
              <label>Priority</label>
              <select className="priority" required>
                <option value="1">Critical</option>
                <option value="2">Urgent</option>
                <option value="3">High Priority</option>
                <option value="4">Medium Priority</option>
                <option value="5">Low Priority</option>
              </select>
            </div>
            <div>
              <label>Status</label>
              <select className="status" required>
                <option value="Pending">Pending</option>
                <option value="In-progress">In-Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label>Category</label>
              <select className="category" required>
                <option value="New Landscaping">New Landscaping</option>
                <option value="Site Clearing">Site Clearing</option>
                <option value="Plant Maintenance">Plant Maintenance</option>
                <option value="Grass Maintenance">Grass Maintenance</option>
                <option value="General Maintenance">General Maintenance</option>
              </select>
            </div>
            <div><label>Description</label><textarea className="taskDescription" required /></div>
          </div>

          <input type="file" className="fileUpload" accept="image/*,application/pdf,video/*,audio/*" />
          <button className="button" onClick={handleAddTask}>Add</button>
          <button className="button" onClick={() => setShowTaskBox(false)}>Close</button>
        </div>
      )}

      <div className="calendarArea">
        {
          (() => {
            const calendarElements = [];
            for (let i = 0; i < 7; i++) {
              const date = new Date(currentDate);
              date.setDate(currentDate.getDate() + i);
              const key = formatDateKey(date);
              const isOpen = openIndex === i;

              const taskElements = [];
              if (tasks[key]) {
                for (let index = 0; index < tasks[key].length; index++) {
                  const task = tasks[key][index];
                  taskElements.push(
                    <div key={index} className="taskItem">
                      <div
                        className="priorityBuble"
                        style={{
                          backgroundColor:
                            task.priority === '1'
                              ? '#E63946'
                              : task.priority === '2'
                                ? 'orange'
                                : task.priority === '3'
                                  ? '#008080'
                                  : task.priority === '4'
                                    ? '#6A0DAD'
                                    : 'gray',
                        }}
                      ></div>
                      <span>{task.title}</span>
                      <span className={`categoryLabel ${task.category.replace(" ", '-')}`}>
                        {task.category}
                      </span>
                    </div>
                  );
                }
              }

              calendarElements.push(
                <div key={i} className="date">
                  <div
                    className={`dateContainer ${isOpen ? 'accordionToggledDate' : ''}`}
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  >
                    {formatReadableDate(date)}
                  </div>
                  <div
                    className={`accordion ${isOpen ? 'accordionToggled' : ''}`}
                    style={{ display: isOpen ? 'block' : 'none' }}
                  >
                    <button className="addTaskBtn" onClick={() => handleAddTaskClick(date)}>Add Task</button>
                    <div className="taskList">{taskElements}</div>
                  </div>
                </div>
              );
            }
            return calendarElements;
          })()
        }
      </div>
    </div>
  );
}
