import emitter from "./event.js";

// Global Variables
let abortController = null; // Used to stop fetch requests
let candidateData = []; // store candidate data to be used in calls to Olivia API
let roomData = []; // store room data to be used in calls to Rooms API

async function getAuthToken(accountId, secretKey, apiInstance) {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", accountId);
  params.append("client_secret", secretKey);

  try {
    const response = await fetch(
      `/auth/token?apiInstance=${encodeURIComponent(apiInstance)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `HTTP error! status: ${response.status} - ${error.message}`
      );
    }
    const data = await response.json();
    return data.access_token;
  } catch (err) {
    throw err;
  }
}

async function updateStatus(
  status,
  candidateId,
  authToken,
  apiInstance,
  signal
) {
  try {
    const response = await fetch(
      `/update-status/${candidateId}?apiInstance=${encodeURIComponent(
        apiInstance
      )}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ candidate_journey_status: status }),
        signal: signal, // Attach the abort signal to the fetch request
      }
    );
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
    const response = await fetch(
      `/delete-candidate/${candidateId}?apiInstance=${encodeURIComponent(
        apiInstance
      )}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        signal: signal,
      }
    );
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
    const response = await fetch(
      `/create-candidate?apiInstance=${encodeURIComponent(apiInstance)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(candidateData),
        signal: signal,
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `${candidateData.name}: ${response.status} - ${error.message}`
      );
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

async function createRoom(room, authToken, apiInstance, signal) {
  try {
    const response = await fetch(
      `/create-room?apiInstance=${encodeURIComponent(apiInstance)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(room),
        signal: signal,
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`${room.name}: ${response.status} - ${error.message}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

function appendOutput(message) {
  document.getElementById("output").innerHTML += `<p>${message}</p>`;
}

async function updateCandidateAttributes() {
  const accountId = document.getElementById("accountId").value;
  const secretKey = document.getElementById("secretKey").value;
  const attribute = document.getElementById("attribute").value;
  const apiInstance = document.getElementById("apiInstance").value;

  const authToken = await getAuthToken(accountId, secretKey, apiInstance);

  const payload = {
    attribute: attribute,
    data: candidateData,
  };

  const response = await fetch(
    `/update-candidate-attribute?apiInstance=${encodeURIComponent(
      apiInstance
    )}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Account-ID": accountId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();
  const results = data.results || [];

  const requestTotal = results.length;
  let requestCount = 0;

  document.getElementById("output-progress").style.display = "block";
  document.getElementById("stop").disabled = false;
  document.getElementById("output").innerHTML = "";
  document.getElementById("count").innerHTML = `0 / ${requestTotal}`;

  for (const result of results) {
    requestCount += 1;

    const p = document.createElement("p");
    if (result.status === "Success") {
      p.innerHTML = `<span class="green-text">✅ ${result.candidateId}: ${result.attribute} → ${result.value}</span>`;
    } else {
      p.innerHTML = `<span class="red-text">⚠️ ${
        result.candidateId || "[no ID]"
      }: ${result.status} — ${result.value || "[no value]"}</span>`;
    }

    document.getElementById("output").appendChild(p);
    document.getElementById(
      "count"
    ).innerHTML = `${requestCount} / ${requestTotal}`;
  }

  showMessage("Task Complete", "success");
}

async function startUpdate() {
  const accountId = document.getElementById("accountId").value;
  const secretKey = document.getElementById("secretKey").value;
  const status = document.getElementById("status").value;
  const apiInstance = document.getElementById("apiInstance").value;
  const requestTotal = candidateData.length;
  let requestCount = 0;
  document.getElementById("output-progress").style.display = "block";
  document.getElementById("stop").disabled = false;

  try {
    const authToken = await getAuthToken(accountId, secretKey, apiInstance);
    abortController = new AbortController();
    const signal = abortController.signal;

    for (const candidateId of candidateData) {
      requestCount += 1;
      document.getElementById(
        "count"
      ).innerHTML = `${requestCount} / ${requestTotal}`;
      const response = await updateStatus(
        status,
        candidateId.trim(),
        authToken,
        apiInstance,
        signal
      );
      appendOutput(`Candidate ${candidateId}: ${JSON.stringify(response)}`);
    }
    showMessage("Task Complete", "success");
  } catch (err) {
    if (err.name === "AbortError") {
      appendOutput("Requests stopped by user");
    }
    if (typeof M !== "undefined" && M.toast) {
      M.toast({ html: err });
    } else {
      console.error(err);
    }
    return;
  }
}

async function deleteCandidates() {
  const accountId = document.getElementById("accountId").value;
  const secretKey = document.getElementById("secretKey").value;
  const apiInstance = document.getElementById("apiInstance").value;
  const requestTotal = candidateData.length;
  let requestCount = 0;
  document.getElementById("output-progress").style.display = "block";
  document.getElementById("stop").disabled = false;

  try {
    const authToken = await getAuthToken(accountId, secretKey, apiInstance);
    abortController = new AbortController();
    const signal = abortController.signal;
    for (const candidateId of candidateData) {
      requestCount += 1;
      document.getElementById(
        "count"
      ).innerHTML = `${requestCount} / ${requestTotal}`;
      const response = await deleteCandidate(
        candidateId.trim(),
        authToken,
        apiInstance,
        signal
      );
      appendOutput(`Candidate ${candidateId}: ${JSON.stringify(response)}`);
    }
    showMessage("Task Complete", "success");
  } catch (err) {
    if (err.name === "AbortError") {
      appendOutput("Requests stopped by user");
    }
    showMessage(err);
  }
}

async function createCandidates() {
  const accountId = document.getElementById("accountId").value;
  const secretKey = document.getElementById("secretKey").value;
  const apiInstance = document.getElementById("apiInstance").value;
  const requestTotal = candidateData.length;
  let requestCount = 0;
  document.getElementById("output-progress").style.display = "flex";
  document.getElementById("stop").disabled = false;

  try {
    const authToken = await getAuthToken(accountId, secretKey, apiInstance);
    abortController = new AbortController();
    const signal = abortController.signal;
    for (const candidate of candidateData) {
      const response = await createCandidate(
        candidate,
        authToken,
        apiInstance,
        signal
      );
      const { name, email, OID } = response.candidate;
      appendOutput(`Candidate ${name}: ${OID} - ${email}`);
      requestCount += 1;
      document.getElementById(
        "count"
      ).innerHTML = `${requestCount} / ${requestTotal}`;
    }
    showMessage("Task Complete", "success");
  } catch (err) {
    if (err.name === "AbortError") {
      appendOutput("Requests stopped by user");
    }
    const { message } = err;
    showMessage(message);
    return;
  }
}

export async function uploadFile() {
  if (candidateData.length !== 0) {
    emitter.emit("clearData");
  }
  const fileInput = document.getElementById("csvFile");
  const file = fileInput.files[0];
  const attribute = document.getElementById("attribute")?.value?.trim();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("attribute", attribute);

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });
    const resp = await response.json();
    if (!resp.success) {
      throw new Error(resp.message);
    }
    candidateData.push(...resp.data);
    showMessage(resp.message, "success");
  } catch (error) {
    const { message } = error;
    return showMessage(message);
  }
}

// uploadFileForRooms() will be called when the user clicks the upload button for rooms
export async function uploadFileForRooms() {
  const API_FIELDS = [
    "name",
    "location_id",
    "seats",
    "cal_email",
    "room_ex_id",
  ];
  if (roomData.length !== 0) {
    emitter.emit("clearData");
  }
  const fileInput = document.getElementById("csvFile");
  if (!fileInput.files[0]) {
    showMessage("Please select a CSV file first", "error");
    return;
  }
  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    // first, get headers from CSV
    const response = await fetch("/upload-room-headers", {
      method: "POST",
      body: formData,
    });
    const resp = await response.json();
    if (!resp.success) {
      throw new Error(resp.message);
    }
    const csvHeaders = resp.headers;
    showMappingUI(csvHeaders, API_FIELDS); // show mapping UI with headers and API fields
  } catch (error) {
    const { message } = error;
    return showMessage(message);
  }
}

/**
 * Show the mapping UI with CSV headers.
 **/
function showMappingUI(headers, apiFields) {
  const mappingModal = document.getElementById("mapping-modal");
  const mappingFields = document.getElementById("mapping-fields");
  const rowTemplate = document.getElementById("mapping-row-template");
  const optionTemplate = document.getElementById("mapping-option-template");
  mappingModal.setAttribute("data-api-fields", JSON.stringify(apiFields));
  // Clear previous mappings (keep templates)
  Array.from(mappingFields.children).forEach((child) => {
    if (!child.id?.startsWith("mapping-")) child.remove();
  });
  // Create dropdown for each API field
  apiFields.forEach((field) => {
    const row = rowTemplate.content.cloneNode(true);
    row.querySelector(".mapping-label").textContent = field;
    const select = row.querySelector(".mapping-select");
    select.id = `map-${field}`;

    headers.forEach((header) => {
      const option = optionTemplate.content
        .cloneNode(true)
        .querySelector("option");
      option.value = option.textContent = header;
      select.appendChild(option);
    });

    mappingFields.appendChild(row);
  });

  M.Modal.init(mappingModal, {
    dismissible: false,
    onOpenEnd: () =>
      M.FormSelect.init(document.querySelectorAll(".mapping-select")),
    onCloseEnd: () => {
      Array.from(mappingFields.children).forEach((child) => {
        if (!child.id?.startsWith("mapping-")) child.remove();
      });
    },
  }).open();
}

// Function for submitting the mapping and parse CSV
export async function submitMapping() {
  const mappingModal = document.getElementById("mapping-modal");
  const apiFields = JSON.parse(
    mappingModal.getAttribute("data-api-fields") || "null"
  );

  if (!apiFields) {
    return showMessage(
      "Mapping data not found. Please upload the file again.",
      "error"
    );
  }

  // Collect and validate mappings
  const mapping = {};
  for (const field of apiFields) {
    const value = document.getElementById(`map-${field}`)?.value;
    if (!value) {
      return showMessage("Please map all required fields", "error");
    }
    mapping[field] = value;
  }

  // Close modal and submit data
  M.Modal.getInstance(mappingModal)?.close();

  const formData = new FormData();
  formData.append("file", document.getElementById("csvFile").files[0]);
  formData.append("headerMapping", JSON.stringify(mapping));

  try {
    const resp = await (
      await fetch("/upload-room", {
        method: "POST",
        body: formData,
      })
    ).json();

    if (!resp.success) throw new Error(resp.message);

    roomData.push(...resp.data);
    showMessage(resp.message, "success");
    document.getElementById("submit-btn").disabled = false;
  } catch (error) {
    showMessage(error.message);
  }
}

// Function to get all locations and their OID's in order to be used in rooms API
export async function getLocationsOID(authToken, apiInstance) {
  const locOIDdic = {};
  let per_page = 500;
  const max_pages = 4;

  // Fetch first page to determine total pages
  try {
    const response = await fetch(
      `/location?apiInstance=${encodeURIComponent(
        apiInstance
      )}&per_page=${per_page}&page=1`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.log(
        `failed to get initial locations: ${response.status} ${response.body}`
      );
      return;
    }

    const firstData = await response.json();
    const total_pages = firstData.meta.total_pages;
    console.log(
      "initial location meta: current_page = " +
        firstData.meta.current_page +
        ", total_pages = " +
        firstData.meta.total_pages +
        ", items_per_page = " +
        per_page
    );

    // Process first page locations
    firstData.locations.forEach((item) => {
      locOIDdic[item.job_loc_code] = `${item.oid}`;
    });

    // Fetch remaining pages if needed
    if (total_pages > 1) {
      const max_items = per_page * total_pages;
      per_page = max_items / max_pages; // increase per_page in order to prevent being throttled by Locations endpt

      for (let page = 2; page <= max_pages; page++) {
        try {
          const response = await fetch(
            `/location?apiInstance=${encodeURIComponent(
              apiInstance
            )}&per_page=${per_page}&page=${page}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            data.locations.forEach((item) => {
              locOIDdic[item.job_loc_code] = `${item.oid}`;
            });
          } else {
            console.log(
              `failed to get locations for page: ${page}. Status: ${response.status}`
            );
          }
        } catch (error) {
          console.error(error.message);
        }
      }
    }
  } catch (error) {
    console.error(error.message);
    return;
  }

  // update roomData to include OID for each location_id
  roomData.forEach((item) => {
    item.location_id = locOIDdic[item.location_id];
  });
}

