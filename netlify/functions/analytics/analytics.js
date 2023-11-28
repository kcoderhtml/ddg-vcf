const faunadb = require("faunadb");
const faunaClient = new faunadb.Client({
	secret: process.env.FAUNADB_SERVER_SECRET,
});
const q = faunadb.query;
const fetch = require("node-fetch");

const fs = require("fs");
const VCardTemplate = fs.readFileSync(`./netlify/functions/analytics/output.vcf`, "utf8");

/**
 * Converts a URL-encoded form data string to a JSON object.
 *
 * @param {string} formDataString - The URL-encoded form data string.
 * @returns {Object} - The JSON object representing the form data.
 */
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

/**
 * Generates a unique email address using the DuckDuckGo API.
 * @param {string} visit_id - The visit ID associated with the email address.
 * @returns {Promise<{data: {visit_id: string, email: string}}|{statusCode: number, body: string}>} - A promise that resolves to an object containing the generated email address and visit ID, or an error object if an error occurs.
 */
async function genEmail(visit_id) {
	const url = "https://quack.duckduckgo.com/api/email/addresses";
	const token = process.env.DUCK_API_SECRET;

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		});

		const data = await response.json();

		if (response.ok && data.address) {
			const formattedAddress = `${data.address}@duck.com`;

			return {
				data: { visit_id: visit_id, email: formattedAddress }, // return the email
			};
		} else {
			throw new Error("Invalid response from the API");
		}
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({ error: "Internal Server Error" }),
		};
	}
}

/**
 * Retrieves the email associated with a visit ID from the Fauna database.
 * If the email is found, it is returned. If not found, a new email is generated,
 * saved to the database, and returned.
 *
 * @param {string} visit_id - The visit ID to retrieve the email for.
 * @returns {Promise<string>} The email associated with the visit ID.
 * @throws {Error} If there is an error retrieving or generating the email.
 */
async function checkForEmail(visit_id) {
	try {
		const query = q.Get(q.Match(q.Index("email_by_visit_id"), visit_id));
		const response = await faunaClient.query(query);

		if (response.data.email) {
			const email = response.data.email;
			console.log(`Email found: ${email}`);
			return email;
		}
	} catch (error) {
		if (error.message.includes("instance not found")) {
			console.log("Instance not found, handling gracefully...");
			const data = await genEmail(visit_id);
			console.log(data);

			// Access the email property
			const email = data.data.email;

			// save the data to fauna
			await faunaClient.query(q.Create(q.Ref("classes/email_id_pairs"), data));
			return email;
		}

		console.error("Error:", error);
		throw error; // rethrow the error if needed
	}
}

/**
 * Generates a VCard string based on the provided contact information.
 *
 * @param {string} visit_id - The visit ID associated with the contact information.
 * @returns {string} - The generated VCard string.
 */
async function genVCard(visit_id) {
	try {
		const email = await checkForEmail(visit_id);

		if (email) {
			vcard = VCardTemplate.replace("{{email}}", email);
			return vcard;
		} else {
			return null;
		}
	} catch (error) {
		console.error("Error during VCard generation:", error);
		throw error;
	}
}

/**
 * Handles the incoming HTTP request and performs analytics operations.
 * @param {Object} event - The event object representing the HTTP request.
 * @returns {Object} - The response object containing the status code, headers, and body.
 */
const handler = async (event) => {
	try {
		if (event.httpMethod !== "POST") {
			return { statusCode: 500, body: "POST OR BUST!" };
		}

		jsonizedForm = urlEncodedFormDataToJson(event.body);
		jsonizedForm["date"] = new Date().toISOString();

		// convert the post request to json
		const data = { data: jsonizedForm };

		// save the data to fauna
		await faunaClient.query(q.Create(q.Ref("classes/usage"), data));

		vcard = await genVCard(jsonizedForm["visitor_id"]);

		if (vcard) {
			console.log(`Handling VCard: ${vcard}`);

			return {
				statusCode: 200,
				headers: {
					"Content-Type": "text/vcard",
					"Content-Disposition": 'attachment; filename="KieranKlukas.vcf"',
				},
				body: vcard,
			};
		} else {
			console.log("VCard not generated");
			return { statusCode: 500, body: "VCard not generated" };
		}
	} catch (error) {
		return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
	}
};

module.exports = { handler };
