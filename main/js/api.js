async function updateStatus(status, id, authToken) {
    try {
        const response = await fetch(`/update-status/${id}`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "candidate_journey_status":  status })
        })
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`HTTP error! status: ${response.status} - ${error.message}`);
        }
        return await response.json();
    } catch (err) {
        throw err;
    }
}

async function getAuthToken(accountId, secretKey) {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', accountId);
    params.append('client_secret', secretKey);
    try {
        const response = await fetch('/auth/token', { // Pointing to your local server
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
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

async function startUpdate() {
    const accountId = document.getElementById('accountId').value;
    const secretKey = document.getElementById('secretKey').value;
    const status = document.getElementById('status').value;
    const candidateIds = document.getElementById('candidateIds').value.split(',');

    try {
        const authToken = await getAuthToken(accountId, secretKey);
        for (const candidateId of candidateIds) {
            const response = await updateStatus(status, candidateId.trim(), authToken);
            document.getElementById('output').innerHTML += `<p>Candidate ${candidateId}: ${JSON.stringify(response)}</p>`;
        }
    } catch (err) {
        M.toast({html: err});
        return;
    }
}

async function uploadFile() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });
        const columnData = await response.json();
        let area = document.getElementById('candidateIds')
        area.value = columnData.join(', ')
        // M.textareaAutoResize(area);
    } catch (error) {
        console.error('Error:', error);
    }
}