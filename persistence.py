import json
import os

DATA_FILES = {
    'models': 'models.json',
    'test_sensors': 'test_sensors.json',
    'test_configurations': 'test_configurations.json',
    'model_configs': 'model_configs.json',
    'test_run_history': 'test_run_history.json',
}


def save_data(name, data):
    filename = DATA_FILES[name]
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)


def load_data(name, default):
    filename = DATA_FILES[name]
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    return default


def save_all(models, test_sensors, test_configurations, model_configs):
    save_data('models', models)
    save_data('test_sensors', test_sensors)
    save_data('test_configurations', test_configurations)
    save_data('model_configs', model_configs)


def load_all():
    models = load_data('models', [])
    test_sensors = load_data('test_sensors', [])
    test_configurations = load_data('test_configurations', [])
    model_configs = load_data('model_configs', {})
    return models, test_sensors, test_configurations, model_configs
