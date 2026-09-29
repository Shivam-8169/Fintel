"""
Generates a realistic synthetic bank statement containing both benign everyday transactions
and deliberately injected AML typologies (high-value transfers, structuring, fan-out, rapid movement, circular chains).
Output: data/sample_bank_statement.csv
"""

import os
import csv
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
OUTPUT_PATH = os.path.join(DATA_DIR, "sample_bank_statement.csv")


def generate_sample_statement():
    os.makedirs(DATA_DIR, exist_ok=True)
    base_time = datetime(2026, 9, 1, 9, 0, 0)
    rows = []

    # 1. Normal everyday transactions
    benign_descriptions = [
        ("Monthly Corporate Salary", 6500.00, "CREDIT", "ACC-EMPLOYER-CORP"),
        ("Metro Electric Utility Bill", 145.20, "DEBIT", "ACC-METRO-POWER"),
        ("City Water Services", 62.50, "DEBIT", "ACC-CITY-WATER"),
        ("Whole Foods Market Groceries", 188.40, "DEBIT", "ACC-MERCHANT-GROCERY"),
        ("Amazon Online Marketplace", 74.99, "DEBIT", "ACC-AMZN-RETAIL"),
        ("Monthly Residential Rent", 2200.00, "DEBIT", "ACC-LANDLORD-PROP"),
        ("Starbucks Coffee", 8.75, "DEBIT", "ACC-STARBUCKS-01"),
        ("Health Insurance Premium", 340.00, "DEBIT", "ACC-BLUECROSS-INS"),
        ("Gym Membership Subscription", 55.00, "DEBIT", "ACC-FITNESS-CLUB"),
        ("Fuel & Gas Station", 48.30, "DEBIT", "ACC-SHELL-STATION"),
        ("Pharmacy Medication", 32.10, "DEBIT", "ACC-CVS-PHARMACY"),
        ("Internet & Fiber Bill", 85.00, "DEBIT", "ACC-VERIZON-NET"),
        ("Streaming Entertainment", 19.99, "DEBIT", "ACC-NETFLIX-SVCS"),
        ("Dining & Bistro Restaurant", 112.50, "DEBIT", "ACC-BISTRO-DINING"),
        ("Bookstore Purchase", 27.60, "DEBIT", "ACC-BARNES-BOOKS"),
    ]

    running_time = base_time
    for i in range(3):  # 3 iterations over benign items across 3 weeks
        for desc, amt, dir_type, counterparty in benign_descriptions:
            running_time += timedelta(hours=8, minutes=15)
            rows.append({
                "Transaction Date": running_time.strftime("%Y-%m-%d %H:%M:%S"),
                "Description": desc,
                "Debit Amount": f"{amt:.2f}" if dir_type == "DEBIT" else "",
                "Credit Amount": f"{amt:.2f}" if dir_type == "CREDIT" else "",
                "Account ID": "ACC-PRIMARY-STMT",
                "Counterparty": counterparty,
                "Reference ID": f"REF-NOR-{len(rows)+1:04d}"
            })

    # 2. Injected Typology: Rapid Fund Pass-Through
    pass_through_account = "ACC-PASS-THROUGH"
    running_time += timedelta(days=2)
    # Inflow
    rows.append({
        "Transaction Date": running_time.strftime("%Y-%m-%d %H:%M:%S"),
        "Description": "Inbound Wire Transfer from Offshore Entity",
        "Debit Amount": "",
        "Credit Amount": "85000.00",
        "Account ID": pass_through_account,
        "Counterparty": "ACC-OFFSHORE-GLOBAL",
        "Reference ID": f"REF-SUSP-{len(rows)+1:04d}"
    })
    # Rapid Outflows within 45 minutes
    for j in range(3):
        running_time += timedelta(minutes=15)
        rows.append({
            "Transaction Date": running_time.strftime("%Y-%m-%d %H:%M:%S"),
            "Description": f"Urgent Outbound Wire Disbursement Tranche {j+1}",
            "Debit Amount": "28000.00",
            "Credit Amount": "",
            "Account ID": pass_through_account,
            "Counterparty": f"ACC-SHELL-BENEFICIARY-0{j+1}",
            "Reference ID": f"REF-SUSP-{len(rows)+1:04d}"
        })

    # 3. Injected Typology: Structuring / Smurfing (just below $10,000 threshold)
    struct_account = "ACC-STRUCT-SUSPECT"
    running_time += timedelta(days=1)
    smurf_amounts = [9800.00, 9500.00, 9900.00, 9400.00, 9750.00]
    for amt in smurf_amounts:
        running_time += timedelta(hours=3, minutes=20)
        rows.append({
            "Transaction Date": running_time.strftime("%Y-%m-%d %H:%M:%S"),
            "Description": "Over-The-Counter Cash Placement Deposit",
            "Debit Amount": "",
            "Credit Amount": f"{amt:.2f}",
            "Account ID": struct_account,
            "Counterparty": "ACC-CASH-VAULT",
            "Reference ID": f"REF-SMURF-{len(rows)+1:04d}"
        })

    # 4. Injected Typology: Fan-Out Dispersion (1 to 5 counterparties in short window)
    fanout_account = "ACC-FANOUT-HUB"
    running_time += timedelta(days=2)
    # Major funding
    rows.append({
        "Transaction Date": running_time.strftime("%Y-%m-%d %H:%M:%S"),
        "Description": "Capital Injection Wire",
        "Debit Amount": "",
        "Credit Amount": "120000.00",
        "Account ID": fanout_account,
        "Counterparty": "ACC-VENTURE-HOLDINGS",
        "Reference ID": f"REF-FAN-{len(rows)+1:04d}"
    })
    # Rapid fan-out to 5 distinct recipients
    for k in range(5):
        running_time += timedelta(minutes=18)
        rows.append({
            "Transaction Date": running_time.strftime("%Y-%m-%d %H:%M:%S"),
            "Description": f"Commercial Transfer to Counterparty M{k+1}",
            "Debit Amount": "22000.00",
            "Credit Amount": "",
            "Account ID": fanout_account,
            "Counterparty": f"ACC-MULE-RECIPIENT-0{k+1}",
            "Reference ID": f"REF-FAN-{len(rows)+1:04d}"
        })

    # 5. Injected Typology: Circular Layering Loop (A -> B -> C -> A)
    loop_a, loop_b, loop_c = "ACC-LOOP-ALPHA", "ACC-LOOP-BETA", "ACC-LOOP-GAMMA"
    running_time += timedelta(days=1)
    loop_steps = [
        (loop_a, loop_b, 65000.00, "Consulting Fee Settlement"),
        (loop_b, loop_c, 64200.00, "Subcontractor Invoice Payment"),
        (loop_c, loop_a, 63800.00, "Management Advisory Rebate")
    ]
    for s_acc, r_acc, amt, desc in loop_steps:
        running_time += timedelta(hours=6)
        rows.append({
            "Transaction Date": running_time.strftime("%Y-%m-%d %H:%M:%S"),
            "Description": desc,
            "Debit Amount": f"{amt:.2f}",
            "Credit Amount": "",
            "Account ID": s_acc,
            "Counterparty": r_acc,
            "Reference ID": f"REF-LOOP-{len(rows)+1:04d}"
        })

    # Write out to CSV
    fieldnames = ["Transaction Date", "Description", "Debit Amount", "Credit Amount", "Account ID", "Counterparty", "Reference ID"]
    with open(OUTPUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} statement rows -> {OUTPUT_PATH}")
    return OUTPUT_PATH


if __name__ == "__main__":
    generate_sample_statement()
