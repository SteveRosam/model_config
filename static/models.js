document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('add-model-form');
    const modelsList = document.getElementById('models-list');
    const downloadBtn = document.getElementById('download-models-btn');
    const uploadInput = document.getElementById('upload-models-input');
    const configCogBtn = document.getElementById('config-cog-btn');
    const configModal = document.getElementById('models-config-modal');
    const closeConfigModal = document.getElementById('close-config-modal');

    function loadModels() {
        fetch('/api/models')
            .then(r => r.json())
            .then(models => {
                modelsList.innerHTML = '';
                models.forEach(model => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${model.name}</td><td>${model.file}</td><td>${model.description}</td>`;
                    modelsList.appendChild(tr);
                });
            });
    }

    form.onsubmit = function (e) {
        e.preventDefault();
        const name = document.getElementById('model-name').value.trim();
        const file = document.getElementById('model-file').value.trim();
        const description = document.getElementById('model-desc').value.trim();
        if (!name || !file || !description) return;
        fetch('/api/models', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, file, description })
        })
        .then(r => r.json())
        .then(() => {
            form.reset();
            loadModels();
        });
    };

    if (configCogBtn && configModal && closeConfigModal) {
        configCogBtn.onclick = function() {
            configModal.style.display = 'block';
        };
        closeConfigModal.onclick = function() {
            configModal.style.display = 'none';
        };
        configModal.onclick = function(e) {
            if (e.target === configModal) configModal.style.display = 'none';
        };
    }

    if (downloadBtn) {
        downloadBtn.onclick = function () {
            fetch('/api/models')
                .then(r => r.json())
                .then(models => {
                    const blob = new Blob([JSON.stringify(models, null, 2)], {type: 'application/json'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `models.json`;
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
            reader.onload = function (e) {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (Array.isArray(imported)) {
                        // models = imported;
                        // saveModels();
                        // renderModels();
                        fetch('/api/models', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(imported)
                        })
                        .then(r => r.json())
                        .then(() => loadModels());
                    }
                } catch (err) {
                    alert('Invalid JSON file');
                }
            };
            reader.readAsText(file);
        };
    }

    loadModels();
});
