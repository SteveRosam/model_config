// test_config.js - Handles the Test Configuration page

document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.querySelector('#test-mapping-table tbody');
    const addBtn = document.getElementById('add-test-mapping-btn');
    const saveBtn = document.getElementById('save-test-mapping-btn');
    const downloadBtn = document.getElementById('download-test-mapping-btn');
    const uploadInput = document.getElementById('upload-test-mapping-input');
    const saveStatus = document.getElementById('test-save-status');
    const spinner = document.getElementById('spinner');
    function showSpinner(show) {
        spinner.style.display = show ? '' : 'none';
    }

function createRow(mapping = {"test_connection": '', "device_sensor": ''}, cabinetSensors = []) {
    const tr = document.createElement('tr');
    const testConnTd = document.createElement('td');
    const sensorTd = document.createElement('td');
    const actionTd = document.createElement('td');

    // Dropdown for Cabinet Connection
    const testConnSelect = document.createElement('select');
    cabinetSensors.forEach(sensor => {
        const opt = document.createElement('option');
        opt.value = sensor.unique_id;
        opt.textContent = sensor.unique_id;
        if (sensor.unique_id === mapping.test_connection) opt.selected = true;
        testConnSelect.appendChild(opt);
    });
    testConnTd.appendChild(testConnSelect);

    // Input for Device Sensor
    const sensorInput = document.createElement('input');
    sensorInput.type = 'text';
    sensorInput.value = mapping.device_sensor || '';
    sensorInput.placeholder = 'Device Sensor';
    sensorTd.appendChild(sensorInput);

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => tr.remove();
    actionTd.appendChild(removeBtn);

    tr.appendChild(testConnTd);
    tr.appendChild(sensorTd);
    tr.appendChild(actionTd);
    tableBody.appendChild(tr);
}

    let cabinetSensorsCache = [];
let testConfigurations = [];
let selectedConfigIdx = 0;

function renderConfigSelector() {
    const selector = document.getElementById('config-selector');
    selector.innerHTML = '';
    testConfigurations.forEach((cfg, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = cfg.name || `Config ${idx+1}`;
        selector.appendChild(option);
    });
    selector.value = selectedConfigIdx;
}

function renderConfigDetails() {
    const nameInput = document.getElementById('config-name');
    const descInput = document.getElementById('config-desc');
    if (testConfigurations[selectedConfigIdx]) {
        nameInput.value = testConfigurations[selectedConfigIdx].name || '';
        descInput.value = testConfigurations[selectedConfigIdx].description || '';
    } else {
        nameInput.value = '';
        descInput.value = '';
    }
}

function renderMappingTable() {
    tableBody.innerHTML = '';
    const mapping = testConfigurations[selectedConfigIdx]?.mapping || [];
    if (Array.isArray(mapping) && mapping.length) {
        mapping.forEach(m => createRow(m, cabinetSensorsCache));
    } else {
        createRow({"test_connection": cabinetSensorsCache[0]?.unique_id || '', "device_sensor": ''}, cabinetSensorsCache);
    }
}

function loadAll() {
    showSpinner(true);
    fetch('/api/test_chamber')
        .then(r => r.json())
        .then(cabinetSensors => {
            cabinetSensorsCache = cabinetSensors;
            fetch('/api/test_mapping')
                .then(r => r.json())
                .then(configs => {
                    testConfigurations = Array.isArray(configs) && configs.length ? configs : [{name:'Default',description:'',mapping:[]}];
                    selectedConfigIdx = 0;
                    renderConfigSelector();
                    renderConfigDetails();
                    renderMappingTable();
                    showSpinner(false);
                });
        });
}


    addBtn.onclick = function () {
    createRow({"test_connection": cabinetSensorsCache[0]?.unique_id || '', "device_sensor": ''}, cabinetSensorsCache);
};

// Config selector change
const configSelector = document.getElementById('config-selector');
if (configSelector) {
    configSelector.onchange = function() {
        selectedConfigIdx = parseInt(configSelector.value, 10);
        renderConfigDetails();
        renderMappingTable();
    };
}
// Add new config
const addConfigBtn = document.getElementById('add-config-btn');
if (addConfigBtn) {
    addConfigBtn.onclick = function() {
        testConfigurations.push({name:'New Config',description:'',mapping:[]});
        selectedConfigIdx = testConfigurations.length - 1;
        renderConfigSelector();
        renderConfigDetails();
        renderMappingTable();
    };
}
// Name/desc change
const nameInput = document.getElementById('config-name');
const descInput = document.getElementById('config-desc');
if (nameInput && descInput) {
    nameInput.oninput = function() {
        if (testConfigurations[selectedConfigIdx]) testConfigurations[selectedConfigIdx].name = nameInput.value;
        renderConfigSelector();
    };
    descInput.oninput = function() {
        if (testConfigurations[selectedConfigIdx]) testConfigurations[selectedConfigIdx].description = descInput.value;
    };
}

    saveBtn.onclick = function () {
    const rows = tableBody.querySelectorAll('tr');
    const mapping = [];
    rows.forEach(tr => {
        const tds = tr.querySelectorAll('td');
        const test_connection = tds[0].querySelector('select').value;
        const device_sensor = tds[1].querySelector('input').value.trim();
        if (test_connection && device_sensor) {
            mapping.push({ test_connection, device_sensor });
        }
    });
    if (testConfigurations[selectedConfigIdx]) {
        testConfigurations[selectedConfigIdx].mapping = mapping;
    }
    showSpinner(true);
    fetch('/api/test_mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testConfigurations)
    })
    .then(r => r.json())
    .then(resp => {
        showSpinner(false);
        if (resp.status === 'success') {
            saveStatus.textContent = 'Saved!';
        } else {
            saveStatus.textContent = 'Error saving!';
        }
        setTimeout(() => { saveStatus.textContent = ''; }, 2000);
    });
};

    if (downloadBtn) {
        downloadBtn.onclick = function () {
            fetch('/api/test_mapping')
                .then(r => r.json())
                .then(mapping => {
                    const blob = new Blob([JSON.stringify(mapping, null, 2)], {type: 'application/json'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'test_mapping.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
        };
    }

    if (uploadInput) {
        uploadInput.onchange = function (e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (evt) {
                try {
                    const mapping = JSON.parse(evt.target.result);
                    if (!Array.isArray(mapping)) throw new Error('Invalid format');
                    fetch('/api/test_mapping', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(mapping)
                    })
                    .then(r => r.json())
                    .then(() => loadAll());
                } catch (err) {
                    alert('Invalid JSON file.');
                }
            };
            reader.readAsText(file);
        };
    }

    loadAll();
});
