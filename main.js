function applyStyles(selector, styles) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(function (element) {
        console.log("Applying styles to element:", element);
        element.style.cssText = styles; // Replace existing styles
    });
}

function applyStylesFor3DView() {
    applyStyles(".if-no-sup-hide", "visibility: visible");
    applyStyles(".if-no-sup-remove", "display: block");
    applyStyles(".if-sup-hide", "visibility: hidden");
    applyStyles(".if-sup-remove", "display: none");
}

function applyStylesForHTMLView() {
    applyStyles(".if-no-sup-hide", "visibility: hidden");
    applyStyles(".if-no-sup-remove", "display: none");
    applyStyles(".if-sup-hide", "visibility: visible");
    applyStyles(".if-sup-remove", "display: block");
}

// Check if the browser is Safari
function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

if (isSafari()) {
    // Apply styles for Safari
    applyStylesForHTMLView();
    console.log("Showing HTML view for Safari.");
}

function handleDeviceMotionEvent(event) {
    console.log("DeviceMotionEvent received:", event);

    // Check if rotationRate data is present
    if (event.rotationRate) {
        console.log("RotationRate data present:", event.rotationRate);

        // Check if all rotationRate values are not null, undefined, or zero
        const hasValidRotationRate = (
            event.rotationRate.alpha !== null &&
            event.rotationRate.beta !== null &&
            event.rotationRate.gamma !== null
        );

        if (hasValidRotationRate) {
            console.log("Gyroscope present.");

            // Check if A-frame is supported after gyroscope detection
            if (typeof AFRAME !== "undefined") {
                // Apply styles for 3D view
                applyStylesFor3DView();
                console.log("Showing 3D view.");
            } else {
                // Apply styles for HTML view
                applyStylesForHTMLView();
                console.log("Showing HTML view because A-frame is not supported.");
            }
        } else {
            // Gyroscope data is not present or all values are null, undefined, or zero
            console.log("Gyroscope not present or invalid rotationRate values.");

            // Apply styles for HTML view
            applyStylesForHTMLView();
            console.log("Showing HTML view because gyroscope is not present or rotationRate values are invalid.");
        }

        // Remove the event listener after handling the event
        window.removeEventListener("devicemotion", handleDeviceMotionEvent);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // Check if A-frame is supported
    const aFrameSupported = typeof AFRAME !== "undefined";
    console.log("A-frame supported:", aFrameSupported);

    let sensorsEnabled = false;
    const clickHere = document.querySelector('.click-here');

    // Function to show the arrow after 2 seconds
    setTimeout(() => {
        clickHere.classList.add('show-arrow');
    }, 1000);

    // Variables for scroll tracking
    let isScrolling;
    let lastScrollTime = Date.now();

    // Function to handle scroll event
    window.addEventListener('scroll', function() {
        clickHere.classList.remove('show-arrow'); // Hide the arrow on scroll
        lastScrollTime = Date.now();

        // Clear the existing timeout
        clearTimeout(isScrolling);

        // Set a timeout to check if there's no scrolling after 2 seconds
        isScrolling = setTimeout(function() {
            const currentTime = Date.now();
            const timeSinceLastScroll = currentTime - lastScrollTime;

            if (timeSinceLastScroll >= 1000) {
                // If no scrolling for 2 seconds, show the arrow again
                clickHere.classList.add('show-arrow');
            }
        }, 1000);
    });

    // Delay attaching the event listener
    setTimeout(function () {
        if ('ondevicemotion' in window) {
            window.addEventListener("devicemotion", handleDeviceMotionEvent);
            console.log("devicemotion event listener attached.");
        } else {
            console.log("DeviceMotionEvent is not supported on this device.");

            // Apply styles for HTML view
            applyStylesForHTMLView();
            console.log("Showing HTML view because DeviceMotionEvent is not supported on this device.");
        }
    }, 500); // Adjust the delay time as needed
});