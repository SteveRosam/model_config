from flask import Flask, render_template, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

# In-memory mapping store
test_mapping = []

# In-memory model list and Test Configs
model_files = ['model1.pkl', 'model2.pkl']  # For backward compatibility
model_configs = {}
models = [
    {"name": "Model 1", "file": "model1.pkl", "description": "First test model."},
    {"name": "Model 2", "file": "model2.pkl", "description": "Second test model."}
]

# In-memory test sensors
test_sensors = [
    {"unique_id": "TEST_SEN_0001", "name": "Temperature Sensor", "description": "Measures temperature inside the test."},
    {"unique_id": "TEST_SEN_0002", "name": "Pressure Sensor", "description": "Measures pressure inside the test."}
]

# In-memory store for last run
last_run = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/test_config')
def test_config():
    return render_template('test_config.html')

@app.route('/api/test_mapping', methods=['GET', 'POST'])
def api_test_mapping():
    global test_mapping
    if request.method == 'POST':
        test_mapping = request.json or []
        return jsonify({'status': 'success'})
    return jsonify(test_mapping)

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
            return jsonify({'status': 'success'})
        # Single model add
        if not data or not all(k in data for k in ('name', 'file', 'description')):
            return jsonify({'status': 'error', 'message': 'Missing fields'}), 400
        models.append(data)
        return jsonify({'status': 'success'})
    return jsonify(models)

@app.route('/api/model_config/<model_file>', methods=['GET', 'POST'])
def api_model_config(model_file):
    global model_configs
    if request.method == 'POST':
        model_configs[model_file] = request.json or {}
        return jsonify({'status': 'success'})
    return jsonify(model_configs.get(model_file, {}))

@app.route('/run_test')
def run_test_page():
    return render_template('run_test.html')

@app.route('/api/run_test', methods=['POST'])
def api_run_test():
    global last_run
    data = request.json
    if not data or 'file' not in data or 'config_idx' not in data:
        return jsonify({'status': 'error', 'message': 'Missing file or config'}), 400
    last_run = {'file': data['file'], 'config_idx': data['config_idx']}
    return jsonify({'status': 'success'})

@app.route('/api/load_all', methods=['POST'])
def api_load_all():
    global models, test_sensors, test_mapping, model_configs
    data = request.json
    try:
        if 'models' in data:
            models.clear()
            for m in data['models']:
                if not all(k in m for k in ('name', 'file', 'description')):
                    return jsonify({'status': 'error', 'message': 'Invalid model'}), 400
                models.append(m)
        if 'sensors' in data:
            test_sensors.clear()
            for s in data['sensors']:
                if not all(k in s for k in ('unique_id', 'name', 'description')):
                    return jsonify({'status': 'error', 'message': 'Invalid sensor'}), 400
                test_sensors.append(s)
        if 'mapping' in data:
            test_mapping.clear()
            for m in data['mapping']:
                if not all(k in m for k in ('test-connection', 'device_sensor')):
                    return jsonify({'status': 'error', 'message': 'Invalid mapping'}), 400
                test_mapping.append(m)
        if 'modelConfigs' in data:
            model_configs.clear()
            for mc in data['modelConfigs']:
                if 'file' in mc and 'config' in mc:
                    model_configs[mc['file']] = mc['config']
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/cabinet_sensors')
def cabinet_sensors_page():
    return render_template('cabinet_sensors.html')

@app.route('/api/cabinet_sensors', methods=['GET', 'POST'])
def api_cabinet_sensors():
    global test_sensors
    if request.method == 'POST':
        data = request.json
        if not data or not all(k in data for k in ('unique_id', 'name', 'description')):
            return jsonify({'status': 'error', 'message': 'Missing fields'}), 400
        # Prevent duplicate unique_id
        if any(s['unique_id'] == data['unique_id'] for s in test_sensors):
            return jsonify({'status': 'error', 'message': 'Unique ID already exists'}), 400
        test_sensors.append(data)
        return jsonify({'status': 'success'})
    return jsonify(test_sensors)


if __name__ == '__main__':
    from livereload import Server
    server = Server(app.wsgi_app)
    server.watch('templates/')
    server.watch('static/')
    server.serve(port=5501, open_url_delay=True, debug=True)
