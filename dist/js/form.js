// Initialize the agent at application startup.
var fpPromise = FingerprintJS.load()
var visitorId = "";

// Analyze the visitor when necessary.
fpPromise
    .then(fp => fp.get())
    .then(result => fillForm(result.visitorId));

// create function to handle displaying the id
function fillForm(id) {
    visitorId = id;
    document.getElementById("visitorId").innerHTML = "Visit ID: " + visitorId;
    document.getElementById("visitor_id").value = visitorId;
    // get the ip address
    fetch('https://api.ipify.org?format=json')
        .then(results => results.json())
        .then(data => {
            document.getElementById("ip").value = data.ip;
        });
}