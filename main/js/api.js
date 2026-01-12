import emitter from "./event.js";

// Global Variables
let abortController = null; // Used to stop fetch requests
let candidateData = []; // store candidate data to be used in calls to Olivia API
let roomData = []; // store room data to be used in calls to Rooms API

async function getAuthToken(accountId, secretKey, apiInstance) {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', accountId);
    params.append('client_secret', secretKey);

    try {
        const response = await fetch(`/auth/token?apiInstance=${encodeURIComponent(apiInstance)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`HTTP error! status: ${response.status} - ${error.message}`);
        }
        const data = await response.json();
        return data.access_token;
    } catch (err) {
        throw err;
    }
}

async function updateStatus(status, candidateId, authToken, apiInstance, signal) {
    try {
        const response = await fetch(`/update-status/${candidateId}?apiInstance=${encodeURIComponent(apiInstance)}`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "candidate_journey_status": status }),
            signal: signal // Attach the abort signal to the fetch request
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`${candidateId}: ${response.status} - ${error.message}`);
        }
        return await response.json();
    } catch (err) {
        throw err;
    }
}

async function deleteCandidate(candidateId, authToken, apiInstance, signal) {
    try {
        const response = await fetch(`/delete-candidate/${candidateId}?apiInstance=${encodeURIComponent(apiInstance)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            signal: signal
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`${candidateId}: ${response.status} - ${error.message}`);
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

async function createCandidate(candidateData, authToken, apiInstance, signal) {
    try {
        const response = await fetch(`/create-candidate?apiInstance=${encodeURIComponent(apiInstance)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(candidateData),
            signal: signal
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`${candidateData.name}: ${response.status} - ${error.message}`);
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

async function createRoom(room, authToken, apiInstance, signal) {
    try {
        const response = await fetch(`/create-room?apiInstance=${encodeURIComponent(apiInstance)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(room),
            signal: signal
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`${room.name}: ${response.status} - ${error.message}`);
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}


async function updateCandidateAttributes() {
    const accountId = document.getElementById('accountId').value;
    const secretKey = document.getElementById('secretKey').value;
    const attribute = document.getElementById('attribute').value;
    const apiInstance = document.getElementById('apiInstance').value;

    const authToken = await getAuthToken(accountId, secretKey, apiInstance);

    const payload = {
        attribute: attribute,
        data: candidateData
    };

    const response = await fetch(`/update-candidate-attribute?apiInstance=${encodeURIComponent(apiInstance)}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Account-ID': accountId,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    const results = data.results || [];

    const requestTotal = results.length;
    let requestCount = 0;

    document.getElementById('output-progress').style.display = 'block';
    document.getElementById('stop').disabled = false;
    document.getElementById('output').innerHTML = '';
    document.getElementById('count').innerHTML = `0 / ${requestTotal}`;

    for (const result of results) {
        requestCount += 1;

        const p = document.createElement('p');
        if (result.status === 'Success') {
            p.innerHTML = `<span class="green-text">✅ ${result.candidateId}: ${result.attribute} → ${result.value}</span>`;
        } else {
            p.innerHTML = `<span class="red-text">⚠️ ${result.candidateId || '[no ID]'}: ${result.status} — ${result.value || '[no value]'}</span>`;
        }

        document.getElementById('output').appendChild(p);
        document.getElementById('count').innerHTML = `${requestCount} / ${requestTotal}`;
    }

    showMessage('Task Complete', 'success');
}

async function startUpdate() {
    const accountId = document.getElementById('accountId').value;
    const secretKey = document.getElementById('secretKey').value;
    const status = document.getElementById('status').value;
    const apiInstance = document.getElementById('apiInstance').value;
    const requestTotal = candidateData.length;
    let requestCount = 0;
    document.getElementById('output-progress').style.display = 'block';
    document.getElementById('stop').disabled = false;

    try {
        const authToken = await getAuthToken(accountId, secretKey, apiInstance);
        abortController = new AbortController();
        const signal = abortController.signal;

        for (const candidateId of candidateData) {
            requestCount += 1;
            document.getElementById('count').innerHTML = `${requestCount} / ${requestTotal}`;
            const response = await updateStatus(status, candidateId.trim(), authToken, apiInstance, signal);
            document.getElementById('output').innerHTML += `<p>Candidate ${candidateId}: ${JSON.stringify(response)}</p>`;
        }
        showMessage('Task Complete', 'success')
    } catch (err) {
        if (err.name === 'AbortError') {
            document.getElementById('output').innerHTML += '<p>Requests stopped by user</p>';
        }
        if (typeof M !== 'undefined' && M.toast) {
            M.toast({ html: err });
        } else {
            console.error(err);
        }
        return;
    }
}

async function deleteCandidates() {
    const accountId = document.getElementById('accountId').value;
    const secretKey = document.getElementById('secretKey').value;
    const apiInstance = document.getElementById('apiInstance').value;
    const requestTotal = candidateData.length;
    let requestCount = 0;
    document.getElementById('output-progress').style.display = 'block';
    document.getElementById('stop').disabled = false;

    try {
        const authToken = await getAuthToken(accountId, secretKey, apiInstance);
        abortController = new AbortController();
        const signal = abortController.signal;
        for (const candidateId of candidateData) {
            requestCount += 1;
            document.getElementById('count').innerHTML = `${requestCount} / ${requestTotal}`;
            const response = await deleteCandidate(candidateId.trim(), authToken, apiInstance, signal);
            document.getElementById('output').innerHTML += `<p>Candidate ${candidateId}: ${JSON.stringify(response)}</p>`;
        }
        showMessage('Task Complete', 'success')
    } catch (err) {
        if (err.name === 'AbortError') {
            document.getElementById('output').innerHTML += '<p>Requests stopped by user</p>';

        }
        showMessage(err);
    }
}

async function createCandidates() {
    const accountId = document.getElementById('accountId').value;
    const secretKey = document.getElementById('secretKey').value;
    const apiInstance = document.getElementById('apiInstance').value;
    const requestTotal = candidateData.length;
    let requestCount = 0;
    document.getElementById('output-progress').style.display = 'flex';
    document.getElementById('stop').disabled = false;

    try {
        const authToken = await getAuthToken(accountId, secretKey, apiInstance);
        abortController = new AbortController();
        const signal = abortController.signal;
        for (const candidate of candidateData) {
            const response = await createCandidate(candidate, authToken, apiInstance, signal);
            const { name, email, OID } = response.candidate
            document.getElementById('output').innerHTML += `<p>Candidate ${name}: ${OID} - ${email}</p>`;
            requestCount += 1;
            document.getElementById('count').innerHTML = `${requestCount} / ${requestTotal}`;
        }
        showMessage('Task Complete', 'success')
    } catch (err) {
        if (err.name === 'AbortError') {
            document.getElementById('output').innerHTML += '<p>Requests stopped by user</p>';
        }
        const { message } = err
        showMessage(message);
        return;
    }
}

export async function uploadFile() {
    if (candidateData.length !== 0) {
        emitter.emit('clearData');
    }
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    const attribute = document.getElementById('attribute')?.value?.trim();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('attribute', attribute);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });
        const resp = await response.json();
        if (!resp.success) {
            throw new Error(resp.message);
        }
        candidateData.push(...resp.data);
        showMessage(resp.message, "success")
    } catch (error) {
        const { message } = error
        return showMessage(message);
    }
}

// API fields that need to be mapped
const ROOM_API_FIELDS = ['location_id', 'name', 'seats', 'cal_email', 'room_ex_id'];
let csvHeaders = [];
let uploadedFilePath = null;

// uploadFileForRooms() will be called when the user clicks the upload button for rooms
export async function uploadFileForRooms() {
    if (roomData.length !== 0) {
        emitter.emit('clearData');
    }
    const fileInput = document.getElementById('csvFile');
    
    if (!fileInput.files[0]) {
        showMessage('Please select a CSV file first', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        // First, get headers from CSV
        const response = await fetch('/upload-room-headers', {
            method: 'POST',
            body: formData,
        });
        const resp = await response.json();
        if (!resp.success) {
            throw new Error(resp.message);
        }
        
        csvHeaders = resp.headers;
        uploadedFilePath = resp.filePath; // Store file path for later use
        
        // Show mapping UI
        showMappingUI(csvHeaders);
    } catch (error) {
        const { message } = error;
        return showMessage(message);
    }
}

// Show the mapping UI with CSV headers
function showMappingUI(headers) {
    const mappingContainer = document.getElementById('mapping-container');
    const mappingFields = document.getElementById('mapping-fields');
    
    // Clear previous mappings
    mappingFields.innerHTML = '';
    
    // Create a select dropdown for each API field
    ROOM_API_FIELDS.forEach(apiField => {
        const row = document.createElement('div');
        row.className = 'mapping-row';
        
        const label = document.createElement('div');
        label.className = 'mapping-label';
        label.textContent = apiField.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) + ':';
        
        const select = document.createElement('select');
        select.id = `map-${apiField}`;
        select.className = 'mapping-select browser-default';
        select.required = true;
        
        // Add empty option
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- Select CSV Column --';
        emptyOption.disabled = true;
        emptyOption.selected = true;
        select.appendChild(emptyOption);
        
        // Add CSV headers as options
        headers.forEach(header => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            select.appendChild(option);
        });
        
        row.appendChild(label);
        row.appendChild(select);
        mappingFields.appendChild(row);
    });
    
    // Show mapping container
    mappingContainer.style.display = 'block';
    
    // Reinitialize Materialize select
    M.FormSelect.init(document.querySelectorAll('.mapping-select'));
}

// Submit the mapping and parse CSV
export async function submitMapping() {
    const mapping = {};
    let allMapped = true;
    
    // Collect mappings
    ROOM_API_FIELDS.forEach(apiField => {
        const select = document.getElementById(`map-${apiField}`);
        const selectedValue = select.value;
        
        if (!selectedValue) {
            allMapped = false;
            return;
        }
        
        mapping[apiField] = selectedValue;
    });
    
    if (!allMapped) {
        showMessage('Please map all required fields', 'error');
        return;
    }
    
    // Hide mapping UI
    document.getElementById('mapping-container').style.display = 'none';
    
    // Re-upload file with mapping
    const fileInput = document.getElementById('csvFile');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('headerMapping', JSON.stringify(mapping));
    
    try {
        const response = await fetch('/upload-room', {
            method: 'POST',
            body: formData,
        });
        const resp = await response.json();
        if (!resp.success) {
            throw new Error(resp.message);
        }
        roomData.push(...resp.data);
        showMessage(resp.message, "success");
        
        // Enable submit button
        document.getElementById('submit-btn').disabled = false;
    } catch (error) {
        const { message } = error;
        return showMessage(message);
    }
}

// Cancel mapping
export function cancelMapping() {
    document.getElementById('mapping-container').style.display = 'none';
    csvHeaders = [];
    uploadedFilePath = null;
}

// Function to get all locations and their OID's in order to be used in rooms API
export async function getLocationsOID(authToken, apiInstance) {
    let curr_page = 1, total_pages = 0, per_page = 300, max_pages = 2
    let locAPIjson = { 'locations': [] }
    let locOIDdic = {}

    // make one request to determine how many total locations, then adjust per_page param accordingly
    try {
        const response = await fetch(`/location?apiInstance=${encodeURIComponent(apiInstance)}&per_page=${per_page}&page=${curr_page}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
        });
        if (response.ok) {
            locAPIjson = await response.json()
            total_pages = locAPIjson['meta']['total_pages']
            console.log('initial meta: current_page = ' + locAPIjson['meta']['current_page'] + ', total_pages = ' + locAPIjson['meta']['total_pages'])
        } else {
            console.log(`failed to get initial locations: ${response.status} ${response.body}`)
        }
    } catch (error) {
        console.error(error.message);
    }

    if (total_pages > 1) {
        let max_items = per_page * total_pages
        per_page = max_items / max_pages
        total_pages = max_pages
        console.log('max_items = ' + max_items)

        for (let i = 1; i <= total_pages; i++) {
            curr_page = i

            try {
                const response = await fetch(`/location?apiInstance=${encodeURIComponent(apiInstance)}&per_page=${per_page}&page=${curr_page}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Account-ID': accountId,
                        'Content-Type': 'application/json'
                    },
                });
                if (response.ok) {
                    locAPIjson = await response.json()
                    console.log('in loop response meta: current_page = ' + locAPIjson['meta']['current_page'] + ', total_pages = ' + locAPIjson['meta']['total_pages'])
                    // loop through all locations and extract the OID and location id from each and store in an array
                    locAPIjson['locations'].forEach((item, i) => {
                        locOIDdic[item['job_loc_code']] = `${item['oid']}` // [item['oid']] = item['job_loc_code']
                    })
                    console.log(`\tappended page: ${curr_page} of locations:`)
                    console.log(locOIDdic)

                } else {
                    console.log(`failed to get locations for page: ${curr_page}. Status: ${response.status}`)
                }
            } catch (error) {
                console.error(error.message);
            }
        }
    } else {
        locAPIjson['locations'].forEach((item, i) => {
            locOIDdic[item['job_loc_code']] = `${item['oid']}` // [item['oid']] = item['job_loc_code']
        })
    }
    console.log('--------------------locOIDdic object--------------------')
    console.log(locOIDdic)

    // iterate through parsed csv to update with corresponding OID from location_id --> return csv to be used for API params 
    // console.log('--------------------roomData object before--------------------')
    // console.log(roomData)

    roomData.forEach((item, i) => {
        item['location_id'] = locOIDdic[item['id']];
    })
    //     console.log('--------------------roomData object after--------------------')
    //     console.log(roomData)
}

// TO-DO: implement room creation via API
export async function startRoomImport() {
    const accountId = document.getElementById('accountId').value;
    const secretKey = document.getElementById('secretKey').value;
    const apiInstance = document.getElementById('apiInstance').value;
    const requestTotal = roomData.length;
    let requestCount = 0;
    document.getElementById('output-progress').style.display = 'flex';
    document.getElementById('stop').disabled = false;

    try {
        const authToken = await getAuthToken(accountId, secretKey, apiInstance);
        await getLocationsOID(authToken, apiInstance);
        abortController = new AbortController();
        const signal = abortController.signal;
        for (const room of roomData) {
            try {
                const response = await createRoom(room, authToken, apiInstance, signal);
                const roomResult = response.name
                document.getElementById('output').innerHTML += `<p>created: ${roomResult}</p>`;
            } catch (err) {
                if (err.name === 'AbortError') {
                    document.getElementById('output').innerHTML += '<p>Requests stopped by user</p>';
                }
                const { message } = err
                showMessage(message);
                document.getElementById('output').innerHTML += `<p>Error for room: ${room.name} \n\t ${message}</p>`;
            }
            requestCount += 1;
            document.getElementById('count').innerHTML = `${requestCount} / ${requestTotal}`;
            // return;
        }
        showMessage('Task Complete', 'success')
    } catch (err) {
        const { message } = err
        showMessage(message);
        document.getElementById('output').innerHTML += `<p>Error getting Locations: ${message}</p>`;
    }


}

function stopRequest() {
    if (abortController) {
        abortController.abort(); // Abort the requests
        document.getElementById('stop').disabled = true;
    }
}

function showMessage(message, type = "error") {
    const classname = (type === 'success') ? "green" : "red"
    if (typeof M !== 'undefined' && M.toast) {
        M.toast({ html: message, classes: classname });
    }
}

function getFunctions() {
    return {
        createCandidates,
        startUpdate,
        deleteCandidates,
        updateCandidateAttributes,
    }
}

function executeRequest(key) {
    const functions = getFunctions();
    if (functions[key]) {
        return functions[key]();
    } else {
        throw new Error(`Function with key "${key}" does not exist.`);
    }
}

// Attach functions to the global `window` object
window.api = {
    executeRequest,
    stopRequest,
    uploadFile,
    uploadFileForRooms,
    startRoomImport,
    submitMapping,
    cancelMapping
};

emitter.on('clearData', () => {
    candidateData.length = 0; // Clear the array
    console.log('Data cleared:', candidateData); // Call clearData when the event is emitted
});