export async function startRoomImport() {
  const accountId = document.getElementById("accountId").value;
  const secretKey = document.getElementById("secretKey").value;
  const apiInstance = document.getElementById("apiInstance").value;
  const requestTotal = roomData.length;
  let requestCount = 0;
  const outputProgress = document.getElementById("output-progress");
  const stopBtn = document.getElementById("stop");
  const countDisplay = document.getElementById("count");

  outputProgress.style.display = "flex";
  stopBtn.disabled = false;

  try {
    const authToken = await getAuthToken(accountId, secretKey, apiInstance);
    appendOutput("Getting account Location data...");

    await getLocationsOID(authToken, apiInstance);
    appendOutput("Location data retrieved. Starting room creation...");

    abortController = new AbortController();

    for (const room of roomData) {
      try {
        const response = await createRoom(
          room,
          authToken,
          apiInstance,
          abortController.signal
        );
        appendOutput(`Room created: ${response.name}.`);
      } catch (err) {
        if (err.name === "AbortError") {
          appendOutput("Requests stopped by user");
          break;
        }
        showMessage(err.message);
        appendOutput(`Error: ${err.message}`);
        console.error(`Room creation error: ${err.message}`);
      }
      countDisplay.innerHTML = `${++requestCount} / ${requestTotal}`;
    }
    showMessage("Task Complete", "success");
    console.log("Room import completed successfully");
  } catch (err) {
    showMessage(err.message);
    appendOutput(`Error getting Locations: ${err.message}`);
    console.error(`Location fetch error: ${err.message}`);
  } finally {
    stopBtn.disabled = true;
  }
}

function stopRequest() {
  if (abortController) {
    abortController.abort(); // Abort the requests
    document.getElementById("stop").disabled = true;
  }
}

function showMessage(message, type = "error") {
  const classname = type === "success" ? "green" : "red";
  if (typeof M !== "undefined" && M.toast) {
    M.toast({ html: message, classes: classname });
  }
}

function getFunctions() {
  return {
    createCandidates,
    startUpdate,
    deleteCandidates,
    updateCandidateAttributes,
    startRoomImport,
  };
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
  submitMapping,
};

emitter.on("clearData", () => {
  candidateData.length = 0; // Clear the array
  roomData.length = 0;
  console.log("Data cleared:", candidateData, roomData); // Call clearData when the event is emitted
});
