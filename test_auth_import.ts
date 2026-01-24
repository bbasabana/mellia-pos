
try {
    console.log("Attempting to import authOptions...");
    const { authOptions } = require('./src/lib/auth-options');
    console.log("Successfully imported authOptions.");
    console.log("Providers count:", authOptions.providers.length);
} catch (error) {
    console.error("Failed to import authOptions:", error);
}
