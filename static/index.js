document.addEventListener('DOMContentLoaded', function () {
    // Download All
    const downloadAllBtn = document.getElementById('download-all-btn');
    if (downloadAllBtn) {
        downloadAllBtn.onclick = async function () {
            const [models, sensors, mapping, modelConfigs] = await Promise.all([
                fetch('/api/models').then(r => r.json()),
                fetch('/api/test_chamber').then(r => r.json()),
                fetch('/api/test_mapping').then(r => r.json()),
                Promise.resolve(await fetch('/api/models').then(r => r.json()))
                    .then(models => Promise.all(models.map(m => fetch(`/api/model_config/${encodeURIComponent(m.file)}`).then(r => r.json()).then(cfg => ({file: m.file, config: cfg}))))),
            ]);
            const all = { models, sensors, mapping, modelConfigs };
            const blob = new Blob([JSON.stringify(all, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'all_config_data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
    }
    // Load All handler
    const uploadAllInput = document.getElementById('upload-all-input');
    if (uploadAllInput) {
        uploadAllInput.onchange = function (e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (evt) {
                try {
                    const allData = JSON.parse(evt.target.result);
                    fetch('/api/load_all', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(allData)
                    })
                    .then(r => r.json())
                    .then(resp => {
                        if (resp.status === 'success') {
                            location.reload();
                        } else {
                            alert('Load failed: ' + (resp.message || 'Unknown error'));
                        }
                    });
                } catch (err) {
                    alert('Invalid JSON file.');
                }
            };
            reader.readAsText(file);
        };
    }
    // Populate tables
    fetch('/api/models').then(r => r.json()).then(models => {
        const tbody = document.querySelector('#models-table tbody');
        if (tbody) {
            tbody.innerHTML = '';
            models.forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${m.name}</td><td>${m.file}</td><td>${m.description}</td>`;
                tbody.appendChild(tr);
            });
        }
    });
    fetch('/api/test_chamber').then(r => r.json()).then(sensors => {
        const tbody = document.querySelector('#sensors-table tbody');
        if (tbody) {
            tbody.innerHTML = '';
            sensors.forEach(s => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${s.unique_id}</td>`;
                tbody.appendChild(tr);
            });
        }
    });
    fetch('/api/test_mapping').then(r => r.json()).then(configs => {
    const mappingTable = document.getElementById('mapping-table');
    // Remove any previously rendered configs
    const oldBlocks = document.querySelectorAll('.test-config-block');
    oldBlocks.forEach(el => el.remove());
    if (mappingTable && Array.isArray(configs) && configs.length) {
        let insertAfter = mappingTable;
        configs.forEach(cfg => {
            const block = document.createElement('div');
            block.className = 'test-config-block';
            block.style.marginBottom = '32px';
            const heading = document.createElement('h3');
            heading.textContent = cfg.name || 'Unnamed Configuration';
            block.appendChild(heading);
            const desc = document.createElement('div');
            desc.textContent = cfg.description || '';
            desc.style.fontStyle = 'italic';
            desc.style.marginBottom = '8px';
            block.appendChild(desc);
            const table = document.createElement('table');
            table.className = 'mapping-table';
            table.style.width = '100%';
            table.innerHTML = `<thead><tr><th>Cabinet Connection</th><th>Device Sensor</th></tr></thead>`;
            const tbody = document.createElement('tbody');
            if (Array.isArray(cfg.mapping) && cfg.mapping.length) {
                cfg.mapping.forEach(m => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${m.test_connection}</td><td>${m.device_sensor}</td>`;
                    tbody.appendChild(tr);
                });
            } else {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="2" style="text-align:center;color:#888;">No mappings</td>';
                tbody.appendChild(tr);
            }
            table.appendChild(tbody);
            block.appendChild(table);
            // Insert directly after the mapping table
            insertAfter.parentNode.insertBefore(block, insertAfter.nextSibling);
            insertAfter = block;
        });
    }
});
    // Model Configs
    fetch('/api/models').then(r => r.json()).then(models => {
        const container = document.getElementById('model-configs-list');
        if (container) {
            container.innerHTML = '';
            models.forEach(m => {
                fetch(`/api/model_config/${encodeURIComponent(m.file)}`).then(r => r.json()).then(cfg => {
                    const pre = document.createElement('pre');
                    pre.textContent = `${m.name} (${m.file}):\n` + JSON.stringify(cfg, null, 2);
                    container.appendChild(pre);
                });
            });
        }
    });
});
