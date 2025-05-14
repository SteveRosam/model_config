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
                history.slice().reverse().forEach((run, idx) => {
                    const tr = document.createElement('tr');
                    const configName = configs[run.config_idx]?.name || `Config ${Number(run.config_idx) + 1}` || '';
                    tr.innerHTML = `<td>${new Date(run.timestamp).toLocaleString()}</td><td>${run.file}</td><td>${configName}</td><td>${run.user || 'Unknown'}</td><td style='width:220px;'>${run.notes && run.notes.trim() ? `<span class='test-notes-icon-wrap' style='position:relative;display:inline-block;'><svg height='18' width='18' viewBox='0 0 20 20' style='vertical-align:middle;margin-right:4px;cursor:pointer;' fill='#4fc3f7'><path d='M2 3.5A1.5 1.5 0 0 1 3.5 2h13A1.5 1.5 0 0 1 18 3.5v9A1.5 1.5 0 0 1 16.5 14H6.707l-3.353 3.354A.5.5 0 0 1 2.5 16.5V3.5z'/></svg><span class='test-notes-tooltip' style='display:none;position:absolute;bottom:120%;left:50%;transform:translateX(-50%);background:#222e3c;color:#fff;padding:6px 12px;border-radius:6px;font-size:14px;white-space:pre-line;box-shadow:0 2px 8px rgba(0,0,0,0.16);z-index:10;min-width:120px;max-width:320px;word-break:break-word;'>${run.notes.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span></span>` : ''}<button class=\"test-notes-btn\">Notes</button><div class=\"test-notes-edit\" style=\"display:none;\"><textarea rows=\"2\" style=\"width:90%;resize:vertical;\">${run.notes ? run.notes.replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''}</textarea><br><button class=\"test-notes-save\">Save</button> <button class=\"test-notes-cancel\">Cancel</button></div></td>`;                    tbody.appendChild(tr);

                    // Notes button logic
                    const notesBtn = tr.querySelector('.test-notes-btn');
                    const notesEdit = tr.querySelector('.test-notes-edit');
                    const textarea = notesEdit.querySelector('textarea');
                    const saveBtn = notesEdit.querySelector('.test-notes-save');
                    const cancelBtn = notesEdit.querySelector('.test-notes-cancel');

                    // Tooltip logic for speech bubble icon
                    const iconWrap = tr.querySelector('.test-notes-icon-wrap');
                    if (iconWrap) {
                        const tooltip = iconWrap.querySelector('.test-notes-tooltip');
                        const svg = iconWrap.querySelector('svg');
                        svg.addEventListener('mouseenter', () => {
                            tooltip.style.display = 'block';
                        });
                        svg.addEventListener('mouseleave', () => {
                            tooltip.style.display = 'none';
                        });
                        svg.addEventListener('focus', () => {
                            tooltip.style.display = 'block';
                        });
                        svg.addEventListener('blur', () => {
                            tooltip.style.display = 'none';
                        });
                    }

                    notesBtn.addEventListener('click', () => {
                        notesEdit.style.display = '';
                        notesBtn.style.display = 'none';
                        textarea.value = run.notes || '';
                    });
                    cancelBtn.addEventListener('click', () => {
                        notesEdit.style.display = 'none';
                        notesBtn.style.display = '';
                    });
                    saveBtn.addEventListener('click', () => {
                        fetch('/api/test_run_notes', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ index: idx, notes: textarea.value })
                        })
                        .then(r => r.json())
                        .then(resp => {
                            if (resp.status === 'success') {
                                run.notes = textarea.value;
                                notesEdit.style.display = 'none';
                                notesBtn.style.display = '';
                            } else {
                                alert('Failed to save notes: ' + (resp.message || 'Unknown error'));
                            }
                        });
                    });
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
