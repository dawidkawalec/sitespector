import csv
import json
import os
import sys

def merge_csvs(directory):
    results = {}
    if not os.path.exists(directory):
        print(json.dumps({"error": f"Directory {directory} not found"}))
        return

    for filename in os.listdir(directory):
        if filename.endswith(".csv"):
            tab_name = filename.replace(".csv", "")
            filepath = os.path.join(directory, filename)
            
            try:
                with open(filepath, mode='r', encoding='utf-8-sig') as f:
                    reader = csv.DictReader(f)
                    results[tab_name] = list(reader)
            except Exception as e:
                results[tab_name] = {"error": str(e)}

    print(json.dumps(results))

if __name__ == "__main__":
    dir_path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/crawls"
    merge_csvs(dir_path)
