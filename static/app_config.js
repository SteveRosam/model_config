// app_config.js - Handles the App Configuration page

document.addEventListener('DOMContentLoaded', function () {
    // Load current config
    fetch('/api/app_config').then(r => r.json()).then(cfg => {
        document.getElementById('test-chamber-page-name').value = cfg.test_chamber_page_name || 'Test Chamber';
        document.getElementById('test-config-page-name').value = cfg.test_config_page_name || 'Test Configuration';
        document.getElementById('cabinet-connection-label').value = cfg.cabinet_connection_label || 'Cabinet Connection';
        document.getElementById('device-sensor-label').value = cfg.device_sensor_label || 'Device Sensor';
    });

    // Handle form submit
    const form = document.getElementById('app-config-form');
    form.onsubmit = function(e) {
        e.preventDefault();
        const name = document.getElementById('test-chamber-page-name').value.trim() || 'Test Chamber';
        const configPageName = document.getElementById('test-config-page-name').value.trim() || 'Test Configuration';
        const cabinetLabel = document.getElementById('cabinet-connection-label').value.trim() || 'Cabinet Connection';
        const deviceLabel = document.getElementById('device-sensor-label').value.trim() || 'Device Sensor';
        fetch('/api/update_app_config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                test_chamber_page_name: name,
                test_config_page_name: configPageName,
                cabinet_connection_label: cabinetLabel,
                device_sensor_label: deviceLabel
            })
        })
        .then(r => r.json())
        .then(() => {
            const status = document.getElementById('save-status');
            status.style.display = 'inline';
            setTimeout(() => { status.style.display = 'none'; }, 1200);
        });
    };
});
