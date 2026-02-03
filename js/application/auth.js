export const DOMAIN = "learn.reboot01.com";

export async function login(username, password){
    //btoa -> username:something pass:something then encode with Base64
    const credentials = btoa(`${username}:${password}`);
    
    try {
        const response = await fetch(`https://${DOMAIN}/api/auth/signin`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        // wrong password
        if (response.status === 401 || response.status === 403) {
            throw new Error("Invalid Username or Password");
        }

        // server Error
        if (response.status >= 500) {
            throw new Error("Server is down! Please try again later.");
        }

        // http error
        if (!response.ok) {
            throw new Error(`Login failed (Error ${response.status})`);
        }

        const token = await response.json();
        return token;
    } catch (err) {
        if (err.message === "Invalid Username or Password" || err.message.includes("Server")) {
            throw err;
        } else {
            console.error(err);
            throw new Error("Connection failed. Check your internet.");
        }
        }
}