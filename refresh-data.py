import csv
from datetime import datetime
import json
import urllib.request
import xlrd


def cleanup_fields(workbook, row):
    new = {}
    new["Date Occurred"] = row["Date Occurred"]
    if new["Date Occurred"] != "":
        new["Date Occurred"] = datetime(
            *xlrd.xldate_as_tuple(float(new["Date Occurred"]),
            workbook.datemode)
        ).isoformat()
    new["ID Number"] = row["ID Number"].replace(".0", "")
    return new


print("Downloading data files to data/ dir...")

urllib.request.urlretrieve("https://data.seattle.gov/api/views/28ny-9ts8/rows.csv", "data/terry.csv")
urllib.request.urlretrieve("https://cdn.muckrock.com/foia_files/2017/04/12/Completed_OPA_Cases_with_Allegations_and_Action_Taken_thru_10-12-2016_Supervisor_Actions.xlsx", "data/force.xlsx")

print("Done!")


with open("data/terry.csv", "r") as csv_file, open("data/terry.json", "w") as json_file:
    reader = csv.DictReader(csv_file)
    out = json.dumps([{"Officer ID": entry["Officer ID"], "Reported Date": entry["Reported Date"]} for entry in reader])
    json_file.write(out)


workbook = xlrd.open_workbook("data/force.xlsx")
sheet = workbook.sheet_by_name("Sheet1")

with open("data/force.csv", "w") as csv_file:
    writer = csv.writer(csv_file)
    for rownum in range(sheet.nrows):
        writer.writerow(sheet.row_values(rownum))

with open("data/force.csv", "r") as csv_file, open("data/force.json", "w") as json_file:
    reader = csv.DictReader(csv_file)
    # Exclude events with no date
    out = json.dumps([cleanup_fields(workbook, entry) for entry in reader if entry["Date Occurred"]])
    json_file.write(out)
