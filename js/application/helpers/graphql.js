import { DOMAIN } from "./auth.js";

const GRAPHQL_URL = `https://${DOMAIN}/api/graphql-engine/v1/graphql`;

export async function getGraphQLData(token) {
    // Step 1: Get User ID
    const idQuery = `{ user{id} }`;
    const idData = await runQuery(idQuery, {}, token);

    if (!idData || !idData.user || idData.user.length === 0) {
        console.error("Auth Error: User ID not found");
        return null;
    }

    const userId = idData.user[0].id;

    // Step 2: Find the main curriculum object
    const objectQuery = `
    query GetUserObjects($userId: Int!) {
        progress(
            where: {
                userId: {_eq: $userId},
                path: {_like: "%/bh-module/%", _nlike: "%piscine%"}
            },
            order_by: {createdAt: asc},
            limit: 1
        ) {
            event {
                id
            }
        }
    }`;
    
    const objData = await runQuery(objectQuery, { userId }, token);
    let mainEventId = null;
    
    if (objData && objData.progress && objData.progress.length > 0) {
        mainEventId = objData.progress[0].event.id;
        console.log("MAIN EVENT ID " + mainEventId)
    }
    
    // Step 3: Master Query - Filter by eventId (this is what the institutional dashboard does)
    const masterQuery = `
    query GetData($userId: Int!, $eventId: Int) {
        user(where: {id: {_eq: $userId}}) {
            id
            login
            auditRatio
            totalUp
            totalDown
        }
        transaction(
            where: {
                userId: {_eq: $userId}, 
                _or: [
                    { type: {_eq: "xp"} },
                    { type: {_eq: "level"} }
                ],
                ${mainEventId ? 'eventId: {_eq: $eventId}' : 'path: {_like: "/bahrain/bh-module/%"}'}
            }, 
            order_by: {createdAt: asc}
        ) {
            amount
            type
            createdAt
            path
            eventId
            objectId
        }
        progress(
            where: {
                userId: {_eq: $userId},
            }, 
            order_by: {updatedAt: desc}
        ) {
            grade
            object {
                id
                name
            }
        }
        skills: transaction(
            where: {
                userId: {_eq: $userId}, 
                type: {_ilike: "skill_%"}
            }
        ) {
            type
            amount
            path
        }
    }`;

    const variables = { userId: userId, eventId: mainEventId };
    const data = await runQuery(masterQuery, variables, token);
    console.log("PROGRESS" + JSON.stringify(data.progress, null, 2));
    return data;
}

async function runQuery(query, variables, token) {
    try {
        const response = await fetch(GRAPHQL_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({query, variables})
        });
        if(!response.ok){
            throw new Error(`SERVER_ERROR: ${response.status}`);
        }
        const json = await response.json();
        if(json.errors) {
            const errMsg = json.errors[0].message;
            if (errMsg.includes("JWT") || errMsg.includes("header") || errMsg.includes("token")) {
                throw new Error("AUTH_ERROR");
            }
            throw new Error(`GRAPHQL_ERROR: ${errMsg}`);
        }
        return json.data;
    }catch (e) {
        // If it's already one of our custom errors, re-throw it
        if (e.message === "AUTH_ERROR" || e.message.startsWith("SERVER_ERROR")) {
            throw e;
        }
        // Otherwise, it's a network/offline issue
        throw new Error("NETWORK_ERROR");
    }
}