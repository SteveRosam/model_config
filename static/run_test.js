document.addEventListener('DOMContentLoaded', function () {
    // Hardcoded files list (simulate files on disk)
    const files = [
        '2025-01-22_BOILER_V7',
        '2025-02-10_CHILLER_X1',
        '2025-03-15_HEATER_A3'
    ];
    const fileSelect = document.getElementById('file-select');
    const configSelect = document.getElementById('config-select');
    const status = document.getElementById('run-status');

    // Populate file select
    files.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = f;
        fileSelect.appendChild(opt);
    });

    // Populate test configuration select from cabinet mappings
    fetch('/api/cabinet_mapping').then(r => r.json()).then(mappings => {
        configSelect.innerHTML = '';
        if (Array.isArray(mappings) && mappings.length > 0) {
            mappings.forEach((m, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = `Test Config ${idx + 1}`;
                configSelect.appendChild(opt);
            });
        } else {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'No Test Configurations';
            configSelect.appendChild(opt);
        }
    });

    document.getElementById('run-test-form').onsubmit = function (e) {
        e.preventDefault();
        const selectedFile = fileSelect.value;
        const selectedConfigIdx = configSelect.value;
        fetch('/api/run_test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: selectedFile, config_idx: selectedConfigIdx })
        })
        .then(r => r.json())
        .then(resp => {
            if (resp.status === 'success') {
                status.textContent = 'Run started!';
            } else {
                status.textContent = 'Error: ' + (resp.message || 'Unknown error');
            }
            setTimeout(() => { status.textContent = ''; }, 2000);
        });
    };
});
