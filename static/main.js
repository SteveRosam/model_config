// main.js - Configuration Management Web App Skeleton

document.addEventListener('DOMContentLoaded', function () {
    // Sample data
    const deviceSensors = [
        'heat_exchanger_temp',
        'heat_exchanger_flow_rate',
        'fuel_flow_rate',
        'hot_water_output_temp',
        'pressure_sensor',
        'ambient_temp'
    ];
    let cabinetConnections = [];

    // Only run mapping UI code if on cabinet config page
    if (document.getElementById('cabinet-config-container')) {
        const tableBody = document.querySelector('#mapping-table tbody');
        const addBtn = document.getElementById('add-mapping-btn');
        const saveBtn = document.getElementById('save-mapping-btn');
        const downloadBtn = document.getElementById('download-mapping-btn');
        const uploadInput = document.getElementById('upload-mapping-input');

        if (!tableBody) {
            console.error('Mapping table tbody not found. Please check the HTML structure.');
            return;
        }

        function createCabinetConnectionDropdown(selected) {
            const select = document.createElement('select');
            cabinetConnections.forEach(sensor => {
                const option = document.createElement('option');
                option.value = sensor.unique_id;
                option.textContent = sensor.unique_id;
                if (sensor.unique_id === selected) option.selected = true;
                select.appendChild(option);
            });
            return select;
        }
        function createDeviceSensorDropdown(selected) {
            const select = document.createElement('select');
            deviceSensors.forEach(sensor => {
                const option = document.createElement('option');
                option.value = sensor;
                option.textContent = sensor;
                if (sensor === selected) option.selected = true;
                select.appendChild(option);
            });
            return select;
        }

        function addRow(cabinet = '', sensor = '') {
            const row = document.createElement('tr');
            const connectionCell = document.createElement('td');
            const sensorCell = document.createElement('td');
            const actionCell = document.createElement('td');

            // Dropdowns
            const connectionDropdown = createCabinetConnectionDropdown(cabinet);
            const sensorDropdown = createDeviceSensorDropdown(sensor);

            connectionCell.appendChild(connectionDropdown);
            sensorCell.appendChild(sensorDropdown);
            // Remove button
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = () => row.remove();
            actionCell.appendChild(removeBtn);
            row.appendChild(connectionCell);
            row.appendChild(sensorCell);
            row.appendChild(actionCell);
            tableBody.appendChild(row);
        }

        // Load saved mapping if present
        function clearTable() {
            while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);
        }
        function loadMapping(mapping) {
            clearTable();
            if (Array.isArray(mapping) && mapping.length > 0) {
                mapping.forEach(m => addRow(m.cabinet_connection, m.device_sensor));
            } else {
                addRow('CAB_SEN_0001', 'heat_exchanger_temp');
            }
        }
        // Show spinner while loading
        const spinner = document.getElementById('spinner');
        if (spinner) spinner.style.display = 'block';
        // Fetch sensors first, then mapping
        fetch('/api/cabinet_sensors')
            .then(r => r.json())
            .then(sensors => {
                cabinetConnections = sensors.length ? sensors : [];
                return fetch('/api/cabinet_mapping');
            })
            .then(r => r.json())
            .then(data => {
                if (spinner) spinner.style.display = 'none';
                if (Array.isArray(data) && data.length > 0) {
                    loadMapping(data);
                } else {
                    addRow(cabinetConnections[0]?.unique_id || '', deviceSensors[0] || '');
                }
            })
            .catch(() => {
                if (spinner) spinner.style.display = 'none';
                addRow(cabinetConnections[0]?.unique_id || '', deviceSensors[0] || '');
            });

        addBtn.onclick = () => addRow();
        // Save Mapping functionality
        if (saveBtn) {
            saveBtn.onclick = function () {
                const mappings = [];
                tableBody.querySelectorAll('tr').forEach(row => {
                    const cabSelect = row.querySelector('td:nth-child(1) select');
                    const sensorSelect = row.querySelector('td:nth-child(2) select');
                    if (cabSelect && sensorSelect) {
                        mappings.push({
                            cabinet_connection: cabSelect.value,
                            device_sensor: sensorSelect.value
                        });
                    }
                });
                // Save to backend
                fetch('/api/cabinet_mapping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(mappings)
                })
                .then(r => r.json())
                .then(() => {
                    const statusDiv = document.getElementById('save-status');
                    if (statusDiv) {
                        statusDiv.textContent = 'Mapping saved successfully!';
                        setTimeout(() => { statusDiv.textContent = ''; }, 2000);
                    }
                });
            };
        }
        // Download mapping as JSON
        if (downloadBtn) {
            downloadBtn.onclick = function () {
                fetch('/api/cabinet_mapping')
                    .then(r => r.json())
                    .then(mapping => {
                        const blob = new Blob([JSON.stringify(mapping, null, 2)], {type: 'application/json'});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'cabinet_config.json';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    });
            };
        }
        // Upload mapping from JSON
        if (uploadInput) {
            uploadInput.onchange = function (e) {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function (evt) {
                    try {
                        const mapping = JSON.parse(evt.target.result);
                        fetch('/api/cabinet_mapping', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(mapping)
                        })
                        .then(r => r.json())
                        .then(() => window.location.reload());
                    } catch (err) {
                        alert('Invalid JSON file.');
                    }
                };
                reader.readAsText(file);
            };
        }
    }

    console.log('App loaded');
});
