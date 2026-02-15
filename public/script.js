document.addEventListener('DOMContentLoaded', init);

let globalConfig = null;

const STORAGE_KEYS = {
    API_KEY_USAGE: 'kayzz_api_key_usage',
    API_KEY_LIMIT: 'kayzz_api_key_limit',
    LAST_RESET: 'kayzz_last_reset'
};

function loadApiKeyUsage() {
    try {
        const usage = localStorage.getItem(STORAGE_KEYS.API_KEY_USAGE);
        const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);
        if (lastReset) {
            const lastDate = new Date(lastReset);
            const today = new Date();
            if (lastDate.toDateString() !== today.toDateString()) {
                saveApiKeyUsage(0);
                return 0;
            }
        }
        return usage ? parseInt(usage) : 0;
    } catch (e) {
        return 0;
    }
}

function saveApiKeyUsage(usage, limit) {
    try {
        localStorage.setItem(STORAGE_KEYS.API_KEY_USAGE, usage.toString());
        if (limit) localStorage.setItem(STORAGE_KEYS.API_KEY_LIMIT, limit.toString());
        localStorage.setItem(STORAGE_KEYS.LAST_RESET, new Date().toISOString());
    } catch (e) {}
}

function isLimitExceeded() {
    const usage = loadApiKeyUsage();
    const limit = parseInt(localStorage.getItem(STORAGE_KEYS.API_KEY_LIMIT) || '0');
    return limit > 0 && usage >= limit;
}

async function init() {
    try {
        const response = await fetch('/config');
        globalConfig = await response.json();
        
        setUi(globalConfig);
        loadEnd(globalConfig.tags);
        startWIBClock();
        loadReminder();
        setSearch();
        updateTotalEndpoints();
        updateVisitorCount();
        loadTopEndpoints();
    } catch (e) {
        showError('Failed to initialize');
    }
}

function showError(message) {
    const container = document.getElementById('api-container');
    if (container) {
        container.innerHTML = `<div class="bg-error/10 border border-error/30 rounded-lg p-6 text-center">
            <i class="fa-solid fa-exclamation-triangle text-error text-3xl mb-3"></i>
            <p class="text-error font-bold mb-2">${message}</p>
            <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-error text-white rounded-lg">Refresh</button>
        </div>`;
    }
}

async function updateVisitorCount() {
    try {
        const response = await fetch('/api/monitoring/stats');
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                const visitorElement = document.getElementById('stat-visitors');
                if (visitorElement) visitorElement.innerText = result.data.visitors || 0;
                
                if (result.data.endpointStats) {
                    updateTopEndpoints(result.data.endpointStats);
                }
            }
        }
    } catch (e) {}
}

async function loadTopEndpoints() {
    try {
        const response = await fetch('/api/monitoring/stats');
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data && result.data.endpointStats) {
                updateTopEndpoints(result.data.endpointStats);
            }
        }
    } catch (e) {}
}

