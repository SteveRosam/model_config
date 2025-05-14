from flask import Flask, render_template, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True

@app.context_processor
def inject_nav_test_chamber_name():
    config = load_app_config()
    return dict(nav_test_chamber_name=config.get('test_chamber_page_name', 'Test Chamber'))

CORS(app)  # Enable CORS for all domains

# Load persisted data at startup (each file individually)
from persistence import save_data, load_data, save_all, load_all

def load_or_default(name, default):
    try:
        return load_data(name, default)
    except Exception:
        return default

models = load_or_default('models', [
    {"name": "Model 1", "file": "model1.pkl", "description": "First test model."},
    {"name": "Model 2", "file": "model2.pkl", "description": "Second test model."}
])
test_sensors = load_or_default('test_sensors', [
    {"unique_id": "TEST_SEN_0001"},
    {"unique_id": "TEST_SEN_0002"}
])
test_configurations = load_or_default('test_configurations', [])
model_configs = load_or_default('model_configs', {})

# In-memory store for last run
last_run = {}
# In-memory list for test run history
import datetime
from persistence import save_data, load_data, save_all, load_all

test_run_history = load_or_default('test_run_history', [])

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/test_config')
def test_config():
    return render_template('test_config.html')

@app.route('/api/test_mapping', methods=['GET', 'POST'])
def api_test_mapping():
    global test_configurations
    if request.method == 'POST':
        test_configurations = request.json or []
        save_data('test_configurations', test_configurations)
        return jsonify({'status': 'success'})
    return jsonify(test_configurations)

@app.route('/model_config')
def model_config_page():
    return render_template('model_config.html')

@app.route('/models')
def models_page():
    return render_template('models.html')

@app.route('/api/models', methods=['GET', 'POST'])
def api_models():
    global models
    if request.method == 'POST':
        data = request.json
        # If uploading a list, overwrite all
        if isinstance(data, list):
            models.clear()
            for m in data:
                if not all(k in m for k in ('name', 'file', 'description')):
                    return jsonify({'status': 'error', 'message': 'Missing fields in at least one model'}), 400
                models.append(m)
            save_data('models', models)
            return jsonify({'status': 'success'})
        # Single model add
        if not data or not all(k in data for k in ('name', 'file', 'description')):
            return jsonify({'status': 'error', 'message': 'Missing fields'}), 400
        models.append(data)
        save_data('models', models)
        return jsonify({'status': 'success'})
    return jsonify(models)

@app.route('/api/model_config/<model_file>', methods=['GET', 'POST'])
def api_model_config(model_file):
    global model_configs
    if request.method == 'POST':
        model_configs[model_file] = request.json or {}
        save_data('model_configs', model_configs)
        return jsonify({'status': 'success'})
    return jsonify(model_configs.get(model_file, {}))

@app.route('/run_test')
def run_test_page():
    return render_template('run_test.html')

@app.route('/api/run_test', methods=['POST'])
def api_run_test():
    global last_run, test_run_history
    data = request.json
    if not data or 'file' not in data or 'config_idx' not in data:
        return jsonify({'status': 'error', 'message': 'Missing file or config'}), 400
    last_run = {'file': data['file'], 'config_idx': data['config_idx']}
    # Add to test run history with timestamp
    test_run = {
        'file': data['file'],
        'config_idx': data['config_idx'],
        'timestamp': datetime.datetime.now().isoformat(),
        'user': data.get('user', 'Emma Wagner')
    }
    test_run_history.append(test_run)
    save_data('test_run_history', test_run_history)
    return jsonify({'status': 'success'})



@app.route('/test_chamber')
def test_chamber():
    config = load_app_config()
    page_title = config.get('test_chamber_page_name', 'Test Chamber')
    return render_template('test_chamber.html', page_title=page_title)

