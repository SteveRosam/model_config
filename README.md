# Test Configuration App

A web application for configuring test mappings between cabinet sensors and device sensors, managing model input parameters, and storing sensor metadata.

## Features

- **Test Configuration:** Map cabinet connections (user-defined sensors) to device sensors (predefined list). Save, download, and upload mappings as JSON.
- **Cabinet Sensors:** Add, view, download, and upload cabinet sensors (with unique ID, name, and description).
- **Model Configuration:** For each model, define parameters: model parameter name, source (Live Data/Constant), and data column. Save, download, and upload per-model configs as JSON.
- **Download/Upload All:** Download all configuration data as a single JSON file, or upload it to restore the complete app state, using buttons on the index page.
- **Sidebar Navigation:** Quick links to all sections.

## Stack
- **Backend:** Python (Flask, Flask-CORS, livereload)
- **Frontend:** HTML, CSS, JavaScript (fetch API)

## Getting Started

### Upload/Download All Configuration (New)

- On the index page, use the **Download All** button to save all configuration data (models, sensors, mappings, model configs) to a single JSON file.
- Use the **Upload All** button to restore all configuration data from a previously downloaded JSON file. This sends the data to the `/api/load_all` endpoint.

#### `/api/load_all` Endpoint
- **Method:** POST
- **Description:** Accepts a JSON object with keys: `models`, `sensors`, `mapping`, and `modelConfigs`.
- **Example JSON structure:**

```json
{
  "models": [ ... ],
  "sensors": [ ... ],
  "mapping": [ ... ],
  "modelConfigs": [ ... ]
}
```
- The endpoint updates all in-memory data. Returns `{"status": "success"}` or an error message.

### 1. Install dependencies
```sh
pip install flask flask-cors livereload
```

### 2. Run the app
```sh
python app.py
```

