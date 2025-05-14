// test_sensors.js - Handles the Test Sensors page

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('sensor-form');
    const uniqueIdInput = document.getElementById('sensor-unique-id');
    
    const statusSpan = document.getElementById('sensor-status');
    const tableBody = document.querySelector('#sensor-table tbody');
    const downloadBtn = document.getElementById('download-sensors-btn');
    const uploadInput = document.getElementById('upload-sensors-input');

    function loadSensors() {
        tableBody.innerHTML = '';
        fetch('/api/cabinet_sensors')
            .then(r => r.json())
            .then(sensors => {
                sensors.forEach(s => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${s.unique_id}</td>`;
                    tableBody.appendChild(row);
                });
            });
    }

    form.onsubmit = function (e) {
        e.preventDefault();
        const unique_id = uniqueIdInput.value.trim();
        if (!unique_id) return;
        fetch('/api/cabinet_sensors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unique_id })
        })
        .then(r => r.json())
        .then(resp => {
            if (resp.status === 'success') {
                statusSpan.textContent = 'Sensor added!';
                form.reset();
                loadSensors();
                setTimeout(() => { statusSpan.textContent = ''; }, 1500);
            } else {
                statusSpan.style.color = 'red';
                statusSpan.textContent = resp.message || 'Error';
                setTimeout(() => { statusSpan.textContent = ''; statusSpan.style.color = 'green'; }, 2000);
            }
        });
    };

    // Download sensors as JSON
    if (downloadBtn) {
        downloadBtn.onclick = function () {
            fetch('/api/cabinet_sensors')
                .then(r => r.json())
                .then(sensors => {
                    const blob = new Blob([JSON.stringify(sensors, null, 2)], {type: 'application/json'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'test_sensors.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
        };
    }
    // Upload sensors from JSON
    if (uploadInput) {
        uploadInput.onchange = function (e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (evt) {
                try {
                    const sensors = JSON.parse(evt.target.result);
                    if (!Array.isArray(sensors)) throw new Error('Invalid format');
                    // Overwrite all sensors by posting one by one (could be optimized)
                    Promise.all(sensors.map(s =>
                        fetch('/api/cabinet_sensors', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(s)
                        })
                    )).then(() => window.location.reload());
                } catch (err) {
                    alert('Invalid JSON file.');
                }
            };
            reader.readAsText(file);
        };
    }

    loadSensors();
});
