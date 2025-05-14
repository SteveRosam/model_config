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

    // Populate test configuration select from test configurations
    fetch('/api/test_mapping').then(r => r.json()).then(configs => {
        configSelect.innerHTML = '';
        if (Array.isArray(configs) && configs.length > 0) {
            configs.forEach((cfg, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = cfg.name ? cfg.name : `Config ${idx + 1}`;
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
            body: JSON.stringify({ file: selectedFile, config_idx: selectedConfigIdx, user: 'Emma Wagner' })
        })
        .then(r => r.json())
        .then(resp => {
            if (resp.status === 'success') {
                status.textContent = 'Run started!';
            } else {
                status.textContent = 'Error: ' + (resp.message || 'Unknown error');
            }
            setTimeout(() => { status.textContent = ''; }, 2000);
            setTimeout(renderTestRunHistory, 500);
        });
    };

    // --- Test Run History ---
    function renderTestRunHistory() {
        Promise.all([
            fetch('/api/test_run_history').then(r => r.json()),
            fetch('/api/test_mapping').then(r => r.json())
        ]).then(([history, configs]) => {
            const tbody = document.querySelector('#test-run-history-table tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
            if (Array.isArray(history) && history.length > 0) {
                history.slice().reverse().forEach(run => {
                    const tr = document.createElement('tr');
                    const configName = configs[run.config_idx]?.name || `Config ${Number(run.config_idx) + 1}` || '';
                    tr.innerHTML = `<td>${new Date(run.timestamp).toLocaleString()}</td><td>${run.file}</td><td>${configName}</td><td>${run.user || 'Unknown'}</td>`;
                    tbody.appendChild(tr);
                });
            } else {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="3" style="text-align:center;color:#888;">No runs yet</td>';
                tbody.appendChild(tr);
            }
        });
    }
    renderTestRunHistory();
});
