// Initialize the agent at application startup.
var fpPromise = FingerprintJS.load()
var visitorId = "";

// Analyze the visitor when necessary.
fpPromise
    .then(fp => fp.get())
    .then(result => fillForm(result.visitorId));

// create function to handle displaying the id

/**
 * Fills the form with the provided visitor ID and retrieves the IP address.
 * @param {string} id - The visitor ID.
 */
function fillForm(id) {
    visitorId = id;
    // display the id
    document.getElementById("visitorId").innerHTML = "Visit ID: " + visitorId;
    document.getElementById("visitor_id").value = visitorId;
    // get the ip address
    fetch('https://api.ipify.org?format=json')
        .then(results => results.json())
        .then(data => {
            document.getElementById("ip").value = data.ip;
        });
}