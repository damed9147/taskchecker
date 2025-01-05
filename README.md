# Task Manager

A Trello-like project management web application built with Flask and SQLite.

## Features

- Create, edit, and delete lists
- Add, edit, and delete cards within lists
- Drag and drop cards between lists
- Set due dates, assignees, and completion rates for cards
- Persistent storage using SQLite database
- Responsive design that works on all devices

## Setup Instructions

1. Create a virtual environment (recommended):
```bash
python -m venv venv
venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

4. Open your browser and navigate to `http://localhost:5000`

## Project Structure

- `app.py`: Main Flask application with routes and database models
- `templates/`: HTML templates
  - `index.html`: Main application template
- `static/`: Static assets
  - `css/style.css`: Custom styles
  - `js/main.js`: Frontend JavaScript code
- `taskmanager.db`: SQLite database (created automatically)

## Usage

1. Click "Add List" to create a new list
2. Within each list, click "Add Card" to create new cards
3. Click on any card to edit its details
4. Drag and drop cards between lists to change their status
5. Drag lists to reorder them
6. All changes are automatically saved to the database

## Technologies Used

- Backend: Python Flask
- Database: SQLite with SQLAlchemy
- Frontend: HTML5, CSS3, JavaScript
- UI Framework: Bootstrap 5
- Drag and Drop: SortableJS
- Icons: Font Awesome
