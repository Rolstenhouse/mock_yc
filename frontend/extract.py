import requests
import json
import os

# API details
api_key = "24ee2e1b-1844-490a-948d-618118e94117"
url = "https://api.vapi.ai/call"
headers = {"Authorization": f"Bearer {api_key}"}

# Text to search for in messages
search_text = "YCombinator"

# Set max limit and filter for startedAt before the given date
cutoff_date = "2024-09-14T17:46:11.472Z"
params = {
    "limit": 1000,
    "createdAtLt": cutoff_date  # Fetch calls started before this timestamp
}

# Directory to store JSON files
output_dir = "call_logs"
os.makedirs(output_dir, exist_ok=True)

# Function to fetch calls and process matches
def fetch_calls_with_text():
    try:
        # Make the API request
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()  # Raise an error for bad status codes
        
        # Parse the JSON response
        calls = response.json()
        
        # List to store matching calls and summary info
        matching_calls = []
        summary = []
        
        # Iterate through each call
        for call in calls:
            match_found = False
            
            # Check messages in the main 'messages' field
            if "messages" in call:
                for message in call["messages"]:
                    if "message" in message and isinstance(message["message"], str):
                        if search_text.lower() in message["message"].lower():
                            match_found = True
                            break
            
            # Check messages in the 'artifact' field too (if it exists)
            if not match_found and "artifact" in call and "messages" in call["artifact"]:
                for message in call["artifact"]["messages"]:
                    if "message" in message and isinstance(message["message"], str):
                        if search_text.lower() in message["message"].lower():
                            match_found = True
                            break
            
            # If a match is found, process it
            if match_found:
                call_id = call["id"]
                matching_calls.append(call)
                
                # Save the full JSON to a file named after the ID
                file_path = os.path.join(output_dir, f"{call_id}.json")
                with open(file_path, "w") as f:
                    json.dump(call, f, indent=2)
                
                # Get createdAt or startedAt for summary (prefer createdAt, fallback to startedAt)
                timestamp = call.get("createdAt", call.get("startedAt", "Unknown"))
                summary.append((call_id, timestamp))
        
        return matching_calls, summary
    
    except requests.exceptions.RequestException as e:
        return None, f"Error fetching calls: {str(e)}"

# Run the script and process results
matching_calls, result = fetch_calls_with_text()

# Print results
if isinstance(result, list) and result:
    print(f"Saved {len(matching_calls)} calls containing '{search_text}' started before {cutoff_date} to '{output_dir}' directory.")
    print("\nSummary of matching calls:")
    for call_id, timestamp in result:
        print(f"ID: {call_id}, Created/Started: {timestamp}")
elif isinstance(result, str):
    print(result)
else:
    print(f"No calls found containing '{search_text}' started before {cutoff_date}")