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

function genEmail() {
	return "lolz@duck.com";
}

async function checkForEmail(visit_id) {
	try {
		const query = q.Get(q.Match(q.Index("email_by_visit_id"), visit_id));
		const response = await faunaClient.query(query);

		if (response.data) {
			const email = response.data.email;
			console.log(`Email found: ${email}`);
			return email;
		} else {
			console.log("No document found for the given visit ID");
			return null;
		}
	} catch (error) {
		console.error("Error:", error);
		throw error; // rethrow the error if needed
	}
}

async function genVCard(visit_id) {
	try {
		const email = await checkForEmail(visit_id);

		if (email) {
			console.log(`Handling email: ${email}`);
			const vcard = `BEGIN:VCARD
		  VERSION:3.0
		  N:Lastname;Firstname;;;
		  EMAIL: ${email}
		  END:VCARD`;

			return vcard;
		} else {
			console.log("Email not found");
			return null;
		}
	} catch (error) {
		console.error("Error during VCard generation:", error);
		throw error; // rethrow the error if needed
	}
}

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
					"Content-Disposition": 'attachment; filename="vcard.vcf"',
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
