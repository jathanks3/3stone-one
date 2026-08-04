import assert from "node:assert/strict";
import { isJobApplicationMessage, routeIntegrationContent } from "../src/server/services/integrationContentRouter";

const job = routeIntegrationContent(["Your application for the Analyst role", "The hiring team will review your application."]);
assert(job.destinations.includes("job_tracker"));
assert(isJobApplicationMessage(["Your application for the Analyst role", "The hiring team will review it."]));

const meeting = routeIntegrationContent(["Project kickoff meeting", "Scheduled for Friday"]);
assert(meeting.destinations.includes("calendar"));
assert(meeting.destinations.includes("projects"));

const schoolFile = routeIntegrationContent(["BIO 201 final exam study guide.pdf"], { isFile: true });
assert.deepEqual(schoolFile.destinations.slice(0, 2), ["documents", "knowledge"]);
assert(schoolFile.destinations.includes("assignments"));

const invoice = routeIntegrationContent(["Client invoice and payment receipt"]);
assert(invoice.destinations.includes("crm"));
assert(invoice.destinations.includes("finances"));

assert.equal(isJobApplicationMessage(["New summer sale", "Shop our newest offers"]), false);
assert(isJobApplicationMessage(["Marketing Internship Application.pdf", "Job-related file detected in Google Drive."]));

console.log("Integration routing tests passed.");