@app.route('/api/test_chamber', methods=['GET', 'POST'])
def api_test_chamber():
    global test_sensors
    if request.method == 'POST':
        data = request.json
        if not data or 'unique_id' not in data:
            return jsonify({'status': 'error', 'message': 'Missing unique_id'}), 400
        # Prevent duplicate unique_id
        if any(s['unique_id'] == data['unique_id'] for s in test_sensors):
            return jsonify({'status': 'error', 'message': 'Unique ID already exists'}), 400
        test_sensors.append(data)
        save_data('test_sensors', test_sensors)
        return jsonify({'status': 'success'})
    return jsonify(test_sensors)


@app.route('/api/test_run_history', methods=['GET'])
def api_test_run_history():
    global test_run_history
    test_run_history = load_or_default('test_run_history', test_run_history)
    return jsonify(test_run_history)

@app.route('/api/test_run_notes', methods=['POST'])
def api_test_run_notes():
    global test_run_history
    data = request.json
    idx = data.get('index')
    notes = data.get('notes', '')
    if idx is None or not isinstance(idx, int) or idx < 0 or idx >= len(test_run_history):
        return jsonify({'status': 'error', 'message': 'Invalid index'}), 400
    test_run_history[-(idx+1)]['notes'] = notes
    save_data('test_run_history', test_run_history)
    return jsonify({'status': 'success'})

@app.route('/api/live_data_options', methods=['GET'])
def api_live_data_options():
    return jsonify([
        'f_manifold_pressure',
        'b_running',
        'f_ambient_temperature',
        'f_spindle_speed'
    ])

import json

CONFIG_PATH = 'app_config.json'

def load_app_config():
    try:
        with open(CONFIG_PATH, 'r') as f:
            return json.load(f)
    except Exception:
        return {"test_chamber_page_name": "Test Chamber"}

def save_app_config(config):
    with open(CONFIG_PATH, 'w') as f:
        json.dump(config, f, indent=4)

@app.route('/app_config')
def app_config():
    return render_template('app_config.html')

@app.route('/api/app_config', methods=['GET'])
def api_get_app_config():
    return load_app_config()

@app.route('/api/update_app_config', methods=['POST'])
def api_update_app_config():
    data = request.get_json()
    config = load_app_config()
    config.update(data)
    save_app_config(config)
    return {"success": True, "config": config}

@app.route('/api/load_all', methods=['POST'])
def api_load_all():
    global models, test_sensors, test_configurations, model_configs
    data = request.json
    if not data:
        return jsonify({'status': 'error', 'message': 'No data provided'}), 400
    try:
        if 'models' in data:
            # Validate models
            if not isinstance(data['models'], list):
                return jsonify({'status': 'error', 'message': 'models should be a list'}), 400
            models.clear()
            for m in data['models']:
                if not all(k in m for k in ('name', 'file', 'description')):
                    return jsonify({'status': 'error', 'message': 'Missing fields in at least one model'}), 400
                models.append(m)
        if 'sensors' in data:
            if not isinstance(data['sensors'], list):
                return jsonify({'status': 'error', 'message': 'sensors should be a list'}), 400
            test_sensors.clear()
            for s in data['sensors']:
                if 'unique_id' not in s:
                    return jsonify({'status': 'error', 'message': 'Missing unique_id in at least one sensor'}), 400
                test_sensors.append(s)
        if 'mapping' in data:
            if not isinstance(data['mapping'], list):
                return jsonify({'status': 'error', 'message': 'mapping should be a list'}), 400
            test_configurations.clear()
            test_configurations.extend(data['mapping'])
        if 'modelConfigs' in data:
            if not isinstance(data['modelConfigs'], list):
                return jsonify({'status': 'error', 'message': 'modelConfigs should be a list'}), 400
            model_configs.clear()
            for mc in data['modelConfigs']:
                if not isinstance(mc, dict) or 'file' not in mc or 'config' not in mc:
                    return jsonify({'status': 'error', 'message': 'Each modelConfig should have file and config'}), 400
                model_configs[mc['file']] = mc['config']
        # Save all data to disk after bulk load
        save_all(models, test_sensors, test_configurations, model_configs)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

if __name__ == '__main__':
    from livereload import Server
    server = Server(app.wsgi_app)
    server.watch('templates/')
    server.watch('static/')
    server.serve(port=5501, open_url_delay=True, debug=True)