function updateTopEndpoints(endpointStats) {
    const container = document.getElementById('top-endpoints');
    if (!container) return;
    
    const endpoints = Object.entries(endpointStats).sort((a, b) => b[1] - a[1]);
    
    if (endpoints.length === 0) {
        container.innerHTML = '<div class="text-[10px] text-gray-500 text-center py-2">No data yet</div>';
        return;
    }
    
    container.innerHTML = endpoints.map(([endpoint, count], index) => {
        const colors = ['text-primary', 'text-sky-blue', 'text-success', 'text-warning', 'text-secondary'];
        const color = colors[index % colors.length];
        return `<div class="flex justify-between items-center text-[10px] bg-black/30 p-2 rounded border border-border-dark mb-1">
            <div class="flex items-center gap-1.5 flex-1 min-w-0">
                <span class="${color} font-bold shrink-0">#${index + 1}</span>
                <code class="text-gray-400 truncate">${endpoint}</code>
            </div>
            <span class="${color} font-bold shrink-0">${formatNumber(count)}</span>
        </div>`;
    }).join('');
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function updateTotalEndpoints() {
    if (!globalConfig || !globalConfig.tags) return;
    const endpoints = Object.values(globalConfig.tags).flat();
    const totalEl = document.getElementById('total-endpoints');
    if(totalEl) totalEl.innerText = endpoints.length;
}

function startWIBClock() {
    const timeEl = document.getElementById('server-time');
    const dateEl = document.getElementById('server-date');
    if(!timeEl || !dateEl) return;
    
    function update() {
        const now = new Date();
        timeEl.innerText = now.toLocaleTimeString('id-ID', { 
            timeZone: 'Asia/Jakarta', 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        dateEl.innerText = now.toLocaleDateString('id-ID', { 
            timeZone: 'Asia/Jakarta', 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    }
    update();
    setInterval(update, 1000);
}

async function loadReminder() {
    try {
        const req = await fetch('../src/reminder.json');
        const data = await req.json();
        if(data?.message) {
            document.getElementById('running-text').innerText = data.message.toUpperCase();
        }
    } catch (e) {}
}

function messeg(msg, type = 'success') {
    const toast = document.getElementById('custom-toast');
    const msgBox = document.getElementById('toast-message');
    const toastIcon = toast?.querySelector('i');
    const toastContainer = toast?.querySelector('div');
    
    if(!toast || !msgBox) return;
    
    const types = {
        success: { icon: 'fa-check', bg: 'bg-success', border: 'border-success/30' },
        error: { icon: 'fa-xmark', bg: 'bg-error', border: 'border-error/30' },
        warning: { icon: 'fa-exclamation', bg: 'bg-warning', border: 'border-warning/30' },
        info: { icon: 'fa-info', bg: 'bg-sky-blue', border: 'border-sky-blue/30' }
    };
    
    const style = types[type] || types.success;
    
    if (toastIcon) toastIcon.className = `fa-solid ${style.icon} text-[10px]`;
    if (toastContainer) {
        toastContainer.className = `${style.bg} text-white px-3 py-2 font-bold text-xs rounded-md flex items-center gap-2 border ${style.border}`;
    }
    
    msgBox.innerText = msg;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

function setUi(config) {
    const s = config.settings || {};
    const navTitle = document.getElementById('nav-title');
    if(navTitle) navTitle.innerText = s.apiName || 'KayzzAoshi';
    if (s.favicon) {
        let link = document.querySelector("link[rel~='icon']") || document.createElement('link');
        link.rel = 'icon';
        link.href = s.favicon;
        document.head.appendChild(link);
    }
}

function setSearch() {
    const input = document.getElementById('search-input');
    const noResults = document.getElementById('no-results');
    if(!input) return;

    input.addEventListener('input', function(e) {
        const val = e.target.value.toLowerCase();
        let anyVisible = false;

        document.querySelectorAll('.api-section').forEach(function(section) {
            const grid = section.querySelector('.api-section-grid');
            const arrow = section.querySelector('.cat-arrow');
            let matchInThisSection = 0;

            section.querySelectorAll('.api-card-wrapper').forEach(function(card) {
                const txt = card.getAttribute('data-search').toLowerCase();
                if (txt.includes(val)) {
                    card.classList.remove('hidden');
                    matchInThisSection++;
                } else {
                    card.classList.add('hidden');
                }
            });

            if (matchInThisSection > 0) {
                section.classList.remove('hidden');
                anyVisible = true;
                if(grid) grid.classList.remove('hidden');
                if(arrow) arrow.classList.add('rotate-180');
            } else {
                section.classList.add('hidden');
            }
        });

        if(noResults) {
            if(anyVisible) {
                noResults.classList.add('hidden');
                noResults.classList.remove('flex');
            } else {
                noResults.classList.remove('hidden');
                noResults.classList.add('flex');
            }
        }
    });
}

function loadEnd(tags) {
    const container = document.getElementById('api-container');
    if(!container || !tags) return;
    
    container.innerHTML = '';

    for (const [cat, routes] of Object.entries(tags)) {
        const section = document.createElement('div');
        section.className = 'api-section w-full';
        
        const catId = `cat-${cat.replace(/\s+/g, '-')}`;

        const headerBtn = `
            <button onclick="toggleCategory('${catId}')" class="w-full flex items-center justify-between bg-card-bg text-primary p-3 rounded-lg border border-border-dark mb-3">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-folder text-sm text-secondary"></i>
                    <h2 class="text-sm font-bold uppercase tracking-wider truncate">${cat}</h2>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[9px] bg-primary/20 border border-primary/30 px-1.5 py-0.5 rounded text-primary font-bold">${routes.length}</span>
                    <i id="arrow-${catId}" class="cat-arrow fa-solid fa-chevron-down text-xs"></i>
                </div>
            </button>
        `;

        const grid = document.createElement('div');
        grid.id = `grid-${catId}`;
        grid.className = 'api-section-grid grid grid-cols-1 md:grid-cols-2 gap-3 hidden mb-6';

        routes.forEach(function(route, idx) {
            const id = `${cat}-${idx}`.replace(/\s+/g, '-');
            const searchTerms = `${route.name} ${route.endpoint} ${cat}`;
            
            let inputsHtml = '';
            if (route.params?.length) {
                inputsHtml = `<div class="bg-black/30 p-3 border-t border-border-dark grid gap-2">` + 
                route.params.map(function(p) {
                    return `<div class="relative">
                        <div class="flex justify-between items-center mb-0.5">
                            <label class="text-[9px] font-bold text-primary uppercase flex items-center gap-1">
                                <span class="w-1 h-1 bg-primary rounded-full"></span> 
                                <span>${p.name.toUpperCase()}</span>
                            </label>
                            <span class="text-[8px] font-bold ${p.required ? 'text-error' : 'text-primary/60'}">${p.required ? 'REQ' : 'OPT'}</span>
                        </div>
                        <input type="text" id="input-${id}-${p.name}" placeholder="${p.description || '...'}" 
                        class="w-full bg-black/50 border border-border-dark p-1.5 font-mono text-[10px] focus:border-primary focus:outline-none rounded text-white">
                     </div>`;
                }).join('') + `</div>`;
            }

            const methodColors = {
                'GET': { bg: 'bg-gradient-to-r from-sky-blue to-blue-500', text: 'text-white' },
                'POST': { bg: 'bg-gradient-to-r from-success to-emerald-500', text: 'text-white' },
                'DELETE': { bg: 'bg-gradient-to-r from-error to-red-600', text: 'text-white' },
                'PUT': { bg: 'bg-gradient-to-r from-warning to-amber-500', text: 'text-white' },
                'PATCH': { bg: 'bg-gradient-to-r from-secondary to-orange-600', text: 'text-white' }
            };
            
            const methodStyle = methodColors[route.method] || methodColors.GET;
            
            const card = document.createElement('div');
            card.className = 'api-card-wrapper bg-card-bg border border-border-dark rounded-lg hover:border-primary/40';
            card.setAttribute('data-search', searchTerms);
            
            card.innerHTML = `
                <div class="p-3 cursor-pointer" onclick="toggle('${id}')">
                    <div class="flex justify-between items-center gap-2">
                        <div class="flex items-center gap-1.5 min-w-0 flex-1">
                            <span class="px-2 py-1 text-[9px] font-bold ${methodStyle.text} ${methodStyle.bg} rounded font-mono shrink-0">${route.method}</span>
                            <code class="font-bold text-xs truncate text-white flex-1">${route.endpoint}</code>
                        </div>
                        <i id="icon-${id}" class="fa-solid fa-plus text-[10px] text-primary shrink-0"></i>
                    </div>
                    <p class="text-[10px] text-slate-400 mt-1.5 truncate">${route.name}</p>
                </div>
                
                <div id="body-${id}" class="hidden">
                    ${inputsHtml}
                    
                    <div class="p-2.5 flex gap-1.5 border-t border-border-dark bg-black/30">
                        <button id="btn-exec-${id}" onclick="testReq(this, '${route.endpoint}', '${route.method}', '${id}')" class="flex-1 bg-primary text-white font-bold py-2 hover:bg-primary/80 text-xs uppercase rounded text-[10px]">
                            Execute
                        </button>
                        <button onclick="copy('${route.endpoint}')" class="px-2.5 border border-border-dark bg-card-bg hover:bg-primary/10 text-primary rounded text-[10px]">
                            <i class="fa-regular fa-copy text-xs"></i>
                        </button>
                        <button onclick="clearInputs('${id}')" class="px-2.5 border border-border-dark bg-card-bg hover:bg-error/10 text-error rounded text-[10px]">
                            <i class="fa-solid fa-eraser text-xs"></i>
                        </button>
                    </div>

                    <div id="res-area-${id}" class="hidden border-t border-border-dark bg-black text-[11px] relative rounded-b-lg">
                        <div class="flex justify-between items-center bg-black/80 px-3 py-1.5 border-b border-border-dark">
                            <div class="flex gap-1.5 items-center">
                                <span class="w-1.5 h-1.5 rounded-full bg-warning" id="status-dot-${id}"></span>
                                <span id="status-${id}" class="text-gray-400 font-bold text-[10px]">WAITING</span>
                            </div>
                            <span id="time-${id}" class="text-gray-500 text-[9px]">--ms</span>
                        </div>
                        
                        <div class="absolute top-1.5 right-1.5 flex gap-1 z-20">
                             <a id="dl-btn-${id}" class="hidden bg-success/20 text-success border border-success/50 px-1.5 py-0.5 hover:bg-success/30 rounded cursor-pointer text-[9px]"><i class="fa-solid fa-download text-[9px]"></i></a>
                             <button onclick="copyRes('${id}')" class="bg-sky-blue/20 text-sky-blue border border-sky-blue/50 px-1.5 py-0.5 hover:bg-sky-blue/30 rounded text-[9px]"><i class="fa-regular fa-clone text-[9px]"></i></button>
                             <button onclick="reset('${id}')" class="bg-error/20 text-error border border-error/50 px-1.5 py-0.5 hover:bg-error/30 rounded text-[9px]"><i class="fa-solid fa-rotate-left text-[9px]"></i></button>
                        </div>

                        <div id="request-info-${id}" class="hidden p-3 border-b border-border-dark bg-black/70 space-y-3">
                            <div class="flex items-center gap-2 mb-2">
                                <div id="status-badge-${id}" class="px-2 py-0.5 bg-primary/20 text-primary text-[9px] font-bold rounded-full border border-primary/30">
                                    200
                                </div>
                                <span class="text-[9px] text-gray-400 font-bold">EXECUTE</span>
                            </div>
                            
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="text-[9px] font-bold text-primary uppercase">REQUEST URL</span>
                                    <button onclick="copyRequestUrl('${id}')" class="text-[8px] text-primary hover:text-white ml-auto">
                                        <i class="far fa-copy mr-0.5"></i>COPY
                                    </button>
                                </div>
                                <div>
                                    <code id="request-url-text-${id}" class="font-mono text-[10px] bg-black/70 border border-primary/20 p-2 rounded block break-all text-gray-300 whitespace-pre-wrap">
                                    </code>
                                </div>
                            </div>
                            
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="text-[9px] font-bold text-secondary uppercase">CURL COMMAND</span>
                                    <button onclick="copyCurlCommand('${id}')" class="text-[8px] text-secondary hover:text-white ml-auto">
                                        <i class="far fa-copy mr-0.5"></i>COPY
                                    </button>
                                </div>
                                <div>
                                    <code id="curl-command-text-${id}" class="font-mono text-[10px] bg-black/70 border border-secondary/20 p-2 rounded block break-all text-gray-300 whitespace-pre-wrap">
                                    </code>
                                </div>
                            </div>
                        </div>

                        <div id="output-${id}" class="font-mono text-[10px] p-3 min-h-[40px] text-gray-300 break-words whitespace-pre-wrap"></div>
                    </div>
                </div>`;
            grid.appendChild(card);
        });

        section.innerHTML = headerBtn;
        section.appendChild(grid);
        container.appendChild(section);
    }
}

window.clearInputs = function(id) {
    document.querySelectorAll(`[id^="input-${id}-"]`).forEach(i => i.value = '');
    messeg('INPUTS CLEARED', 'info');
};

window.copyRequestUrl = function(id) {
    const urlText = document.getElementById(`request-url-text-${id}`).innerText;
    if (!urlText || urlText.trim() === '') return;
    navigator.clipboard.writeText(urlText);
    messeg('URL COPIED', 'success');
};

window.copyCurlCommand = function(id) {
    const curlText = document.getElementById(`curl-command-text-${id}`).innerText;
    if (!curlText || curlText.trim() === '') return;
    navigator.clipboard.writeText(curlText);
    messeg('cURL COPIED', 'success');
};

window.toggleCategory = function(catId) {
    const grid = document.getElementById(`grid-${catId}`);
    const arrow = document.getElementById(`arrow-${catId}`);
    
    if(grid.classList.contains('hidden')) {
        grid.classList.remove('hidden');
        if(arrow) arrow.classList.add('rotate-180');
    } else {
        grid.classList.add('hidden');
        if(arrow) arrow.classList.remove('rotate-180');
    }
};

window.toggle = function(id) {
    const b = document.getElementById(`body-${id}`);
    const i = document.getElementById(`icon-${id}`);
    
    if (b.classList.contains('hidden')) {
        b.classList.remove('hidden');
        if(i) i.classList.add('rotate-45');
    } else {
        b.classList.add('hidden');
        if(i) i.classList.remove('rotate-45');
    }
};

window.copy = function(txt) {
    navigator.clipboard.writeText(window.location.origin + txt);
    messeg('COPIED', 'success');
};

window.copyRes = function(id) {
    const out = document.getElementById(`output-${id}`);
    if (!out.innerText) return;
    navigator.clipboard.writeText(out.innerText);
    messeg('COPIED', 'success');
};

window.reset = function(id) {
    const resArea = document.getElementById(`res-area-${id}`);
    const requestInfo = document.getElementById(`request-info-${id}`);
    const output = document.getElementById(`output-${id}`);
    const requestUrl = document.getElementById(`request-url-text-${id}`);
    const curlCommand = document.getElementById(`curl-command-text-${id}`);
    const dlBtn = document.getElementById(`dl-btn-${id}`);
    
    if(resArea) resArea.classList.add('hidden');
    if(requestInfo) requestInfo.classList.add('hidden');
    if(output) output.innerHTML = '';
    if(requestUrl) requestUrl.innerHTML = '';
    if(curlCommand) curlCommand.innerHTML = '';
    if(dlBtn) dlBtn.classList.add('hidden');
};

window.testReq = async function(btn, url, method, id) {
    if (btn.disabled) return;
    
    if (isLimitExceeded()) {
        const usage = loadApiKeyUsage();
        const limit = localStorage.getItem(STORAGE_KEYS.API_KEY_LIMIT);
        messeg(`Limit reached: ${usage}/${limit} requests today`, 'error');
        return;
    }

    const out = document.getElementById(`output-${id}`);
    const status = document.getElementById(`status-${id}`);
    const statusDot = document.getElementById(`status-dot-${id}`);
    const time = document.getElementById(`time-${id}`);
    const dlBtn = document.getElementById(`dl-btn-${id}`);
    const requestInfo = document.getElementById(`request-info-${id}`);
    const requestUrlText = document.getElementById(`request-url-text-${id}`);
    const curlCommandText = document.getElementById(`curl-command-text-${id}`);
    const statusBadge = document.getElementById(`status-badge-${id}`);
    
    const originalBtnText = btn.innerText;
    
    btn.disabled = true;
    btn.classList.add('opacity-70', 'cursor-not-allowed');
    
    let startTime = Date.now();
    let timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        btn.innerText = `${elapsed}ms`;
    }, 50);
    
    const resArea = document.getElementById(`res-area-${id}`);
    if(resArea) resArea.classList.remove('hidden');
    if(requestInfo) requestInfo.classList.remove('hidden');
    if(dlBtn) dlBtn.classList.add('hidden');
    
    if(status) status.innerText = 'LOADING...';
    if(statusDot) statusDot.className = 'w-1.5 h-1.5 rounded-full bg-warning';
    
    if(out) out.innerHTML = '<span class="text-gray-500 italic text-[10px]">loading...</span>';
    
    const params = {};
    document.querySelectorAll(`[id^="input-${id}-"]`).forEach(i => {
        const paramName = i.id.split(`input-${id}-`)[1];
        if(i.value) params[paramName] = i.value;
    });

    let fetchUrl = url;
    if (method === 'GET' && Object.keys(params).length > 0) {
        fetchUrl += '?' + new URLSearchParams(params).toString();
    }
    
    const fullUrl = fetchUrl.startsWith('http') ? fetchUrl : window.location.origin + fetchUrl;
    if(requestUrlText) requestUrlText.textContent = `${method} ${fullUrl}`;
    
    let curlCommand = `curl -X ${method} "${fullUrl}"`;
    if (method !== 'GET' && Object.keys(params).length > 0) {
        curlCommand = `curl -X ${method} "${window.location.origin + url}" -H "Content-Type: application/json" -d '${JSON.stringify(params)}'`;
    }
    if(curlCommandText) curlCommandText.textContent = curlCommand;

    const opts = { 
        method, 
        headers: { 'Accept': 'application/json' }
    };

    if (method !== 'GET' && Object.keys(params).length > 0) {
        opts.headers = { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        opts.body = JSON.stringify(params);
    }

    try {
        const req = await fetch(fetchUrl, opts);
        
        clearInterval(timerInterval);
        const duration = Date.now() - startTime;
        
        if(status) {
            status.innerText = `${req.status}`;
            status.className = req.ok ? 'text-success font-bold text-[10px]' : 'text-error font-bold text-[10px]';
        }
        if(statusDot) statusDot.className = req.ok ? 'w-1.5 h-1.5 rounded-full bg-success' : 'w-1.5 h-1.5 rounded-full bg-error';
        if(time) time.innerText = `${duration}ms`;
        
        if(statusBadge) {
            statusBadge.innerText = req.status;
            if (req.ok) statusBadge.className = 'px-2 py-0.5 bg-success/20 text-success text-[9px] font-bold rounded-full border border-success/30';
            else if (req.status >= 400 && req.status < 500) statusBadge.className = 'px-2 py-0.5 bg-warning/20 text-warning text-[9px] font-bold rounded-full border border-warning/30';
            else statusBadge.className = 'px-2 py-0.5 bg-error/20 text-error text-[9px] font-bold rounded-full border border-error/30';
        }

        const type = req.headers.get('content-type') || '';
        
        if (type.includes('json')) {
            const json = await req.json();
            if(out) out.innerHTML = syntaxHighlight(json);
        } else if (type.startsWith('image')) {
            const blob = await req.blob();
            const urlObj = URL.createObjectURL(blob);
            if(dlBtn) {
                dlBtn.href = urlObj;
                dlBtn.download = `img-${Date.now()}.${type.split('/')[1] || 'jpg'}`;
                dlBtn.classList.remove('hidden');
            }
            if(out) {
                out.innerHTML = `<div class="flex flex-col items-center">
                    <div class="border border-dashed border-gray-700 p-2 bg-black/50 rounded flex justify-center mb-2">
                        <img src="${urlObj}" class="max-w-full max-h-[120px] rounded">
                    </div>
                    <div class="text-[9px] text-gray-400">Image (${Math.round(blob.size/1024)} KB)</div>
                </div>`;
            }
        } else if (type.includes('audio')) {
            const blob = await req.blob();
            if(out) {
                out.innerHTML = `<div class="flex flex-col items-center">
                    <div class="bg-black/50 p-2 rounded w-full">
                        <audio controls src="${URL.createObjectURL(blob)}" class="w-full rounded"></audio>
                    </div>
                    <div class="mt-1 text-[9px] text-gray-400">Audio (${Math.round(blob.size/1024)} KB)</div>
                </div>`;
            }
        } else {
            const text = await req.text();
            if(out) out.innerHTML = `<div class="break-words whitespace-pre-wrap">${escapeHtml(text)}</div>`;
        }
        
        const currentUsage = loadApiKeyUsage();
        const currentLimit = parseInt(localStorage.getItem(STORAGE_KEYS.API_KEY_LIMIT) || '0');
        saveApiKeyUsage(currentUsage + 1, currentLimit);
        
        messeg('REQUEST SUCCESS', 'success');
    } catch (err) {
        clearInterval(timerInterval);
        const duration = Date.now() - startTime;
        
        if(out) out.innerHTML = `<div class="text-error font-bold text-[10px]">ERROR</div><div class="text-gray-500 text-[10px] mt-1 break-words">${escapeHtml(err.message)}</div>`;
        if(status) {
            status.innerText = 'ERR';
            status.className = 'text-error font-bold text-[10px]';
        }
        if(statusDot) statusDot.className = 'w-1.5 h-1.5 rounded-full bg-error';
        if(time) time.innerText = `${duration}ms`;
        if(statusBadge) {
            statusBadge.innerText = 'ERR';
            statusBadge.className = 'px-2 py-0.5 bg-error/20 text-error text-[9px] font-bold rounded-full border border-error/30';
        }
        
        messeg('REQUEST FAILED', 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = originalBtnText;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
};

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function syntaxHighlight(json) {
    if (typeof json != 'string') json = JSON.stringify(json, undefined, 2);
    json = escapeHtml(json);
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) cls = 'json-key';
            else cls = 'json-string';
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
    });
}