function toggleVisibility (element, shouldShow) {
    console.log(element)
    if (element) {
        element.classList.toggle('hide-section', !shouldShow);
    }
};

function handleSection (section, manualInputSelector, shouldShowManual, shouldShowUpload, uploadInput) {
    toggleVisibility(section, true);
    toggleVisibility(section.querySelector(manualInputSelector), shouldShowManual);
    toggleVisibility(uploadInput, shouldShowUpload);
};

export { toggleVisibility, handleSection }