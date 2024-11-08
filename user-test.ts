import { faker } from "npm:@faker-js/faker";

// support --prod flag which sets the target URL to production
const TARGET_URL = Deno.args.includes("--prod")
  ? "https://raostack.deno.dev"
  : "http://localhost:8000";

// Generate 5 random users with realistic data
const TEST_USERS = Array.from({ length: 5 }, () => {
  const firstName = faker.person.firstName().toLowerCase();
  const lastName = faker.person.lastName().toLowerCase();
  return {
    // create username from first initial + lastname, like jsmith
    username: `${firstName[0]}${lastName}`,
    // Full name with a random job title
    displayName: `${faker.person.fullName()} (${faker.person.jobTitle()})`,
    // Generate a bio with interests and a quote
    summary: `${faker.person.bio()}\n\n"${faker.lorem.sentence()}"`,
  };
});

async function createUser(user: typeof TEST_USERS[0]) {
  console.log(`Creating user ${user.username}...`);
  console.log(`Display Name: ${user.displayName}`);
  console.log(`Summary: ${user.summary}`);

  try {
    const response = await fetch(`${TARGET_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    const data = await response.text();

    if (!response.ok) {
      console.log(`❌ Failed to create ${user.username}: ${response.status} ${data}`);
      return false;
    }

    console.log(`✅ Created ${user.username}`);
    return true;
  } catch (error) {
    console.log(`❌ Error creating ${user.username}: ${error.message}`);
    return false;
  }
}

async function verifyWebfinger(username: string) {
  console.log(`Verifying webfinger for ${username}...`);

  try {
    const domain = new URL(TARGET_URL).host;
    const response = await fetch(
      `${TARGET_URL}/.well-known/webfinger?resource=acct:${username}@${domain}`
    );

    const data = await response.text();

    if (!response.ok) {
      console.log(`❌ Webfinger failed for ${username}: ${response.status} ${data}`);
      return false;
    }

    console.log(`✅ Webfinger verified for ${username}`);
    return true;
  } catch (error) {
    console.log(`❌ Webfinger error for ${username}: ${error.message}`);
    return false;
  }
}

async function runTest() {
  console.log(`🎯 Testing against ${TARGET_URL}\n`);

  let successCount = 0;
  let verifyCount = 0;

  for (const user of TEST_USERS) {
    if (await createUser(user)) {
      successCount++;
      if (await verifyWebfinger(user.username)) {
        verifyCount++;
      }
    }
    console.log(); // Add a blank line between users
  }

  console.log("\nSummary:");
  console.log(`Created ${successCount}/${TEST_USERS.length} users`);
  console.log(`Verified ${verifyCount}/${TEST_USERS.length} webfinger endpoints`);
}

runTest();