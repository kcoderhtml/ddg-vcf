const faunadb = require("faunadb");
const faunaClient = new faunadb.Client({
	secret: process.env.FAUNADB_SERVER_SECRET,
});
const q = faunadb.query;

function urlEncodedFormDataToJson(formDataString) {
	// Split the string into key-value pairs
	const formDataPairs = formDataString.split("&");

	// Initialize an empty object to store the form data
	const formData = {};

	// Loop through the key-value pairs and populate the object
	formDataPairs.forEach((pair) => {
		const [key, value] = pair.split("=");
		formData[key] = decodeURIComponent(value);
	});

	// Return the JSON object
	return formData;
}

const handler = async (event) => {
	try {
		if (event.httpMethod !== "POST") {
			return { statusCode: 500, body: "POST OR BUST!" };
		}

    jsonizedForm = urlEncodedFormDataToJson(event.body)
    jsonizedForm['date'] = new Date().toISOString()
    
		// convert the post request to json
		const data = { data: jsonizedForm };

		// save the data to fauna
		const req = await faunaClient.query(q.Create(q.Ref("classes/email"), data));
		console.log(req);

		return {
			statusCode: 200,
			body: JSON.stringify({ message: "Successfully added email!" }),
		};
	} catch (error) {
		return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
	}
};

module.exports = { handler };