The app will be available at [http://127.0.0.1:5501](http://127.0.0.1:5501)

### 3. Project Structure
```
Configuration/
├── app.py
├── static/
│   ├── main.js
│   ├── style.css
│   ├── cabinet_sensors.js
│   ├── model_config.js
├── templates/
│   ├── index.html
│   ├── _sidebar.html
│   ├── cabinet_config.html
│   ├── cabinet_sensors.html
│   ├── model_config.html
└── README.md
```

## Data Models

### Cabinet Sensors
```json
[
  { "unique_id": "CAB_SEN_0001", "name": "Temperature Sensor", "description": "Measures temperature" }
]
```
### Test Configuration Mapping
```json
[
  { "cabinet_connection": "CAB_SEN_0001", "device_sensor": "heat_exchanger_temp" }
]
```
### Model Configuration
```json
[
  { "model_param": "temperature_1", "source": "Live Data", "data_property_name": "cabinet_temp_sensor_1" }
]
```

## User Flows

1. **Define Sensors:**
   - Go to Cabinet Sensors, add/edit sensors. Download/upload sensor list as needed.
2. **Configure Test Mapping:**
   - Go to Test Configuration, map cabinet connections (from sensors) to device sensors. Save, download, or upload mapping.
3. **Configure Model Parameters:**
   - Go to Model Configuration, select a model file, define required parameters with their source and data mapping. Save, download, or upload configuration.

## Extensibility

- Swap in-memory storage for a database for persistence.
- Add authentication for multi-user support.
- Extend model config to support constants or data validation.
- Add delete/edit for sensors and mappings.
- Integrate with real device APIs for live data.

---

## Step-by-Step Setup Guide

1. **Clone or copy the codebase to your machine.**
2. **Install Python 3.8+ and pip if not already installed.**
3. **Install dependencies:**
   ```sh
   pip install flask flask-cors livereload
   ```
4. **Run the app:**
   ```sh
   python app.py
   ```
5. **Visit [http://127.0.0.1:5501](http://127.0.0.1:5501) in your browser.**
6. **Navigate using the sidebar:**
   - Cabinet Sensors: Manage sensors
   - Test Configuration: Map sensors to device sensors
   - Model Configuration: Define model parameters

## Notes
- All data is stored in-memory by default. Restarting the app will reset all data.
- Use the **Download All** feature regularly to back up your configuration, and **Upload All** to restore it as needed.
- For production, add persistent storage and restrict CORS.

---

For further help, see the code comments or contact the app maintainer.

---

# How to Recreate the Test Configuration App (Detailed Step-by-Step Guide for Beginners)

## 1. Set Up Your Project Folder
- Create a new folder called `Configuration`.
- Inside `Configuration`, create two subfolders: `static` and `templates`.
- Your folder structure should look like this:
  ```
  Configuration/
    app.py
    static/
    templates/
  ```

## 2. Install Python and Required Packages
- Make sure you have Python 3.8 or later installed. Download from [python.org](https://www.python.org/downloads/) if needed.
- Open a terminal (Command Prompt or PowerShell on Windows).
- Navigate to your `Configuration` folder.
- Install the required packages by running:
  ```sh
  pip install flask flask-cors livereload
  ```
  - `flask` is the web framework.
  - `flask-cors` allows your frontend JS to talk to the backend.
  - `livereload` auto-reloads the server when you change files (for development).

## 3. Create the Backend (app.py)
- In your `Configuration` folder, create a file called `app.py`.
- This file will:
  - Start a Flask server.
  - Serve your HTML pages.
  - Provide API endpoints to save/load configuration data.
  - Store all data in Python variables (in-memory).

**Example structure for `app.py`:**
```python
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from livereload import Server

app = Flask(__name__)
CORS(app)

# In-memory data stores
cabinet_sensors = []
cabinet_mappings = []
model_configs = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/cabinet_config')
def cabinet_config():
    return render_template('cabinet_config.html')

@app.route('/cabinet_sensors')
def cabinet_sensors_page():
    return render_template('cabinet_sensors.html')

@app.route('/model_config')
def model_config():
    return render_template('model_config.html')

# Add API endpoints for GET/POST for each config (see codebase for details)

if __name__ == '__main__':
    server = Server(app.wsgi_app)
    server.serve(port=5501, host='127.0.0.1')
```
- You’ll need to add more routes for API endpoints. Look at the existing code for examples.

## 4. Create Your HTML Templates
- All HTML files go in the `templates` folder.
- Create:
  - `index.html` (home page)
  - `_sidebar.html` (navigation links)
  - `cabinet_config.html` (Test Configuration page)
  - `cabinet_sensors.html` (Cabinet Sensors page)
  - `model_config.html` (Model Configuration page)

**Tip:**  Use `{% include '_sidebar.html' %}` at the top of each page for navigation.

## 5. Add Frontend Logic (JavaScript)
- Place all JS files in the `static` folder.
- Create:
  - `main.js` (for cabinet config logic)
  - `cabinet_sensors.js` (for sensors logic)
  - `model_config.js` (for model parameter logic)

**How the JS works:**
- Uses the Fetch API to talk to Flask endpoints.
- Dynamically creates tables and forms on the page.
- Handles saving, loading, downloading, and uploading JSON files.

**Example:**
```javascript
// In model_config.js
fetch('/api/model_config/model1.json')
  .then(response => response.json())
  .then(config => {
      // Populate table with config data
  });
```

## 6. Add Styles
- Create `style.css` in the `static` folder.
- Link it in each HTML file:
  ```html
  <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
  ```

## 7. Wire Up Everything
- In each HTML template, link the relevant JS file at the end of the `<body>`, for example:
  ```html
  <script src="{{ url_for('static', filename='model_config.js') }}"></script>
  ```
- Make sure all buttons and forms have unique IDs, so your JS can find them.

## 8. Test the App
- Start the backend:
  ```sh
  python app.py
  ```
- Open [http://127.0.0.1:5501](http://127.0.0.1:5501) in your browser.
- Try adding sensors, mappings, and model parameters.
- Test downloading and uploading JSON files.

## 9. Troubleshooting
- If the page doesn’t update, check the browser console for JS errors.
- If you change Python code, restart the server.
- If you change HTML/JS, livereload should refresh the browser automatically.

---

## Summary of Key Files
- `app.py` — Flask backend, all endpoints.
- `templates/_sidebar.html` — Navigation bar.
- `templates/cabinet_config.html` — Test Configuration UI.
- `templates/cabinet_sensors.html` — Sensor management UI.
- `templates/model_config.html` — Model parameter UI.
- `static/main.js`, `cabinet_sensors.js`, `model_config.js` — All frontend logic.
- `static/style.css` — Page styling.

---

If you follow these steps, you will recreate the exact same functionality.
If you want, I can generate example code for any of the files above!
