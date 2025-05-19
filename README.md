# Shopping App with Interactive Map

A full-stack application featuring an interactive map interface for location management with bookmark functionality. The application consists of a React frontend and Django backend.

## Project Structure

```
shoping_app/
├── gis_backend/         # Django backend
└── shopping-app/        # React frontend
```

## Table of Contents

- [Backend Documentation](#backend-documentation)
- [Frontend Documentation](#frontend-documentation)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Features](#features)

---

# Backend Documentation

## Overview

The backend is built with Django and provides a RESTful API for managing location data. It includes models for locations and user profiles, with endpoints for CRUD operations.

## Tech Stack

- **Framework**: Django 5.2.1
- **Database**: SQLite (default)
- **API**: RESTful endpoints
- **CORS**: django-cors-headers for cross-origin requests

## Models

### Location Model

```python
class Location(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('unk', 'Unk'),
    )
    
    name = models.CharField(max_length=255)
    lat = models.FloatField()
    lng = models.FloatField()
    location_name = models.CharField(max_length=255)
    type = models.CharField(max_length=20)
    usage = models.TextField(help_text="Short description of location usage")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    last_serviced_date = models.DateField(null=True, blank=True)
    bockmarked = models.BooleanField(default=False, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### UserProfile Model

```python
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/locations/` | GET | Get all locations |
| `/locations/` | POST | Create a new location |
| `/locations/<id>/` | GET | Get a specific location |
| `/locations/<id>/` | PUT | Update a specific location |
| `/locations/<id>/` | DELETE | Delete a specific location |
| `/locations/filter/` | GET | Filter locations by name, location name, or type |

## Setup & Installation

1. Navigate to the backend directory:
   ```bash
   cd gis_backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   source venv/bin/activate  # On Unix/MacOS
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the development server:
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/`.

---

# Frontend Documentation

## Overview

The frontend is built with React and provides an interactive map interface using OpenLayers. Users can view, add, edit, and bookmark locations on the map.

## Tech Stack

- **Framework**: React 19.1.0
- **Routing**: React Router 7.6.0
- **Styling**: TailwindCSS 3.4.17
- **Map Library**: OpenLayers (ol) 10.5.0 with ol-ext 4.0.31
- **HTTP Client**: Axios 1.9.0
- **UI Components**: React Icons 5.5.0, React Toastify 11.0.5
- **Form Handling**: React Hook Form 7.56.4

## Key Components

### Home Component

The main component that renders the interactive map with location markers. Features include:
- Interactive map with OpenLayers
- Location markers with different styles based on type
- Clustering of nearby locations
- Popup information for locations
- Bookmark functionality
- Filtering by location type

### AddNewPin Component

Allows users to add new locations to the map with details like:
- Name
- Coordinates (latitude/longitude)
- Location name
- Type (Drone, IoT Devices, Satellite, Distribution, Storage)
- Usage description
- Status

### EditLocationDialog Component

Modal dialog for editing existing location details.

### ListViewDialog Component

Displays locations in a list format for easier browsing.

### Context (Store)

Provides global state management for:
- Map instances
- Selected location data
- Coordinates

## Features

1. **Interactive Map**:
   - Pan and zoom functionality
   - Location search using Nominatim
   - Custom markers for different location types

2. **Location Management**:
   - View all locations on the map
   - Add new locations
   - Edit existing locations
   - Delete locations
   - Filter locations by type

3. **Bookmarking System**:
   - Bookmark favorite locations
   - Persistent bookmarks using localStorage
   - Toggle bookmarks on/off

4. **Responsive UI**:
   - Mobile-friendly design
   - Toast notifications for user feedback

## Setup & Installation

1. Navigate to the frontend directory:
   ```bash
   cd shopping-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000/`.

---

# Installation & Setup (Full Stack)

## Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- npm or yarn

## Backend Setup

```bash
# Navigate to backend directory
cd gis_backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows
source venv/bin/activate  # On Unix/MacOS

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

## Frontend Setup

```bash
# Navigate to frontend directory
cd shopping-app

# Install dependencies
npm install

# Start development server
npm start
```

## Environment Configuration

Create a `.env` file in the `gis_backend` directory with the following variables:

```
DEBUG=True
SECRET_KEY=your_secret_key
ALLOWED_HOSTS=localhost,127.0.0.1
```

---

# API Documentation

## Location Endpoints

### Get All Locations

```
GET /locations/
```

Response:
```json
[
  {
    "id": 1,
    "name": "Drone Station Alpha",
    "lat": 37.7749,
    "lng": -122.4194,
    "location_name": "San Francisco",
    "type": "drone",
    "usage": "Package delivery",
    "status": "active",
    "bockmarked": false,
    "last_serviced_date": "2023-05-15",
    "created_at": "2023-06-01T12:00:00Z",
    "updated_at": "2023-06-01T12:00:00Z"
  }
]
```

### Create Location

```
POST /locations/
```

Request Body:
```json
{
  "name": "New Storage Facility",
  "lat": 34.0522,
  "lng": -118.2437,
  "location_name": "Los Angeles",
  "type": "storage",
  "usage": "Inventory storage",
  "status": "active",
  "bookmarked": false,
  "last_serviced_date": "2023-07-20"
}
```

### Get Location Details

```
GET /locations/{id}/
```

### Update Location

```
PUT /locations/{id}/
```

Request Body:
```json
{
  "name": "Updated Name",
  "status": "inactive",
  "bockmarked": true
}
```

### Delete Location

```
DELETE /locations/{id}/
```

### Filter Locations

```
GET /locations/filter/?q=search_term&type=drone
```

---

# Features

- **Interactive Map**: Visualize all locations with custom markers
- **Location Management**: Add, edit, delete, and filter locations
- **Bookmarking**: Save favorite locations for quick access
- **Search Functionality**: Find locations by name or address
- **Filtering**: Filter locations by type (drone, IoT, satellite, etc.)
- **Clustering**: Group nearby locations for better visualization
- **Responsive Design**: Works on desktop and mobile devices

---

# License

This project is licensed under the MIT License.