import emitter from "./event.js";

// Global Variables
let abortController = null; // Used to stop fetch requests
let candidateData = []; // store candidate data to be used in calls to Olivia API

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
        showMessage(err);
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
            throw new Error(`HTTP error! status: ${response.status} - ${error.message}`);
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
        return await response.json();
    } catch (error) {
        return { error: error.message };
    }
}

async function createCandidate(candidateData, authToken, apiInstance) {
    try {
        const response = await fetch(`/create-candidate?apiInstance=${encodeURIComponent(apiInstance)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: candidateData
        });
        return await response.json();
    } catch (error) {
        return { error: error.message };
    }
}

async function startUpdate() {
    const accountId = document.getElementById('accountId').value;
    const secretKey = document.getElementById('secretKey').value;
    const status = document.getElementById('status').value;
    // const candidateIds = document.getElementById('candidateIds').value.split(',');
    const apiInstance = document.getElementById('apiInstance').value;
    const requestTotal = candidateIds.length;
    let requestCount = 0;
    document.getElementById('output-progress').style.display = 'block';
    document.getElementById('stop').disabled = false;

    try {
        const authToken = await getAuthToken(accountId, secretKey, apiInstance);
        abortController = new AbortController();
        const signal = abortController.signal;
        
        for (const candidateId of candidateIds) {
            requestCount += 1;
            document.getElementById('count').innerHTML = `${requestCount} / ${requestTotal}`;
            const response = await updateStatus(status, candidateId.trim(), authToken, apiInstance, signal);
            document.getElementById('output').innerHTML += `<p>Candidate ${candidateId}: ${JSON.stringify(response)}</p>`;
        }
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
        for (const candidateId of candidateIds) {
            requestCount += 1;
            document.getElementById('count').innerHTML = `${requestCount} / ${requestTotal}`;
            const response = await deleteCandidate(candidateId.trim(), authToken, apiInstance, signal);
            document.getElementById('output').innerHTML += `<p>Candidate ${candidateId}: ${JSON.stringify(response)}</p>`;
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            document.getElementById('output').innerHTML += '<p>Requests stopped by user</p>';
        }
        console.error(err);
        return;
    }
}

async function createCandidates() {
    console.log("Here");
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
            document.getElementById('output').innerHTML += `<p>Candidate ${candidate}: ${JSON.stringify(response)}</p>`;
            requestCount += 1;
            document.getElementById('count').innerHTML = `${requestCount} / ${requestTotal}`;
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            document.getElementById('output').innerHTML += '<p>Requests stopped by user</p>';
        }
        console.error(err);
        return;
    }
}

export async function uploadFile() {
    if(candidateData.length !== 0 ) {
        emitter.emit('clearData');
    } 
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });
        const resp = await response.json();
        if(!resp.success) {
            throw new Error(resp.message);
        }
        candidateData.push(...resp.data);
        console.log(candidateData)
        showMessage(resp, "success")
    } catch (error) {
        return showMessage(error);
    }
}


function stopRequest() {
    if (abortController) {
        abortController.abort(); // Abort the requests
        document.getElementById('stop').disabled = true;
    }
}

function showMessage(resp, type = "error") {
    console.log(resp)
    const classname = (type === 'success') ? "green" : "red"
    if (typeof M !== 'undefined' && M.toast) {
        M.toast({ html: resp.message, classes: classname });
    }
}

function getFunctions () {
    return {
        createCandidates,
        startUpdate,
        deleteCandidates,
        stopRequest
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
    uploadFile
};

emitter.on('clearData', () => {
    candidateData.length = 0; // Clear the array
    console.log('Data cleared:', candidateData); // Call clearData when the event is emitted
});