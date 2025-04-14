import { toggleVisibility, handleSection } from './formUtils.js';
import emitter from "./event.js";

window.action = {
    create: 'createCandidates',
    delete: 'deleteCandidates'
}
window.runAction = ''
// set necessary elements to variabled for cleaner reference below
let fileUpload = document.getElementById('csvFile');
let uploadButton = document.getElementById('upload-btn');
let checkbox = document.getElementById('acknowledge');
let submitBtn = document.getElementById('submit-btn');
if (submitBtn) submitBtn.removeAttribute('disabled');
let action = document.getElementById('apiAction') || null;
// let inputType = document.getElementById('dataInput');
// let createSection = document.getElementById('create');
// let deleteSection = document.getElementById('delete');
// let uploadInput = document.getElementById('file-upload');
// let manualInput = document.getElementById('manual-input')
// let candidateIds = document.getElementById('candidateIds');



if (action) {
    action.addEventListener('change', (e) => {
        emitter.emit('clearData')
        fileUpload.value = ''
        const { value } = e.target
        window.runAction = window.action[value]
    })
}

// disable upload button until the file is attached
fileUpload.addEventListener('change', (e) => {
    e.target.value ? uploadButton.removeAttribute('disabled') : uploadButton.setAttribute('disabled', true);
})

// disable submit button until user has confirmed list is verified
checkbox.addEventListener('change', (e) => {
    let { checked } = checkbox;
    checked ? submitBtn.removeAttribute('disabled') : submitBtn.setAttribute('disabled', true);
})

// create modal and content for docs in app
document.addEventListener("DOMContentLoaded", function () {
    const modal = `
    <div id="global-modal" class="modal">
        <div class="modal-content">
            <h4>Mass Update Tool</h4>
            <h5>Required CSV Upload columns per action</h5>
            <table>
                <thead>
                <tr>
                    <th>Action</th>
                    <th>Required columns</th>
                </tr>
                </thead>

                <tbody>
                <tr>
                    <td>Create</td>
                    <td>Name, email, phone</td>
                </tr>
                <tr>
                    <td>Update Status</td>
                    <td>long_id</td>
                </tr>
                <tr>
                    <td>Delete</td>
                    <td>long_id</td>
                </tr>
                </tbody>
            </table>
        </div>
        <div class="modal-footer">
            <a href="#!" class="modal-close waves-effect waves-green btn-flat">Close</a>
        </div>
    </div>
`;
    document.body.insertAdjacentHTML("beforeend", modal);

    // Initialize Modal
    const modalElems = document.querySelectorAll('.modal');
    M.Modal.init(modalElems);

    // Create the new element
    const fixedActionBtn = document.createElement("div");
    fixedActionBtn.className = "fixed-action-btn horizontal";
    fixedActionBtn.style.bottom = "45px";
    fixedActionBtn.style.right = "24px";

    const anchor = document.createElement("a");
    anchor.className = "btn-floating btn-large paradox-primary-btn";

    const icon = document.createElement("i");
    icon.className = "large material-icons grey-text text-lighten-5";
    icon.textContent = "info_outline";

    // Append icon to anchor
    anchor.appendChild(icon);

    // Append anchor to the btn
    fixedActionBtn.appendChild(anchor);

    // Append the btn to the container
    const container = document.querySelector(".body-container");
    container.appendChild(fixedActionBtn);

    // Add Click Event to FAB
    fixedActionBtn.addEventListener("click", function () {
        const modalInstance = M.Modal.getInstance(document.getElementById("global-modal"));
        modalInstance.open();
    });
});

/** commented out code that may come in handle later */

// handling what section is displayed based on manual or file upload
// inputType.addEventListener('change', (e) => {
//     const { value } = e.target;
//     const elem = document.getElementById('apiAction') || null;
//     if (elem && elem.value === 'create') {
//         toggleVisibility(deleteSection, false);
//         handleSection(createSection, '#manual-input', value === 'manual', value === 'fileUpload', uploadInput);
//     } else if (elem && elem.value === 'delete') {
//         toggleVisibility(createSection, false);
//         handleSection(deleteSection, '#manual-input', value === 'manual', value === 'fileUpload', uploadInput);
//     } else if (value === 'fileUpload') {
//         toggleVisibility(createSection, false);
//         toggleVisibility(deleteSection, false);
//         toggleVisibility(manualInput, false);
//         toggleVisibility(uploadInput, true);
//     } else if (!elem && value === 'manual') {
//         toggleVisibility(createSection, false);
//         toggleVisibility(deleteSection, false);
//         toggleVisibility(manualInput, true);
//         toggleVisibility(uploadInput, false);
//     } else {
//         toggleVisibility(createSection, false);
//         toggleVisibility(deleteSection, false);
//         toggleVisibility(uploadInput, false);
//         toggleVisibility(manualInput, false);
//     }
// });

// create a listener that will emit the event to clear candidate data
// candidateIds.addEventListener('input', (e) => {
//     const { value } = e.target;
//     if (value.trim() === '') {
//         console.log('Input is empty. Emitting clearData event.');
//         emitter.emit('clearData'); // Notify api.js to clear data
//     }
// });

/** end */