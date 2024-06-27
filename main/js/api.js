async function updateStatus(status, id, authToken) {
    try {
        const response = await fetch(`/update-status/${id}`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 'candidate_journey_status': status})
        })
        return await response.json();
    } catch (error) {
        console.log(error);
        return error.message;
    }
}

async function getAuthToken(accountId, secretKey) {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', accountId);
    params.append('client_secret', secretKey);

    const response = await fetch('/auth/token', { // Pointing to your local server
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
    });

    const data = await response.json();
    console.log("Auth response data:", data)
    return data.access_token;
}

async function startUpdate() {
    const accountId = document.getElementById('accountId').value;
    const secretKey = document.getElementById('secretKey').value;
    const status = document.getElementById('status').value;
    const candidateIds = document.getElementById('candidateIds').value.split(',');

    const authToken = await getAuthToken(accountId, secretKey);

    for (const candidateId of candidateIds) {
        const response = await updateStatus(status, candidateId.trim(), authToken);
        document.getElementById('output').innerHTML += `<p>Candidate ${candidateId}: ${JSON.stringify(response)}</p>`;
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