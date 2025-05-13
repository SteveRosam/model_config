// model_config.js - Handles the Model Configuration page

document.addEventListener('DOMContentLoaded', function () {
    const modelSelect = document.getElementById('model-select');
    const paramList = document.getElementById('param-list');
    const addParamBtn = document.getElementById('add-param-btn');
    const saveBtn = document.getElementById('save-model-config-btn');
    const saveStatus = document.getElementById('model-save-status');
    const form = document.getElementById('model-config-form');
    const downloadBtn = document.getElementById('download-model-config-btn');
    const uploadInput = document.getElementById('upload-model-config-input');

    // Helper to create parameter row
    function createParamRow(modelParam = '', dataProp = '', source = 'Live Data') {
        const tr = document.createElement('tr');
        tr.className = 'param-row';

        const modelParamTd = document.createElement('td');
        const modelParamInput = document.createElement('input');
        modelParamInput.type = 'text';
        modelParamInput.placeholder = 'Model Parameter Name';
        modelParamInput.value = modelParam;
        modelParamInput.required = true;
        modelParamInput.style.width = '95%';
        modelParamTd.appendChild(modelParamInput);

        const dataPropTd = document.createElement('td');
        const dataPropInput = document.createElement('input');
        dataPropInput.type = 'text';
        dataPropInput.placeholder = 'Data';
        dataPropInput.value = dataProp;
        dataPropInput.required = true;
        dataPropInput.style.width = '95%';
        dataPropTd.appendChild(dataPropInput);

        const sourceTd = document.createElement('td');
        const sourceSelect = document.createElement('select');
        ['Live Data', 'Constant'].forEach(optVal => {
            const opt = document.createElement('option');
            opt.value = optVal;
            opt.textContent = optVal;
            if (optVal === source) opt.selected = true;
            sourceSelect.appendChild(opt);
        });
        sourceTd.appendChild(sourceSelect);

        const actionTd = document.createElement('td');
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => tr.remove();
        actionTd.appendChild(removeBtn);

        tr.appendChild(modelParamTd);
        tr.appendChild(sourceTd);
        tr.appendChild(dataPropTd);
        tr.appendChild(actionTd);
        paramList.appendChild(tr);
    }

    // Load models into select
    fetch('/api/models')
        .then(r => r.json())
        .then(models => {
            modelSelect.innerHTML = '';
            models.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.file;
                opt.textContent = m.name + " (" + m.file + ")";
                modelSelect.appendChild(opt);
            });
            // Load config for first model
            if (models.length > 0) {
                loadModelConfig(models[0].file);
            }
        });

    // Load config when model changes
    modelSelect.onchange = function () {
        loadModelConfig(modelSelect.value);
    };

    function loadModelConfig(modelFile) {
        paramList.innerHTML = '';
        fetch(`/api/model_config/${encodeURIComponent(modelFile)}`)
            .then(r => r.json())
            .then(config => {
                if (Array.isArray(config) && config.length > 0) {
                    // If array of objects [{model_param, data_property_name, source}]
                    if (typeof config[0] === 'object') {
                        config.forEach(obj => createParamRow(obj.model_param || '', obj.data_property_name || '', obj.source || 'Live Data'));
                    } else if (typeof config[0] === 'string') {
                        // Backward compatibility: array of strings
                        config.forEach(name => createParamRow(name, '', 'Live Data'));
                    }
                } else if (config && typeof config === 'object' && Object.keys(config).length > 0) {
                    // Backward compatibility: convert object keys to array
                    Object.keys(config).forEach(name => createParamRow(name, '', 'Live Data'));
                } else {
                    createParamRow(); // Show one empty row by default
                }
            });
    }

    addParamBtn.onclick = function () {
        createParamRow();
    };

    // Download config as JSON
    if (downloadBtn) {
        downloadBtn.onclick = function () {
            const modelFile = modelSelect.value;
            fetch(`/api/model_config/${encodeURIComponent(modelFile)}`)
                .then(r => r.json())
                .then(config => {
                    const blob = new Blob([JSON.stringify(config, null, 2)], {type: 'application/json'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${modelFile}_config.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
        };
    }
    // Upload config from JSON
    if (uploadInput) {
        uploadInput.onchange = function (e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (evt) {
                try {
                    const config = JSON.parse(evt.target.result);
                    const modelFile = modelSelect.value;
                    fetch(`/api/model_config/${encodeURIComponent(modelFile)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(config)
                    })
                    .then(r => r.json())
                    .then(() => loadModelConfig(modelFile));
                } catch (err) {
                    alert('Invalid JSON file.');
                }
            };
            reader.readAsText(file);
        };
    }

    form.onsubmit = function (e) {
        e.preventDefault();
        const config = [];
        paramList.querySelectorAll('.param-row').forEach(tr => {
            const inputs = tr.querySelectorAll('input');
            const selects = tr.querySelectorAll('select');
            const model_param = inputs[0].value.trim();
            const data_property_name = inputs[1].value.trim();
            const source = selects[0].value;
            if (model_param && data_property_name && source) config.push({model_param, data_property_name, source});
        });
        const modelFile = modelSelect.value;
        fetch(`/api/model_config/${encodeURIComponent(modelFile)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        })
        .then(r => r.json())
        .then(() => {
            saveStatus.textContent = 'Model configuration saved!';
            setTimeout(() => { saveStatus.textContent = ''; }, 2000);
        });
    };
});
