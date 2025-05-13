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

    function createRow(mapping = {"test_connection": '', "device_sensor": ''}) {
        const tr = document.createElement('tr');
        const testConnTd = document.createElement('td');
        const sensorTd = document.createElement('td');
        const actionTd = document.createElement('td');

        const testConnInput = document.createElement('input');
        testConnInput.type = 'text';
        testConnInput.value = mapping.test_connection || '';
        testConnInput.placeholder = 'Test Connection';
        testConnTd.appendChild(testConnInput);

        const sensorInput = document.createElement('input');
        sensorInput.type = 'text';
        sensorInput.value = mapping.device_sensor || '';
        sensorInput.placeholder = 'Device Sensor';
        sensorTd.appendChild(sensorInput);

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

    function loadMappings() {
        showSpinner(true);
        fetch('/api/test_mapping')
            .then(r => r.json())
            .then(mappings => {
                tableBody.innerHTML = '';
                if (Array.isArray(mappings) && mappings.length) {
                    mappings.forEach(m => createRow(m));
                } else {
                    createRow();
                }
                showSpinner(false);
            });
    }

    addBtn.onclick = function () {
        createRow();
    };

    saveBtn.onclick = function () {
        const rows = tableBody.querySelectorAll('tr');
        const data = [];
        rows.forEach(tr => {
            const tds = tr.querySelectorAll('td');
            const test_connection = tds[0].querySelector('input').value.trim();
            const device_sensor = tds[1].querySelector('input').value.trim();
            if (test_connection && device_sensor) {
                data.push({ test_connection, device_sensor });
            }
        });
        showSpinner(true);
        fetch('/api/test_mapping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
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
                    .then(() => loadMappings());
                } catch (err) {
                    alert('Invalid JSON file.');
                }
            };
            reader.readAsText(file);
        };
    }

    loadMappings();
});
