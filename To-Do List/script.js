const categoryInput = document.querySelector('.categories input[type="text"]');
const addCategoryButton = document.querySelector('.add-category');
const categoryList = document.querySelector('.category-list');
const taskInput = document.querySelector('.task-input input[type="text"]');
const dueDateInput = document.querySelector('.task-input input[type="date"]');
const categoryCheckboxesContainer = document.querySelector('.category-checkboxes');
const addTaskButton = document.querySelector('.add-task');
const taskList = document.createElement('ul'); // Create a new UL for tasks
document.querySelector('.task-section').appendChild(taskList); // Append to the task section
const analyticsDisplay = document.querySelector('.analytics');

// Initialize categories and tasks
let categories = JSON.parse(localStorage.getItem('categories')) || [];
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Function to render categories
function renderCategories() {
    categoryList.innerHTML = '';
    categoryCheckboxesContainer.innerHTML = '';

    categories.forEach((category, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${category} <button class="delete-btn" onclick="deleteCategory(${index})">Delete</button>`;
        categoryList.appendChild(li);

        const checkboxLabel = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = category;
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(document.createTextNode(category));
        categoryCheckboxesContainer.appendChild(checkboxLabel);
    });
}

// Add a new category
addCategoryButton.addEventListener('click', () => {
    const newCategory = categoryInput.value.trim();
    if (newCategory && !categories.includes(newCategory)) {
        categories.push(newCategory);
        localStorage.setItem('categories', JSON.stringify(categories));
        categoryInput.value = '';
        renderCategories();
        updateAnalytics();
    } else {
        alert('Category cannot be empty or already exists!');
    }
});

// Function to render tasks
function renderTasks() {
    taskList.innerHTML = '';

    // Sort tasks: incomplete tasks first, then completed tasks, and sort by due date
    const sortedTasks = tasks.sort((a, b) => {
        // Compare completion status
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1; // Move completed tasks to the end
        }

        // If both have the same completion status, sort by due date
        const dateA = a.dueDate ? new Date(a.dueDate) : Infinity; // Use Infinity for tasks without due date
        const dateB = b.dueDate ? new Date(b.dueDate) : Infinity;

        return dateA - dateB; // Ascending order
    });

    sortedTasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.justifyContent = 'space-between';

        const taskContainer = document.createElement('div');
        taskContainer.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${index})">
            <span style="text-decoration: ${task.completed ? 'line-through' : 'none'}">
                ${task.text} - ${task.dueDate || 'No due date'} 
            </span>
            <span>(Categories: ${task.category.join(', ')})</span>
        `;
        li.appendChild(taskContainer);

        const buttonContainer = document.createElement('div');
        buttonContainer.innerHTML = `
            <button onclick="openEditModal(${index})">Edit</button>
            <button onclick="deleteTask(${index})">Delete</button>
        `;
        li.appendChild(buttonContainer);
        
        taskList.appendChild(li);
    });
    updateAnalytics();
}

// Update analytics
let analyticsChart;
const analyticsChartElement = document.getElementById('analyticsChart');

function updateAnalytics() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionRates = {};

    categories.forEach(category => {
        const tasksInCategory = tasks.filter(task => task.category && task.category.includes(category));
        const completedInCategory = tasksInCategory.filter(task => task.completed).length;
        completionRates[category] = tasksInCategory.length > 0 ? (completedInCategory / tasksInCategory.length * 100).toFixed(2) : 0;
    });

    const overallCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0;
    document.getElementById('overall-completion-rate').innerText = `Overall Completion Rate: ${overallCompletionRate}%`;

    const chartLabels = categories;
    const chartData = chartLabels.map(category => completionRates[category] || 0);

    // Create or update the bar chart
    if (analyticsChart) {
        analyticsChart.data.labels = chartLabels;
        analyticsChart.data.datasets[0].data = chartData;
        analyticsChart.update();
    } else {
        analyticsChart = new Chart(analyticsChartElement, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Completion Rates (%)',
                    data: chartData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Completion Rate (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Categories'
                        }
                    }
                }
            }
        });
    }

    const categoryCompletionRates = document.querySelector('.category-completion-rates');
    categoryCompletionRates.innerHTML = '';
    categories.forEach(category => {
        const rateText = document.createElement('p');
        const completionRate = completionRates[category];
        rateText.textContent = `${category}: ${completionRate}%`;
        categoryCompletionRates.appendChild(rateText);
    });
}

// Delete a category
function deleteCategory(index) {
    if (confirm('Are you sure you want to delete this category?')) {
        const categoryToDelete = categories[index];
        
        // Remove the category from the categories array
        categories.splice(index, 1);
        
        // Remove tasks associated with the deleted category
        tasks = tasks.filter(task => !task.category.includes(categoryToDelete));
        
        // Update localStorage
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // Re-render categories and tasks
        renderCategories();
        renderTasks();
    }
}

// Add a new task
addTaskButton.addEventListener('click', () => {
    const newTaskText = taskInput.value.trim();
    const newDueDate = dueDateInput.value;
    const selectedCategories = Array.from(categoryCheckboxesContainer.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);

    if (newTaskText) {
        const newTask = {
            text: newTaskText,
            dueDate: newDueDate,
            category: selectedCategories,
            completed: false
        };
        tasks.push(newTask);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        taskInput.value = '';
        dueDateInput.value = '';
        renderTasks();
    } else {
        alert('Task name cannot be empty!');
    }
});

// Toggle task completion
function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
}

// Open edit modal
function openEditModal(index) {
    const task = tasks[index];
    const editModal = document.createElement('div');
    editModal.classList.add('modal');
    editModal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal()">×</span>
            <h2>Edit Task</h2>
            <label>Task Name:</label>
            <input type="text" id="edit-task-name" value="${task.text}">
            <label>Due Date:</label>
            <input type="date" id="edit-due-date" value="${task.dueDate}">
            <label>Categories:</label>
            <div class="edit-category-checkboxes"></div>
            <button onclick="saveEdit(${index})">Save</button>
        </div>
    `;
    document.body.appendChild(editModal);
    renderEditCategories(task.category);
}

// Render categories in edit modal
function renderEditCategories(selectedCategories) {
    const editCategoryContainer = document.querySelector('.edit-category-checkboxes');
    editCategoryContainer.innerHTML = '';
    categories.forEach(category => {
        const checkboxLabel = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = category;
        checkbox.checked = selectedCategories.includes(category);
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(document.createTextNode(category));
        editCategoryContainer.appendChild(checkboxLabel);
    });
}

// Save edits
function saveEdit(index) {
    const editedTaskName = document.getElementById('edit-task-name').value.trim();
    const editedDueDate = document.getElementById('edit-due-date').value;
    const selectedCategories = Array.from(document.querySelectorAll('.edit-category-checkboxes input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);

    if (editedTaskName) {
        tasks[index].text = editedTaskName;
        tasks[index].dueDate = editedDueDate;
        tasks[index].category = selectedCategories;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        closeModal();
        renderTasks();
    } else {
        alert('Task name cannot be empty!');
    }
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// Delete a task
function deleteTask(index) {
    tasks.splice(index, 1);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
}

// Initial render
renderCategories();
renderTasks();
