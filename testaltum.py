#!/usr/bin/env python3
"""
Simple Altum API Debug Script
Search for one address and show ALL raw data for debugging
"""

import requests
import json


def debug_altum_api():
    """
    Simple debug test for Altum Autosearch API
    """

    # Configuration
    base_url = "https://api.altum.ai/autosearch"
    api_key = "4QN9oipIeF6XwA7ektkLB1YHyCeM22tc2gW6Stne"  # Replace with your actual key

    # Search for your demo address postcode
    search_postcode = "1015MN"  # Westerstraat 72-1, Amsterdam

    print("🔍 ALTUM API DEBUG TEST")
    print("=" * 60)
    print(f"Searching for postcode: {search_postcode}")
    print(f"API Endpoint: {base_url}")
    print("=" * 60)

    # Headers
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key
    }

    # Parameters
    params = {
        "search": search_postcode,
        "sort": "datum",
        "limit": 10
    }

    print("\n📤 REQUEST DETAILS:")
    print("-" * 30)
    print(f"Headers: {headers}")
    print(f"Params: {params}")

    try:
        # Make the request
        print("\n🚀 Making API call...")
        response = requests.get(base_url, headers=headers, params=params, timeout=30)

        print(f"\n📊 RESPONSE STATUS: {response.status_code}")
        print("-" * 30)

        # Show response headers
        print("Response Headers:")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")

        print(f"\n📄 RAW RESPONSE TEXT:")
        print("-" * 30)
        print(response.text)

        if response.status_code == 200:
            try:
                # Parse JSON
                data = response.json()

                print(f"\n✅ JSON PARSED SUCCESSFULLY")
                print(f"Number of properties found: {len(data)}")
                print("=" * 60)

                print(f"\n🏠 FORMATTED RESULTS:")
                print("-" * 30)

                for i, prop in enumerate(data, 1):
                    print(f"\n--- Property {i} ---")
                    for key, value in prop.items():
                        print(f"{key}: {value}")

                print(f"\n📋 COMPLETE RAW JSON:")
                print("-" * 30)
                print(json.dumps(data, indent=2, ensure_ascii=False))

                # Look specifically for Westerstraat
                print(f"\n🎯 LOOKING FOR WESTERSTRAAT PROPERTIES:")
                print("-" * 40)
                found_westerstraat = False
                for prop in data:
                    if 'westerstraat' in prop.get('street', '').lower():
                        found_westerstraat = True
                        print(
                            f"✅ FOUND: {prop.get('street')} {prop.get('housenumber')}{prop.get('houseaddition', '') or ''}")
                        print(f"   Price: {prop.get('asking_price')}")
                        print(f"   Status: {prop.get('market_status')}")
                        print(f"   Listed: {prop.get('date_listed')}")
                        print(f"   Full data: {json.dumps(prop, indent=2)}")

                if not found_westerstraat:
                    print("❌ No Westerstraat properties found in this postcode")
                    print("Available streets in this postcode:")
                    streets = set()
                    for prop in data:
                        street = prop.get('street', 'Unknown')
                        streets.add(street)
                    for street in sorted(streets):
                        print(f"  - {street}")

            except json.JSONDecodeError as e:
                print(f"❌ JSON DECODE ERROR: {e}")
                print("The response is not valid JSON")

        else:
            print(f"❌ API ERROR - Status Code: {response.status_code}")

            if response.status_code == 401:
                print("   → Check your API key")
            elif response.status_code == 403:
                print("   → API key may not have permission for this endpoint")
            elif response.status_code == 400:
                print("   → Bad request - check parameters")

    except requests.exceptions.RequestException as e:
        print(f"❌ REQUEST ERROR: {e}")
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")


if __name__ == "__main__":
    debug_altum_api()